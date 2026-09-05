'use client';

import { useBoard } from '@/lib/store';

export function Toast() {
  const toast = useBoard((s) => s.toast);
  const dismiss = useBoard((s) => s.dismissToast);

  if (!toast) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="flex items-center gap-2 rounded-lg bg-txt-primary px-4 py-3 text-sm text-white shadow-strong">
        <span className="flex-1">{toast}</span>
        <button onClick={dismiss} className="shrink-0 rounded p-0.5 text-white/60 hover:text-white">
          ✕
        </button>
      </div>
    </div>
  );
}
