import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ open, title, message, needsInput, inputLabel, inputPlaceholder, inputValue, onInputChange, onConfirm, onCancel, confirmText = 'Yes', cancelText = 'Cancel', confirmColor = 'bg-red-600 hover:bg-red-700' }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertTriangle size={32} className="text-yellow-600" />
            </div>
          </div>

          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100 text-center mb-2 flex-1">
              {title}
            </h3>
            <button onClick={onCancel} className="text-gray-400 dark:text-slate-300 hover:text-gray-600 dark:hover:text-slate-200 ml-4">
              <X size={18} />
            </button>
          </div>

          {message && (
            <p className="text-gray-600 dark:text-slate-300 text-center mb-6">
              {message}
            </p>
          )}

          {needsInput && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">{inputLabel}</label>
              <input
                type="number"
                value={inputValue}
                onChange={(e) => onInputChange && onInputChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-slate-900 dark:text-slate-100"
                placeholder={inputPlaceholder}
                min="1"
              />
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition font-medium">
              {cancelText}
            </button>
            <button onClick={onConfirm} className={`flex-1 px-4 py-2.5 text-white rounded-lg transition font-medium ${confirmColor}`}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
