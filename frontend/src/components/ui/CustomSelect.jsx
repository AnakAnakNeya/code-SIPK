import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export function CustomSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Pilih opsi...',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
          <span>{label}</span>
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full h-11 px-3.5 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-800 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy-900/15 focus:border-navy-900 flex items-center justify-between transition cursor-pointer shadow-2xs"
      >
        <span className={`truncate text-left ${value ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-navy-900' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-1.5 w-full bg-white rounded-xl border border-slate-200 shadow-xl max-h-60 overflow-y-auto py-1 text-xs divide-y divide-slate-50 animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between transition hover:bg-slate-50 cursor-pointer ${
                  isSelected ? 'bg-navy-50/80 text-navy-900 font-bold' : 'text-slate-700'
                }`}
              >
                <span className="truncate pr-2">{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-navy-900 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
