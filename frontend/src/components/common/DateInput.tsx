import { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const lastSelectedDateRef = useRef<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Add click outside handler to close picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateInputRef.current && containerRef.current) {
        // If picker is open and user clicks outside, close it
        if (document.activeElement === dateInputRef.current) {
          dateInputRef.current.blur();
        }
      }
    };

    // Add keyboard handler to close on Escape
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dateInputRef.current && document.activeElement === dateInputRef.current) {
        dateInputRef.current.blur();
        const textInput = containerRef.current?.querySelector('input[type="text"]') as HTMLInputElement;
        if (textInput) {
          textInput.focus();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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

  const handleCalendarClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (disabled || !dateInputRef.current) return;
    
    // Convert DD/MM/YYYY to YYYY-MM-DD for native date input
    if (displayValue && isValidDDMMYYYY(displayValue)) {
      const yyyyMMdd = convertDDMMYYYYToYYYYMMDD(displayValue);
      dateInputRef.current.value = yyyyMMdd;
    } else {
      // Clear value if no valid date
      dateInputRef.current.value = '';
    }
    
    // Mark picker as open
    setPickerOpen(true);
    
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      if (dateInputRef.current) {
        try {
          // Try showPicker() first (modern browsers)
          if (typeof dateInputRef.current.showPicker === 'function') {
            dateInputRef.current.showPicker();
          } else {
            // Fallback: click the input directly
            dateInputRef.current.click();
          }
        } catch (error) {
          // Fallback: click the input directly
          dateInputRef.current.click();
        }
      }
    }, 10);
  };

  const closePicker = () => {
    setPickerOpen(false);
    
    if (dateInputRef.current) {
      // Method 1: Direct blur
      dateInputRef.current.blur();
      
      // Method 2: Remove focus from document
      if (document.activeElement === dateInputRef.current) {
        (document.activeElement as HTMLElement).blur();
      }
      
      // Method 3: Focus on text input to force picker to close
      const textInput = containerRef.current?.querySelector('input[type="text"]') as HTMLInputElement;
      if (textInput) {
        textInput.focus();
      }
      
      // Method 4: Click on body to remove focus (last resort)
      setTimeout(() => {
        if (document.activeElement === dateInputRef.current) {
          document.body.click();
        }
      }, 50);
      
      // Don't clear value immediately - keep it for the picker
      // Clear value after picker is confirmed closed
      setTimeout(() => {
        if (dateInputRef.current && !pickerOpen) {
          dateInputRef.current.value = '';
          lastSelectedDateRef.current = '';
        }
      }, 500);
    }
  };

  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nativeDate = e.target.value; // YYYY-MM-DD format
    if (nativeDate) {
      // Check if this is the same date being selected twice (double-click scenario)
      if (lastSelectedDateRef.current === nativeDate) {
        // User clicked the same date twice - force close immediately
        const ddMMyyyy = convertYYYYMMDDToDDMMYYYY(nativeDate);
        setDisplayValue(ddMMyyyy);
        onChange(ddMMyyyy);
        setError(false);
        setPickerOpen(false);
        // Force close by temporarily removing from DOM
        if (dateInputRef.current) {
          dateInputRef.current.style.display = 'none';
          setTimeout(() => {
            if (dateInputRef.current) {
              dateInputRef.current.style.display = '';
              dateInputRef.current.blur();
            }
          }, 10);
        }
        return;
      }
      
      // First time selecting this date
      lastSelectedDateRef.current = nativeDate;
      const ddMMyyyy = convertYYYYMMDDToDDMMYYYY(nativeDate);
      setDisplayValue(ddMMyyyy);
      onChange(ddMMyyyy);
      setError(false);
      
      // Force close by temporarily hiding the input element
      // This should force the browser to close the picker
      if (dateInputRef.current) {
        const originalDisplay = dateInputRef.current.style.display;
        dateInputRef.current.style.display = 'none';
        
        setTimeout(() => {
          if (dateInputRef.current) {
            dateInputRef.current.style.display = originalDisplay || '';
            dateInputRef.current.blur();
            setPickerOpen(false);
          }
        }, 100);
      }
      
      // Also try the normal close methods
      setTimeout(() => {
        closePicker();
      }, 200);
    }
  };

  const handleNativeDateBlur = () => {
    setPickerOpen(false);
    // Clear the value when picker closes
    if (dateInputRef.current) {
      setTimeout(() => {
        if (dateInputRef.current) {
          dateInputRef.current.value = '';
          lastSelectedDateRef.current = '';
        }
      }, 100);
    }
  };
  
  const handleNativeDateFocus = () => {
    setPickerOpen(true);
  };
  
  const handleOverlayClick = () => {
    closePicker();
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Overlay to capture clicks and close picker when open */}
      {pickerOpen && (
        <div
          onClick={handleOverlayClick}
          onMouseDown={(e) => {
            // Prevent the click from propagating to the date input
            e.preventDefault();
            handleOverlayClick();
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9998,
            backgroundColor: 'transparent',
            cursor: 'pointer',
          }}
        />
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', zIndex: 9999 }}>
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
            padding: '0.55rem 0.8rem',
            paddingRight: '2.5rem',
            borderRadius: '0.75rem',
            border: error ? '1px solid #ef4444' : '1px solid rgba(148, 163, 184, 0.6)',
            fontSize: '0.875rem',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
        <button
          type="button"
          onClick={handleCalendarClick}
          disabled={disabled}
          style={{
            position: 'absolute',
            right: '0.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            opacity: disabled ? 0.5 : 1,
            zIndex: 1,
            flexShrink: 0,
          }}
          aria-label="Open date picker"
        >
          <Calendar size={18} />
        </button>
        {/* Hidden native date input for calendar picker - positioned off-screen but still accessible */}
        <input
          ref={dateInputRef}
          type="date"
          onChange={handleNativeDateChange}
          onBlur={handleNativeDateBlur}
          onFocus={handleNativeDateFocus}
          onClick={(e) => {
            // When user clicks on the date input, mark as open
            setPickerOpen(true);
          }}
          onInput={(e) => {
            // Additional handler to ensure picker closes on input
            const target = e.target as HTMLInputElement;
            if (target.value) {
              // Trigger blur to close picker
              setTimeout(() => {
                target.blur();
                if (document.activeElement === target) {
                  (document.activeElement as HTMLElement).blur();
                }
                // Focus on text input
                const textInput = target.parentElement?.querySelector('input[type="text"]') as HTMLInputElement;
                if (textInput) {
                  textInput.focus();
                }
              }, 100);
            }
          }}
          style={{
            position: 'absolute',
            opacity: 0,
            width: '1px',
            height: '1px',
            top: 0,
            left: 0,
            zIndex: -1,
            pointerEvents: 'auto', // Allow pointer events for showPicker to work
          }}
          tabIndex={-1}
        />
      </div>
      {error && (
        <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
          Invalid date format. Please use DD/MM/YYYY
        </div>
      )}
    </div>
  );
}

