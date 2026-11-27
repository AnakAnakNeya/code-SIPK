import React from 'react';
import { Check, Circle } from 'lucide-react';
import { checkPassword, passwordStrength } from '../../utils/validators.js';

const BAR = ['bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600'];

/** Checklist aturan kata sandi + bar kekuatan yang diperbarui saat mengetik. */
export function PasswordChecklist({ password = '', className = '' }) {
  const rules = checkPassword(password);
  const { skor, label } = passwordStrength(password);
  const dirty = password.length > 0;

  return (
    <div className={`rounded-lg border border-slate-200 bg-slate-50 p-3 ${className}`} aria-live="polite">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 grid grid-cols-4 gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-colors ${dirty && i < skor ? BAR[skor] : 'bg-slate-200'}`}
            />
          ))}
        </div>
        <span className="text-[11px] font-bold text-slate-600 w-20 text-right">{dirty ? label : 'Belum diisi'}</span>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
        {rules.map((r) => (
          <li
            key={r.id}
            className={`flex items-center gap-1.5 text-[11px] ${r.ok ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}
          >
            {r.ok ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Circle className="w-3 h-3 shrink-0" />}
            {r.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PasswordChecklist;
