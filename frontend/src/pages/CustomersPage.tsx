import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { DataTable } from '../components/common/DataTable';
import { FilterBar } from '../components/common/FilterBar';
import { Tabs } from '../components/common/Tabs';
import { apiGet, apiPost, apiDelete, apiPatch } from '../lib/api';
import { formatDateDDMMYYYY } from '../lib/dateUtils';
import {
  mockCustomers,
  mockInternalOperations,
  mockServiceOperations,
  mockOutsourceOperations,
  mockBills,
  mockCollectionsCheck,
  mockCollectionCreditCard,
  mockCollectionCash,
} from '../lib/mockData';
import type {
  ContactPerson,
  Customer,
  WorkingSite,
  Bill,
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
} from '../types';
import styles from './CustomersPage.module.css';

type CustomerRecord = {
  id: string;
  name: string;
  balance: string;
  phoneNumber?: string | null;
  address?: string | null;
  email?: string | null;
  vergiDairesi?: string | null;
  vkn?: string | null;
  createdAt?: string;
};

type ContactRecord = ContactPerson & {
  customerId: string;
};

type WorkingSiteRecord = {
  id: string;
  customerId?: string;
  workingSiteName: string;
  location: string;
  createdAt?: string;
};

type SummaryMetric = {
  label: string;
  value: string;
};

type SummaryCard = {
  id: string;
  title: string;
  subtitle?: string;
  metrics: SummaryMetric[];
};

