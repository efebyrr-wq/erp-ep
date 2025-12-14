import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { DataTable } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Tabs } from '../components/common/Tabs';
import { DateTimeInput } from '../components/common/DateTimeInput';
import { apiGet } from '../lib/api';
import { convertDDMMYYYYHHMMToISO, convertISOToDDMMYYYYHHMM } from '../lib/dateTimeUtils';
import { mockBills, mockInvoices } from '../lib/mockData';
import type { Bill, Invoice, Customer, InternalOperation, OutsourceOperation, Supplier, Supply, Outsourcer } from '../types';
import styles from './BillingPage.module.css';

type BillingTab = 'bills' | 'invoices';

type BillLineForm = {
  type: string;
  details: string;
  unitPrice: string;
  amount: string;
  startDate?: string;
  endDate?: string;
  operationId?: string;
  closeOperation?: boolean;
};

type BillWithLinesForm = {
  customerName: string;
  billDate: string;
  taxed: boolean;
  lines: BillLineForm[];
};

type InvoiceForm = {
  supplierOutsourcerName: string;
  totalAmount: string;
  billDate: string;
  taxed: boolean;
  lines?: {
    type: string;
    details: string;
    unitPrice: string;
    amount: string;
    operationId?: string;
    supplyId?: string; // Added supplyId to track selected supply
  }[];
};

