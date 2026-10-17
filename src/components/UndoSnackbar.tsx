import React from 'react';
import { RotateCcw, X } from 'lucide-react';
import { DocumentLine } from '../types';

interface UndoSnackbarProps {
  deletedLine: { documentId: string; line: DocumentLine } | null;
  onUndo: () => void;
  onDismiss: () => void;
}

export const UndoSnackbar: React.FC<UndoSnackbarProps> = ({
  deletedLine,
  onUndo,
  onDismiss,
}) => {
  if (!deletedLine) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between border border-slate-700/60">
        <div className="truncate mr-3">
          <p className="text-xs text-slate-300">Removed line item:</p>
          <p className="text-sm font-semibold truncate text-white">{deletedLine.line.name}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onUndo}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
          <button
            onClick={onDismiss}
            aria-label="Dismiss"
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