const initialCustomerList: CustomerRecord[] = [];
const initialContactList: ContactRecord[] = [];
const initialWorkingSites: WorkingSiteRecord[] = [];

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerRecord[]>(initialCustomerList);
  const [contacts, setContacts] = useState<ContactRecord[]>(initialContactList);
  const [workingSites, setWorkingSites] = useState<WorkingSiteRecord[]>(initialWorkingSites);
  const [filter, setFilter] = useState('');
  const [cardIndex, setCardIndex] = useState(0);
  const [cardView, setCardView] = useState<'customers' | 'sites'>('customers');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [customerTab, setCustomerTab] = useState<'transactions' | 'operations'>('transactions');
  const [operationTab, setOperationTab] = useState<'internal' | 'outsource' | 'service' | 'transportation'>('internal');
  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [workingSiteFormOpen, setWorkingSiteFormOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [workingSiteFormStatus, setWorkingSiteFormStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [workingSiteFormLoading, setWorkingSiteFormLoading] = useState(false);
  
  // Data for customer cards
  const [bills, setBills] = useState<Bill[]>([]);
  const [collectionsCheck, setCollectionsCheck] = useState<CollectionsCheck[]>([]);
  const [collectionsCreditCard, setCollectionsCreditCard] = useState<CollectionCreditCard[]>([]);
  const [collectionsCash, setCollectionsCash] = useState<CollectionCash[]>([]);
  const [paymentsCheck, setPaymentsCheck] = useState<PaymentCheck[]>([]);
  const [paymentsCreditCard, setPaymentsCreditCard] = useState<PaymentCreditCard[]>([]);
  const [paymentsCash, setPaymentsCash] = useState<PaymentsCash[]>([]);
  const [internalOperations, setInternalOperations] = useState<InternalOperation[]>([]);
  const [internalOperationsActive, setInternalOperationsActive] = useState<InternalOperation[]>([]);
  const [outsourceOperations, setOutsourceOperations] = useState<OutsourceOperation[]>([]);
  const [outsourceOperationsActive, setOutsourceOperationsActive] = useState<OutsourceOperation[]>([]);
  const [serviceOperations, setServiceOperations] = useState<ServiceOperation[]>([]);
  const [transportationOperations, setTransportationOperations] = useState<TransportationOperation[]>([]);

  useEffect(() => {
    void apiGet<Customer[]>('/customers', []).then((data) => {
      setCustomers(
        data.map(({ id, name, balance, phoneNumber, address, email, vergiDairesi, vkn, createdAt }) => ({
          id,
          name,
          balance: balance ?? '0',
          phoneNumber: phoneNumber ?? null,
          address: address ?? null,
          email: email ?? null,
          vergiDairesi: vergiDairesi ?? null,
          vkn: vkn ?? null,
          createdAt,
        })),
      );

      setContacts(
        data.flatMap((customer) =>
          (customer.contacts ?? []).map((contact) => ({
            ...contact,
            customerId: customer.id,
          })),
        ),
      );
    });

    void apiGet<WorkingSite[]>('/working-sites', []).then((data) => {
      setWorkingSites(
        data.map(({ id, workingSiteName, location, createdAt }) => ({
          id,
          workingSiteName,
          location,
          createdAt: createdAt ? new Date(createdAt).toISOString() : undefined,
        })),
      );
    });

    // Load data for customer cards
    void apiGet<Bill[]>('/billing', mockBills).then((data) => {
      setBills(data);
    });
    void apiGet<CollectionsCheck[]>('/collections/check', []).then((data) => {
      setCollectionsCheck(data);
    });
    void apiGet<CollectionCreditCard[]>('/collections/credit-card', []).then((data) => {
      setCollectionsCreditCard(data);
    });
    void apiGet<CollectionCash[]>('/collections/cash', []).then((data) => {
      setCollectionsCash(data);
    });
    void apiGet<PaymentCheck[]>('/payments/check', []).then((data) => {
      setPaymentsCheck(data);
    });
    void apiGet<PaymentCreditCard[]>('/payments/credit-card', []).then((data) => {
      setPaymentsCreditCard(data);
    });
    void apiGet<PaymentsCash[]>('/payments/cash', []).then((data) => {
      setPaymentsCash(data);
    });
    void apiGet<InternalOperation[]>('/operations/internal', mockInternalOperations).then((data) => {
      setInternalOperations(data);
    });
    void apiGet<InternalOperation[]>('/operations/internal/active', []).then((data) => {
      setInternalOperationsActive(data);
    });
    void apiGet<OutsourceOperation[]>('/operations/outsource', []).then((data) => {
      setOutsourceOperations(data);
    });
    void apiGet<OutsourceOperation[]>('/operations/outsource/active', []).then((data) => {
      setOutsourceOperationsActive(data);
    });
    void apiGet<ServiceOperation[]>('/operations/service', mockServiceOperations).then((data) => {
      setServiceOperations(data);
    });
    void apiGet<TransportationOperation[]>('/operations/transportation', []).then((data) => {
      setTransportationOperations(data);
    });
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!filter) return customers;
    const normalized = filter.toLowerCase();
    return customers.filter((customer) => customer.name.toLowerCase().includes(normalized));
  }, [customers, filter]);

  const customerCards = useMemo<SummaryCard[]>(() => {
    const last30Threshold = new Date();
    last30Threshold.setDate(last30Threshold.getDate() - 30);

    return customers.map((customer) => {
      const customerName = customer.name;
      const internalForCustomer = internalOperations.filter(
        (operation) => operation.customerName === customerName,
      );

      const recentInternal = internalForCustomer.filter((operation) => {
        if (!operation.startDate) return false;
        return new Date(operation.startDate) >= last30Threshold;
      });

      const activeMachinery = new Set(
        recentInternal.map((operation) => operation.machineNumber).filter(Boolean),
      ).size;

      const transportationCount = recentInternal.filter(
        (operation) => operation.transportationOperationId,
      ).length;

      const customerMachines = internalForCustomer
        .map((operation) => operation.machineNumber)
        .filter(Boolean);

      const serviceCount = mockServiceOperations.filter((service) => {
        if (!service.machineNumber || !service.createdAt) return false;
        if (!customerMachines.includes(service.machineNumber)) return false;
        return new Date(service.createdAt) >= last30Threshold;
      }).length;

      return {
        id: customer.id,
        title: customer.name,
        subtitle: currencyFormatter.format(Number(customer.balance ?? 0)),
        metrics: [
          { label: 'Active Machinery', value: String(activeMachinery) },
          { label: 'Transportation (30 days)', value: String(transportationCount) },
          { label: 'Services (30 days)', value: String(serviceCount) },
        ],
      };
    });
  }, [customers, internalOperations, serviceOperations]);

  const workingSiteCards = useMemo<SummaryCard[]>(() => {
    const last30Threshold = new Date();
    last30Threshold.setDate(last30Threshold.getDate() - 30);

    return workingSites.map((site) => {
      const operationsAtSite = internalOperations.filter(
        (operation) => operation.workingSiteName === site.workingSiteName,
      );

      const uniqueCustomers = new Set(
        operationsAtSite.map((operation) => operation.customerName).filter(Boolean),
      );

      const uniqueMachines = new Set(
        operationsAtSite.map((operation) => operation.machineNumber).filter(Boolean),
      );

      const transportationCount = operationsAtSite.filter(
        (operation) => operation.transportationOperationId,
      ).length;

      const serviceCount = serviceOperations.filter((service) => {
        if (!service.machineNumber || !service.createdAt) return false;
        if (
          !uniqueMachines.has(service.machineNumber)
        ) {
          return false;
        }
        return new Date(service.createdAt) >= last30Threshold;
      }).length;

      return {
        id: site.id,
        title: site.workingSiteName,
        subtitle: site.location,
        metrics: [
          { label: 'Total Customers', value: String(uniqueCustomers.size || (site.customerId ? 1 : 0)) },
          { label: 'Active Machinery', value: String(uniqueMachines.size) },
          { label: 'Transportation Operations', value: String(transportationCount) },
          { label: 'Services (30 days)', value: String(serviceCount) },
        ],
      };
    });
  }, [workingSites, internalOperations, serviceOperations]);

  const activeCards = useMemo(() => {
    return cardView === 'customers' ? customerCards : workingSiteCards;
  }, [cardView, customerCards, workingSiteCards]);

  useEffect(() => {
    setCardIndex(0);
    setExpandedCardId(null);
  }, [cardView]);

  useEffect(() => {
    if (!activeCards.length) {
      setCardIndex(0);
    } else if (cardIndex >= activeCards.length) {
      setCardIndex(activeCards.length - 1);
    }
  }, [cardIndex, activeCards]);

  const handleCustomerSubmit = async (event: FormEvent<HTMLFormElement>): Promise<boolean> => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = (formData.get('customerName') as string)?.trim();
    if (!name) return false;

    const balance = (formData.get('customerBalance') as string)?.trim() ?? '';
    const phoneNumber = (formData.get('customerPhoneNumber') as string)?.trim() || null;
    const address = (formData.get('customerAddress') as string)?.trim() || null;
    const email = (formData.get('customerEmail') as string)?.trim() || null;
    const vergiDairesi = (formData.get('customerVergiDairesi') as string)?.trim() || null;
    const vkn = (formData.get('customerVKN') as string)?.trim() || null;

    const payload = {
      name,
      balance,
      phoneNumber,
      address,
      email,
      vergiDairesi,
      vkn,
    };

    if (editingCustomerId) {
      // Update existing customer
      const result = await apiPatch<typeof payload, Customer>(`/customers/${editingCustomerId}`, payload);
      
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === editingCustomerId
            ? {
                id: customer.id,
                name: result?.name ?? name,
                balance: result?.balance ?? (balance || '0'),
                phoneNumber: result?.phoneNumber ?? phoneNumber,
                address: result?.address ?? address,
                email: result?.email ?? email,
                vergiDairesi: result?.vergiDairesi ?? vergiDairesi,
                vkn: result?.vkn ?? vkn,
                createdAt: customer.createdAt,
              }
            : customer,
        ),
      );
      
      setEditingCustomerId(null);
    } else {
      // Create new customer
      const result = await apiPost<typeof payload, Customer>('/customers', payload);

      const newId = result?.id ?? String(Date.now());
      const newCustomer: CustomerRecord = {
        id: newId,
        name: result?.name ?? name,
        balance: result?.balance ?? (balance || '0'),
        phoneNumber: result?.phoneNumber ?? phoneNumber,
        address: result?.address ?? address,
        email: result?.email ?? email,
        vergiDairesi: result?.vergiDairesi ?? vergiDairesi,
        vkn: result?.vkn ?? vkn,
        createdAt: result?.createdAt ?? new Date().toISOString(),
      };

      setCustomers((prev) => [newCustomer, ...prev]);
    }

    return true;
  };

  const openEditCustomerForm = (customer: CustomerRecord) => {
    setEditingCustomerId(customer.id);
    setCustomerFormOpen(true);
  };

  const closeCustomerForm = () => {
    setCustomerFormOpen(false);
    setEditingCustomerId(null);
  };

  const handleContactSubmit = (event: FormEvent<HTMLFormElement>): boolean => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const customerId = (formData.get('contactCustomerId') as string)?.trim();
    if (!customerId) return false;

    const name = (formData.get('contactName') as string)?.trim();
    const role = (formData.get('contactRole') as string)?.trim();
    const email = (formData.get('contactEmail') as string)?.trim();
    const phoneNumber = (formData.get('contactPhone') as string)?.trim();

    if (!name || !email) return false;

    const newContact: ContactRecord = {
      id: String(Date.now()),
      customerId,
      name,
      role: role ?? '',
      email,
      phoneNumber: phoneNumber ?? '',
      createdAt: new Date().toISOString(),
    };

    setContacts((prev) => [newContact, ...prev]);
    return true;
  };

  const handleWorkingSiteSubmit = async (event: FormEvent<HTMLFormElement>): Promise<boolean> => {
    event.preventDefault();
    setWorkingSiteFormLoading(true);
    setWorkingSiteFormStatus({ type: null, message: '' });

    try {
      const formData = new FormData(event.currentTarget);
      const workingSiteName = (formData.get('siteName') as string)?.trim();
      const location = (formData.get('siteLocation') as string)?.trim();
      
      if (!workingSiteName || !location) {
        setWorkingSiteFormStatus({
          type: 'error',
          message: 'Please fill in all required fields (Site Name and Location).',
        });
        setWorkingSiteFormLoading(false);
        return false;
      }

      const payload = {
        workingSiteName,
        location,
      };

      const result = await apiPost<typeof payload, WorkingSite>('/working-sites', payload);
      
      if (result) {
        setWorkingSiteFormStatus({
          type: 'success',
          message: `Working site "${workingSiteName}" has been successfully created!`,
        });
        
        // Refresh working sites list
        void apiGet<WorkingSite[]>('/working-sites', []).then((data) => {
          setWorkingSites(
            data.map(({ id, workingSiteName, location, createdAt }) => ({
              id,
              workingSiteName,
              location,
              createdAt,
            })),
          );
        });
        
        // Reset form
        const form = (event.target as HTMLFormElement);
        form.reset();
        
        // Clear form and close modal after a short delay
        setTimeout(() => {
          setWorkingSiteFormOpen(false);
          setWorkingSiteFormStatus({ type: null, message: '' });
        }, 2000);
        
        setWorkingSiteFormLoading(false);
        return true;
      } else {
        setWorkingSiteFormStatus({
          type: 'error',
          message: 'Failed to create working site. Please check your connection and try again.',
        });
        setWorkingSiteFormLoading(false);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      setWorkingSiteFormStatus({
        type: 'error',
        message: `Error: ${errorMessage}. Please try again.`,
      });
      setWorkingSiteFormLoading(false);
      return false;
    }
  };

  const handleWorkingSiteDelete = async (siteId: string): Promise<void> => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this working site? This action cannot be undone.'
    );
    if (!confirmed) return;

    const result = await apiDelete(`/working-sites/${siteId}`);
    if (result !== null) {
      // Refresh working sites list
      void apiGet<WorkingSite[]>('/working-sites', []).then((data) => {
        setWorkingSites(
          data.map(({ id, workingSiteName, location, createdAt }) => ({
            id,
            workingSiteName,
            location,
            createdAt,
          })),
        );
      });
    } else {
      alert('Failed to delete working site.');
    }
  };

  const openDetails = (customer: CustomerRecord) => {
    setSelectedCustomer(customer);
    setDetailsModalOpen(true);
  };

  function CustomerTransactions({ customerName }: { customerName: string }) {
    const customer = customers.find((c) => c.name === customerName);
    const currentBalance = customer ? parseFloat(customer.balance ?? '0') : 0;

    const customerBills = bills.filter((bill) => bill.customerName === customerName);
    const customerCollectionsCheck = collectionsCheck.filter(
      (collection) => collection.customerName === customerName,
    );
    const customerCollectionsCreditCard = collectionsCreditCard.filter(
      (collection) => collection.customerName === customerName,
    );
    const customerCollectionsCash = collectionsCash.filter(
      (collection) => collection.customerName === customerName,
    );
    const customerPaymentsCheck = paymentsCheck.filter(
      (payment) => payment.customerName === customerName,
    );
    const customerPaymentsCreditCard = paymentsCreditCard.filter(
      (payment) => payment.customerName === customerName,
    );
    const customerPaymentsCash = paymentsCash.filter(
      (payment) => payment.customerName === customerName,
    );

    // Create transaction entries with amounts and references
    const transactionEntries: Array<{
      type: string;
      date: string;
      amount: number;
      details: string;
      isPayment: boolean;
      billId?: string;
      collectionId?: string;
      collectionType?: 'check' | 'credit-card' | 'cash';
      paymentId?: string;
      paymentType?: 'check' | 'credit-card' | 'cash';
    }> = [
      ...customerBills.map((bill) => ({
        type: 'Bill',
        date: bill.billDate ?? '—',
        amount: parseFloat(bill.totalAmount?.replace(/,/g, '') ?? '0') || 0,
        details: `Bill #${bill.id}${bill.taxed ? ' (Taxed)' : ''}`,
        isPayment: false,
        billId: bill.id,
      })),
      ...customerCollectionsCheck.map((collection) => ({
        type: 'Collection (Check)',
        date: collection.collectionDate ?? '—',
        amount: parseFloat(collection.amount?.replace(/,/g, '') ?? '0') || 0,
        details: collection.notes ?? '—',
        isPayment: false,
        collectionId: collection.id,
        collectionType: 'check' as const,
      })),
      ...customerCollectionsCreditCard.map((collection) => ({
        type: 'Collection (Credit Card)',
        date: collection.transactionDate ?? '—',
        amount: parseFloat(collection.amount?.replace(/,/g, '') ?? '0') || 0,
        details: collection.notes ?? '—',
        isPayment: false,
        collectionId: collection.id,
        collectionType: 'credit-card' as const,
      })),
      ...customerCollectionsCash.map((collection) => ({
        type: 'Collection (Cash)',
        date: collection.transactionDate ?? '—',
        amount: parseFloat(collection.amount?.replace(/,/g, '') ?? '0') || 0,
        details: collection.notes ?? '—',
        isPayment: false,
        collectionId: collection.id,
        collectionType: 'cash' as const,
      })),
      ...customerPaymentsCheck.map((payment) => ({
        type: 'Payment (Check)',
        date: payment.collectionDate ?? payment.checkDate ?? '—',
        amount: parseFloat(payment.amount?.replace(/,/g, '') ?? '0') || 0,
        details: payment.notes ?? '—',
        isPayment: true,
        paymentId: payment.id,
        paymentType: 'check' as const,
      })),
      ...customerPaymentsCreditCard.map((payment) => ({
        type: 'Payment (Credit Card)',
        date: payment.transactionDate ?? '—',
        amount: parseFloat(payment.amount?.replace(/,/g, '') ?? '0') || 0,
        details: payment.notes ?? '—',
        isPayment: true,
        paymentId: payment.id,
        paymentType: 'credit-card' as const,
      })),
      ...customerPaymentsCash.map((payment) => ({
        type: 'Payment (Cash)',
        date: payment.transactionDate ?? '—',
        amount: parseFloat(payment.amount?.replace(/,/g, '') ?? '0') || 0,
        details: payment.notes ?? '—',
        isPayment: true,
        paymentId: payment.id,
        paymentType: 'cash' as const,
      })),
    ].sort((a, b) => {
      if (a.date === '—' && b.date === '—') return 0;
      if (a.date === '—') return 1;
      if (b.date === '—') return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // Calculate balances for each transaction (working backwards from current balance)
    // Transactions are sorted newest first, so we work backwards to calculate previous balances
    // Collections increase balance, payments decrease balance, bills increase balance (debt)
    let runningBalance = currentBalance;
    const transactionsWithBalances = transactionEntries.map((transaction) => {
      let previousBalance: number;
      let updatedBalance: number;
      
      if (transaction.isPayment) {
        // Payment decreases balance
        // If balance after payment is $1000 and payment was $100, balance before was $1100
        previousBalance = runningBalance + transaction.amount;
        updatedBalance = runningBalance; // Balance after the payment
        runningBalance = previousBalance; // Move backwards to balance before this transaction
      } else {
        // Collection or Bill increases balance (debt)
        // If balance after collection/bill is $1000 and amount was $100, balance before was $900
        previousBalance = runningBalance - transaction.amount;
        updatedBalance = runningBalance; // Balance after the collection/bill
        runningBalance = previousBalance; // Move backwards to balance before this transaction
      }
      
      return {
        ...transaction,
        previousBalance,
        updatedBalance,
      };
    });

    // Show only recent 20 transactions (already sorted newest first)
    const recentTransactions = transactionsWithBalances.slice(0, 20);

    if (recentTransactions.length === 0) {
      return <p className={styles.noData}>No transactions found for this customer.</p>;
    }

    return (
      <div className={styles.transactionsList}>
        <div className={styles.transactionsTable}>
          {recentTransactions.map((transaction, index) => (
            <div key={index} className={styles.transactionRow}>
              <div className={styles.transactionType}>{transaction.type}</div>
              <div className={styles.transactionDate}>
                {transaction.date !== '—' ? formatDateDDMMYYYY(transaction.date) : '—'}
              </div>
              <div className={styles.transactionAmount}>
                {transaction.amount > 0
                  ? currencyFormatter.format(transaction.amount)
                  : '—'}
              </div>
              <div className={styles.transactionBalance}>
                <span className={styles.balanceLabel}>Previous:</span>{' '}
                {currencyFormatter.format(transaction.previousBalance)}
              </div>
              <div className={styles.transactionBalance}>
                <span className={styles.balanceLabel}>Updated:</span>{' '}
                {currencyFormatter.format(transaction.updatedBalance)}
              </div>
              <div className={styles.transactionDetails}>{transaction.details}</div>
              <div className={styles.transactionActions}>
                {transaction.billId && (
                  <button
                    type="button"
                    className={styles.navButton}
                    onClick={() => {
                      navigate('/billing', { state: { billId: transaction.billId } });
                    }}
                    title="Fatura Detaylarını Görüntüle"
                  >
                    <ExternalLink size={14} />
                    Fatura
                  </button>
                )}
                {transaction.collectionId && transaction.collectionType && (
                  <button
                    type="button"
                    className={styles.navButton}
                    onClick={() => {
                      navigate('/collections', { 
                        state: { 
                          collectionId: transaction.collectionId,
                          collectionType: transaction.collectionType,
                          viewMode: 'collections'
                        } 
                      });
                    }}
                    title="Tahsilat Detaylarını Görüntüle"
                  >
                    <ExternalLink size={14} />
                    Tahsilat
                  </button>
                )}
                {transaction.paymentId && transaction.paymentType && (
                  <button
                    type="button"
                    className={styles.navButton}
                    onClick={() => {
                      navigate('/collections', { 
                        state: { 
                          paymentId: transaction.paymentId,
                          paymentType: transaction.paymentType,
                          viewMode: 'payments'
                        } 
                      });
                    }}
                    title="View Payment Details"
                  >
                    <ExternalLink size={14} />
                    Payment
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {transactionsWithBalances.length > 20 && (
          <p className={styles.moreInfo}>Showing 20 most recent of {transactionsWithBalances.length} transactions</p>
        )}
      </div>
    );
  }

  function CustomerOperations({ customerName }: { customerName: string }) {
    // Get all operations (previous + active)
    const customerInternalOps = internalOperations.filter(
      (op) => op.customerName === customerName,
    );
    const customerInternalOpsActive = internalOperationsActive.filter(
      (op) => op.customerName === customerName,
    );
    const customerOutsourceOps = outsourceOperations.filter(
      (op) => op.customerName === customerName,
    );
    const customerOutsourceOpsActive = outsourceOperationsActive.filter(
      (op) => op.customerName === customerName,
    );
    
    // Get machine numbers from customer operations
    const customerMachineNumbers = new Set([
      ...customerInternalOps.map((op) => op.machineNumber).filter(Boolean),
      ...customerOutsourceOps.map((op) => op.machineCode).filter(Boolean),
    ]);

    const customerServiceOps = serviceOperations.filter((service) => {
      return service.machineNumber && customerMachineNumbers.has(service.machineNumber);
    });

    // Get transportation operations linked to customer operations
    const customerTransportationOpIds = new Set([
      ...customerInternalOps.map((op) => op.transportationOperationId).filter(Boolean),
      ...customerOutsourceOps.map((op) => op.transportationOperationId).filter(Boolean),
    ]);
    const customerTransportationOps = transportationOperations.filter((trans) => {
      return customerTransportationOpIds.has(trans.transportationOpId);
    });

    // Create a set of active operation IDs for quick lookup
    const activeInternalIds = new Set(customerInternalOpsActive.map((op) => op.id));
    const activeOutsourceIds = new Set(customerOutsourceOpsActive.map((op) => op.id));

    // Prepare operations by type
    const internalOpsList = customerInternalOps.map((op) => ({
      type: 'Internal Operation',
      date: op.startDate ?? '—',
      endDate: op.endDate ?? '—',
      details: `Machine: ${op.machineNumber ?? '—'}, Site: ${op.workingSiteName ?? '—'}`,
      isActive: activeInternalIds.has(op.id),
      operationId: op.id,
      operationType: 'internal' as const,
    }));

    const outsourceOpsList = customerOutsourceOps.map((op) => ({
      type: 'Outsource Operation',
      date: op.startDate ?? '—',
      endDate: op.endDate ?? '—',
      details: `Outsourcer: ${op.outsourcerName ?? '—'}, Machine: ${op.machineCode ?? '—'}, Site: ${op.workingSiteName ?? '—'}`,
      isActive: activeOutsourceIds.has(op.id),
      operationId: op.id,
      operationType: 'outsource' as const,
    }));

    const serviceOpsList = customerServiceOps.map((service) => ({
      type: 'Service Operation',
      date: service.createdAt ? new Date(service.createdAt).toISOString().split('T')[0] : '—',
      endDate: '—',
      details: `${service.type ?? '—'}: ${service.description ?? '—'}`,
      isActive: false,
      operationId: service.id,
      operationType: 'service' as const,
    }));

    const transportationOpsList = customerTransportationOps.map((trans) => ({
      type: 'Transportation Operation',
      date: trans.operationDate ?? '—',
      endDate: '—',
      details: `From: ${trans.startingLoc ?? '—'} → To: ${trans.endingLoc ?? '—'}, Plate: ${trans.plateNum ?? '—'}`,
      isActive: false,
      operationId: trans.transportationOpId,
      operationType: 'transportation' as const,
    }));

    // Get operations for current tab
    const getOperationsForTab = () => {
      switch (operationTab) {
        case 'internal':
          return internalOpsList;
        case 'outsource':
          return outsourceOpsList;
        case 'service':
          return serviceOpsList;
        case 'transportation':
          return transportationOpsList;
        default:
          return [];
      }
    };

    const currentOperations = getOperationsForTab().sort((a, b) => {
      // Sort active operations first, then by date
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1;
      }
      if (a.date === '—' && b.date === '—') return 0;
      if (a.date === '—') return 1;
      if (b.date === '—') return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    const tabCounts = {
      internal: internalOpsList.length,
      outsource: outsourceOpsList.length,
      service: serviceOpsList.length,
      transportation: transportationOpsList.length,
    };

    return (
      <div className={styles.operationsList}>
        <Tabs
          tabs={[
            { id: 'internal', label: 'Internal', badge: String(tabCounts.internal) },
            { id: 'outsource', label: 'Outsource', badge: String(tabCounts.outsource) },
            { id: 'service', label: 'Service', badge: String(tabCounts.service) },
            { id: 'transportation', label: 'Transportation', badge: String(tabCounts.transportation) },
          ]}
          active={operationTab}
          onChange={(tab) => setOperationTab(tab as typeof operationTab)}
        >
          {currentOperations.length === 0 ? (
            <p className={styles.noData}>No {operationTab} operations found for this customer.</p>
          ) : (
            <>
              <div className={styles.operationsTable}>
                {currentOperations.map((operation, index) => (
                  <div key={index} className={clsx(styles.operationRow, operation.isActive && styles.operationActive)}>
                    <div className={styles.operationType}>
                      {operation.type}
                      {operation.isActive && <span className={styles.activeBadge}>Active</span>}
                    </div>
                    <div className={styles.operationDate}>
                      {operation.date !== '—' ? formatDateDDMMYYYY(operation.date) : '—'}
                      {operation.endDate !== '—' && (
                        <span className={styles.operationEndDate}>
                          {' → '}
                          {formatDateDDMMYYYY(operation.endDate)}
                        </span>
                      )}
                      {operation.isActive && operation.endDate === null && (
                        <span className={styles.operationEndDate}> → Ongoing</span>
                      )}
                    </div>
                    <div className={styles.operationDetails}>{operation.details}</div>
                    <div className={styles.operationActions}>
                      <button
                        type="button"
                        className={styles.navButton}
                        onClick={() => {
                          navigate('/operations', { 
                            state: { 
                              operationId: operation.operationId,
                              operationType: operation.operationType
                            } 
                          });
                        }}
                        title={`View ${operation.type} Details`}
                      >
                        <ExternalLink size={14} />
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className={styles.moreInfo}>
                Showing {currentOperations.length} {operationTab} operation{currentOperations.length !== 1 ? 's' : ''}
                {currentOperations.filter((op) => op.isActive).length > 0 && (
                  <> ({currentOperations.filter((op) => op.isActive).length} active)</>
                )}
              </p>
            </>
          )}
        </Tabs>
      </div>
    );
  }

  function WorkingSiteOperations({ workingSiteName }: { workingSiteName: string }) {
    const internalOps = internalOperations.filter(
      (op) => op.workingSiteName === workingSiteName,
    );
    const outsourceOps = outsourceOperations.filter(
      (op) => op.workingSiteName === workingSiteName,
    );
    const serviceOps = serviceOperations.filter((service) => {
      const machineNumbers = new Set([
        ...internalOps.map((op) => op.machineNumber).filter(Boolean),
        ...outsourceOps.map((op) => op.machineCode).filter(Boolean),
      ]);
      return service.machineNumber && machineNumbers.has(service.machineNumber);
    });

    const allOperations = [
      ...internalOps.map((op) => ({
        type: 'Internal Operation',
        date: op.startDate ?? '—',
        endDate: op.endDate ?? '—',
        details: `Customer: ${op.customerName ?? '—'}, Machine: ${op.machineNumber ?? '—'}`,
      })),
      ...outsourceOps.map((op) => ({
        type: 'Outsource Operation',
        date: op.startDate ?? '—',
        endDate: op.endDate ?? '—',
        details: `Customer: ${op.customerName ?? '—'}, Outsourcer: ${op.outsourcerName ?? '—'}, Machine: ${op.machineCode ?? '—'}`,
      })),
      ...serviceOps.map((service) => ({
        type: 'Service Operation',
        date: service.createdAt ? new Date(service.createdAt).toISOString().split('T')[0] : '—',
        endDate: '—',
        details: `${service.type ?? '—'}: ${service.description ?? '—'}`,
      })),
    ].sort((a, b) => {
      if (a.date === '—' && b.date === '—') return 0;
      if (a.date === '—') return 1;
      if (b.date === '—') return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    if (allOperations.length === 0) {
      return <p className={styles.noData}>No operations found for this working site.</p>;
    }

    return (
      <div className={styles.operationsList}>
        <h4>Operations</h4>
        <div className={styles.operationsTable}>
          {allOperations.map((operation, index) => (
            <div key={index} className={styles.operationRow}>
              <div className={styles.operationType}>{operation.type}</div>
              <div className={styles.operationDate}>
                {operation.date !== '—' ? formatDateDDMMYYYY(operation.date) : '—'}
                {operation.endDate !== '—' && (
                  <span className={styles.operationEndDate}>
                    {' → '}
                    {formatDateDDMMYYYY(operation.endDate)}
                  </span>
                )}
              </div>
              <div className={styles.operationDetails}>{operation.details}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Müşteriler &amp; Şantiyeler</h1>
          <p>Müşteri profillerini, iletişim kişilerini ve proje konumlarını yönetin.</p>
        </div>
        <div className={styles.buttonGroup}>
          <button type="button" onClick={() => setCustomerFormOpen(true)}>
            + Müşteri
          </button>
          <button type="button" onClick={() => setContactFormOpen(true)}>
            + İletişim Kişisi
          </button>
          <button type="button" onClick={() => setWorkingSiteFormOpen(true)}>
            + Şantiye
          </button>
        </div>
      </header>

      <section className={styles.cards}>
        <h2 className={styles.sectionTitle}>Özet</h2>
        <div className={styles.cardToggle}>
          <span className={clsx(styles.toggleLabel, cardView === 'customers' && styles.activeToggleLabel)}>
            Customers
          </span>
          <button
            type="button"
            className={clsx(styles.toggleSwitch, cardView === 'sites' && styles.toggleSwitchActive)}
            aria-label="Toggle card view"
            onClick={() =>
              setCardView((prev) => (prev === 'customers' ? 'sites' : 'customers'))
            }
          >
            <span className={styles.toggleThumb} />
          </button>
          <span className={clsx(styles.toggleLabel, cardView === 'sites' && styles.activeToggleLabel)}>
            Working Sites
          </span>
        </div>
        {activeCards.length ? (
          <div className={styles.cardCarousel}>
            <button
              type="button"
              className={styles.cardArrow}
              aria-label="Previous customer"
              onClick={() =>
                setCardIndex((prev) => (prev === 0 ? activeCards.length - 1 : prev - 1))
              }
              disabled={activeCards.length < 2}
            >
              <ChevronLeft size={20} />
            </button>
            <div className={styles.cardWrapper}>
              {activeCards[cardIndex] && (
                <div className={clsx(styles.customerCard, expandedCardId === activeCards[cardIndex].id && styles.customerCardExpanded)}>
                  <header>
                    <div>
                      <h3>{activeCards[cardIndex].title}</h3>
                      {activeCards[cardIndex].subtitle && (
                        <span className={styles.cardSubtitle}>{activeCards[cardIndex].subtitle}</span>
                      )}
                    </div>
                    {cardView === 'customers' && (
                      <button
                        type="button"
                        className={styles.editButton}
                        onClick={() => {
                          const customer = customers.find((c) => c.name === activeCards[cardIndex].title);
                          if (customer) {
                            openEditCustomerForm(customer);
                          }
                        }}
                        title="Edit Customer"
                      >
                        Edit
                      </button>
                    )}
                  </header>
                  <div className={styles.customerCardMetrics}>
                    {activeCards[cardIndex].metrics.map((metric) => (
                      <div key={`${activeCards[cardIndex].id}-${metric.label}`}>
                        <span>{metric.label}</span>
                        <span className={styles.metricValue}>{metric.value}</span>
                      </div>
                    ))}
                  </div>
                  {expandedCardId === activeCards[cardIndex].id && (
                    <div className={styles.expandedContent}>
                      {cardView === 'customers' ? (
                        <Tabs
                          tabs={[
                            { id: 'transactions', label: 'Transactions' },
                            { id: 'operations', label: 'Operations' },
                          ]}
                          active={customerTab}
                          onChange={(tab) => setCustomerTab(tab as 'transactions' | 'operations')}
                        >
                          {customerTab === 'transactions' ? (
                        <CustomerTransactions customerName={activeCards[cardIndex].title} />
                          ) : (
                            <CustomerOperations customerName={activeCards[cardIndex].title} />
                          )}
                        </Tabs>
                      ) : (
                        <WorkingSiteOperations workingSiteName={activeCards[cardIndex].title} />
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    className={styles.expandButton}
                    onClick={() => {
                      const newExpandedId = expandedCardId === activeCards[cardIndex].id
                          ? null
                        : activeCards[cardIndex].id;
                      setExpandedCardId(newExpandedId);
                      if (newExpandedId && cardView === 'customers') {
                        setCustomerTab('transactions'); // Reset to transactions tab when expanding
                      }
                    }}
                    aria-label={expandedCardId === activeCards[cardIndex].id ? 'Collapse' : 'Expand'}
                  >
                    {expandedCardId === activeCards[cardIndex].id ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              className={styles.cardArrow}
              aria-label="Next customer"
              onClick={() =>
                setCardIndex((prev) => (prev === activeCards.length - 1 ? 0 : prev + 1))
              }
              disabled={activeCards.length < 2}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        ) : (
          <p>
            {cardView === 'customers'
              ? 'No customers yet. Add one using the form below.'
              : 'No working sites yet. Add one using the form below.'}
          </p>
        )}
      </section>

      <FilterBar>
        <input
          placeholder="Search customers…"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />
      </FilterBar>

      <section className={styles.tableGroup}>
        <div>
          <h3 className={styles.sectionTitle}>Customers</h3>
          <DataTable
            columns={[
              { key: 'name', header: 'Customer' },
              {
                key: 'balance',
                header: 'Balance',
                render: (customer) => currencyFormatter.format(Number(customer.balance ?? 0)),
              },
              {
                key: 'createdAt',
                header: 'Created',
                render: (customer) =>
                  customer.createdAt ? formatDateDDMMYYYY(customer.createdAt) : '—',
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (customer) => (
                  <div className={styles.actions}>
                    <button type="button" onClick={() => openDetails(customer)}>
                      View Details
                    </button>
                  </div>
                ),
              },
            ]}
            data={filteredCustomers}
          />
        </div>

        <div>
          <h3 className={styles.sectionTitle}>Customer Contact Persons</h3>
          <DataTable
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'role', header: 'Role' },
              {
                key: 'customerId',
                header: 'Customer',
                render: (contact) =>
                  customers.find((customer) => customer.id === contact.customerId)?.name ?? '—',
              },
              { key: 'email', header: 'Email' },
              { key: 'phoneNumber', header: 'Phone' },
            ]}
            data={contacts}
          />
        </div>

        <div>
          <h3 className={styles.sectionTitle}>Working Sites</h3>
          <DataTable
            columns={[
              { key: 'workingSiteName', header: 'Site' },
              { key: 'location', header: 'Location' },
              {
                key: 'customerId',
                header: 'Customer',
                render: (site) =>
                  site.customerId
                    ? customers.find((customer) => customer.id === site.customerId)?.name ?? '—'
                    : '—',
              },
              {
                key: 'createdAt',
                header: 'Created',
                render: (site) =>
                  site.createdAt ? formatDateDDMMYYYY(site.createdAt) : '—',
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (site) => (
                  <div className={styles.actions}>
                    <button
                      type="button"
                      onClick={() => handleWorkingSiteDelete(site.id)}
                      className={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </div>
                ),
              },
            ]}
            data={workingSites}
          />
        </div>
      </section>

      <Modal
        title="Customer Details"
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        width="lg"
      >
        {selectedCustomer && (
          <div className={styles.details}>
            <section>
              <h3>Contacts</h3>
              {contacts.filter((contact) => contact.customerId === selectedCustomer.id).length ? (
                <ul>
                  {contacts
                    .filter((contact) => contact.customerId === selectedCustomer.id)
                    .map((contact) => (
                      <li key={contact.id}>
                        <strong>{contact.name}</strong> · {contact.role} · {contact.email} ·{' '}
                        {contact.phoneNumber}
                      </li>
                    ))}
                </ul>
              ) : (
                <p>No contacts registered.</p>
              )}
            </section>
          </div>
        )}
      </Modal>

      <Modal
        title="Add Customer"
        open={customerFormOpen}
        onClose={closeCustomerForm}
        width="sm"
      >
        <form onSubmit={(event) => {
          const form = event.currentTarget;
          handleCustomerSubmit(event).then((success) => {
            if (success) {
              form.reset();
              closeCustomerForm();
            }
          });
        }}
        className={styles.formFields}>
          <label>
            <span>Name</span>
            <input 
              name="customerName" 
              required 
              defaultValue={editingCustomerId ? customers.find(c => c.id === editingCustomerId)?.name : ''}
            />
          </label>
          <label>
            <span>Balance</span>
            <input 
              name="customerBalance" 
              type="number" 
              step="0.01"
              defaultValue={editingCustomerId ? customers.find(c => c.id === editingCustomerId)?.balance : ''}
            />
          </label>
          <label>
            <span>Phone Number</span>
            <input 
              name="customerPhoneNumber" 
              type="tel"
              defaultValue={editingCustomerId ? customers.find(c => c.id === editingCustomerId)?.phoneNumber || '' : ''}
            />
          </label>
          <label>
            <span>Address</span>
            <input 
              name="customerAddress" 
              type="text"
              defaultValue={editingCustomerId ? customers.find(c => c.id === editingCustomerId)?.address || '' : ''}
            />
          </label>
          <label>
            <span>Email</span>
            <input 
              name="customerEmail" 
              type="email"
              defaultValue={editingCustomerId ? customers.find(c => c.id === editingCustomerId)?.email || '' : ''}
            />
          </label>
          <label>
            <span>Vergi Dairesi (Tax Office)</span>
            <input 
              name="customerVergiDairesi" 
              type="text"
              defaultValue={editingCustomerId ? customers.find(c => c.id === editingCustomerId)?.vergiDairesi || '' : ''}
            />
          </label>
          <label>
            <span>VKN (Tax Identification Number)</span>
            <input 
              name="customerVKN" 
              type="text"
              defaultValue={editingCustomerId ? customers.find(c => c.id === editingCustomerId)?.vkn || '' : ''}
            />
          </label>
          <div className={styles.modalActions}>
            <button type="button" onClick={closeCustomerForm}>
              Cancel
            </button>
            <button type="submit">{editingCustomerId ? 'Update Customer' : 'Save Customer'}</button>
          </div>
        </form>
      </Modal>

      <Modal
        title="Add Contact Person"
        open={contactFormOpen}
        onClose={() => setContactFormOpen(false)}
        width="md"
      >
        <form
          onSubmit={(event) => {
            const form = event.currentTarget;
            const success = handleContactSubmit(event);
            if (success) {
              form.reset();
              setContactFormOpen(false);
            }
          }}
          className={styles.formFields}
        >
          <label>
            <span>Customer</span>
            <select name="contactCustomerId" required defaultValue="">
              <option value="" disabled>
                Select customer
              </option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Name</span>
            <input name="contactName" required />
          </label>
          <label>
            <span>Role</span>
            <input name="contactRole" />
          </label>
          <label>
            <span>Email</span>
            <input name="contactEmail" type="email" required />
          </label>
          <label>
            <span>Phone</span>
            <input name="contactPhone" />
          </label>
          <div className={styles.modalActions}>
            <button type="button" onClick={() => setContactFormOpen(false)}>
              Cancel
            </button>
            <button type="submit">Add Contact</button>
          </div>
        </form>
      </Modal>

      <Modal
        title="Add Working Site"
        open={workingSiteFormOpen}
        onClose={() => {
          setWorkingSiteFormOpen(false);
          setWorkingSiteFormStatus({ type: null, message: '' });
        }}
        width="md"
      >
        <form
          onSubmit={async (event) => {
            await handleWorkingSiteSubmit(event);
          }}
          className={styles.formFields}
        >
          {workingSiteFormStatus.type && (
            <div
              className={
                workingSiteFormStatus.type === 'success'
                  ? styles.successMessage
                  : styles.errorMessage
              }
            >
              {workingSiteFormStatus.message}
            </div>
          )}
          <label>
            <span>Site Name</span>
            <input name="siteName" required disabled={workingSiteFormLoading} />
          </label>
          <label>
            <span>Location</span>
            <input name="siteLocation" required disabled={workingSiteFormLoading} />
          </label>
          <label>
            <span>Customer (optional)</span>
            <select name="siteCustomerId" defaultValue="" disabled={workingSiteFormLoading}>
              <option value="">No association</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={() => {
                setWorkingSiteFormOpen(false);
                setWorkingSiteFormStatus({ type: null, message: '' });
              }}
              disabled={workingSiteFormLoading}
            >
              Cancel
            </button>
            <button type="submit" disabled={workingSiteFormLoading}>
              {workingSiteFormLoading ? 'Creating...' : 'Add Working Site'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

