import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectFieldOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectFieldOption[];
  placeholder?: string;
  required?: boolean;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select option',
  required,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <input
        tabIndex={-1}
        required={required}
        value={value}
        onChange={() => undefined}
        className="sr-only"
      />

      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="flex min-h-[52px] w-full items-center justify-between gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-3 text-left text-base font-medium text-gray-900 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
      >
        <span className={selectedOption ? 'truncate' : 'truncate text-gray-500 dark:text-gray-400'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={`h-5 w-5 flex-shrink-0 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-[70] mt-2 max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 shadow-xl">
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`flex min-h-[44px] w-full items-center rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
                option.value === value
                  ? 'bg-gray-100 text-gray-950 dark:bg-gray-800 dark:text-white'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
