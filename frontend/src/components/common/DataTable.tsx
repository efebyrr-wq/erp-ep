import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import styles from './DataTable.module.css';

type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (item: T) => ReactNode;
  searchable?: boolean;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  searchable?: boolean;
};

export function DataTable<T>({
  columns,
  data,
  emptyMessage = 'No records found.',
  searchable = false,
}: DataTableProps<T>) {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, Set<string>>>({});
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const filterRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Get unique values for each searchable column
  const columnUniqueValues = useMemo(() => {
    const values: Record<string, Set<string>> = {};
    
    columns.forEach((column) => {
      if (searchable && column.searchable !== false) {
        const uniqueSet = new Set<string>();
        data.forEach((item) => {
          let value: string | null = null;
          
          if (column.render) {
            const rendered = column.render(item);
            value = rendered ? String(rendered) : null;
          } else {
            const itemValue = (item as Record<string, unknown>)[column.key as string];
            value = itemValue !== null && itemValue !== undefined ? String(itemValue) : null;
          }
          
          if (value && value.trim() !== '' && value !== '—') {
            uniqueSet.add(value);
          }
        });
        values[String(column.key)] = uniqueSet;
      }
    });
    
    return values;
  }, [data, columns, searchable]);

  const filteredData = useMemo(() => {
    if (!searchable) return data;

    return data.filter((item) => {
      return columns.every((column) => {
        const columnKey = String(column.key);
        const selectedValues = selectedFilters[columnKey];
        
        if (!selectedValues || selectedValues.size === 0 || !column.searchable) return true;

        let itemValue: string | null = null;
        
        if (column.render) {
          const rendered = column.render(item);
          itemValue = rendered ? String(rendered) : null;
        } else {
          const rawValue = (item as Record<string, unknown>)[column.key as string];
          itemValue = rawValue !== null && rawValue !== undefined ? String(rawValue) : null;
        }
        
        if (!itemValue || itemValue.trim() === '' || itemValue === '—') return false;
        
        return selectedValues.has(itemValue);
      });
    });
  }, [data, selectedFilters, columns, searchable]);

  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);

  const handleFilterToggle = (columnKey: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (openFilter === columnKey) {
      setOpenFilter(null);
      setDropdownPosition(null);
    } else {
      const filterElement = filterRefs.current[columnKey];
      if (filterElement) {
        const rect = filterElement.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
        });
      }
      setOpenFilter(columnKey);
    }
  };

  // Update dropdown position on scroll/resize
  useEffect(() => {
    if (!openFilter) return;

    const updatePosition = () => {
      const filterElement = filterRefs.current[openFilter];
      if (filterElement) {
        const rect = filterElement.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
        });
      }
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [openFilter]);

  const handleFilterSelect = (columnKey: string, value: string) => {
    setSelectedFilters((prev) => {
      const current = prev[columnKey] || new Set<string>();
      const updated = new Set(current);
      
      if (updated.has(value)) {
        updated.delete(value);
      } else {
        updated.add(value);
      }
      
      return {
        ...prev,
        [columnKey]: updated,
      };
    });
  };

  const clearFilter = (columnKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFilters((prev) => {
      const updated = { ...prev };
      delete updated[columnKey];
      return updated;
    });
  };

  // Close filter when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openFilter) {
        const filterElement = filterRefs.current[openFilter];
        const target = event.target as Node;
        
        // Check if click is outside the filter container
        if (filterElement && !filterElement.contains(target)) {
          // Also check if click is on the dropdown itself (which is rendered outside)
          const dropdown = document.querySelector(`[data-filter-dropdown="${openFilter}"]`);
          if (!dropdown || !dropdown.contains(target)) {
            setOpenFilter(null);
            setDropdownPosition(null);
          }
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openFilter]);

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => {
              const columnKey = String(column.key);
              const isSearchable = searchable && column.searchable !== false;
              const isOpen = openFilter === columnKey;
              const selectedCount = selectedFilters[columnKey]?.size || 0;
              const uniqueValues = columnUniqueValues[columnKey] || new Set<string>();
              const sortedValues = Array.from(uniqueValues).sort();

              return (
                <th key={columnKey} className={styles.thWithFilter}>
                  <div className={styles.headerCell}>
                    <span className={styles.headerText}>{column.header}</span>
                    {isSearchable && (
                      <div
                        ref={(el) => {
                          filterRefs.current[columnKey] = el;
                        }}
                        className={styles.filterContainer}
                      >
                        <button
                          type="button"
                          className={`${styles.filterButton} ${selectedCount > 0 ? styles.filterActive : ''}`}
                          onClick={(e) => handleFilterToggle(columnKey, e)}
                          title={selectedCount > 0 ? `${selectedCount} filtre seçili` : 'Filtrele'}
                        >
                          <Search size={14} />
                          {selectedCount > 0 && (
                            <span className={styles.filterBadge}>{selectedCount}</span>
                          )}
                        </button>
                        {isOpen && dropdownPosition && createPortal(
                          <div
                            className={styles.filterDropdown}
                            data-filter-dropdown={columnKey}
                            style={{
                              top: `${dropdownPosition.top}px`,
                              left: `${dropdownPosition.left}px`,
                            }}
                          >
                            <div className={styles.filterDropdownHeader}>
                              <span>{column.header} Filtrele</span>
                              {selectedCount > 0 && (
                                <button
                                  type="button"
                                  className={styles.clearFilterButton}
                                  onClick={(e) => clearFilter(columnKey, e)}
                                >
                                  Temizle
                                </button>
                              )}
                            </div>
                            <div className={styles.filterOptions}>
                              {sortedValues.length === 0 ? (
                                <div className={styles.noOptions}>Filtrelenecek veri yok</div>
                              ) : (
                                sortedValues.map((value) => {
                                  const isSelected = selectedFilters[columnKey]?.has(value) || false;
                                  return (
                                    <label
                                      key={value}
                                      className={`${styles.filterOption} ${isSelected ? styles.filterOptionSelected : ''}`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleFilterSelect(columnKey, value)}
                                      />
                                      <span>{value}</span>
                                    </label>
                                  );
                                })
                              )}
                            </div>
                          </div>,
                          document.body
                        )}
                      </div>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {filteredData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.empty}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            filteredData.map((item, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td key={String(column.key)}>
                    {column.render
                      ? column.render(item)
                      : ((item as Record<string, unknown>)[column.key as string] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

