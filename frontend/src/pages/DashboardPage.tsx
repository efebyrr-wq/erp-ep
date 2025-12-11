import { useEffect, useState, useMemo, useRef } from 'react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CardGrid } from '../components/common/CardGrid';
import { StatCard } from '../components/common/StatCard';
import { MachineryMap } from '../components/map/MachineryMap';
import { apiGet } from '../lib/api';
import {
  mockAccounts,
  mockBills,
  mockCustomers,
  mockInvoices,
  mockInventory,
  mockInternalOperations,
  mockMachinery,
  mockOutsourceOperations,
  mockServiceOperations,
  mockTransportationOperations,
  mockSuppliers,
  mockCollectionCash,
  mockCollectionCreditCard,
  mockCollectionsCheck,
  mockPaymentCheck,
  mockPaymentCreditCard,
  mockPaymentsCash,
} from '../lib/mockData';
import type {
  Account,
  Bill,
  Customer,
  InventoryItem,
  Supplier,
  Invoice,
  CollectionsCheck,
  CollectionCreditCard,
  CollectionCash,
  PaymentCheck,
  PaymentCreditCard,
  PaymentsCash,
  InternalOperation,
  OutsourceOperation,
  ServiceOperation,
  TransportationOperation,
  Machinery,
  WorkingSite,
  PersonelPayment,
} from '../types';
import styles from './DashboardPage.module.css';
import { ChevronDown } from 'lucide-react';

type DashboardSnapshot = {
  customers: Customer[];
  suppliers: Supplier[];
  bills: Bill[];
  invoices: Invoice[];
  accounts: Account[];
  inventory: InventoryItem[];
  collectionsCheck: CollectionsCheck[];
  collectionsCreditCard: CollectionCreditCard[];
  collectionsCash: CollectionCash[];
  paymentsCheck: PaymentCheck[];
  paymentsCreditCard: PaymentCreditCard[];
  paymentsCash: PaymentsCash[];
  internalOperations: InternalOperation[];
  outsourceOperations: OutsourceOperation[];
  serviceOperations: ServiceOperation[];
  transportationOperations: TransportationOperation[];
  machinery: Machinery[];
  workingSites: WorkingSite[];
  personelPayments: PersonelPayment[];
};

