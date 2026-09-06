'use client';

import { useState } from 'react';
import { CheckIcon, XIcon } from './icons';

export function AgreementModal({
  agreementText,
  jobTitle,
  onConfirm,
  onBack,
  loading = false,
}: {
  agreementText: string;
  jobTitle: string;
  onConfirm: () => void;
  onBack: () => void;
  loading?: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-txt-primary/40 backdrop-blur-sm p-4">
      <div className="flex w-full max-w-lg flex-col rounded-2xl bg-surface shadow-strong border border-border-subtle max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-txt-primary">Agreement Terms</h3>
            <p className="text-xs text-txt-secondary mt-0.5">{jobTitle}</p>
          </div>
          <button onClick={onBack} className="rounded-lg p-1.5 text-txt-tertiary hover:bg-inset hover:text-txt-primary transition">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto px-5 py-4"
          onScroll={(e) => {
            const el = e.currentTarget;
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) setScrolled(true);
          }}
        >
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-txt-secondary">
            {agreementText}
          </div>
          {!scrolled && (
            <p className="mt-3 text-center text-xs text-txt-tertiary italic">Scroll to read the full agreement</p>
          )}
        </div>

        <div className="border-t border-border-subtle px-5 py-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border-strong text-accent-600 focus:ring-accent-500/30"
            />
            <span className="text-sm text-txt-secondary">
              I have read and agree to these terms. This signature is legally binding.
            </span>
          </label>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              onClick={onBack}
              className="rounded-lg border border-border-subtle bg-surface px-4 py-2 text-sm font-medium text-txt-secondary transition hover:bg-inset"
            >
              Go back
            </button>
            <button
              onClick={onConfirm}
              disabled={!agreed || loading}
              className="flex items-center gap-1.5 rounded-lg bg-success-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-success-600/90 shadow-soft disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <CheckIcon className="h-4 w-4" />}
              {loading ? 'Signing…' : 'Sign & Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
