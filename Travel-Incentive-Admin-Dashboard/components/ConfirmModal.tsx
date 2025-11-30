import React from 'react';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'success' | 'danger' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ open, title, message, confirmLabel = 'Ok', cancelLabel = 'Annulla', onConfirm, onCancel, variant = 'info' }) => {
  if (!open) return null;

  const confirmClasses = variant === 'success' ? 'px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700' : variant === 'danger' ? 'px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700' : 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6">
        {title && <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>}
        <div className="text-sm text-gray-700 mb-4">{message}</div>
        <div className="flex justify-end space-x-3">
          {cancelLabel ? (
            <button onClick={onCancel} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">{cancelLabel}</button>
          ) : null}
          <button onClick={onConfirm} className={confirmClasses}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
