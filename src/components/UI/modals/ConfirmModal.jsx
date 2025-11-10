import { AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useState } from 'react';

export default function ConfirmModal({ 
  open, 
  title, 
  message, 
  needsInput, 
  inputLabel, 
  inputPlaceholder, 
  inputValue, 
  onInputChange, 
  showPermanentOption,
  onConfirm, 
  onCancel, 
  confirmText = 'Yes', 
  cancelText = 'Cancel', 
  confirmColor = 'bg-red-600 hover:bg-red-700' 
}) {
  const [isPermanent, setIsPermanent] = useState(false);

  if (!open) return null;

  const handleConfirm = () => {
    if (showPermanentOption) {
      onConfirm(inputValue, isPermanent);
    } else {
      onConfirm(inputValue);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999]" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 transform transition-all" style={{ position: 'relative', zIndex: 10000 }}>
        <div className="p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertTriangle size={40} className="text-yellow-600" />
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-800 dark:text-slate-100 text-center mb-3">
            {title}
          </h3>

          {message && (
            <p className="text-gray-600 dark:text-slate-300 text-center mb-8 text-lg">
              {message}
            </p>
          )}

          {needsInput && !isPermanent && (
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

          {showPermanentOption && (
            <div className="mb-6">
              <label className="inline-flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isPermanent}
                  onChange={(e) => setIsPermanent(e.target.checked)}
                  className="h-5 w-5 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                />
                <span className="text-gray-700 dark:text-slate-200 font-semibold">
                  Kalıcı Ban (Süresiz)
                </span>
              </label>
              {isPermanent && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                  ⚠️ Bu kullanıcı süresiz olarak yasaklanacaktır!
                </p>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <button onClick={onCancel} className="flex-1 px-6 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition font-semibold text-base">
              {cancelText}
            </button>
            <button onClick={handleConfirm} className={`flex-1 px-6 py-3 text-white rounded-lg transition font-semibold text-base ${confirmColor}`}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