export default function BillingPage() {
  const [tab, setTab] = useState<BillingTab>('bills');
  const [bills, setBills] = useState<Bill[]>(mockBills);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeInternalOps, setActiveInternalOps] = useState<InternalOperation[]>([]);
  const [activeOutsourceOps, setActiveOutsourceOps] = useState<OutsourceOperation[]>([]);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  
  // Bill with lines form state
  const [billWithLinesForm, setBillWithLinesForm] = useState<BillWithLinesForm>({
    customerName: '',
    billDate: '',
    taxed: false,
    lines: [
      {
        type: '',
        details: '',
        unitPrice: '',
        amount: '',
        startDate: '',
        endDate: '',
        operationId: '',
        closeOperation: false,
      },
    ],
  });
  
  const [invoiceForm, setInvoiceForm] = useState<InvoiceForm>({
    supplierOutsourcerName: '',
    totalAmount: '',
    billDate: '',
    taxed: false,
    lines: [],
  });
  const [supplierOptions, setSupplierOptions] = useState<{ supplyId: string; label: string; supply: Supply }[]>([]);
  const [suppliersList, setSuppliersList] = useState<Supplier[]>([]);
  const [outsourcersList, setOutsourcersList] = useState<Outsourcer[]>([]);

  useEffect(() => {
    void apiGet<Bill[]>('/billing', mockBills).then((data) => {
      console.log('Loaded bills:', data);
      // Check if bills have billLines
      data.forEach((bill) => {
        if (bill.billLines && Array.isArray(bill.billLines)) {
          console.log(`Bill ${bill.id} has ${bill.billLines.length} lines:`, bill.billLines);
        } else {
          console.log(`Bill ${bill.id} has no billLines or billLines is not an array`);
        }
      });
      setBills(data);
    });
    void apiGet<Invoice[]>('/invoices', mockInvoices).then((data) => {
      setInvoices(data);
    });
    void apiGet<Customer[]>('/customers', []).then((data) => {
      setCustomers(data);
    });
    void apiGet<InternalOperation[]>('/operations/internal/active', []).then((data) => {
      setActiveInternalOps(data);
    });
    void apiGet<OutsourceOperation[]>('/operations/outsource/active', []).then((data) => {
      setActiveOutsourceOps(data);
    });
    // Build supply options for invoice lines select
    void apiGet<Supplier[]>('/suppliers', []).then((data) => {
      setSuppliersList(data);
      const opts: { supplyId: string; label: string; supply: Supply }[] = [];
      data.forEach((s) => {
        (s.supplies ?? []).forEach((sup) => {
          if ((sup as any).id) {
            const idStr = String((sup as any).id);
            const label = `${s.name} • ${sup.productName ?? '—'} • ${sup.type ?? ''} • ₺${sup.price ?? '0.00'} • Qty: ${sup.quantity ?? 0}`;
            opts.push({ supplyId: idStr, label, supply: sup as Supply });
          }
        });
      });
      setSupplierOptions(opts);
    });
    void apiGet<Outsourcer[]>('/outsourcers', []).then((data) => {
      setOutsourcersList(data);
    });
  }, []);

  const openBillForm = async (bill?: Bill) => {
    // Refresh active operations list when opening the form
    void apiGet<InternalOperation[]>('/operations/internal/active', []).then((data) => {
      setActiveInternalOps(data);
    });
    void apiGet<OutsourceOperation[]>('/operations/outsource/active', []).then((data) => {
      setActiveOutsourceOps(data);
    });
    
    if (bill) {
      setEditingBillId(bill.id);
      // Always fetch fresh bill data with lines from backend
      // First try to use billLines from the already loaded bill, then try API
      let billWithLines: Bill = bill;
      
      // If bill already has billLines, use them; otherwise fetch from API
      if (!bill.billLines || bill.billLines.length === 0) {
        try {
          billWithLines = await apiGet<Bill>(`/billing/${bill.id}`, bill);
        } catch (error) {
          console.error('Error fetching bill from API, using loaded bill:', error);
          // Use the bill from state if API fails
          billWithLines = bill;
        }
      }
      
      console.log('Using bill with lines:', billWithLines);
      console.log('Bill ID:', bill.id);
      console.log('Bill lines:', billWithLines.billLines);
      
      // Convert bill lines to form format
      // The backend now merges both rental and non-rental lines into billLines
      // Rental lines have startDate/endDate, non-rental don't
      const formLines: BillLineForm[] = [];
      
      if (billWithLines.billLines && Array.isArray(billWithLines.billLines) && billWithLines.billLines.length > 0) {
        console.log('Processing bill lines:', billWithLines.billLines.length);
        billWithLines.billLines.forEach((line: any) => {
          // Check if this is a rental line (has startDate/endDate)
          const isRental = !!(line.startDate || line.endDate);
          
          // Format dates properly for DateTimeInput (DD/MM/YYYY HH:MM format)
          let formattedStartDate = '';
          let formattedEndDate = '';
          
          if (isRental) {
            if (line.startDate) {
              try {
                // Convert ISO date string to DD/MM/YYYY HH:MM
                formattedStartDate = convertISOToDDMMYYYYHHMM(String(line.startDate));
                console.log(`Parsed startDate: "${line.startDate}" -> "${formattedStartDate}"`);
              } catch (error) {
                console.error('Error parsing startDate:', error, line.startDate);
                formattedStartDate = '';
              }
            }
            if (line.endDate) {
              try {
                // Convert ISO date string to DD/MM/YYYY HH:MM
                formattedEndDate = convertISOToDDMMYYYYHHMM(String(line.endDate));
                console.log(`Parsed endDate: "${line.endDate}" -> "${formattedEndDate}"`);
              } catch (error) {
                console.error('Error parsing endDate:', error, line.endDate);
                formattedEndDate = '';
              }
            }
          }
          
          console.log(`Line type: ${line.type}, isRental: ${isRental}, startDate: "${formattedStartDate}", endDate: "${formattedEndDate}"`);
          
          formLines.push({
            type: line.type || '',
            details: line.details || '',
            unitPrice: line.unitPrice || '',
            amount: line.amount || '',
            operationId: line.operationId || '',
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            closeOperation: false, // Default to false when editing
          });
        });
      } else {
        console.log('No bill lines found');
      }
      
      console.log('Total form lines to display:', formLines.length);
      
      // If no lines found, add one empty line
      if (formLines.length === 0) {
        console.log('No lines found, adding empty line');
        formLines.push({ type: '', details: '', unitPrice: '', amount: '', startDate: '', endDate: '', operationId: '', closeOperation: false });
      }
      
      setBillWithLinesForm({
        customerName: billWithLines.customerName || '',
        billDate: billWithLines.billDate ? convertISOToDDMMYYYYHHMM(billWithLines.billDate) : '',
        taxed: billWithLines.taxed ?? false,
        lines: formLines,
      });
    } else {
      setEditingBillId(null);
      setBillWithLinesForm({
        customerName: '',
        billDate: '',
        taxed: false,
        lines: [{ type: '', details: '', unitPrice: '', amount: '', startDate: '', endDate: '', operationId: '', closeOperation: false }],
      });
    }
      setBillModalOpen(true);
  };

  const openInvoiceForm = async (invoice?: Invoice) => {
    // Refresh active operations list when opening the form
    void apiGet<InternalOperation[]>('/operations/internal/active', []).then((data) => {
      setActiveInternalOps(data);
    });
    void apiGet<OutsourceOperation[]>('/operations/outsource/active', []).then((data) => {
      setActiveOutsourceOps(data);
    });
    // Refresh outsourcers list
    void apiGet<Outsourcer[]>('/outsourcers', []).then((data) => {
      setOutsourcersList(data);
    });
    
    if (invoice) {
      setEditingInvoiceId(invoice.id);
      setInvoiceForm({
        supplierOutsourcerName: invoice.supplierOutsourcerName ?? '',
        totalAmount: invoice.totalAmount ?? '',
        billDate: invoice.billDate ? convertISOToDDMMYYYYHHMM(invoice.billDate) : '',
        taxed: invoice.taxed ?? false,
        lines: [], // lines will be fetched/attached later if needed
      });
    } else {
      setEditingInvoiceId(null);
      setInvoiceForm({
        supplierOutsourcerName: '',
        totalAmount: '0.00',
        billDate: '',
        taxed: false,
        lines: [{ type: '', details: '', unitPrice: '', amount: '', operationId: '', supplyId: '' }],
      });
    }
    setInvoiceModalOpen(true);
  };
  const addInvoiceLine = () => {
    setInvoiceForm((prev) => ({
      ...prev,
      lines: [...(prev.lines ?? []), { type: '', details: '', unitPrice: '', amount: '', operationId: '', supplyId: '' }],
    }));
  };
  const removeInvoiceLine = (index: number) => {
    setInvoiceForm((prev) => ({
      ...prev,
      lines: (prev.lines ?? []).filter((_, i) => i !== index),
    }));
  };
  const updateInvoiceLine = (
    index: number,
    field: 'type' | 'details' | 'unitPrice' | 'amount' | 'operationId' | 'supplyId',
    value: string,
  ) => {
    setInvoiceForm((prev) => {
      const next = [...(prev.lines ?? [])] as any[];
      
      // If supplyId is being set, auto-fill the supply data
      if (field === 'supplyId' && value) {
        const selectedSupply = supplierOptions.find(opt => opt.supplyId === value)?.supply;
        if (selectedSupply) {
          next[index] = {
            ...next[index],
            supplyId: value,
            type: selectedSupply.type || '',
            details: selectedSupply.productName || '',
            unitPrice: selectedSupply.price || '',
            amount: String(selectedSupply.quantity || ''),
          };
        } else {
      next[index] = { ...next[index], [field]: value };
        }
      } else {
        next[index] = { ...next[index], [field]: value };
      }
      
      // Auto-calculate total amount when lines change
      const newTotal = next.reduce((acc, l) => {
        const u = parseFloat(l.unitPrice || '0');
        const a = parseFloat(l.amount || '0');
        return acc + (isFinite(u * a) ? u * a : 0);
      }, 0);
      
      return { ...prev, lines: next, totalAmount: newTotal.toFixed(2) } as any;
    });
  };

  const computeInvoiceTotal = () => {
    const sum =
      invoiceForm.lines?.reduce((acc, l) => {
        const u = parseFloat(l.unitPrice || '0');
        const a = parseFloat(l.amount || '0');
        return acc + (isFinite(u * a) ? u * a : 0);
      }, 0) ?? 0;
    return sum.toFixed(2);
  };


  const closeBillForm = () => {
    setBillModalOpen(false);
    setEditingBillId(null);
    setBillWithLinesForm({
      customerName: '',
      billDate: '',
      taxed: false,
      lines: [{ type: '', details: '', unitPrice: '', amount: '', startDate: '', endDate: '', operationId: '', closeOperation: false }],
    });
  };

  const closeInvoiceForm = () => {
    setInvoiceModalOpen(false);
    setEditingInvoiceId(null);
    setInvoiceForm({
      supplierOutsourcerName: '',
      totalAmount: '',
      billDate: '',
      taxed: false,
    });
  };

  // Calculate total amount from bill lines
  const calculateTotalAmount = useMemo(() => {
    return billWithLinesForm.lines.reduce((total, line) => {
      const unitPrice = parseFloat(line.unitPrice) || 0;
      const amount = parseFloat(line.amount) || 0;
      return total + unitPrice * amount;
    }, 0);
  }, [billWithLinesForm.lines]);

  // Filter active operations by selected customer
  const filteredActiveOperations = useMemo(() => {
    const selectedCustomerName = billWithLinesForm.customerName;
    if (!selectedCustomerName) {
      return { internal: [], outsource: [] };
    }

    const filteredInternal = activeInternalOps.filter(
      (op) => !op.endDate && op.customerName === selectedCustomerName
    );
    const filteredOutsource = activeOutsourceOps.filter(
      (op) => !op.endDate && op.customerName === selectedCustomerName
    );

    return { internal: filteredInternal, outsource: filteredOutsource };
  }, [activeInternalOps, activeOutsourceOps, billWithLinesForm.customerName]);

  const addBillLine = () => {
    setBillWithLinesForm((prev) => ({
      ...prev,
      lines: [...prev.lines, { type: '', details: '', unitPrice: '', amount: '', startDate: '', endDate: '', operationId: '', closeOperation: false }],
    }));
  };

  const removeBillLine = (index: number) => {
    setBillWithLinesForm((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }));
  };

  const updateBillLine = (index: number, field: keyof BillLineForm, value: string | boolean) => {
    setBillWithLinesForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line, i) => {
        if (i === index) {
          const updated = { ...line, [field]: value };
          // If type changes to non-rental, clear start/end dates and closeOperation
          if (field === 'type' && typeof value === 'string' && !value.includes('Rental')) {
            updated.startDate = '';
            updated.endDate = '';
            updated.closeOperation = false;
          }
          // If user checks closeOperation, set today's date as endDate
          if (field === 'closeOperation' && value === true) {
            const today = new Date();
            const dd = String(today.getDate()).padStart(2, '0');
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const yyyy = today.getFullYear();
            const hh = String(today.getHours()).padStart(2, '0');
            const min = String(today.getMinutes()).padStart(2, '0');
            updated.endDate = `${dd}/${mm}/${yyyy} ${hh}:${min}`;
          }
          return updated;
        }
        return line;
      }),
    }));
  };

  // Check if a type is a rental type
  const isRentalType = (type: string): boolean => {
    return type.includes('Rental');
  };

  const handleBillSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Calculate total amount
    const totalAmount = calculateTotalAmount.toFixed(2);
    
    // Separate rental and non-rental lines
    const rentalLines = billWithLinesForm.lines.filter((line) => isRentalType(line.type));
    
    // Prepare bill lines for API
    const billLines = billWithLinesForm.lines.map((line) => ({
      type: line.type || null,
      details: line.details || null,
      unitPrice: line.unitPrice || null,
      amount: line.amount || null,
      operationId: line.operationId || null,
      startDate: line.startDate ? convertDDMMYYYYHHMMToISO(line.startDate) : null,
      endDate: line.endDate ? convertDDMMYYYYHHMMToISO(line.endDate) : null,
    }));

    // Save bill to database via API FIRST
    try {
      const payload = {
        customerName: billWithLinesForm.customerName || null,
        totalAmount: totalAmount,
        billDate: billWithLinesForm.billDate ? convertDDMMYYYYHHMMToISO(billWithLinesForm.billDate) : null,
        taxed: billWithLinesForm.taxed,
        lines: billLines,
      };

      console.log('Saving bill with payload:', payload);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/billing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('Bill save response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Bill save error response:', errorText);
        let errorMessage = 'Failed to save bill.';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
          if (errorJson.statusCode) {
            errorMessage = `[${errorJson.statusCode}] ${errorMessage}`;
          }
        } catch {
          errorMessage = errorText || errorMessage;
        }
        alert(`Error saving bill: ${errorMessage}`);
        return;
      }

      const result = await response.json();
      
      if (result) {
        // Only close operations AFTER bill is successfully saved
        for (const line of rentalLines) {
          if (line.closeOperation && line.operationId) {
            // Try to find the operation in internal or outsource operations
            const internalOp = activeInternalOps.find((op) => op.id === line.operationId);
            const outsourceOp = activeOutsourceOps.find((op) => op.id === line.operationId);
            
            if (internalOp) {
              try {
                const closeResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/operations/internal/${line.operationId}/close`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({}),
                });
                if (closeResponse.ok) {
                  // Refresh active operations immediately
                  const updatedInternalOps = await apiGet<InternalOperation[]>('/operations/internal/active', []);
                  setActiveInternalOps(updatedInternalOps);
                } else {
                  console.error('Error closing internal operation:', await closeResponse.text());
                }
              } catch (error) {
                console.error('Error closing internal operation:', error);
              }
            } else if (outsourceOp) {
              try {
                const closeResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/operations/outsource/${line.operationId}/close`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({}),
                });
                if (closeResponse.ok) {
                  // Refresh active operations immediately
                  const updatedOutsourceOps = await apiGet<OutsourceOperation[]>('/operations/outsource/active', []);
                  setActiveOutsourceOps(updatedOutsourceOps);
                } else {
                  console.error('Error closing outsource operation:', await closeResponse.text());
                }
              } catch (error) {
                console.error('Error closing outsource operation:', error);
              }
            }
          }
        }

        // Refresh bills list
        void apiGet<Bill[]>('/billing', mockBills).then((data) => {
          setBills(data);
        });

        // Refresh customers list to get updated balance
        void apiGet<Customer[]>('/customers', []).then((data) => {
          setCustomers(data);
        });

        // Refresh active operations if any were closed
        if (rentalLines.some(line => line.closeOperation)) {
          void apiGet<InternalOperation[]>('/operations/internal/active', []).then((data) => {
            setActiveInternalOps(data);
          });
          void apiGet<OutsourceOperation[]>('/operations/outsource/active', []).then((data) => {
            setActiveOutsourceOps(data);
          });
        }

        closeBillForm();
      } else {
        alert('Failed to save bill. Please try again.');
      }
    } catch (error) {
      console.error('Error saving bill:', error);
      alert(`Failed to save bill: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleInvoiceSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const confirmed = window.confirm(
      editingInvoiceId ? 'Are you sure you want to update this invoice?' : 'Are you sure you want to create this invoice?'
    );
    if (!confirmed) return;

    // Validate required fields
    if (!invoiceForm.supplierOutsourcerName || invoiceForm.supplierOutsourcerName.trim() === '') {
      alert('Please select a supplier/outsourcer.');
      return;
    }
    if (!invoiceForm.billDate) {
      alert('Please select a bill date.');
      return;
    }

    // Convert billDate from DD/MM/YYYY HH:MM to ISO for backend
    const billDateForBackend = convertDDMMYYYYHHMMToISO(invoiceForm.billDate);
    if (!billDateForBackend) {
      alert('Please enter a valid bill date.');
      return;
    }

    // Always compute total from lines to ensure accuracy
    const computedTotal = computeInvoiceTotal();
    if (parseFloat(computedTotal) <= 0) {
      alert('Invoice total must be greater than 0. Please add invoice lines.');
      return;
    }

    // Filter out empty lines and prepare payload
    const validLines = (invoiceForm.lines ?? []).filter((l) => 
      l.type || l.details || l.unitPrice || l.amount
    );

    const payload = {
      supplierOutsourcerName: invoiceForm.supplierOutsourcerName.trim(),
      totalAmount: computedTotal,
      billDate: billDateForBackend,
      taxed: invoiceForm.taxed || false,
      lines: validLines.length > 0 ? validLines.map((l) => ({
        type: l.type && l.type.trim() ? l.type.trim() : null,
        details: l.details && l.details.trim() ? l.details.trim() : null,
        unitPrice: l.unitPrice && l.unitPrice.trim() ? l.unitPrice.trim() : null,
        amount: l.amount && l.amount.trim() ? l.amount.trim() : null,
        operationId: l.operationId && l.operationId.trim() ? l.operationId.trim() : null,
        totalPrice:
          l.unitPrice && l.amount
            ? String((parseFloat(l.unitPrice) * parseFloat(l.amount)).toFixed(2))
            : null,
      })) : undefined,
    };

    console.log('Submitting invoice payload:', payload);

    try {
    if (editingInvoiceId) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/invoices/${editingInvoiceId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Failed to update invoice.';
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.message || errorJson.error || errorMessage;
              if (Array.isArray(errorJson.message)) {
                errorMessage = errorJson.message.join(', ');
              }
            } catch {
              errorMessage = errorText || errorMessage;
            }
            alert(`Error updating invoice: ${errorMessage}`);
            return;
          }

          const updated = await response.json();
      if (updated) {
        const fresh = await apiGet<Invoice[]>('/invoices', []);
        setInvoices(fresh);
            // Refresh suppliers to get updated balance
            void apiGet<Supplier[]>('/suppliers', []).then((data) => {
              setSuppliersList(data);
            });
        closeInvoiceForm();
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError instanceof Error) {
            if (fetchError.name === 'AbortError') {
              alert('Request timed out. Please try again.');
            } else if (fetchError.message.includes('Load failed') || fetchError.message.includes('Failed to fetch')) {
              alert('Network error: Could not connect to the server. Please check if the backend is running.');
      } else {
              alert(`Error updating invoice: ${fetchError.message}`);
      }
            console.error('Invoice update fetch error:', fetchError);
    } else {
            alert('Unknown error occurred while updating invoice.');
            console.error('Invoice update unknown error:', fetchError);
          }
        }
      } else {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/invoices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Failed to create invoice.';
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.message || errorJson.error || errorMessage;
              if (Array.isArray(errorJson.message)) {
                errorMessage = errorJson.message.join(', ');
              }
            } catch {
              errorMessage = errorText || errorMessage;
            }
            alert(`Error creating invoice: ${errorMessage}`);
            console.error('Invoice creation error:', errorText);
            return;
          }

          const created = await response.json();
      if (created) {
        const fresh = await apiGet<Invoice[]>('/invoices', []);
        setInvoices(fresh);
            // Refresh suppliers to get updated balance
            void apiGet<Supplier[]>('/suppliers', []).then((data) => {
              setSuppliersList(data);
            });
        closeInvoiceForm();
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError instanceof Error) {
            if (fetchError.name === 'AbortError') {
              alert('Request timed out. Please try again.');
            } else if (fetchError.message.includes('Load failed') || fetchError.message.includes('Failed to fetch')) {
              alert('Network error: Could not connect to the server. Please check if the backend is running.');
      } else {
              alert(`Error creating invoice: ${fetchError.message}`);
            }
            console.error('Invoice creation fetch error:', fetchError);
          } else {
            alert('Unknown error occurred while creating invoice.');
            console.error('Invoice creation unknown error:', fetchError);
          }
        }
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert(`Failed to save invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const columns = useMemo(
    () => [
      { key: 'name', header: tab === 'bills' ? 'Müşteri' : 'Tedarikçi/Taşeron' },
      {
        key: 'totalAmount',
        header: 'Toplam',
        render: (record: Bill | Invoice) => (
          <span>₺{record.totalAmount ?? '0.00'}</span>
        ),
      },
      {
        key: 'billDate',
        header: 'Fatura Tarihi',
        render: (record: Bill | Invoice) =>
          record.billDate ? new Date(record.billDate).toLocaleDateString() : '—',
      },
      {
        key: 'taxed',
        header: 'Vergili',
        render: (record: Bill | Invoice) => (record.taxed ? 'Evet' : 'Hayır'),
      },
    ],
    [tab],
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Faturalama &amp; Faturalar</h1>
          <p>Müşteri faturaları ve tedarikçi faturaları oluşturun ve vergi takibi yapın.</p>
        </div>
      </header>

      <Tabs
        tabs={[
          { id: 'bills', label: 'Faturalar', badge: String(bills.length) },
          { id: 'invoices', label: 'Gider Faturaları', badge: String(invoices.length) },
        ]}
        active={tab}
        onChange={setTab}
        actions={
          <button
            type="button"
            className={styles.insertButton}
            onClick={() => {
              if (tab === 'bills') {
                openBillForm();
              } else {
                openInvoiceForm();
              }
            }}
          >
            + Add {tab === 'bills' ? 'Bill' : 'Invoice'}
          </button>
        }
      >
        <DataTable
          columns={[
            {
              key: 'name',
              header: tab === 'bills' ? 'Müşteri' : 'Tedarikçi/Taşeron',
              render: (record: Bill | Invoice) =>
                'customerName' in record ? record.customerName ?? '—' : record.supplierOutsourcerName ?? '—',
            },
            ...columns.slice(1),
            {
              key: 'actions',
              header: 'İşlemler',
              render: (record: Bill | Invoice) => (
                <div className={styles.actions}>
                  <button
                    type="button"
                    onClick={() => {
                      if ('customerName' in record) {
                        openBillForm(record as Bill);
                      } else {
                        openInvoiceForm(record as Invoice);
                      }
                    }}
                  >
                    Düzenle
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if ('customerName' in record) {
                        const confirmed = window.confirm(`Delete bill for ${record.customerName || 'customer'}?`);
                        if (!confirmed) return;

                        try {
                          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/billing/${record.id}`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                          });

                          if (!response.ok) {
                            const errorText = await response.text();
                            let errorMessage = 'Failed to delete bill.';
                            try {
                              const errorJson = JSON.parse(errorText);
                              errorMessage = errorJson.message || errorMessage;
                            } catch {
                              errorMessage = errorText || errorMessage;
                            }
                            alert(errorMessage);
                            return;
                          }

                          // Refresh bills list
                          void apiGet<Bill[]>('/billing', mockBills).then((data) => {
                            setBills(data);
                          });
                          // Refresh customers list to get updated balance
                          void apiGet<Customer[]>('/customers', []).then((data) => {
                            setCustomers(data);
                          });
                        } catch (error) {
                          console.error('Error deleting bill:', error);
                          alert(`Failed to delete bill: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        }
                      } else {
                        const invoice = record as Invoice;
                        const confirmed = window.confirm(`Delete invoice for ${invoice.supplierOutsourcerName || 'supplier'}?`);
                        if (!confirmed) return;

                        try {
                          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/invoices/${invoice.id}`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                          });

                          if (!response.ok) {
                            const errorText = await response.text();
                            let errorMessage = 'Failed to delete invoice.';
                            try {
                              const errorJson = JSON.parse(errorText);
                              errorMessage = errorJson.message || errorJson.error || errorMessage;
                              if (Array.isArray(errorJson.message)) {
                                errorMessage = errorJson.message.join(', ');
                              }
                            } catch {
                              errorMessage = errorText || errorMessage;
                            }
                            alert(errorMessage);
                            return;
                          }

                          // Refresh invoices list
                          void apiGet<Invoice[]>('/invoices', mockInvoices).then((data) => {
                            setInvoices(data);
                          });
                          // Refresh suppliers list to get updated balance
                          void apiGet<Supplier[]>('/suppliers', []).then((data) => {
                            setSuppliersList(data);
                          });
                        } catch (error) {
                          console.error('Error deleting invoice:', error);
                          alert(`Failed to delete invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        }
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
          data={tab === 'bills' ? bills : invoices}
        />
      </Tabs>

      {/* Bill with Lines Form Modal */}
      {tab === 'bills' && (
        <Modal
          title={editingBillId ? 'Edit Bill with Lines' : 'Add Bill with Lines'}
          open={billModalOpen}
          onClose={closeBillForm}
          width="lg"
        >
          <form className={styles.form} onSubmit={handleBillSubmit}>
            <div className={styles.billHeader}>
              <label>
                <span>Customer Name</span>
                <select
                  value={billWithLinesForm.customerName}
                  onChange={(e) => {
                    const newCustomerName = e.target.value;
                    setBillWithLinesForm((prev) => ({
                      ...prev,
                      customerName: newCustomerName,
                      // Clear operation IDs when customer changes to prevent invalid selections
                      lines: prev.lines.map((line) => ({
                        ...line,
                        operationId: '',
                      })),
                    }));
                  }}
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.name}>
                      {customer.name} (Balance: ₺{customer.balance})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Bill Date</span>
                <DateTimeInput
                  value={billWithLinesForm.billDate}
                  onChange={(value) =>
                    setBillWithLinesForm((prev) => ({ ...prev, billDate: value }))
                  }
                  required
                />
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={billWithLinesForm.taxed}
                  onChange={(e) =>
                    setBillWithLinesForm((prev) => ({ ...prev, taxed: e.target.checked }))
                  }
                />
                <span>Taxed</span>
              </label>
            </div>

            <div className={styles.billLinesSection}>
              <div className={styles.billLinesHeader}>
                <h3>Bill Lines</h3>
                <button type="button" onClick={addBillLine} className={styles.addLineButton}>
                  + Add Line
                </button>
              </div>

              <div className={styles.billLinesContainer}>
                {billWithLinesForm.lines.map((line, index) => (
                <div key={index} className={`${styles.billLine} ${isRentalType(line.type) ? styles.rental : ''}`}>
                  <label>
                    <span>Type</span>
                    <select
                      value={line.type}
                      onChange={(e) => updateBillLine(index, 'type', e.target.value)}
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="Scissored Platform Rental">Scissored Platform Rental</option>
                      <option value="Jointed Platform Rental">Jointed Platform Rental</option>
                      <option value="Terrain Type Platform Rental">Terrain Type Platform Rental</option>
                      <option value="Vertical Platform Rental">Vertical Platform Rental</option>
                      <option value="Forklift Rental">Forklift Rental</option>
                      <option value="Crane Rental">Crane Rental</option>
                      <option value="Basket Crane Rental">Basket Crane Rental</option>
                      <option value="Dock Rental">Dock Rental</option>
                      <option value="Service">Service</option>
                      <option value="Part Selling">Part Selling</option>
                    </select>
                  </label>
                  <label>
                    <span>Operation ID</span>
                    <select
                      value={line.operationId || ''}
                      onChange={(e) => updateBillLine(index, 'operationId', e.target.value)}
                      required
                      disabled={!billWithLinesForm.customerName}
                    >
                      <option value="">
                        {billWithLinesForm.customerName 
                          ? 'Select Operation' 
                          : 'Select Customer First'}
                      </option>
                      {filteredActiveOperations.internal.map((op) => (
                        <option key={op.id} value={op.id}>
                          Internal #{op.id} - {op.machineCode || 'N/A'} - {op.workingSiteName || 'N/A'}
                        </option>
                      ))}
                      {filteredActiveOperations.outsource.map((op) => (
                        <option key={op.id} value={op.id}>
                          Outsource #{op.id} - {op.machineCode || 'N/A'} - {op.workingSiteName || 'N/A'}
                        </option>
                      ))}
                      {billWithLinesForm.customerName && 
                       filteredActiveOperations.internal.length === 0 && 
                       filteredActiveOperations.outsource.length === 0 && (
                        <option value="" disabled>
                          No active operations for this customer
                        </option>
                      )}
                    </select>
                  </label>
                  <label>
                    <span>Details</span>
                    <input
                      value={line.details}
                      onChange={(e) => updateBillLine(index, 'details', e.target.value)}
                      placeholder="Description"
                    />
                  </label>
                  {isRentalType(line.type) && (
                    <>
                      <label>
                        <span>Start Date</span>
                        <DateTimeInput
                          value={line.startDate || ''}
                          onChange={(value) => updateBillLine(index, 'startDate', value)}
                          required={isRentalType(line.type)}
                        />
                      </label>
                      <label>
                        <span>End Date</span>
                        <DateTimeInput
                          value={line.endDate || ''}
                          onChange={(value) => updateBillLine(index, 'endDate', value)}
                          required={isRentalType(line.type)}
                        />
                      </label>
                    </>
                  )}
                  <label>
                    <span>Unit Price</span>
                    <input
                      type="number"
                      step="0.01"
                      value={line.unitPrice}
                      onChange={(e) => updateBillLine(index, 'unitPrice', e.target.value)}
                      placeholder="0.00"
                    />
                  </label>
                  <label>
                    <span>Amount</span>
                    <input
                      type="number"
                      step="0.01"
                      value={line.amount}
                      onChange={(e) => updateBillLine(index, 'amount', e.target.value)}
                      placeholder="0.00"
                    />
                  </label>
                  <label>
                    <span>Total</span>
                    <input
                      type="text"
                      value={
                        line.unitPrice && line.amount
                          ? (parseFloat(line.unitPrice) * parseFloat(line.amount)).toFixed(2)
                          : '0.00'
                      }
                      readOnly
                      className={styles.readOnly}
                    />
                  </label>
                  <div className={styles.removeButtonContainer}>
                    {billWithLinesForm.lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBillLine(index)}
                        className={styles.removeLineButton}
                      >
                        ×
                      </button>
                    )}
                    {isRentalType(line.type) && (
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={line.closeOperation || false}
                          onChange={(e) => updateBillLine(index, 'closeOperation', e.target.checked)}
                        />
                      </label>
                    )}
                  </div>
                </div>
                ))}
              </div>

              <div className={styles.totalSection}>
                <strong>Total Amount: ₺{calculateTotalAmount.toFixed(2)}</strong>
              </div>
            </div>

            <footer className={styles.footer}>
              <button type="button" onClick={closeBillForm}>
                Cancel
              </button>
              <button type="submit">{editingBillId ? 'Update Bill' : 'Create Bill'}</button>
            </footer>
          </form>
        </Modal>
      )}

      {/* Invoice Form Modal */}
      {tab === 'invoices' && (
        <Modal
          title={editingInvoiceId ? 'Edit Invoice' : 'Add Invoice'}
          open={invoiceModalOpen}
          onClose={closeInvoiceForm}
          width="lg"
        >
          <form className={styles.form} onSubmit={handleInvoiceSubmit}>
            <div className={styles.billHeader}>
              <label>
                <span>Supplier / Outsourcer</span>
                <select
                  value={invoiceForm.supplierOutsourcerName}
                  onChange={(e) => {
                    const newName = e.target.value;
                    const wasOutsourcer = outsourcersList.some(o => o.name === invoiceForm.supplierOutsourcerName);
                    const isNowOutsourcer = outsourcersList.some(o => o.name === newName);
                    
                    // If switching between supplier and outsourcer, reset lines
                    if (wasOutsourcer !== isNowOutsourcer && invoiceForm.lines && invoiceForm.lines.length > 0) {
                      setInvoiceForm((prev) => ({
                        ...prev,
                        supplierOutsourcerName: newName,
                        lines: (prev.lines || []).map(line => ({
                          ...line,
                          operationId: '',
                          supplyId: '',
                          details: '',
                          customerName: '',
                          machineCode: '',
                          workingSiteName: '',
                          startDate: '',
                          endDate: '',
                        })),
                      }));
                    } else {
                      setInvoiceForm((prev) => ({ ...prev, supplierOutsourcerName: newName }));
                  }
                  }}
                  required
                >
                  <option value="">Select Supplier / Outsourcer</option>
                  <optgroup label="Suppliers">
                  {suppliersList.map((s) => (
                    <option key={s.id} value={s.name ?? ''}>{s.name}</option>
                  ))}
                  </optgroup>
                  <optgroup label="Outsourcers">
                    {outsourcersList.map((o) => (
                      <option key={o.id} value={o.name ?? ''}>{o.name}</option>
                    ))}
                  </optgroup>
                </select>
              </label>
              <label>
                <span>Bill Date</span>
                <DateTimeInput
                  value={invoiceForm.billDate}
                  onChange={(value) =>
                    setInvoiceForm((prev) => ({ ...prev, billDate: value }))
                  }
                  required
                />
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={invoiceForm.taxed}
                  onChange={(e) =>
                    setInvoiceForm((prev) => ({ ...prev, taxed: e.target.checked }))
                  }
                />
                <span>Taxed</span>
              </label>
            </div>

            <label>
              <span>Total Amount</span>
              <input
                type="number"
                step="0.01"
                value={invoiceForm.totalAmount || computeInvoiceTotal()}
                onChange={(e) =>
                  setInvoiceForm((prev) => ({ ...prev, totalAmount: e.target.value }))
                }
                required
                readOnly
                className={styles.readOnly}
              />
            </label>

            <div className={styles.billLinesSection}>
              <div className={styles.billLinesHeader}>
                <h3>Invoice Lines</h3>
                <button type="button" onClick={addInvoiceLine} className={styles.addLineButton}>
                  + Add Line
                </button>
              </div>

              <div className={styles.billLinesContainer}>
                {(invoiceForm.lines ?? []).map((line, index) => {
                  // Determine if selected is an outsourcer or supplier
                  const isOutsourcer = invoiceForm.supplierOutsourcerName 
                    ? outsourcersList.some(o => o.name === invoiceForm.supplierOutsourcerName)
                    : false;
                  const isSupplier = invoiceForm.supplierOutsourcerName 
                    ? suppliersList.some(s => s.name === invoiceForm.supplierOutsourcerName)
                    : false;

                  return (
                  <div key={index} className={styles.billLine}>
                    <label>
                      <span>Type</span>
                      <select
                        value={line.type}
                        onChange={(e) => updateInvoiceLine(index, 'type', e.target.value)}
                      >
                        <option value="">Select Type</option>
                        <option value="Scissored Platform Rental">Scissored Platform Rental</option>
                        <option value="Jointed Platform Rental">Jointed Platform Rental</option>
                        <option value="Terrain Type Platform Rental">Terrain Type Platform Rental</option>
                        <option value="Vertical Platform Rental">Vertical Platform Rental</option>
                        <option value="Forklift Rental">Forklift Rental</option>
                        <option value="Crane Rental">Crane Rental</option>
                        <option value="Basket Crane Rental">Basket Crane Rental</option>
                        <option value="Dock Rental">Dock Rental</option>
                        <option value="Service">Service</option>
                        <option value="Part Selling">Part Selling</option>
                      </select>
                    </label>
                    {isOutsourcer && (
                      <>
                        <label>
                          <span>Outsource Operation</span>
                          <select
                            value={line.operationId ?? ''}
                            onChange={(e) => {
                              updateInvoiceLine(index, 'operationId', e.target.value);
                              // Auto-fill details from operation if selected
                              if (e.target.value) {
                                const selectedOp = activeOutsourceOps.find(op => op.id === e.target.value);
                                if (selectedOp) {
                                  // Auto-fill details from operation
                                  setInvoiceForm((prev) => {
                                    const newLines = [...(prev.lines ?? [])];
                                    newLines[index] = {
                                      ...newLines[index],
                                      operationId: e.target.value,
                                      details: `${selectedOp.customerName || ''} - ${selectedOp.machineCode || ''} - ${selectedOp.workingSiteName || ''}`.trim() || newLines[index].details,
                                    };
                                    return { ...prev, lines: newLines };
                                  });
                                }
                              } else {
                                // Clear operation ID if no operation selected
                                setInvoiceForm((prev) => {
                                  const newLines = [...(prev.lines ?? [])];
                                  newLines[index] = {
                                    ...newLines[index],
                                    operationId: '',
                                  };
                                  return { ...prev, lines: newLines };
                                });
                              }
                            }}
                          >
                            <option value="">Select Outsource Operation</option>
                            {activeOutsourceOps
                              .filter((op) => {
                                // Filter operations by selected outsourcer
                                if (!invoiceForm.supplierOutsourcerName) return false;
                                return op.outsourcerName === invoiceForm.supplierOutsourcerName;
                              })
                              .map((op) => (
                                <option key={op.id} value={op.id ?? ''}>
                                  {op.customerName || 'N/A'} - {op.machineCode || 'N/A'} - {op.workingSiteName || 'N/A'}
                                </option>
                              ))}
                          </select>
                        </label>
                      </>
                    )}
                    {isSupplier && (
                    <label>
                      <span>Supply</span>
                      <select
                          value={(line as any).supplyId ?? ''}
                          onChange={(e) => updateInvoiceLine(index, 'supplyId', e.target.value)}
                      >
                        <option value="">Select Supply</option>
                          {supplierOptions
                            .filter((opt) => {
                              // Filter supplies by selected supplier
                              if (!invoiceForm.supplierOutsourcerName) return false;
                              return opt.label.startsWith(invoiceForm.supplierOutsourcerName);
                            })
                            .map((opt) => (
                          <option key={opt.supplyId} value={opt.supplyId}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    )}
                    <label>
                      <span>Details</span>
                      <input
                        value={line.details}
                        onChange={(e) => updateInvoiceLine(index, 'details', e.target.value)}
                        placeholder="Description"
                      />
                    </label>
                    <label>
                      <span>Unit Price</span>
                      <input
                        type="number"
                        step="0.01"
                        value={line.unitPrice}
                        onChange={(e) => {
                          updateInvoiceLine(index, 'unitPrice', e.target.value);
                          // Recalculate total when unit price changes
                          const newTotal = (invoiceForm.lines ?? []).reduce((acc, l, i) => {
                            const u = i === index ? parseFloat(e.target.value || '0') : parseFloat(l.unitPrice || '0');
                            const a = parseFloat(l.amount || '0');
                            return acc + (isFinite(u * a) ? u * a : 0);
                          }, 0);
                          setInvoiceForm((prev) => ({ ...prev, totalAmount: newTotal.toFixed(2) }));
                        }}
                        placeholder="0.00"
                      />
                    </label>
                    <label>
                      <span>Amount</span>
                      <input
                        type="number"
                        step="0.01"
                        value={line.amount}
                        onChange={(e) => {
                          updateInvoiceLine(index, 'amount', e.target.value);
                          // Recalculate total when amount changes
                          const newTotal = (invoiceForm.lines ?? []).reduce((acc, l, i) => {
                            const u = parseFloat(l.unitPrice || '0');
                            const a = i === index ? parseFloat(e.target.value || '0') : parseFloat(l.amount || '0');
                            return acc + (isFinite(u * a) ? u * a : 0);
                          }, 0);
                          setInvoiceForm((prev) => ({ ...prev, totalAmount: newTotal.toFixed(2) }));
                        }}
                        placeholder="0.00"
                      />
                    </label>
                    <label>
                      <span>Total</span>
                      <input
                        type="text"
                        value={
                          line.unitPrice && line.amount
                            ? (parseFloat(line.unitPrice) * parseFloat(line.amount)).toFixed(2)
                            : '0.00'
                        }
                        readOnly
                        className={styles.readOnly}
                      />
                    </label>
                    <div className={styles.removeButtonContainer}>
                      {(invoiceForm.lines ?? []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeInvoiceLine(index)}
                          className={styles.removeLineButton}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>

              <div className={styles.totalSection}>
                <strong>Total Amount: ₺{computeInvoiceTotal()}</strong>
              </div>
            </div>

            <footer className={styles.footer}>
              <button type="button" onClick={closeInvoiceForm}>
                Cancel
              </button>
              <button type="submit">Save</button>
            </footer>
          </form>
        </Modal>
      )}
    </div>
  );
}

