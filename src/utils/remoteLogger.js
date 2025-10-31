const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const ENABLE = import.meta.env.VITE_ENABLE_REMOTE_LOGS === 'true' || import.meta.env.PROD;
const LOG_ENDPOINT = (API_BASE.replace(/\/$/, '') || '') + '/api/logs';
const LOG_KEY = import.meta.env.VITE_LOG_API_KEY || '';

// Configuration
const buffer = [];
let flushTimer = null;
const FLUSH_INTERVAL = 4000; // 4 seconds
const BATCH_SIZE = 12;
const MAX_ENTRY_SIZE = 16 * 1024; // 16 KB per entry
const MAX_QUEUE_STORAGE = 200; // max items to persist offline

// Retry state
const retryQueue = [];

function safeStringify(v, fallback = '') {
    try {
        return JSON.stringify(v);
    } catch {
        try { return String(v); } catch { return fallback; }
    }
}

function getUserContext() {
    try {
        const raw = localStorage.getItem('user');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return { id: parsed.id || parsed._id || null, username: parsed.username || null };
    } catch {
        return null;
    }
}

function truncateIfNeeded(str) {
    if (typeof str !== 'string') str = safeStringify(str, '');
    if (str.length <= MAX_ENTRY_SIZE) return str;
    return str.slice(0, MAX_ENTRY_SIZE - 100) + '...[truncated]';
}

async function postPayload(payload) {
    if (!ENABLE || !LOG_ENDPOINT) return { ok: false };
    try {
        const res = await fetch(LOG_ENDPOINT, {
            method: 'POST',
            headers: Object.assign({ 'Content-Type': 'application/json' }, LOG_KEY ? { 'x-log-key': LOG_KEY } : {}),
            body: JSON.stringify(payload),
        });
        return { ok: res.ok, status: res.status };
    } catch {
        return { ok: false };
    }
}

function scheduleFlush() {
    if (flushTimer) return;
    flushTimer = setTimeout(() => {
        flushTimer = null;
        flushBuffer();
    }, FLUSH_INTERVAL);
}

function enqueueOffline(item) {
    try {
        const key = 'remoteLogsQueue';
        const raw = localStorage.getItem(key);
        const arr = raw ? JSON.parse(raw) : [];
        arr.push(item);
        // cap queue
        if (arr.length > MAX_QUEUE_STORAGE) arr.splice(0, arr.length - MAX_QUEUE_STORAGE);
        localStorage.setItem(key, JSON.stringify(arr));
    } catch {
        // ignore
    }
}

async function flushBuffer() {
    if (buffer.length === 0 && retryQueue.length === 0) {
        // attempt to flush any offline stored items
        try {
            const key = 'remoteLogsQueue';
            const raw = localStorage.getItem(key);
            if (raw) {
                const persisted = JSON.parse(raw);
                if (Array.isArray(persisted) && persisted.length > 0) {
                    buffer.push(...persisted.splice(0, BATCH_SIZE));
                    // persist remainder
                    if (persisted.length === 0) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(persisted));
                }
            }
        } catch {
            // ignore
        }
        return;
    }

    // Merge retryQueue entries first
    while (retryQueue.length > 0 && buffer.length < BATCH_SIZE) {
        buffer.unshift(retryQueue.shift());
    }

    if (buffer.length === 0) return;

    const toSend = buffer.splice(0, BATCH_SIZE);

    // Build payload. If single, send single. If multiple, send as batch meta array.
    const payload = toSend.length === 1 ? toSend[0] : { level: 'info', message: 'batch', meta: toSend };

    // If offline, persist and return
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        toSend.forEach(enqueueOffline);
        return;
    }

    const res = await postPayload(payload);
    if (!res.ok) {
        // schedule retry with exponential backoff
        const retryItem = { items: toSend, attempts: 1, nextDelay: 1000 };
        retryQueue.push(retryItem);
        scheduleRetry(retryItem);
    }
}

