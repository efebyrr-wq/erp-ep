import { useState, useEffect } from 'react';
import { convertDDMMYYYYToYYYYMMDD, convertYYYYMMDDToDDMMYYYY, isValidDDMMYYYY, parseDDMMYYYY } from '../../lib/dateUtils';

type DateInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
};

/**
 * Date input component that uses DD/MM/YYYY format
 * Internally stores DD/MM/YYYY but converts to YYYY-MM-DD for backend
 */
export function DateInput({ value, onChange, placeholder = 'DD/MM/YYYY', required, disabled }: DateInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [error, setError] = useState(false);

  // Handle incoming value - can be either YYYY-MM-DD (from backend) or DD/MM/YYYY (from form state)
  useEffect(() => {
    if (value) {
      // If it's already in DD/MM/YYYY format, use it directly
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        setDisplayValue(value);
        setError(false);
      } else if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
        // Convert from YYYY-MM-DD to DD/MM/YYYY
        const converted = convertYYYYMMDDToDDMMYYYY(value);
        setDisplayValue(converted);
        setError(false);
      } else {
        // Try to parse as date
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            const converted = convertYYYYMMDDToDDMMYYYY(value);
            setDisplayValue(converted);
            setError(false);
          } else {
            setDisplayValue(value);
          }
        } catch {
          setDisplayValue(value);
        }
      }
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);

    // Allow empty input
    if (!inputValue.trim()) {
      onChange('');
      setError(false);
      return;
    }

    // Validate DD/MM/YYYY format
    if (isValidDDMMYYYY(inputValue)) {
      // Keep DD/MM/YYYY format for form state
      onChange(inputValue);
      setError(false);
    } else {
      // Still allow typing, but mark as error if not valid
      if (inputValue.length >= 10) {
        setError(true);
      } else {
        setError(false);
      }
    }
  };

  const handleBlur = () => {
    // On blur, validate and fix if possible
    if (displayValue && !isValidDDMMYYYY(displayValue)) {
      // Try to parse and reformat
      const parsed = parseDDMMYYYY(displayValue);
      if (parsed) {
        const day = String(parsed.getDate()).padStart(2, '0');
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const year = parsed.getFullYear();
        const formatted = `${day}/${month}/${year}`;
        setDisplayValue(formatted);
        onChange(formatted);
        setError(false);
      } else {
        setError(true);
      }
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        maxLength={10}
        style={{
          width: '100%',
          padding: '0.45rem 0.75rem',
          borderRadius: '0.6rem',
          border: error ? '1px solid #ef4444' : '1px solid rgba(148, 163, 184, 0.6)',
          fontSize: '0.9rem',
        }}
      />
      {error && (
        <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
          Invalid date format. Please use DD/MM/YYYY
        </div>
      )}
    </div>
  );
}