const COLORS = ['#2563eb', '#22d3ee', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

function getMonthYear(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// Calculate monthly sales (bills) and expenses (invoices) for past 6 months
function calculateMonthlySalesAndExpenses(
  bills: Bill[],
  invoices: Invoice[],
) {
  const salesMap = new Map<string, number>();
  const expensesMap = new Map<string, number>();

  // Calculate sales from bills
  bills.forEach((bill) => {
    const monthYear = getMonthYear(bill.billDate);
    if (monthYear) {
      const amount = Number(bill.totalAmount ?? 0);
      salesMap.set(monthYear, (salesMap.get(monthYear) ?? 0) + amount);
    }
  });

  // Calculate expenses from invoices
  invoices.forEach((invoice) => {
    const monthYear = getMonthYear(invoice.billDate);
    if (monthYear) {
      const amount = Number(invoice.totalAmount ?? 0);
      expensesMap.set(monthYear, (expensesMap.get(monthYear) ?? 0) + amount);
    }
  });

  // Get last 6 months
  const months: { month: string; sales: number; expenses: number; profit: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const sales = salesMap.get(monthYear) ?? 0;
    const expenses = expensesMap.get(monthYear) ?? 0;
    months.push({
      month: monthName,
      sales,
      expenses,
      profit: sales - expenses,
    });
  }

  return months;
}

// Calculate current month sales and expenses
function calculateCurrentMonthSalesAndExpenses(
  bills: Bill[],
  invoices: Invoice[],
): { sales: number; expenses: number; profit: number } {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let sales = 0;
  let expenses = 0;

  bills.forEach((bill) => {
    const monthYear = getMonthYear(bill.billDate);
    if (monthYear === currentMonth) {
      sales += Number(bill.totalAmount ?? 0);
    }
  });

  invoices.forEach((invoice) => {
    const monthYear = getMonthYear(invoice.billDate);
    if (monthYear === currentMonth) {
      expenses += Number(invoice.totalAmount ?? 0);
    }
  });

  return { sales, expenses, profit: sales - expenses };
}

function calculateCurrentMonthRevenue(bills: Bill[]): {
  total: number;
  taxed: number;
  untaxed: number;
  taxedPercentage: number;
  untaxedPercentage: number;
} {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Calculate total sales from bills for the current month
  let total = 0;
  let taxed = 0;
  let untaxed = 0;

  bills.forEach((bill) => {
    const monthYear = getMonthYear(bill.billDate);
    if (monthYear === currentMonth) {
      const amount = Number(bill.totalAmount ?? 0);
      total += amount;
      if (bill.taxed === true) {
        taxed += amount;
      } else {
        untaxed += amount;
      }
    }
  });

  const taxedPercentage = total > 0 ? (taxed / total) * 100 : 0;
  const untaxedPercentage = total > 0 ? (untaxed / total) * 100 : 0;

  return {
    total,
    taxed,
    untaxed,
    taxedPercentage,
    untaxedPercentage,
  };
}

function calculateUsageRate(
  internalOperations: InternalOperation[],
  outsourceOperations: OutsourceOperation[],
  serviceOperations: ServiceOperation[],
  machinery: Machinery[],
): number {
  if (machinery.length === 0) return 0;

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Count active operations this month
  const activeOps = [
    ...internalOperations,
    ...outsourceOperations,
    ...serviceOperations,
  ].filter((op) => {
    const dateField = 'startDate' in op ? op.startDate : 'createdAt' in op ? op.createdAt : null;
    if (!dateField) return false;
    const monthYear = getMonthYear(dateField);
    return monthYear === currentMonth;
  });

  // Calculate usage rate: (active operations / total machinery) * 100
  const usageRate = (activeOps.length / machinery.length) * 100;
  return Math.min(usageRate, 100); // Cap at 100%
}

// Component for Usage Rate card showing selected machine type and meter usage
function UsageRateCard({
  internalOperations,
  outsourceOperations,
  machinery,
}: {
  internalOperations: InternalOperation[];
  outsourceOperations: OutsourceOperation[];
  machinery: Machinery[];
}) {
  const [selectedMachineType, setSelectedMachineType] = useState<string | null>(null);
  const [selectedMeter, setSelectedMeter] = useState<string | null>(null);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [meterDropdownOpen, setMeterDropdownOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const meterDropdownRef = useRef<HTMLDivElement>(null);

  // Extract unique machine types from specs
  const machineTypes = useMemo(() => {
    const types = new Set<string>();
    machinery.forEach((machine) => {
      machine.specs?.forEach((spec) => {
        const specName = spec.specName.toLowerCase();
        if (
          specName.includes('type') ||
          specName.includes('model') ||
          specName === 'machine_type' ||
          specName === 'type'
        ) {
          if (spec.specValue) {
            types.add(spec.specValue);
          }
        }
      });
    });
    return Array.from(types).sort();
  }, [machinery]);

  // Extract unique height (meter) values from specs
  // If a machine type is selected, only show heights available for that type
  const meterValues = useMemo(() => {
    const meters = new Set<string>();
    
    // Filter machinery by selected type first (if a type is selected)
    const machinesToCheck = selectedMachineType
      ? machinery.filter((machine) => {
          return machine.specs?.some((spec) => {
            const specName = spec.specName.toLowerCase();
            return (
              (specName.includes('type') ||
                specName.includes('model') ||
                specName === 'machine_type' ||
                specName === 'type') &&
              spec.specValue === selectedMachineType
            );
          });
        })
      : machinery;
    
    // Extract heights from the filtered machinery
    machinesToCheck.forEach((machine) => {
      machine.specs?.forEach((spec) => {
        const specName = spec.specName.toLowerCase();
        if (
          specName.includes('height') ||
          specName === 'height' ||
          specName === 'working_height'
        ) {
          if (spec.specValue) {
            meters.add(spec.specValue);
          }
        }
      });
    });
    return Array.from(meters).sort((a, b) => {
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });
  }, [machinery, selectedMachineType]);

  // Filter machinery by selected type AND height (meter) - both conditions must match
  const filteredMachinery = useMemo(() => {
    return machinery.filter((machine) => {
      let matchesType = !selectedMachineType; // If no type selected, match all
      let matchesHeight = !selectedMeter; // If no height selected, match all

      // Check if machine matches selected type
      if (selectedMachineType) {
        matchesType = machine.specs?.some((spec) => {
          const specName = spec.specName.toLowerCase();
          return (
            (specName.includes('type') ||
              specName.includes('model') ||
              specName === 'machine_type' ||
              specName === 'type') &&
            spec.specValue === selectedMachineType
          );
        }) || false;
      }

      // Check if machine matches selected height
      if (selectedMeter) {
        matchesHeight = machine.specs?.some((spec) => {
          const specName = spec.specName.toLowerCase();
          return (
            (specName.includes('height') ||
              specName === 'height' ||
              specName === 'working_height') &&
            spec.specValue === selectedMeter
          );
        }) || false;
      }

      // Both conditions must be true (AND logic)
      return matchesType && matchesHeight;
    });
  }, [machinery, selectedMachineType, selectedMeter]);

  // Calculate usage rate as active/total percentage
  const usageRate = useMemo(() => {
    if (filteredMachinery.length === 0) return 0;
    const active = filteredMachinery.filter(
      (m) => m.status === 'Active' || m.status === 'ACTIVE',
    ).length;
    return (active / filteredMachinery.length) * 100;
  }, [filteredMachinery]);

  // Calculate data for selected filters
  const selectedData = useMemo(() => {
    const active = filteredMachinery.filter(
      (m) => m.status === 'Active' || m.status === 'ACTIVE',
    ).length;
    const idle = filteredMachinery.length - active;

    return {
      total: filteredMachinery.length,
      active,
      idle,
    };
  }, [filteredMachinery]);

  // Get customer for a machine from active operations
  const getCustomerForMachine = useMemo(() => {
    return (machine: Machinery): string | null => {
      // Find active internal operations (no endDate or empty endDate)
      const activeInternalOp = internalOperations.find(
        (op) =>
          (op.machineNumber === machine.machineNumber ||
            op.machineCode === machine.machineCode) &&
          (!op.endDate || op.endDate === '')
      );

      if (activeInternalOp?.customerName) {
        return activeInternalOp.customerName;
      }

      // Find active outsource operations (no endDate or empty endDate)
      const activeOutsourceOp = outsourceOperations.find(
        (op) =>
          op.machineCode === machine.machineCode &&
          (!op.endDate || op.endDate === '')
      );

      if (activeOutsourceOp?.customerName) {
        return activeOutsourceOp.customerName;
      }

      return null;
    };
  }, [internalOperations, outsourceOperations]);

  // Get meter (height) for a machine
  const getMeterForMachine = (machine: Machinery): string | null => {
    const heightSpec = machine.specs?.find((spec) => {
      const specName = spec.specName.toLowerCase();
      return (
        specName.includes('height') ||
        specName === 'height' ||
        specName === 'working_height'
      );
    });
    return heightSpec?.specValue || null;
  };

  // Prepare machinery list with details for expanded view
  const machineryList = useMemo(() => {
    return filteredMachinery.map((machine) => ({
      machine,
      machineNumber: machine.machineNumber,
      meter: getMeterForMachine(machine),
      customer: getCustomerForMachine(machine),
      isWorking: machine.status === 'Active' || machine.status === 'ACTIVE',
    }));
  }, [filteredMachinery, getCustomerForMachine]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(target) &&
        meterDropdownRef.current &&
        !meterDropdownRef.current.contains(target)
      ) {
        setTypeDropdownOpen(false);
        setMeterDropdownOpen(false);
      }
    };

    if (typeDropdownOpen || meterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [typeDropdownOpen, meterDropdownOpen]);

  return (
    <div className={`${styles.usageRateCard} ${styles.card}`}>
      <header className={styles.usageRateHeader}>
        <p>Kullanım Oranı</p>
        <div className={styles.dropdownsContainer}>
          <div className={styles.dropdownContainer} ref={typeDropdownRef}>
            <button
              type="button"
              className={styles.dropdownButton}
              onClick={() => {
                setTypeDropdownOpen(!typeDropdownOpen);
                setMeterDropdownOpen(false);
              }}
              title="Makine Tipi Seç"
            >
              <ChevronDown size={18} />
            </button>
            {typeDropdownOpen && (
              <div className={styles.dropdownMenu}>
                <button
                  type="button"
                  className={`${styles.dropdownItem} ${!selectedMachineType ? styles.active : ''}`}
                  onClick={() => {
                    setSelectedMachineType(null);
                    setTypeDropdownOpen(false);
                  }}
                >
                  All Types
                </button>
                {machineTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`${styles.dropdownItem} ${selectedMachineType === type ? styles.active : ''}`}
                    onClick={() => {
                      setSelectedMachineType(type);
                      setTypeDropdownOpen(false);
                      // Reset meter selection when type changes
                      // The meter dropdown will update to show only heights for the new type
                      setSelectedMeter(null);
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={styles.dropdownContainer} ref={meterDropdownRef}>
            <button
              type="button"
              className={styles.dropdownButton}
              onClick={() => {
                setMeterDropdownOpen(!meterDropdownOpen);
                setTypeDropdownOpen(false);
              }}
              title="Metre Seç"
            >
              <ChevronDown size={18} />
            </button>
            {meterDropdownOpen && (
              <div className={styles.dropdownMenu}>
                <button
                  type="button"
                  className={`${styles.dropdownItem} ${!selectedMeter ? styles.active : ''}`}
                  onClick={() => {
                    setSelectedMeter(null);
                    setMeterDropdownOpen(false);
                  }}
                >
                  Tüm Metreler
                </button>
                {meterValues.map((meter) => (
                  <button
                    key={meter}
                    type="button"
                    className={`${styles.dropdownItem} ${selectedMeter === meter ? styles.active : ''}`}
                    onClick={() => {
                      setSelectedMeter(meter);
                      setMeterDropdownOpen(false);
                    }}
                  >
                    {meter}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>
      <strong>{usageRate.toFixed(1)}%</strong>
      <span>makine kullanımı</span>

      {/* Show active and idle counts */}
      <div className={styles.machineryStatus}>
        <span className={styles.statusItem}>
          <span className={styles.statusLabel}>Aktif:</span>
          <span className={styles.statusValue}>{selectedData.active}</span>
        </span>
        <span className={styles.statusItem}>
          <span className={styles.statusLabel}>Boşta:</span>
          <span className={styles.statusValue}>{selectedData.idle}</span>
        </span>
      </div>

      {/* Expand button */}
      <div className={styles.expandContainer}>
        <button
          type="button"
          className={styles.expandButton}
          onClick={() => setExpanded(!expanded)}
          title={expanded ? 'Listeyi daralt' : 'Listeyi genişlet'}
        >
          <ChevronDown
            size={18}
            className={expanded ? styles.expandedIcon : ''}
          />
        </button>
      </div>

      {/* Expanded machinery list */}
      {expanded && (
        <div className={styles.machineryList}>
          {machineryList.length === 0 ? (
            <div className={styles.machineryListItem}>
              <span className={styles.noMachinery}>Makine bulunamadı</span>
            </div>
          ) : (
            machineryList.map((item, index) => (
              <div key={item.machine.id || index} className={styles.machineryListItem}>
                <div className={styles.machineryItemRow}>
                  <span className={styles.machineryNumber}>{item.machineNumber}</span>
                  {item.meter && (
                    <span className={styles.machineryMeter}>{item.meter}</span>
                  )}
                </div>
                {item.isWorking && item.customer && (
                  <div className={styles.machineryCustomer}>
                    <span className={styles.customerLabel}>Müşteri:</span>
                    <span className={styles.customerValue}>{item.customer}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Component for Account Balances card with account type selection
function AccountBalancesCard({ accounts }: { accounts: Account[] }) {
  const [selectedAccountType, setSelectedAccountType] = useState<string | null>(null);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  // Extract unique account types
  const accountTypes = useMemo(() => {
    const types = new Set<string>();
    accounts.forEach((account) => {
      if (account.type) {
        types.add(account.type);
      }
    });
    return Array.from(types).sort();
  }, [accounts]);

  // Filter accounts by selected type
  const filteredAccounts = useMemo(() => {
    if (!selectedAccountType) {
      return accounts;
    }
    return accounts.filter((account) => account.type === selectedAccountType);
  }, [accounts, selectedAccountType]);

  // Calculate balance for filtered accounts
  // Credit cards are liabilities, so subtract their balances
  const balance = useMemo(() => {
    const total = filteredAccounts.reduce((sum, account) => {
      const value = Number(account.balance ?? 0);
      // Check if account type is credit card (case-insensitive)
      const isCreditCard = account.type?.toLowerCase().includes('credit card') || 
                          account.type?.toLowerCase() === 'credit card';
      
      // Subtract credit card balances (liabilities), add other balances (assets)
      return isCreditCard ? sum - value : sum + value;
    }, 0);
    return total.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [filteredAccounts]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(target)) {
        setTypeDropdownOpen(false);
      }
    };

    if (typeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [typeDropdownOpen]);

  return (
    <div className={`${styles.accountBalancesCard} ${styles.card}`}>
      <header className={styles.usageRateHeader}>
        <p>Hesap Bakiyeleri</p>
        <div className={styles.dropdownsContainer}>
          <div className={styles.dropdownContainer} ref={typeDropdownRef}>
            <button
              type="button"
              className={styles.dropdownButton}
              onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
              title="Hesap Tipi Seç"
            >
              <ChevronDown size={18} />
            </button>
            {typeDropdownOpen && (
              <div className={styles.dropdownMenu}>
                <button
                  type="button"
                  className={`${styles.dropdownItem} ${!selectedAccountType ? styles.active : ''}`}
                  onClick={() => {
                    setSelectedAccountType(null);
                    setTypeDropdownOpen(false);
                  }}
                >
                  All Types
                </button>
                {accountTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`${styles.dropdownItem} ${selectedAccountType === type ? styles.active : ''}`}
                    onClick={() => {
                      setSelectedAccountType(type);
                      setTypeDropdownOpen(false);
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>
      <strong>₺{balance}</strong>
      <span>
        {selectedAccountType
          ? `${selectedAccountType.toLowerCase()} hesaplar`
          : 'finansal hesaplar genelinde'}
      </span>

      {/* Expand button */}
      <div className={styles.expandContainer}>
        <button
          type="button"
          className={styles.expandButton}
          onClick={() => setExpanded(!expanded)}
          title={expanded ? 'Listeyi daralt' : 'Listeyi genişlet'}
        >
          <ChevronDown
            size={18}
            className={expanded ? styles.expandedIcon : ''}
          />
        </button>
      </div>

      {/* Expanded accounts list */}
      {expanded && (
        <div className={styles.machineryList}>
          {filteredAccounts.length === 0 ? (
            <div className={styles.machineryListItem}>
              <span className={styles.noMachinery}>Hesap bulunamadı</span>
            </div>
          ) : (
            filteredAccounts.map((account, index) => {
              const isCreditCard = account.type?.toLowerCase().includes('credit card') || 
                                  account.type?.toLowerCase() === 'credit card';
              const balanceValue = Number(account.balance ?? 0);
              const displayBalance = isCreditCard ? -balanceValue : balanceValue;
              
              return (
                <div key={account.id || index} className={styles.machineryListItem}>
                  <div className={styles.machineryItemRow}>
                    <span className={styles.machineryNumber}>
                      {account.accountName || `Account ${account.id}`}
                    </span>
                    {account.type && (
                      <span className={styles.machineryMeter}>{account.type}</span>
                    )}
                  </div>
                  <div className={styles.machineryCustomer}>
                    <span className={styles.customerLabel}>Bakiye:</span>
                    <span className={styles.customerValue}>
                      ₺{displayBalance.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// Component for Revenue card showing taxed and untaxed sales
function RevenueCard({ bills }: { bills: Bill[] }) {
  const [expanded, setExpanded] = useState(false);

  const revenueData = useMemo(() => {
    return calculateCurrentMonthRevenue(bills);
  }, [bills]);

  return (
    <div className={`${styles.revenueCard} ${styles.card}`}>
      <header className={styles.usageRateHeader}>
        <p>Bu Ay Geliri</p>
      </header>
      <strong>₺{revenueData.total.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}</strong>
      <span>bu ay toplam satış</span>

      {/* Show taxed and untaxed breakdown */}
      <div className={styles.revenueStats}>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>Vergili:</span>
          <span className={styles.statusValue}>
            ₺{revenueData.taxed.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} ({revenueData.taxedPercentage.toFixed(1)}%)
          </span>
        </div>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>Vergisiz:</span>
          <span className={styles.statusValue}>
            ₺{revenueData.untaxed.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} ({revenueData.untaxedPercentage.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* Expand button */}
      <div className={styles.expandContainer}>
        <button
          type="button"
          className={styles.expandButton}
          onClick={() => setExpanded(!expanded)}
          title={expanded ? 'Listeyi daralt' : 'Listeyi genişlet'}
        >
          <ChevronDown
            size={18}
            className={expanded ? styles.expandedIcon : ''}
          />
        </button>
      </div>

      {/* Expanded bills list */}
      {expanded && (
        <div className={styles.machineryList}>
          {(() => {
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const currentMonthBills = bills.filter((bill) => {
              const monthYear = getMonthYear(bill.billDate);
              return monthYear === currentMonth;
            });

            if (currentMonthBills.length === 0) {
              return (
                <div className={styles.machineryListItem}>
                  <span className={styles.noMachinery}>Bu ay için fatura bulunamadı</span>
                </div>
              );
            }

            return currentMonthBills.map((bill, index) => (
              <div key={bill.id || index} className={styles.machineryListItem}>
                <div className={styles.machineryItemRow}>
                  <span className={styles.machineryNumber}>
                    {bill.customerName || `Bill ${bill.id}`}
                  </span>
                  <span className={styles.machineryMeter}>
                    {bill.taxed ? 'Vergili' : 'Vergisiz'}
                  </span>
                </div>
                <div className={styles.machineryCustomer}>
                  <span className={styles.customerLabel}>Tutar:</span>
                  <span className={styles.customerValue}>
                    ₺{Number(bill.totalAmount ?? 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            ));
          })()}
        </div>
      )}
    </div>
  );
}

// Component for Collections card showing monthly total with expandable list
function CollectionsCard({
  collectionsCheck,
  collectionsCreditCard,
  collectionsCash,
}: {
  collectionsCheck: CollectionsCheck[];
  collectionsCreditCard: CollectionCreditCard[];
  collectionsCash: CollectionCash[];
}) {
  const [expanded, setExpanded] = useState(false);

  const collectionsData = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const checkCollections = collectionsCheck.filter((c) => {
      const monthYear = getMonthYear(c.collectionDate);
      return monthYear === currentMonth;
    });

    const creditCardCollections = collectionsCreditCard.filter((c) => {
      const monthYear = getMonthYear(c.transactionDate);
      return monthYear === currentMonth;
    });

    const cashCollections = collectionsCash.filter((c) => {
      const monthYear = getMonthYear(c.transactionDate);
      return monthYear === currentMonth;
    });

    const total = calculateTotalCollections(
      checkCollections,
      creditCardCollections,
      cashCollections,
    );

    return {
      total,
      checkCollections,
      creditCardCollections,
      cashCollections,
      allCollections: [
        ...checkCollections.map((c) => ({ ...c, type: 'Check' })),
        ...creditCardCollections.map((c) => ({ ...c, type: 'Credit Card' })),
        ...cashCollections.map((c) => ({ ...c, type: 'Cash' })),
      ],
    };
  }, [collectionsCheck, collectionsCreditCard, collectionsCash]);

  return (
    <div className={`${styles.collectionsCard} ${styles.card}`}>
      <header className={styles.usageRateHeader}>
        <p>Toplam Tahsilatlar</p>
      </header>
      <strong>
        ₺{collectionsData.total.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </strong>
      <span>bu ay tahsilatlar</span>

      {/* Expand button */}
      <div className={styles.expandContainer}>
        <button
          type="button"
          className={styles.expandButton}
          onClick={() => setExpanded(!expanded)}
          title={expanded ? 'Listeyi daralt' : 'Listeyi genişlet'}
        >
          <ChevronDown
            size={18}
            className={expanded ? styles.expandedIcon : ''}
          />
        </button>
      </div>

      {/* Expanded collections list */}
      {expanded && (
        <div className={styles.machineryList}>
          {collectionsData.allCollections.length === 0 ? (
            <div className={styles.machineryListItem}>
              <span className={styles.noMachinery}>
                Bu ay için tahsilat bulunamadı
              </span>
            </div>
          ) : (
            collectionsData.allCollections.map((collection, index) => (
              <div
                key={
                  'id' in collection
                    ? collection.id
                    : `collection-${index}`
                }
                className={styles.machineryListItem}
              >
                <div className={styles.machineryItemRow}>
                  <span className={styles.machineryNumber}>
                    {('customerName' in collection && collection.customerName) ||
                      'Bilinmeyen Müşteri'}
                  </span>
                  <span className={styles.machineryMeter}>
                    {'type' in collection ? collection.type : 'Unknown'}
                  </span>
                </div>
                <div className={styles.machineryCustomer}>
                  <span className={styles.customerLabel}>Tutar:</span>
                  <span className={styles.customerValue}>
                    ₺{Number(collection.amount ?? 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Component for Outsource Costs card showing total and per-outsourcer costs
function OutsourceCostsCard({
  invoices,
  outsourceOperations,
}: {
  invoices: Invoice[];
  outsourceOperations: OutsourceOperation[];
}) {
  const [expanded, setExpanded] = useState(false);

  const costData = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Get unique outsourcer names from outsource operations
    const outsourcerNames = new Set<string>();
    outsourceOperations.forEach((op) => {
      if (op.outsourcerName) {
        outsourcerNames.add(op.outsourcerName);
      }
    });

    // Filter invoices for current month that match outsourcers
    const currentMonthInvoices = invoices.filter((invoice) => {
      const monthYear = getMonthYear(invoice.billDate);
      return (
        monthYear === currentMonth &&
        invoice.supplierOutsourcerName &&
        outsourcerNames.has(invoice.supplierOutsourcerName)
      );
    });

    // Calculate total
    const total = currentMonthInvoices.reduce((sum, invoice) => {
      return sum + Number(invoice.totalAmount ?? 0);
    }, 0);

    // Calculate per-outsourcer totals
    const perOutsourcer = new Map<string, number>();
    currentMonthInvoices.forEach((invoice) => {
      if (invoice.supplierOutsourcerName) {
        const current = perOutsourcer.get(invoice.supplierOutsourcerName) ?? 0;
        perOutsourcer.set(
          invoice.supplierOutsourcerName,
          current + Number(invoice.totalAmount ?? 0),
        );
      }
    });

    // Convert to array and sort by amount (descending)
    const outsourcerTotals = Array.from(perOutsourcer.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    return {
      total,
      outsourcerTotals,
    };
  }, [invoices, outsourceOperations]);

  return (
    <div className={`${styles.outsourceCostsCard} ${styles.card}`}>
      <header className={styles.usageRateHeader}>
        <p>Dış Kaynak Maliyetleri</p>
      </header>
      <strong>
        ₺{costData.total.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </strong>
      <span>bu ay toplam harcama</span>

      {/* Show per-outsourcer breakdown */}
      {costData.outsourcerTotals.length > 0 && (
        <div className={styles.revenueStats}>
          {costData.outsourcerTotals.map((item) => (
            <div key={item.name} className={styles.statusItem}>
              <span className={styles.statusLabel}>{item.name}:</span>
              <span className={styles.statusValue}>
                ₺{item.amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Expand button */}
      <div className={styles.expandContainer}>
        <button
          type="button"
          className={styles.expandButton}
          onClick={() => setExpanded(!expanded)}
          title={expanded ? 'Listeyi daralt' : 'Listeyi genişlet'}
        >
          <ChevronDown
            size={18}
            className={expanded ? styles.expandedIcon : ''}
          />
        </button>
      </div>

      {/* Expanded invoices list */}
      {expanded && (
        <div className={styles.machineryList}>
          {(() => {
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const outsourcerNames = new Set<string>();
            outsourceOperations.forEach((op) => {
              if (op.outsourcerName) {
                outsourcerNames.add(op.outsourcerName);
              }
            });

            const currentMonthInvoices = invoices.filter((invoice) => {
              const monthYear = getMonthYear(invoice.billDate);
              return (
                monthYear === currentMonth &&
                invoice.supplierOutsourcerName &&
                outsourcerNames.has(invoice.supplierOutsourcerName)
              );
            });

            if (currentMonthInvoices.length === 0) {
              return (
                <div className={styles.machineryListItem}>
                  <span className={styles.noMachinery}>
                    Bu ay için fatura bulunamadı
                  </span>
                </div>
              );
            }

            return currentMonthInvoices.map((invoice, index) => (
              <div key={invoice.id || index} className={styles.machineryListItem}>
                <div className={styles.machineryItemRow}>
                  <span className={styles.machineryNumber}>
                    {invoice.supplierOutsourcerName || `Invoice ${invoice.id}`}
                  </span>
                </div>
                <div className={styles.machineryCustomer}>
                  <span className={styles.customerLabel}>Tutar:</span>
                  <span className={styles.customerValue}>
                    ₺{Number(invoice.totalAmount ?? 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            ));
          })()}
        </div>
      )}
    </div>
  );
}

// Component for Service Operations card showing total for the month
function ServiceOperationsCard({ serviceOperations }: { serviceOperations: ServiceOperation[] }) {
  const [expanded, setExpanded] = useState(false);

  const serviceData = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Filter service operations created this month
    const currentMonthOperations = serviceOperations.filter((op) => {
      if (!op.createdAt) return false;
      const monthYear = getMonthYear(op.createdAt);
      return monthYear === currentMonth;
    });

    return {
      total: currentMonthOperations.length,
      operations: currentMonthOperations,
    };
  }, [serviceOperations]);

  return (
    <div className={`${styles.serviceOperationsCard} ${styles.card}`}>
      <header className={styles.usageRateHeader}>
        <p>Servis Operasyonları</p>
      </header>
      <strong>{serviceData.total}</strong>
      <span>total this month</span>

      {/* Expand button */}
      <div className={styles.expandContainer}>
        <button
          type="button"
          className={styles.expandButton}
          onClick={() => setExpanded(!expanded)}
          title={expanded ? 'Listeyi daralt' : 'Listeyi genişlet'}
        >
          <ChevronDown
            size={18}
            className={expanded ? styles.expandedIcon : ''}
          />
        </button>
      </div>

      {/* Expanded operations list */}
      {expanded && (
        <div className={styles.machineryList}>
          {serviceData.operations.length === 0 ? (
            <div className={styles.machineryListItem}>
              <span className={styles.noMachinery}>
                Bu ay için servis operasyonu bulunamadı
              </span>
            </div>
          ) : (
            serviceData.operations.map((op, index) => (
              <div key={op.id || index} className={styles.machineryListItem}>
                <div className={styles.machineryItemRow}>
                  <span className={styles.machineryNumber}>
                    {op.machineNumber || `Operation ${op.id}`}
                  </span>
                  {op.type && (
                    <span className={styles.machineryMeter}>{op.type}</span>
                  )}
                </div>
                {op.description && (
                  <div className={styles.machineryCustomer}>
                    <span className={styles.customerLabel}>Açıklama:</span>
                    <span className={styles.customerValue}>{op.description}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Component for Transportation Operations card showing total for the month
function TransportationOperationsCard({
  transportationOperations,
}: {
  transportationOperations: TransportationOperation[];
}) {
  const [expanded, setExpanded] = useState(false);

  const transportationData = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Filter transportation operations for this month
    const currentMonthOperations = transportationOperations.filter((op) => {
      if (!op.operationDate) return false;
      const monthYear = getMonthYear(op.operationDate);
      return monthYear === currentMonth;
    });

    return {
      total: currentMonthOperations.length,
      operations: currentMonthOperations,
    };
  }, [transportationOperations]);

  return (
    <div className={`${styles.transportationOperationsCard} ${styles.card}`}>
      <header className={styles.usageRateHeader}>
        <p>Nakliye Operasyonları</p>
      </header>
      <strong>{transportationData.total}</strong>
      <span>total this month</span>

      {/* Expand button */}
      <div className={styles.expandContainer}>
        <button
          type="button"
          className={styles.expandButton}
          onClick={() => setExpanded(!expanded)}
          title={expanded ? 'Listeyi daralt' : 'Listeyi genişlet'}
        >
          <ChevronDown
            size={18}
            className={expanded ? styles.expandedIcon : ''}
          />
        </button>
      </div>

      {/* Expanded operations list */}
      {expanded && (
        <div className={styles.machineryList}>
          {transportationData.operations.length === 0 ? (
            <div className={styles.machineryListItem}>
              <span className={styles.noMachinery}>
                Bu ay için nakliye operasyonu bulunamadı
              </span>
            </div>
          ) : (
            transportationData.operations.map((op, index) => (
              <div
                key={op.transportationOpId || index}
                className={styles.machineryListItem}
              >
                <div className={styles.machineryItemRow}>
                  <span className={styles.machineryNumber}>
                    {op.plateNum || `Operation ${op.transportationOpId}`}
                  </span>
                </div>
                {(op.startingLoc || op.endingLoc) && (
                  <div className={styles.machineryCustomer}>
                    <span className={styles.customerLabel}>Rota:</span>
                    <span className={styles.customerValue}>
                      {op.startingLoc || 'N/A'} → {op.endingLoc || 'N/A'}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function calculateOperationsMix(
  internalOperations: InternalOperation[],
  outsourceOperations: OutsourceOperation[],
  serviceOperations: ServiceOperation[],
) {
  return [
    { name: 'İç', value: internalOperations.length },
    { name: 'Taşeron', value: outsourceOperations.length },
    { name: 'Servis', value: serviceOperations.length },
  ];
}

// Calculate total taxes for current month (SGK + Kurumlar Vergisi + KDV)
function calculateTotalTaxes(
  bills: Bill[],
  invoices: Invoice[],
  personelPayments: PersonelPayment[],
): number {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Filter for current month
  const currentMonthBills = bills.filter((bill) => {
    if (!bill.billDate) return false;
    const billDate = new Date(bill.billDate);
    return billDate.getMonth() === currentMonth && billDate.getFullYear() === currentYear;
  });

  const currentMonthInvoices = invoices.filter((invoice) => {
    if (!invoice.billDate) return false;
    const invoiceDate = new Date(invoice.billDate);
    return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
  });

  const currentMonthPersonelPayments = personelPayments.filter((payment) => {
    if (!payment.date) return false;
    const paymentDate = new Date(payment.date);
    return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
  });

  // Calculate SGK Primleri (15% of personnel payments)
  const totalPersonelPayments = currentMonthPersonelPayments.reduce((sum, payment) => {
    return sum + (parseFloat(payment.amount || '0') || 0);
  }, 0);
  const sgk = totalPersonelPayments * 0.15;

  // Calculate Kurumlar Vergisi (20% of profit)
  const taxedBills = currentMonthBills.filter((bill) => bill.taxed);
  const totalTaxedBills = taxedBills.reduce((sum, bill) => {
    return sum + (parseFloat(bill.totalAmount || '0') || 0);
  }, 0);

  const taxedInvoices = currentMonthInvoices.filter((invoice) => invoice.taxed);
  const totalTaxedInvoices = taxedInvoices.reduce((sum, invoice) => {
    return sum + (parseFloat(invoice.totalAmount || '0') || 0);
  }, 0);

  const profit = totalTaxedBills - totalTaxedInvoices - totalPersonelPayments;
  const kurumlarVergisi = Math.max(0, profit * 0.20);

  // Calculate KDV (20% of (sales KDV - purchase KDV))
  // Note: This is simplified - actual KDV calculation requires başlangıç KDV from settings
  const salesKdv = totalTaxedBills * 0.20;
  const purchaseKdv = totalTaxedInvoices * 0.20;
  const kdv = Math.max(0, salesKdv - purchaseKdv);

  return sgk + kurumlarVergisi + kdv;
}

function calculateTotalCollections(
  collectionsCheck: CollectionsCheck[],
  collectionsCreditCard: CollectionCreditCard[],
  collectionsCash: CollectionCash[],
): number {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const checkTotal = collectionsCheck
    .filter((c) => {
      const monthYear = getMonthYear(c.collectionDate);
      return monthYear === currentMonth;
    })
    .reduce((sum, c) => sum + Number(c.amount ?? 0), 0);

  const creditCardTotal = collectionsCreditCard
    .filter((c) => {
      const monthYear = getMonthYear(c.transactionDate);
      return monthYear === currentMonth;
    })
    .reduce((sum, c) => sum + Number(c.amount ?? 0), 0);

  const cashTotal = collectionsCash
    .filter((c) => {
      const monthYear = getMonthYear(c.transactionDate);
      return monthYear === currentMonth;
    })
    .reduce((sum, c) => sum + Number(c.amount ?? 0), 0);

  return checkTotal + creditCardTotal + cashTotal;
}

function calculateTotalPayments(
  paymentsCheck: PaymentCheck[],
  paymentsCreditCard: PaymentCreditCard[],
  paymentsCash: PaymentsCash[],
): number {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const checkTotal = paymentsCheck
    .filter((p) => {
      const monthYear = getMonthYear(p.collectionDate || p.checkDate);
      return monthYear === currentMonth;
    })
    .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);

  const creditCardTotal = paymentsCreditCard
    .filter((p) => {
      const monthYear = getMonthYear(p.transactionDate);
      return monthYear === currentMonth;
    })
    .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);

  const cashTotal = paymentsCash
    .filter((p) => {
      const monthYear = getMonthYear(p.transactionDate);
      return monthYear === currentMonth;
    })
    .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);

  return checkTotal + creditCardTotal + cashTotal;
}

export default function DashboardPage() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>({
    customers: mockCustomers,
    suppliers: mockSuppliers,
    bills: mockBills,
    invoices: mockInvoices,
    accounts: mockAccounts,
    inventory: mockInventory,
    collectionsCheck: mockCollectionsCheck,
    collectionsCreditCard: mockCollectionCreditCard,
    collectionsCash: mockCollectionCash,
    paymentsCheck: mockPaymentCheck,
    paymentsCreditCard: mockPaymentCreditCard,
    paymentsCash: mockPaymentsCash,
    internalOperations: mockInternalOperations,
    outsourceOperations: mockOutsourceOperations,
    serviceOperations: mockServiceOperations,
    transportationOperations: mockTransportationOperations,
    machinery: mockMachinery,
    workingSites: [],
    personelPayments: [],
  });

  useEffect(() => {
    void Promise.all([
      apiGet<Customer[]>('/customers', mockCustomers),
      apiGet<Supplier[]>('/suppliers', mockSuppliers),
      apiGet<Bill[]>('/billing', mockBills),
      apiGet<Invoice[]>('/invoices', mockInvoices),
      apiGet<Account[]>('/accounts', mockAccounts),
      apiGet<InventoryItem[]>('/inventory', mockInventory),
      apiGet<CollectionsCheck[]>('/collections/check', mockCollectionsCheck),
      apiGet<CollectionCreditCard[]>('/collections/credit-card', mockCollectionCreditCard),
      apiGet<CollectionCash[]>('/collections/cash', mockCollectionCash),
      apiGet<PaymentCheck[]>('/payments/check', mockPaymentCheck),
      apiGet<PaymentCreditCard[]>('/payments/credit-card', mockPaymentCreditCard),
      apiGet<PaymentsCash[]>('/payments/cash', mockPaymentsCash),
      apiGet<InternalOperation[]>('/operations/internal', mockInternalOperations),
      apiGet<OutsourceOperation[]>('/operations/outsource', mockOutsourceOperations),
      apiGet<ServiceOperation[]>('/operations/service', mockServiceOperations),
      apiGet<TransportationOperation[]>('/operations/transportation', mockTransportationOperations),
      apiGet<Machinery[]>('/machinery', mockMachinery),
      apiGet<WorkingSite[]>('/working-sites', []),
      apiGet<PersonelPayment[]>('/personel/payments', []),
    ]).then(
      ([
        customers,
        suppliers,
        bills,
        invoices,
        accounts,
        inventory,
        collectionsCheck,
        collectionsCreditCard,
        collectionsCash,
        paymentsCheck,
        paymentsCreditCard,
        paymentsCash,
        internalOperations,
        outsourceOperations,
        serviceOperations,
        transportationOperations,
        machinery,
        workingSites,
        personelPayments,
      ]) => {
        setSnapshot({
          customers,
          suppliers,
          bills,
          invoices,
          accounts,
          inventory,
          collectionsCheck,
          collectionsCreditCard,
          collectionsCash,
          paymentsCheck,
          paymentsCreditCard,
          paymentsCash,
          internalOperations,
          outsourceOperations,
          serviceOperations,
          transportationOperations,
          machinery,
          workingSites,
          personelPayments,
        });
      },
    );
  }, []);


  const monthlySalesAndExpenses = useMemo(
    () => calculateMonthlySalesAndExpenses(snapshot.bills, snapshot.invoices),
    [snapshot.bills, snapshot.invoices],
  );

  const currentMonthSalesAndExpenses = useMemo(
    () => calculateCurrentMonthSalesAndExpenses(snapshot.bills, snapshot.invoices),
    [snapshot.bills, snapshot.invoices],
  );

  const totalExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return snapshot.invoices
      .filter((invoice) => {
        const monthYear = getMonthYear(invoice.billDate);
        return monthYear === currentMonth;
      })
      .reduce((sum, invoice) => sum + Number(invoice.totalAmount ?? 0), 0);
  }, [snapshot.invoices]);

  const currentMonthRevenueData = useMemo(
    () => calculateCurrentMonthRevenue(snapshot.bills),
    [snapshot.bills],
  );

  const usageRate = useMemo(
    () =>
      calculateUsageRate(
        snapshot.internalOperations,
        snapshot.outsourceOperations,
        snapshot.serviceOperations,
        snapshot.machinery,
      ),
    [
      snapshot.internalOperations,
      snapshot.outsourceOperations,
      snapshot.serviceOperations,
      snapshot.machinery,
    ],
  );

  const operationsMix = useMemo(
    () =>
      calculateOperationsMix(
        snapshot.internalOperations,
        snapshot.outsourceOperations,
        snapshot.serviceOperations,
      ),
    [snapshot.internalOperations, snapshot.outsourceOperations, snapshot.serviceOperations],
  );

  const totalCollections = useMemo(
    () =>
      calculateTotalCollections(
        snapshot.collectionsCheck,
        snapshot.collectionsCreditCard,
        snapshot.collectionsCash,
      ),
    [snapshot.collectionsCheck, snapshot.collectionsCreditCard, snapshot.collectionsCash],
  );

  const totalPayments = useMemo(
    () =>
      calculateTotalPayments(
        snapshot.paymentsCheck,
        snapshot.paymentsCreditCard,
        snapshot.paymentsCash,
      ),
    [snapshot.paymentsCheck, snapshot.paymentsCreditCard, snapshot.paymentsCash],
  );

  const totalTaxes = useMemo(
    () =>
      calculateTotalTaxes(
        snapshot.bills,
        snapshot.invoices,
        snapshot.personelPayments,
      ),
    [snapshot.bills, snapshot.invoices, snapshot.personelPayments],
  );


  // All machinery for the map (including idle) - needed to show idle machinery markers
  const allMachinery = useMemo(
    () =>
      snapshot.machinery.map((m) => ({
        id: m.id,
        machineNumber: m.machineNumber,
        machineCode: m.machineCode,
        status: m.status ?? 'IDLE',
        latitude: m.latitude,
        longitude: m.longitude,
        createdAt: m.createdAt,
      })),
    [snapshot.machinery],
  );

  return (
    <div className={styles.dashboard}>
      <section>
        <h1>Yönetim Özeti</h1>
        <p className={styles.subtitle}>
          Müşteriler, tedarikçiler ve operasyonlar genelinde temel performans göstergelerini izleyin.
        </p>
        <CardGrid>
          <RevenueCard bills={snapshot.bills} />
          <UsageRateCard
            internalOperations={snapshot.internalOperations}
            outsourceOperations={snapshot.outsourceOperations}
            machinery={snapshot.machinery}
          />
          <CollectionsCard
            collectionsCheck={snapshot.collectionsCheck}
            collectionsCreditCard={snapshot.collectionsCreditCard}
            collectionsCash={snapshot.collectionsCash}
          />
          <StatCard
            title="Toplam Ödemeler"
            value={`₺${totalPayments.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
            accent="rose"
            subtitle="bu ay ödemeler"
          />
          <StatCard
            title="Toplam Giderler"
            value={`₺${totalExpenses.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
            accent="amber"
            subtitle="bu ay giderler"
          />
          <OutsourceCostsCard
            invoices={snapshot.invoices}
            outsourceOperations={snapshot.outsourceOperations}
          />
          <AccountBalancesCard accounts={snapshot.accounts} />
          <StatCard
            title="Toplam Vergiler"
            value={`₺${totalTaxes.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
            accent="amber"
            subtitle="bu ay toplam vergi"
          />
          <ServiceOperationsCard serviceOperations={snapshot.serviceOperations} />
          <TransportationOperationsCard
            transportationOperations={snapshot.transportationOperations}
          />
        </CardGrid>
      </section>

      <section className={styles.grid}>
        <div className={styles.chartCard}>
          <h2>Bu Ay Satışlar & Giderler</h2>
          <p className={styles.chartDescription}>Bu ay Satışlar vs Giderler</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={[
                {
                  name: 'Bu Ay',
                  sales: currentMonthSalesAndExpenses.sales,
                  expenses: currentMonthSalesAndExpenses.expenses,
                  profit: currentMonthSalesAndExpenses.profit,
                },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                formatter={(value: number) => `₺${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#10b981"
                strokeWidth={3}
                name="Satışlar"
                dot={{ fill: '#10b981', r: 6 }}
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                strokeWidth={3}
                name="Giderler"
                dot={{ fill: '#ef4444', r: 6 }}
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#2563eb"
                strokeWidth={3}
                name="Kar"
                dot={{ fill: '#2563eb', r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h2>Satış & Gider Trendi (6 Ay)</h2>
          <p className={styles.chartDescription}>Son 6 ayda Satışlar vs Giderler</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlySalesAndExpenses}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                formatter={(value: number) => `₺${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#10b981"
                strokeWidth={3}
                name="Satışlar"
                dot={{ fill: '#10b981', r: 5 }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                strokeWidth={3}
                name="Giderler"
                dot={{ fill: '#ef4444', r: 5 }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#2563eb"
                strokeWidth={3}
                name="Kar"
                dot={{ fill: '#2563eb', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h2>Operasyon Dağılımı</h2>
          <p className={styles.chartDescription}>İç vs Taşeron vs Servis</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={operationsMix}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {operationsMix.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className={styles.mapSection}>
        <div className={styles.chartCard}>
          <h2>Aktif Operasyonlar Haritası</h2>
          <p className={styles.chartDescription}>Tüm aktif makine operasyonlarının coğrafi görünümü</p>
          <MachineryMap
            internalOps={snapshot.internalOperations.filter((op) => !op.endDate || op.endDate === '')}
            outsourceOps={snapshot.outsourceOperations.filter((op) => !op.endDate || op.endDate === '')}
            workingSites={snapshot.workingSites}
            showAllActive={true}
            activeMachinery={allMachinery}
          />
        </div>
      </section>

      <section className={styles.matrix}>
        <div>
          <h2>Operasyon Özeti</h2>
          <ul>
            <li>İç operasyonlar: {snapshot.internalOperations.length}</li>
            <li>Taşeron operasyonlar: {snapshot.outsourceOperations.length}</li>
            <li>Servis müdahaleleri: {snapshot.serviceOperations.length}</li>
            <li>Aktif makine: {snapshot.machinery.length}</li>
            <li>Toplam faturalar: {snapshot.bills.length}</li>
            <li>Toplam faturalar: {snapshot.invoices.length}</li>
          </ul>
        </div>
        <div>
          <h2>Mali Özet</h2>
          <ul>
            <li>Bu ay geliri: ₺{currentMonthRevenueData.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</li>
            <li>Kullanım oranı: {usageRate.toFixed(1)}%</li>
            <li>Toplam tahsilatlar: ₺{totalCollections.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</li>
            <li>Toplam ödemeler: ₺{totalPayments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</li>
            <li>Net nakit akışı: ₺{(totalCollections - totalPayments).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
