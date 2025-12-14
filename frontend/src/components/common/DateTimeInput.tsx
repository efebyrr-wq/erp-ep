import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { convertDDMMYYYYHHMMToISO, convertISOToDDMMYYYYHHMM, isValidDDMMYYYYHHMM, parseDDMMYYYYHHMM } from '../../lib/dateTimeUtils';

type DateTimeInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
};

/**
 * DateTime input component that uses DD/MM/YYYY HH:MM format
 * Internally stores DD/MM/YYYY HH:MM but converts to ISO format for backend
 */
export function DateTimeInput({ value, onChange, placeholder = 'DD/MM/YYYY HH:MM', required, disabled }: DateTimeInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [error, setError] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const dateTimeInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);
  const lastSelectedDateTimeRef = useRef<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle incoming value - can be either ISO (from backend) or DD/MM/YYYY HH:MM (from form state)
  useEffect(() => {
    if (value) {
      // If it's already in DD/MM/YYYY HH:MM format, use it directly
      if (/^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}$/.test(value)) {
        setDisplayValue(value);
        setError(false);
      } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
        // ISO with time - convert and preserve time
        const converted = convertISOToDDMMYYYYHHMM(value);
        setDisplayValue(converted);
        setError(false);
      } else if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
        // ISO date without time - preserve existing time if available, otherwise use 00:00
        let timePart = '00:00';
        const currentDisplay = displayValue;
        if (currentDisplay && isValidDDMMYYYYHHMM(currentDisplay)) {
          const timeMatch = currentDisplay.match(/\s+(\d{2}):(\d{2})$/);
          if (timeMatch) {
            timePart = `${timeMatch[1]}:${timeMatch[2]}`;
          }
        }
        // Convert YYYY-MM-DD to DD/MM/YYYY and add time
        const isoWithTime = `${value}T${timePart}`;
        const converted = convertISOToDDMMYYYYHHMM(isoWithTime);
        setDisplayValue(converted);
        setError(false);
      } else {
        // Try to parse as date
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            const converted = convertISOToDDMMYYYYHHMM(value);
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

    // Validate DD/MM/YYYY HH:MM format
    if (isValidDDMMYYYYHHMM(inputValue)) {
      // Keep DD/MM/YYYY HH:MM format for form state
      onChange(inputValue);
      setError(false);
    } else {
      // Still allow typing, but mark as error if not valid
      if (inputValue.length >= 16) {
        setError(true);
      } else {
        setError(false);
      }
    }
  };

  const handleBlur = () => {
    // On blur, validate and fix if possible
    if (displayValue && !isValidDDMMYYYYHHMM(displayValue)) {
      // Try to parse and reformat
      const parsed = parseDDMMYYYYHHMM(displayValue);
      if (parsed) {
        const day = String(parsed.getDate()).padStart(2, '0');
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const year = parsed.getFullYear();
        const hour = String(parsed.getHours()).padStart(2, '0');
        const minute = String(parsed.getMinutes()).padStart(2, '0');
        const formatted = `${day}/${month}/${year} ${hour}:${minute}`;
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
    if (disabled || !dateTimeInputRef.current) return;
    
    // Convert DD/MM/YYYY HH:MM to YYYY-MM-DD for native date input
    let isoDateTime = '';
    if (displayValue && isValidDDMMYYYYHHMM(displayValue)) {
      isoDateTime = convertDDMMYYYYHHMMToISO(displayValue);
    } else if (displayValue) {
      // Try to extract date part
      const dateMatch = displayValue.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        isoDateTime = `${year}-${month}-${day}T00:00`;
      }
    }
    
    if (isoDateTime) {
      dateTimeInputRef.current.value = isoDateTime.split('T')[0]; // Just the date part
    } else {
      dateTimeInputRef.current.value = '';
    }
    
    // Mark picker as open
    setPickerOpen(true);
    
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      if (dateTimeInputRef.current) {
        try {
          // Try showPicker() first (modern browsers)
          if (typeof dateTimeInputRef.current.showPicker === 'function') {
            dateTimeInputRef.current.showPicker();
          } else {
            // Fallback: click the input directly
            dateTimeInputRef.current.click();
          }
        } catch (error) {
          // Fallback: click the input directly
          dateTimeInputRef.current.click();
        }
      }
    }, 10);
  };

  const handleTimeClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (disabled || !timeInputRef.current) return;
    
    // Extract time from display value or default to current time
    let timeValue = '00:00';
    if (displayValue && isValidDDMMYYYYHHMM(displayValue)) {
      const timeMatch = displayValue.match(/\s+(\d{2}):(\d{2})$/);
      if (timeMatch) {
        timeValue = `${timeMatch[1]}:${timeMatch[2]}`;
      }
    }
    
    timeInputRef.current.value = timeValue;
    setPickerOpen(true);
    
    setTimeout(() => {
      if (timeInputRef.current) {
        try {
          if (typeof timeInputRef.current.showPicker === 'function') {
            timeInputRef.current.showPicker();
          } else {
            timeInputRef.current.click();
          }
        } catch (error) {
          timeInputRef.current.click();
        }
      }
    }, 10);
  };

  const closePicker = () => {
    setPickerOpen(false);
    
    if (dateTimeInputRef.current) {
      dateTimeInputRef.current.blur();
      if (document.activeElement === dateTimeInputRef.current) {
        (document.activeElement as HTMLElement).blur();
      }
    }
    
    if (timeInputRef.current) {
      timeInputRef.current.blur();
      if (document.activeElement === timeInputRef.current) {
        (document.activeElement as HTMLElement).blur();
      }
    }
    
    const textInput = containerRef.current?.querySelector('input[type="text"]') as HTMLInputElement;
    if (textInput) {
      textInput.focus();
    }
  };

  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nativeDate = e.target.value; // YYYY-MM-DD format
    if (nativeDate) {
      // Check if this is the same date being selected twice (double-click scenario)
      if (lastSelectedDateTimeRef.current === nativeDate) {
        // User clicked the same date twice - force close immediately
        // Preserve existing time
        let timePart = '00:00';
        if (displayValue && isValidDDMMYYYYHHMM(displayValue)) {
          const timeMatch = displayValue.match(/\s+(\d{2}):(\d{2})$/);
          if (timeMatch) {
            timePart = `${timeMatch[1]}:${timeMatch[2]}`;
          }
        }
        const isoDateTime = `${nativeDate}T${timePart}`;
        const ddMMyyyyHHmm = convertISOToDDMMYYYYHHMM(isoDateTime);
        setDisplayValue(ddMMyyyyHHmm);
        onChange(ddMMyyyyHHmm);
        setError(false);
        setPickerOpen(false);
        // Force close by temporarily removing from DOM
        if (dateTimeInputRef.current) {
          dateTimeInputRef.current.style.display = 'none';
          setTimeout(() => {
            if (dateTimeInputRef.current) {
              dateTimeInputRef.current.style.display = '';
              dateTimeInputRef.current.blur();
            }
          }, 10);
        }
        return;
      }
      
      // First time selecting this date
      lastSelectedDateTimeRef.current = nativeDate;
      
      // Extract time from current display value or use 00:00
      let timePart = '00:00';
      if (displayValue && isValidDDMMYYYYHHMM(displayValue)) {
        const timeMatch = displayValue.match(/\s+(\d{2}):(\d{2})$/);
        if (timeMatch) {
          timePart = `${timeMatch[1]}:${timeMatch[2]}`;
        }
      }
      
      // Convert YYYY-MM-DD to DD/MM/YYYY and combine with time
      const isoDateTime = `${nativeDate}T${timePart}`;
      const ddMMyyyyHHmm = convertISOToDDMMYYYYHHMM(isoDateTime);
      
      setDisplayValue(ddMMyyyyHHmm);
      onChange(ddMMyyyyHHmm);
      setError(false);
      
      // Force close by temporarily hiding the input element
      if (dateTimeInputRef.current) {
        const originalDisplay = dateTimeInputRef.current.style.display;
        dateTimeInputRef.current.style.display = 'none';
        
        setTimeout(() => {
          if (dateTimeInputRef.current) {
            dateTimeInputRef.current.style.display = originalDisplay || '';
            dateTimeInputRef.current.blur();
            setPickerOpen(false);
          }
        }, 100);
      }
      
      setTimeout(() => {
        closePicker();
      }, 200);
    }
  };

  const handleNativeTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nativeTime = e.target.value; // HH:MM format
    if (nativeTime) {
      // Check if this is the same time being selected twice (double-click scenario)
      const currentDateTime = displayValue && isValidDDMMYYYYHHMM(displayValue) ? displayValue : '';
      if (lastSelectedDateTimeRef.current === `${currentDateTime.split(' ')[0]} ${nativeTime}`) {
        // User clicked the same time twice - force close immediately
        // Preserve existing date
        let datePart = '';
        if (displayValue && isValidDDMMYYYYHHMM(displayValue)) {
          const dateMatch = displayValue.match(/^(\d{2}\/\d{2}\/\d{4})/);
          if (dateMatch) {
            datePart = dateMatch[1];
          }
        }
        
        // If no date, use today
        if (!datePart) {
          const today = new Date();
          const day = String(today.getDate()).padStart(2, '0');
          const month = String(today.getMonth() + 1).padStart(2, '0');
          const year = today.getFullYear();
          datePart = `${day}/${month}/${year}`;
        }
        
        const ddMMyyyyHHmm = `${datePart} ${nativeTime}`;
        setDisplayValue(ddMMyyyyHHmm);
        onChange(ddMMyyyyHHmm);
        setError(false);
        setPickerOpen(false);
        // Force close by temporarily removing from DOM
        if (timeInputRef.current) {
          timeInputRef.current.style.display = 'none';
          setTimeout(() => {
            if (timeInputRef.current) {
              timeInputRef.current.style.display = '';
              timeInputRef.current.blur();
            }
          }, 10);
        }
        return;
      }
      
      // First time selecting this time
      lastSelectedDateTimeRef.current = `${currentDateTime.split(' ')[0]} ${nativeTime}`;
      
      // Extract date from current display value or use today
      let datePart = '';
      if (displayValue && isValidDDMMYYYYHHMM(displayValue)) {
        const dateMatch = displayValue.match(/^(\d{2}\/\d{2}\/\d{4})/);
        if (dateMatch) {
          datePart = dateMatch[1];
        }
      }
      
      // If no date, use today
      if (!datePart) {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        datePart = `${day}/${month}/${year}`;
      }
      
      const ddMMyyyyHHmm = `${datePart} ${nativeTime}`;
      
      setDisplayValue(ddMMyyyyHHmm);
      onChange(ddMMyyyyHHmm);
      setError(false);
      
      // Force close
      if (timeInputRef.current) {
        const originalDisplay = timeInputRef.current.style.display;
        timeInputRef.current.style.display = 'none';
        
        setTimeout(() => {
          if (timeInputRef.current) {
            timeInputRef.current.style.display = originalDisplay || '';
            timeInputRef.current.blur();
            setPickerOpen(false);
          }
        }, 100);
      }
      
      setTimeout(() => {
        closePicker();
      }, 200);
    }
  };

  const handleNativeDateBlur = () => {
    setPickerOpen(false);
  };

  const handleNativeTimeBlur = () => {
    setPickerOpen(false);
  };

  const handleNativeDateFocus = () => {
    setPickerOpen(true);
  };

  const handleNativeTimeFocus = () => {
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
          maxLength={16}
          style={{
            width: '100%',
            padding: '0.55rem 0.8rem',
            paddingRight: '5rem', // Make space for both icons
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
            right: '2.5rem',
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
        <button
          type="button"
          onClick={handleTimeClick}
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
          aria-label="Open time picker"
        >
          <Clock size={18} />
        </button>
        {/* Hidden native date input for calendar picker */}
        <input
          ref={dateTimeInputRef}
          type="date"
          onChange={handleNativeDateChange}
          onBlur={handleNativeDateBlur}
          onFocus={handleNativeDateFocus}
          onClick={() => setPickerOpen(true)}
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
                const textInput = containerRef.current?.querySelector('input[type="text"]') as HTMLInputElement;
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
            pointerEvents: 'auto',
          }}
          tabIndex={-1}
        />
        {/* Hidden native time input for time picker */}
        <input
          ref={timeInputRef}
          type="time"
          onChange={handleNativeTimeChange}
          onBlur={handleNativeTimeBlur}
          onFocus={handleNativeTimeFocus}
          onClick={() => setPickerOpen(true)}
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
                const textInput = containerRef.current?.querySelector('input[type="text"]') as HTMLInputElement;
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
            pointerEvents: 'auto',
          }}
          tabIndex={-1}
        />
      </div>
      {error && (
        <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
          Invalid date/time format. Please use DD/MM/YYYY HH:MM
        </div>
      )}
    </div>
  );
}

