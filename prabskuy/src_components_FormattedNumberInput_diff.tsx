--- src/components/FormattedNumberInput.tsx (原始)


+++ src/components/FormattedNumberInput.tsx (修改后)
// Formatted Number Input - Auto-format with thousand separators
// User types digits, input displays formatted number (1000 → 1.000)

import React, { useState, useEffect, useRef, forwardRef } from 'react';

interface FormattedNumberInputProps {
  value: string;
  onChange: (rawValue: string) => void;
  placeholder?: string;
  className?: string;
  prefix?: string;
  allowDecimal?: boolean;
  maxDecimals?: number;
  autoFocus?: boolean;
}

// Format number with thousand separators (dots)
export function formatNumberWithDots(numStr: string): string {
  // Remove non-digits except decimal point
  const cleaned = numStr.replace(/[^\d]/g, '');
  if (!cleaned) return '';

  // Add dots as thousand separators
  return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Parse formatted number back to raw digits
export function parseFormattedNumber(formatted: string): string {
  return formatted.replace(/[^\d]/g, '');
}

// Parse to actual number
export function formattedToNumber(formatted: string): number {
  const raw = parseFormattedNumber(formatted);
  return raw ? parseFloat(raw) : 0;
}

export const FormattedNumberInput = forwardRef<HTMLInputElement, FormattedNumberInputProps>(
  ({ value, onChange, placeholder = '0', className = '', prefix = '', autoFocus = false }, ref) => {
    const [displayValue, setDisplayValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const combinedRef = (ref as React.RefObject<HTMLInputElement>) || inputRef;

    // Format value when it changes externally
    useEffect(() => {
      if (value === '' || value === undefined) {
        setDisplayValue('');
      } else {
        setDisplayValue(formatNumberWithDots(value));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputVal = e.target.value;
      // Extract only digits
      const rawDigits = inputVal.replace(/[^\d]/g, '');

      // Update display with formatting
      setDisplayValue(formatNumberWithDots(rawDigits));

      // Pass raw digits to parent
      onChange(rawDigits);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow navigation keys, backspace, delete, tab
      const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
      if (allowed.includes(e.key)) return;

      // Block non-digit keys
      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      const rawDigits = pastedText.replace(/[^\d]/g, '');
      setDisplayValue(formatNumberWithDots(rawDigits));
      onChange(rawDigits);
    };

    return (
      <div className={`relative flex items-center ${className}`}>
        {prefix && (
          <span className="absolute left-4 text-[#9CA3AF] text-sm font-medium pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          ref={combinedRef}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`w-full py-3 ${prefix ? 'pl-10' : 'pl-4'} pr-4 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-lg font-bold text-[#F5F5F5] placeholder:text-[#9CA3AF] placeholder:font-normal focus:outline-none focus:border-[#22C55E]/50 transition-colors`}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        />
      </div>
    );
  }
);

FormattedNumberInput.displayName = 'FormattedNumberInput';

// Compact display for small spaces
export function FormattedAmount({ amount, currency = 'IDR', className = '' }: { amount: number; currency?: string; className?: string }) {
  const formatted = formatNumberWithDots(Math.round(amount).toString());
  const prefix = currency === 'IDR' ? 'Rp' : currency === 'USD' ? '$' : currency;

  return (
    <span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {prefix}{formatted}
    </span>
  );
}