function scheduleRetry(retryItem) {
    setTimeout(async () => {
        // try send again
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            // still offline, re-schedule
            retryItem.nextDelay = Math.min(retryItem.nextDelay * 2, 60 * 1000);
            scheduleRetry(retryItem);
            return;
        }
        const payload = retryItem.items.length === 1 ? retryItem.items[0] : { level: 'info', message: 'batch', meta: retryItem.items };
        const res = await postPayload(payload);
        if (!res.ok) {
            retryItem.attempts = (retryItem.attempts || 0) + 1;
            retryItem.nextDelay = Math.min((retryItem.nextDelay || 1000) * 2, 60 * 1000);
            // keep trying up to a cap
            if (retryItem.attempts < 6) {
                scheduleRetry(retryItem);
            } else {
                // give up and persist offline if possible
                retryItem.items.forEach(enqueueOffline);
            }
        }
    }, retryItem.nextDelay);
}

function sendOrBuffer(item) {
    // attach user context
    const user = getUserContext();
    if (user) item.meta = Object.assign({}, item.meta, { user });

    // Truncate large fields
    item.message = truncateIfNeeded(item.message);
    try { item.meta = JSON.parse(truncateIfNeeded(safeStringify(item.meta))); } catch { item.meta = {}; }

    // If critical, try to send immediately
    if (item.level === 'error' || item.level === 'warn') {
        // attempt immediate post
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            enqueueOffline(item);
            return;
        }
        postPayload(item).then(res => {
            if (!res.ok) {
                // push to retryQueue
                const retryItem = { items: [item], attempts: 1, nextDelay: 1000 };
                retryQueue.push(retryItem);
                scheduleRetry(retryItem);
            }
        }).catch(() => {
            enqueueOffline(item);
        });
        return;
    }

    buffer.push(item);
    if (buffer.length >= BATCH_SIZE) {
        flushBuffer();
    } else {
        scheduleFlush();
    }
}

function log(level, message, meta = {}) {
    const entry = { level, message: typeof message === 'string' ? message : String(message), meta };
    sendOrBuffer(entry);
}

function info(message, meta) { log('info', message, meta); }
function warn(message, meta) { log('warn', message, meta); }
function error(message, meta) { log('error', message, meta); }
function debug(message, meta) { log('debug', message, meta); }

// Replace console methods to forward to remote logger while preserving original behaviour
function installConsoleShim({ forward = true } = {}) {
    if (!forward) return;
    try {
        const orig = { ...console };
        console.log = function (...args) {
            try { info(args.map(a => (typeof a === 'object' ? safeStringify(a) : String(a))).join(' ')); } catch { void 0; }
            orig.log.apply(console, args);
        };
        console.info = function (...args) {
            try { info(args.map(a => (typeof a === 'object' ? safeStringify(a) : String(a))).join(' ')); } catch { void 0; }
            orig.info.apply(console, args);
        };
        console.warn = function (...args) {
            try { warn(args.map(a => (typeof a === 'object' ? safeStringify(a) : String(a))).join(' ')); } catch { void 0; }
            orig.warn.apply(console, args);
        };
        console.error = function (...args) {
            try { error(args.map(a => (typeof a === 'object' ? safeStringify(a) : String(a))).join(' ')); } catch { void 0; }
            orig.error.apply(console, args);
        };
        console.debug = function (...args) {
            try { debug(args.map(a => (typeof a === 'object' ? safeStringify(a) : String(a))).join(' ')); } catch { void 0; }
            orig.debug.apply(console, args);
        };

        // Flush on page unload
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
                try { flushBuffer(); } catch { void 0; }
            });
            window.addEventListener('online', () => { try { flushBuffer(); } catch { void 0; } });
        }
    } catch {
        // Silently ignore shim failures in dev
        void 0;
    }
}

function forceFlush() { flushBuffer(); }
function clearQueue() { try { localStorage.removeItem('remoteLogsQueue'); } catch { void 0; } }

export default {
    info,
    warn,
    error,
    debug,
    installConsoleShim,
    flush: flushBuffer,
    forceFlush,
    clearQueue,
};
