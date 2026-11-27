import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { digitsOnly, sanitizePhoneInput } from '../../utils/validators.js';

export function Input({
  label,
  error,
  helperText,
  id,
  required = false,
  className = '',
  ...props
}) {
  const inputId = id || props.name;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-slate-700 mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <input
        id={inputId}
        required={required}
        className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-navy-900 ${
          error
            ? 'border-rose-400 focus:ring-rose-400 focus:border-rose-400'
            : 'border-slate-300 hover:border-slate-400'
        }`}
        {...props}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}

export function Select({
  label,
  error,
  helperText,
  id,
  required = false,
  options = [],
  children,
  className = '',
  ...props
}) {
  const selectId = id || props.name;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-semibold text-slate-700 mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <select
        id={selectId}
        required={required}
        className={`w-full pl-3.5 pr-10 py-2.5 text-sm rounded-lg border bg-white text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-navy-900 cursor-pointer ${
          error
            ? 'border-rose-400 focus:ring-rose-400 focus:border-rose-400'
            : 'border-slate-300 hover:border-slate-400'
        }`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
        {children}
      </select>
      {error ? (
        <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}

export function Textarea({ label, error, helperText, id, required = false, className = '', ...props }) {
  const textareaId = id || props.name;
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-semibold text-slate-700 mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        required={required}
        className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900 ${error ? 'border-rose-400' : 'border-slate-300'}`}
        {...props}
      />
      {error ? <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p> : helperText ? <p className="mt-1.5 text-xs text-slate-500">{helperText}</p> : null}
    </div>
  );
}

/** Input nomor HP: hanya angka (+ di awal), maksimal 16 karakter, keyboard numerik di ponsel. */
export function PhoneInput({ onChange, value = '', ...props }) {
  return (
    <Input
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      maxLength={16}
      value={value}
      onChange={(e) => {
        e.target.value = sanitizePhoneInput(e.target.value);
        onChange?.(e);
      }}
      {...props}
    />
  );
}

/** Input angka murni dengan panjang tetap (mis. NIB 13 digit). */
export function DigitInput({ onChange, value = '', maxLength = 13, ...props }) {
  return (
    <Input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      maxLength={maxLength}
      value={value}
      onChange={(e) => {
        e.target.value = digitsOnly(e.target.value).slice(0, maxLength);
        onChange?.(e);
      }}
      {...props}
    />
  );
}

/** Input kata sandi dengan tombol tampilkan/sembunyikan. */
export function PasswordInput({ label, error, helperText, id, required = false, className = '', ...props }) {
  const [show, setShow] = React.useState(false);
  const inputId = id || props.name;
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-slate-700 mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          required={required}
          type={show ? 'text' : 'password'}
          maxLength={64}
          autoComplete="new-password"
          className={`w-full pl-3.5 pr-11 py-2.5 text-sm rounded-lg border bg-white text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-navy-900 ${
            error ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 hover:border-slate-400'
          }`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-navy-900 cursor-pointer"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}