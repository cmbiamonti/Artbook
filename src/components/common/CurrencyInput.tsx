import { forwardRef } from 'react';

interface CurrencyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-base font-semibold">€</span>
          </div>
          <input
            ref={ref}
            type="number"
            step="0.01"
            min="0"
            className={`input pl-10 ${className}`}
            placeholder="0,00"
            {...props}
          />
        </div>
        {error && (
          <p className="text-red-500 text-sm mt-1">{error}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Inserisci solo il valore numerico (es: 1000 per € 1.000,00)
        </p>
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';