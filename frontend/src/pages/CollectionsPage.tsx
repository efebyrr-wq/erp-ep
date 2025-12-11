import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import clsx from 'clsx';
import { DataTable } from '../components/common/DataTable';
import { Tabs } from '../components/common/Tabs';
import { Modal } from '../components/common/Modal';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';
import {
  mockCollectionCash,
  mockCollectionCreditCard,
  mockCollectionsCheck,
  mockPaymentCheck,
  mockPaymentCreditCard,
  mockPaymentsCash,
} from '../lib/mockData';
import type {
  CollectionCash,
  CollectionCreditCard,
  CollectionsCheck,
  PaymentCheck,
  PaymentCreditCard,
  PaymentsCash,
  Account,
  Customer,
  Supplier,
  Outsourcer,
} from '../types';
import styles from './CollectionsPage.module.css';

type Money = {
  amount: string | null;
};

type CollectionTab = 'check' | 'credit' | 'cash';
type ViewMode = 'collections' | 'payments';

function totalAmount<T extends Money>(records: T[]) {
  return records.reduce((total, record) => {
    const amount = Number(record.amount ?? 0);
    return total + amount;
  }, 0);
}

export default function CollectionsPage() {
  const [tab, setTab] = useState<CollectionTab>('check');
  const [viewMode, setViewMode] = useState<ViewMode>('collections');
  const [collectionsCheck, setCollectionsCheck] = useState<CollectionsCheck[]>([]);
  const [paymentCheck, setPaymentCheck] = useState<PaymentCheck[]>([]);
  const [collectionsCreditCard, setCollectionsCreditCard] = useState<CollectionCreditCard[]>([]);
  const [paymentCreditCard, setPaymentCreditCard] = useState<PaymentCreditCard[]>([]);
  const [collectionsCash, setCollectionsCash] = useState<CollectionCash[]>([]);
  const [paymentsCash, setPaymentsCash] = useState<PaymentsCash[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [outsourcers, setOutsourcers] = useState<Outsourcer[]>([]);
  const [loading, setLoading] = useState(false);
  const [creditCardFeeCalc, setCreditCardFeeCalc] = useState({ amount: '', fee: '' });

  // Modal states for collections
  const [collectionCheckModalOpen, setCollectionCheckModalOpen] = useState(false);
  const [selectedCollectionCheck, setSelectedCollectionCheck] = useState<CollectionsCheck | null>(null);
  const [collectionCreditCardModalOpen, setCollectionCreditCardModalOpen] = useState(false);
  const [selectedCollectionCreditCard, setSelectedCollectionCreditCard] = useState<CollectionCreditCard | null>(null);
  const [collectionCashModalOpen, setCollectionCashModalOpen] = useState(false);
  const [selectedCollectionCash, setSelectedCollectionCash] = useState<CollectionCash | null>(null);

  // Modal states for payments
  const [paymentCheckModalOpen, setPaymentCheckModalOpen] = useState(false);
  const [selectedPaymentCheck, setSelectedPaymentCheck] = useState<PaymentCheck | null>(null);
  const [paymentCreditCardModalOpen, setPaymentCreditCardModalOpen] = useState(false);
  const [selectedPaymentCreditCard, setSelectedPaymentCreditCard] = useState<PaymentCreditCard | null>(null);
  const [paymentCashModalOpen, setPaymentCashModalOpen] = useState(false);
  const [selectedPaymentCash, setSelectedPaymentCash] = useState<PaymentsCash | null>(null);

  const loadAccounts = async () => {
    const data = await apiGet<Account[]>('/accounts', []);
    setAccounts(data);
  };

  const loadData = async () => {
    const [checkCol, checkPay, creditCol, creditPay, cashCol, cashPay] = await Promise.all([
      apiGet<CollectionsCheck[]>('/collections/check', []),
      apiGet<PaymentCheck[]>('/payments/check', []),
      apiGet<CollectionCreditCard[]>('/collections/credit-card', []),
      apiGet<PaymentCreditCard[]>('/payments/credit-card', []),
      apiGet<CollectionCash[]>('/collections/cash', []),
      apiGet<PaymentsCash[]>('/payments/cash', []),
    ]);
    setCollectionsCheck(checkCol);
    setPaymentCheck(checkPay);
    setCollectionsCreditCard(creditCol);
    setPaymentCreditCard(creditPay);
    setCollectionsCash(cashCol);
    setPaymentsCash(cashPay);
  };

  const refreshSuppliers = async () => {
    const data = await apiGet<Supplier[]>('/suppliers', []);
    setSuppliers(data);
  };

  const refreshOutsourcers = async () => {
    const data = await apiGet<Outsourcer[]>('/outsourcers', []);
    setOutsourcers(data);
  };

  useEffect(() => {
    void loadAccounts();
    void loadData();
    void apiGet<Customer[]>('/customers', []).then((data) => {
      setCustomers(data);
    });
    void refreshSuppliers();
    void refreshOutsourcers();
  }, []);

  const totals = useMemo(
    () => ({
      check:
        totalAmount<CollectionsCheck>(collectionsCheck) -
        totalAmount<PaymentCheck>(paymentCheck),
      credit:
        totalAmount<CollectionCreditCard>(collectionsCreditCard) -
        totalAmount<PaymentCreditCard>(paymentCreditCard),
      cash:
        totalAmount<CollectionCash>(collectionsCash) -
        totalAmount<PaymentsCash>(paymentsCash),
    }),
    [collectionsCheck, paymentCheck, collectionsCreditCard, paymentCreditCard, collectionsCash, paymentsCash],
  );

  // Calculate absolute totals for display (always positive, but show 0 if no entries)
  const displayTotals = useMemo(
    () => {
      const hasCheckEntries = collectionsCheck.length > 0 || paymentCheck.length > 0;
      const hasCreditEntries = collectionsCreditCard.length > 0 || paymentCreditCard.length > 0;
      const hasCashEntries = collectionsCash.length > 0 || paymentsCash.length > 0;
      
      return {
        check: hasCheckEntries ? Math.abs(totals.check) : 0,
        credit: hasCreditEntries ? Math.abs(totals.credit) : 0,
        cash: hasCashEntries ? Math.abs(totals.cash) : 0,
      };
    },
    [totals, collectionsCheck.length, paymentCheck.length, collectionsCreditCard.length, paymentCreditCard.length, collectionsCash.length, paymentsCash.length],
  );

  // Filter accounts by type
  const checkingAccounts = useMemo(() => accounts.filter(a => a.type === 'Checking'), [accounts]);
  const creditCardAccounts = useMemo(() => accounts.filter(a => a.type === 'Credit Card'), [accounts]);
  const bankAccounts = useMemo(() => accounts.filter(a => a.type === 'Bank Account'), [accounts]);

  // Collection Check handlers
  const handleCollectionCheckSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const confirmed = window.confirm(
      selectedCollectionCheck ? 'Are you sure you want to update this collection?' : 'Are you sure you want to create this collection?'
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const payload = {
        customerName: formData.get('customerName') as string,
        checkDate: formData.get('checkDate') as string,
        amount: formData.get('amount') as string,
        collectionDate: formData.get('collectionDate') as string,
        accountName: formData.get('accountName') as string,
        notes: formData.get('notes') as string || undefined,
      };

      if (selectedCollectionCheck) {
        const updated = await apiPatch<typeof payload, CollectionsCheck>(
          `/collections/check/${selectedCollectionCheck.id}`,
          payload
        );
        if (updated) {
          await loadData();
          // Refresh customers to get updated balance
          void apiGet<Customer[]>('/customers', []).then((data) => {
            setCustomers(data);
          });
          setCollectionCheckModalOpen(false);
        } else {
          alert('Failed to update collection. Please try again.');
        }
      } else {
        const created = await apiPost<typeof payload, CollectionsCheck>('/collections/check', payload);
        if (created) {
          await loadData();
          // Refresh customers to get updated balance
          void apiGet<Customer[]>('/customers', []).then((data) => {
            setCustomers(data);
          });
          setCollectionCheckModalOpen(false);
        } else {
          alert('Failed to create collection. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error saving collection check:', error);
      alert('An error occurred while saving the collection.');
    } finally {
      setLoading(false);
    }
  };

  const handleCollectionCheckDelete = async (item: CollectionsCheck) => {
    const confirmed = window.confirm(`Are you sure you want to delete this collection? This action cannot be undone.`);
    if (!confirmed) return;

    setLoading(true);
    try {
      const result = await apiDelete<{ message: string }>(`/collections/check/${item.id}`);
      if (result) {
        await loadData();
      } else {
        alert('Failed to delete collection. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting collection check:', error);
      alert('An error occurred while deleting the collection.');
    } finally {
      setLoading(false);
    }
  };

  // Similar handlers for other types - I'll create a comprehensive version with all handlers
  // Due to length, I'll create helper functions for the common patterns

  const renderTable = (type: CollectionTab) => {
    switch (type) {
      case 'check':
        return (
          <div className={styles.split}>
            {viewMode === 'collections' ? (
              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3>Tahsilatlar</h3>
                  <button type="button" onClick={() => { setSelectedCollectionCheck(null); setCollectionCheckModalOpen(true); }} className={styles.addButton}>
                    + Add
                  </button>
                </div>
                <DataTable
                  columns={[
                    { key: 'customerName', header: 'Müşteri' },
                    { key: 'checkDate', header: 'Çek Tarihi' },
                    {
                      key: 'amount',
                      header: 'Tutar',
                      render: (record: CollectionsCheck) => (
                        <span className={styles.greenAmount}>₺{record.amount ?? '0.00'}</span>
                      ),
                    },
                    { key: 'collectionDate', header: 'Collection Date' },
                    { key: 'accountName', header: 'Account' },
                    {
                      key: 'actions',
                      header: 'İşlemler',
                      render: (record: CollectionsCheck) => (
                        <div className={styles.actions}>
                          <button type="button" onClick={() => { setSelectedCollectionCheck(record); setCollectionCheckModalOpen(true); }}>
                            Düzenle
                          </button>
                          <button type="button" onClick={() => handleCollectionCheckDelete(record)} disabled={loading}>
                            Sil
                          </button>
                        </div>
                      ),
                    },
                  ]}
                  data={collectionsCheck}
                />
              </section>
            ) : (
              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3>Ödemeler</h3>
                  <button type="button" onClick={() => { setSelectedPaymentCheck(null); setPaymentCheckModalOpen(true); }} className={styles.addButton}>
                    + Add
                  </button>
                </div>
                <DataTable
                  columns={[
                    { key: 'collectorName', header: 'Collector' },
                    { key: 'checkDate', header: 'Check Date' },
                    {
                      key: 'amount',
                      header: 'Tutar',
                      render: (record: PaymentCheck) => (
                        <span className={styles.greenAmount}>₺{record.amount ?? '0.00'}</span>
                      ),
                    },
                    { key: 'collectionDate', header: 'Collection Date' },
                    { key: 'accountName', header: 'Account' },
                    {
                      key: 'actions',
                      header: 'İşlemler',
                      render: (record: PaymentCheck) => (
                        <div className={styles.actions}>
                          <button type="button" onClick={() => { setSelectedPaymentCheck(record); setPaymentCheckModalOpen(true); }}>
                            Düzenle
                          </button>
                          <button type="button" onClick={async () => {
                            const confirmed = window.confirm(`Are you sure you want to delete this payment? This action cannot be undone.`);
                            if (!confirmed) return;
                            setLoading(true);
                            try {
                              const result = await apiDelete<{ message: string }>(`/payments/check/${record.id}`);
                              if (result) await loadData();
                              else alert('Failed to delete payment.');
                            } catch (error) {
                              alert('An error occurred while deleting the payment.');
                            } finally {
                              setLoading(false);
                            }
                          }} disabled={loading}>
                            Sil
                          </button>
                        </div>
                      ),
                    },
                  ]}
                  data={paymentCheck}
                />
              </section>
            )}
          </div>
        );
      case 'credit':
        return (
          <div className={styles.split}>
            {viewMode === 'collections' ? (
              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3>Tahsilatlar</h3>
                  <button type="button" onClick={() => { setSelectedCollectionCreditCard(null); setCollectionCreditCardModalOpen(true); }} className={styles.addButton}>
                    + Add
                  </button>
                </div>
                <DataTable
                  columns={[
                    { key: 'customerName', header: 'Customer' },
                    { key: 'transactionDate', header: 'Transaction Date' },
                    {
                      key: 'amount',
                      header: 'Tutar',
                      render: (record: CollectionCreditCard) => (
                        <span className={styles.greenAmount}>₺{record.amount ?? '0.00'}</span>
                      ),
                    },
                    { key: 'paymentTo', header: 'Payment To' },
                    {
                      key: 'creditCardFee',
                      header: 'Fee',
                      render: (record: CollectionCreditCard) => {
                        const feePercent = record.creditCardFee ? parseFloat(record.creditCardFee) : 0;
                        const amount = record.amount ? parseFloat(record.amount) : 0;
                        const feeAmount = (amount * feePercent / 100).toFixed(2);
                        return `${feePercent}% ($${feeAmount})`;
                      },
                    },
                    {
                      key: 'actions',
                      header: 'İşlemler',
                      render: (record: CollectionCreditCard) => (
                        <div className={styles.actions}>
                          <button type="button" onClick={() => { setSelectedCollectionCreditCard(record); setCollectionCreditCardModalOpen(true); }}>
                            Düzenle
                          </button>
                          <button type="button" onClick={async () => {
                            const confirmed = window.confirm(`Are you sure you want to delete this collection? This action cannot be undone.`);
                            if (!confirmed) return;
                            setLoading(true);
                            try {
                              const result = await apiDelete<{ message: string }>(`/collections/credit-card/${record.id}`);
                              if (result) await loadData();
                              else alert('Failed to delete collection.');
                            } catch (error) {
                              alert('An error occurred while deleting the collection.');
                            } finally {
                              setLoading(false);
                            }
                          }} disabled={loading}>
                            Sil
                          </button>
                        </div>
                      ),
                    },
                  ]}
                  data={collectionsCreditCard}
                />
              </section>
            ) : (
              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3>Ödemeler</h3>
                  <button type="button" onClick={() => { setSelectedPaymentCreditCard(null); setPaymentCreditCardModalOpen(true); }} className={styles.addButton}>
                    + Add
                  </button>
                </div>
                <DataTable
                  columns={[
                    { key: 'collectorName', header: 'Collector' },
                    { key: 'transactionDate', header: 'Transaction Date' },
                    {
                      key: 'amount',
                      header: 'Tutar',
                      render: (record: PaymentCreditCard) => (
                        <span className={styles.greenAmount}>₺{record.amount ?? '0.00'}</span>
                      ),
                    },
                    { key: 'paymentFrom', header: 'Payment From' },
                    {
                      key: 'creditCardFee',
                      header: 'Fee',
                      render: (record: PaymentCreditCard) => `$${record.creditCardFee ?? '0.00'}`,
                    },
                    {
                      key: 'actions',
                      header: 'İşlemler',
                      render: (record: PaymentCreditCard) => (
                        <div className={styles.actions}>
                          <button type="button" onClick={() => { setSelectedPaymentCreditCard(record); setPaymentCreditCardModalOpen(true); }}>
                            Düzenle
                          </button>
                          <button type="button" onClick={async () => {
                            const confirmed = window.confirm(`Are you sure you want to delete this payment? This action cannot be undone.`);
                            if (!confirmed) return;
                            setLoading(true);
                            try {
                              const result = await apiDelete<{ message: string }>(`/payments/credit-card/${record.id}`);
                              if (result) await loadData();
                              else alert('Failed to delete payment.');
                            } catch (error) {
                              alert('An error occurred while deleting the payment.');
                            } finally {
                              setLoading(false);
                            }
                          }} disabled={loading}>
                            Sil
                          </button>
                        </div>
                      ),
                    },
                  ]}
                  data={paymentCreditCard}
                />
              </section>
            )}
          </div>
        );
      default:
        return (
          <div className={styles.split}>
            {viewMode === 'collections' ? (
              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3>Tahsilatlar</h3>
                  <button type="button" onClick={() => { setSelectedCollectionCash(null); setCollectionCashModalOpen(true); }} className={styles.addButton}>
                    + Add
                  </button>
                </div>
                <DataTable
                  columns={[
                    { key: 'customerName', header: 'Customer' },
                    { key: 'transactionDate', header: 'Transaction Date' },
                    {
                      key: 'amount',
                      header: 'Tutar',
                      render: (record: CollectionCash) => (
                        <span className={styles.greenAmount}>₺{record.amount ?? '0.00'}</span>
                      ),
                    },
                    { key: 'accountName', header: 'Account' },
                    { key: 'notes', header: 'Notes' },
                    {
                      key: 'actions',
                      header: 'İşlemler',
                      render: (record: CollectionCash) => (
                        <div className={styles.actions}>
                          <button type="button" onClick={() => { setSelectedCollectionCash(record); setCollectionCashModalOpen(true); }}>
                            Düzenle
                          </button>
                          <button type="button" onClick={async () => {
                            const confirmed = window.confirm(`Are you sure you want to delete this collection? This action cannot be undone.`);
                            if (!confirmed) return;
                            setLoading(true);
                            try {
                              const result = await apiDelete<{ message: string }>(`/collections/cash/${record.id}`);
                              if (result) await loadData();
                              else alert('Failed to delete collection.');
                            } catch (error) {
                              alert('An error occurred while deleting the collection.');
                            } finally {
                              setLoading(false);
                            }
                          }} disabled={loading}>
                            Sil
                          </button>
                        </div>
                      ),
                    },
                  ]}
                  data={collectionsCash}
                />
              </section>
            ) : (
              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3>Ödemeler</h3>
                  <button type="button" onClick={() => { setSelectedPaymentCash(null); setPaymentCashModalOpen(true); }} className={styles.addButton}>
                    + Add
                  </button>
                </div>
                <DataTable
                  columns={[
                    { key: 'collectorName', header: 'Collector' },
                    { key: 'transactionDate', header: 'Transaction Date' },
                    {
                      key: 'amount',
                      header: 'Tutar',
                      render: (record: PaymentsCash) => (
                        <span className={styles.greenAmount}>₺{record.amount ?? '0.00'}</span>
                      ),
                    },
                    { key: 'accountName', header: 'Account' },
                    { key: 'notes', header: 'Notes' },
                    {
                      key: 'actions',
                      header: 'İşlemler',
                      render: (record: PaymentsCash) => (
                        <div className={styles.actions}>
                          <button type="button" onClick={() => { setSelectedPaymentCash(record); setPaymentCashModalOpen(true); }}>
                            Düzenle
                          </button>
                          <button type="button" onClick={async () => {
                            const confirmed = window.confirm(`Are you sure you want to delete this payment? This action cannot be undone.`);
                            if (!confirmed) return;
                            setLoading(true);
                            try {
                              const result = await apiDelete<{ message: string }>(`/payments/cash/${record.id}`);
                              if (result) await loadData();
                              else alert('Failed to delete payment.');
                            } catch (error) {
                              alert('An error occurred while deleting the payment.');
                            } finally {
                              setLoading(false);
                            }
                          }} disabled={loading}>
                            Sil
                          </button>
                        </div>
                      ),
                    },
                  ]}
                  data={paymentsCash}
                />
              </section>
            )}
          </div>
        );
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Collections &amp; Payments</h1>
          <p>Monitor receivables and payables across payment instruments.</p>
        </div>
      </header>

      <Tabs
        tabs={[
          { id: 'check', label: 'Check', badge: `$${displayTotals.check.toFixed(2)}`, badgeClassName: totals.check >= 0 ? styles.greenBadge : styles.redBadge },
          { id: 'credit', label: 'Credit Card', badge: `$${displayTotals.credit.toFixed(2)}`, badgeClassName: totals.credit >= 0 ? styles.creditCardBadge : styles.redBadge },
          { id: 'cash', label: 'Cash', badge: `$${displayTotals.cash.toFixed(2)}`, badgeClassName: totals.cash >= 0 ? styles.greenBadge : styles.redBadge },
        ]}
        active={tab}
        onChange={setTab}
        actions={
          <div className={styles.cardToggle}>
            <span className={clsx(styles.toggleLabel, viewMode === 'collections' && styles.activeToggleLabel)}>
              Collections
            </span>
            <button
              type="button"
              className={clsx(styles.toggleSwitch, viewMode === 'payments' && styles.toggleSwitchActive)}
              aria-label="Toggle view mode"
              onClick={() => setViewMode((prev) => (prev === 'collections' ? 'payments' : 'collections'))}
            >
              <span className={styles.toggleThumb} />
            </button>
            <span className={clsx(styles.toggleLabel, viewMode === 'payments' && styles.activeToggleLabel)}>
              Payments
            </span>
          </div>
        }
      >
        {renderTable(tab)}
      </Tabs>

      {/* Collection Check Modal */}
      <Modal
        title={selectedCollectionCheck ? 'Edit Collection Check' : 'Add Collection Check'}
        open={collectionCheckModalOpen}
        onClose={() => setCollectionCheckModalOpen(false)}
      >
        <form className={styles.form} onSubmit={handleCollectionCheckSubmit}>
          <label>
            <span>Customer Name</span>
            <select name="customerName" defaultValue={selectedCollectionCheck?.customerName ?? ''} required>
              <option value="">Select Customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.name}>
                  {customer.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Check Date</span>
            <input type="date" name="checkDate" defaultValue={selectedCollectionCheck?.checkDate ?? ''} required />
          </label>
          <label>
            <span>Amount</span>
            <input type="number" step="0.01" name="amount" defaultValue={selectedCollectionCheck?.amount ?? ''} required />
          </label>
          <label>
            <span>Collection Date</span>
            <input type="date" name="collectionDate" defaultValue={selectedCollectionCheck?.collectionDate ?? ''} required />
          </label>
          <label>
            <span>Account</span>
            <select name="accountName" defaultValue={selectedCollectionCheck?.accountName ?? ''} required>
              <option value="">Select Account</option>
              {checkingAccounts.map((account) => (
                <option key={account.id} value={account.accountName ?? ''}>
                  {account.accountName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Notes</span>
            <input name="notes" defaultValue={selectedCollectionCheck?.notes ?? ''} />
          </label>
          <footer className={styles.footer}>
            <button type="button" onClick={() => setCollectionCheckModalOpen(false)} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </footer>
        </form>
      </Modal>

      {/* Payment Check Modal */}
      <Modal
        title={selectedPaymentCheck ? 'Edit Payment Check' : 'Add Payment Check'}
        open={paymentCheckModalOpen}
        onClose={() => setPaymentCheckModalOpen(false)}
      >
        <form className={styles.form} onSubmit={async (e) => {
          e.preventDefault();
          const confirmed = window.confirm(selectedPaymentCheck ? 'Are you sure you want to update this payment?' : 'Are you sure you want to create this payment?');
          if (!confirmed) return;
          setLoading(true);
          try {
            const formData = new FormData(e.currentTarget);
            const payload = {
              collectorName: formData.get('collectorName') as string,
              checkDate: formData.get('checkDate') as string,
              amount: formData.get('amount') as string,
              collectionDate: formData.get('collectionDate') as string,
              accountName: formData.get('accountName') as string,
              notes: formData.get('notes') as string || undefined,
              customerName: formData.get('customerName') as string || undefined,
            };
            if (selectedPaymentCheck) {
              const updated = await apiPatch<typeof payload, PaymentCheck>(`/payments/check/${selectedPaymentCheck.id}`, payload);
              if (updated) { 
                await loadData();
                // Refresh customers to get updated balance
                void apiGet<Customer[]>('/customers', []).then((data) => {
                  setCustomers(data);
                });
                setPaymentCheckModalOpen(false); 
              }
              else alert('Failed to update payment.');
            } else {
              const created = await apiPost<typeof payload, PaymentCheck>('/payments/check', payload);
              if (created) { 
                await loadData();
                // Refresh customers to get updated balance
                void apiGet<Customer[]>('/customers', []).then((data) => {
                  setCustomers(data);
                });
                setPaymentCheckModalOpen(false); 
              }
              else alert('Failed to create payment.');
            }
          } catch (error) {
            alert('An error occurred while saving the payment.');
          } finally {
            setLoading(false);
          }
        }}>
          <label>
            <span>Collector Name</span>
            <select name="collectorName" defaultValue={selectedPaymentCheck?.collectorName ?? ''} required>
              <option value="">Select Supplier/Outsourcer</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.name ?? ''}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Check Date</span>
            <input type="date" name="checkDate" defaultValue={selectedPaymentCheck?.checkDate ?? ''} required />
          </label>
          <label>
            <span>Amount</span>
            <input type="number" step="0.01" name="amount" defaultValue={selectedPaymentCheck?.amount ?? ''} required />
          </label>
          <label>
            <span>Collection Date</span>
            <input type="date" name="collectionDate" defaultValue={selectedPaymentCheck?.collectionDate ?? ''} required />
          </label>
          <label>
            <span>Account</span>
            <select name="accountName" defaultValue={selectedPaymentCheck?.accountName ?? ''} required>
              <option value="">Select Account</option>
              {checkingAccounts.map((account) => (
                <option key={account.id} value={account.accountName ?? ''}>
                  {account.accountName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Notes</span>
            <input name="notes" defaultValue={selectedPaymentCheck?.notes ?? ''} />
          </label>
          <footer className={styles.footer}>
            <button type="button" onClick={() => setPaymentCheckModalOpen(false)} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </footer>
        </form>
      </Modal>

      {/* Collection Credit Card Modal */}
      <Modal
        title={selectedCollectionCreditCard ? 'Edit Collection Credit Card' : 'Add Collection Credit Card'}
        open={collectionCreditCardModalOpen}
        onClose={() => setCollectionCreditCardModalOpen(false)}
      >
        <form className={styles.form} onSubmit={async (e) => {
          e.preventDefault();
          const confirmed = window.confirm(selectedCollectionCreditCard ? 'Are you sure you want to update this collection?' : 'Are you sure you want to create this collection?');
          if (!confirmed) return;
          setLoading(true);
          try {
            const formData = new FormData(e.currentTarget);
            const payload = {
              customerName: formData.get('customerName') as string,
              transactionDate: formData.get('transactionDate') as string,
              amount: formData.get('amount') as string,
              paymentTo: formData.get('paymentTo') as string,
              creditCardFee: formData.get('creditCardFee') as string || undefined,
              notes: formData.get('notes') as string || undefined,
            };
            if (selectedCollectionCreditCard) {
              const updated = await apiPatch<typeof payload, CollectionCreditCard>(`/collections/credit-card/${selectedCollectionCreditCard.id}`, payload);
              if (updated) { 
                await loadData();
                // Refresh customers, suppliers, and outsourcers to get updated balances
                void apiGet<Customer[]>('/customers', []).then((data) => {
                  setCustomers(data);
                });
                void refreshSuppliers();
                void refreshOutsourcers();
                setCollectionCreditCardModalOpen(false); 
              }
              else alert('Failed to update collection.');
            } else {
              const created = await apiPost<typeof payload, CollectionCreditCard>('/collections/credit-card', payload);
              if (created) { 
                await loadData();
                // Refresh customers, suppliers, and outsourcers to get updated balances
                void apiGet<Customer[]>('/customers', []).then((data) => {
                  setCustomers(data);
                });
                void refreshSuppliers();
                void refreshOutsourcers();
                setCollectionCreditCardModalOpen(false); 
              }
              else alert('Failed to create collection.');
            }
          } catch (error) {
            alert('An error occurred while saving the collection.');
          } finally {
            setLoading(false);
          }
        }}>
          <label>
            <span>Customer Name</span>
            <select name="customerName" defaultValue={selectedCollectionCreditCard?.customerName ?? ''} required>
              <option value="">Select Customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.name}>
                  {customer.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Transaction Date</span>
            <input type="date" name="transactionDate" defaultValue={selectedCollectionCreditCard?.transactionDate ?? ''} required />
          </label>
          <label>
            <span>Amount</span>
            <input 
              type="number" 
              step="0.01" 
              name="amount" 
              defaultValue={selectedCollectionCreditCard?.amount ?? ''} 
              onChange={(e) => setCreditCardFeeCalc(prev => ({ ...prev, amount: e.target.value }))}
              required 
            />
          </label>
          <label>
            <span>Payment To</span>
            <select name="paymentTo" defaultValue={selectedCollectionCreditCard?.paymentTo ?? ''} required>
              <option value="">Select Destination</option>
              {bankAccounts.length > 0 && (
                <optgroup label="Bank Accounts">
                  {bankAccounts.map((account) => (
                <option key={account.id} value={account.accountName ?? ''}>
                  {account.accountName}
                </option>
              ))}
                </optgroup>
              )}
              {(suppliers.length > 0 || outsourcers.length > 0) && (
                <optgroup label="Suppliers / Outsourcers">
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.name ?? ''}>
                      {supplier.name}
                    </option>
                  ))}
                  {outsourcers.map((outsourcer) => (
                    <option key={outsourcer.id} value={outsourcer.name ?? ''}>
                      {outsourcer.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>
          <label>
            <span>Credit Card Fee (%)</span>
            <input 
              type="number" 
              step="0.01" 
              name="creditCardFee" 
              defaultValue={selectedCollectionCreditCard?.creditCardFee ?? ''} 
              onChange={(e) => setCreditCardFeeCalc(prev => ({ ...prev, fee: e.target.value }))}
              placeholder="e.g., 3 for 3%"
            />
            {(() => {
              const amount = creditCardFeeCalc.amount || selectedCollectionCreditCard?.amount || '';
              const fee = creditCardFeeCalc.fee || selectedCollectionCreditCard?.creditCardFee || '';
              if (amount && fee) {
                const feeAmount = (parseFloat(amount) * parseFloat(fee) / 100).toFixed(2);
                return (
                  <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
                    Fee amount: ${feeAmount}
                  </small>
                );
              }
              return null;
            })()}
          </label>
          <label>
            <span>Notes</span>
            <input name="notes" defaultValue={selectedCollectionCreditCard?.notes ?? ''} />
          </label>
          <footer className={styles.footer}>
            <button type="button" onClick={() => setCollectionCreditCardModalOpen(false)} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </footer>
        </form>
      </Modal>

      {/* Payment Credit Card Modal */}
      <Modal
        title={selectedPaymentCreditCard ? 'Edit Payment Credit Card' : 'Add Payment Credit Card'}
        open={paymentCreditCardModalOpen}
        onClose={() => setPaymentCreditCardModalOpen(false)}
      >
        <form className={styles.form} onSubmit={async (e) => {
          e.preventDefault();
          const confirmed = window.confirm(selectedPaymentCreditCard ? 'Are you sure you want to update this payment?' : 'Are you sure you want to create this payment?');
          if (!confirmed) return;
          setLoading(true);
          try {
            const formData = new FormData(e.currentTarget);
            const payload = {
              collectorName: formData.get('collectorName') as string,
              transactionDate: formData.get('transactionDate') as string,
              amount: formData.get('amount') as string,
              paymentFrom: formData.get('paymentFrom') as string,
              creditCardFee: formData.get('creditCardFee') as string || undefined,
              notes: formData.get('notes') as string || undefined,
              installmentPeriod: formData.get('installmentPeriod') ? Number(formData.get('installmentPeriod')) : undefined,
              customerName: formData.get('customerName') as string || undefined,
            };
            if (selectedPaymentCreditCard) {
              const updated = await apiPatch<typeof payload, PaymentCreditCard>(`/payments/credit-card/${selectedPaymentCreditCard.id}`, payload);
              if (updated) { 
                await loadData();
                // Refresh customers to get updated balance
                void apiGet<Customer[]>('/customers', []).then((data) => {
                  setCustomers(data);
                });
                setPaymentCreditCardModalOpen(false); 
              }
              else alert('Failed to update payment.');
            } else {
              const created = await apiPost<typeof payload, PaymentCreditCard>('/payments/credit-card', payload);
              if (created) { 
                await loadData();
                // Refresh customers to get updated balance
                void apiGet<Customer[]>('/customers', []).then((data) => {
                  setCustomers(data);
                });
                setPaymentCreditCardModalOpen(false); 
              }
              else alert('Failed to create payment.');
            }
          } catch (error) {
            alert('An error occurred while saving the payment.');
          } finally {
            setLoading(false);
          }
        }}>
          <label>
            <span>Customer Name</span>
            <select name="customerName" defaultValue={(selectedPaymentCreditCard as any)?.customerName ?? ''}>
              <option value="">Select Customer (Optional)</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.name}>
                  {customer.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Collector Name</span>
            <select name="collectorName" defaultValue={selectedPaymentCreditCard?.collectorName ?? ''} required>
              <option value="">Select Supplier/Outsourcer</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.name ?? ''}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Transaction Date</span>
            <input type="date" name="transactionDate" defaultValue={selectedPaymentCreditCard?.transactionDate ?? ''} required />
          </label>
          <label>
            <span>Amount</span>
            <input type="number" step="0.01" name="amount" defaultValue={selectedPaymentCreditCard?.amount ?? ''} required />
          </label>
          <label>
            <span>Payment From</span>
            <select name="paymentFrom" defaultValue={selectedPaymentCreditCard?.paymentFrom ?? ''} required>
              <option value="">Select Account</option>
              {creditCardAccounts.map((account) => (
                <option key={account.id} value={account.accountName ?? ''}>
                  {account.accountName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Credit Card Fee</span>
            <input type="number" step="0.01" name="creditCardFee" defaultValue={selectedPaymentCreditCard?.creditCardFee ?? ''} />
          </label>
          <label>
            <span>Installment Period</span>
            <input type="number" min={1} step="1" name="installmentPeriod" defaultValue={selectedPaymentCreditCard?.installmentPeriod ?? 1} />
          </label>
          <label>
            <span>Notes</span>
            <input name="notes" defaultValue={selectedPaymentCreditCard?.notes ?? ''} />
          </label>
          <footer className={styles.footer}>
            <button type="button" onClick={() => setPaymentCreditCardModalOpen(false)} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </footer>
        </form>
      </Modal>

      {/* Collection Cash Modal */}
      <Modal
        title={selectedCollectionCash ? 'Edit Collection Cash' : 'Add Collection Cash'}
        open={collectionCashModalOpen}
        onClose={() => setCollectionCashModalOpen(false)}
      >
        <form className={styles.form} onSubmit={async (e) => {
          e.preventDefault();
          const confirmed = window.confirm(selectedCollectionCash ? 'Are you sure you want to update this collection?' : 'Are you sure you want to create this collection?');
          if (!confirmed) return;
          setLoading(true);
          try {
            const formData = new FormData(e.currentTarget);
            const payload = {
              customerName: formData.get('customerName') as string,
              transactionDate: formData.get('transactionDate') as string,
              amount: formData.get('amount') as string,
              accountName: formData.get('accountName') as string,
              notes: formData.get('notes') as string || undefined,
            };
            if (selectedCollectionCash) {
              const updated = await apiPatch<typeof payload, CollectionCash>(`/collections/cash/${selectedCollectionCash.id}`, payload);
              if (updated) { 
                await loadData();
                // Refresh customers to get updated balance
                void apiGet<Customer[]>('/customers', []).then((data) => {
                  setCustomers(data);
                });
                setCollectionCashModalOpen(false); 
              }
              else alert('Failed to update collection.');
            } else {
              const created = await apiPost<typeof payload, CollectionCash>('/collections/cash', payload);
              if (created) { 
                await loadData();
                // Refresh customers to get updated balance
                void apiGet<Customer[]>('/customers', []).then((data) => {
                  setCustomers(data);
                });
                setCollectionCashModalOpen(false); 
              }
              else alert('Failed to create collection.');
            }
          } catch (error) {
            alert('An error occurred while saving the collection.');
          } finally {
            setLoading(false);
          }
        }}>
          <label>
            <span>Customer Name</span>
            <select name="customerName" defaultValue={selectedCollectionCash?.customerName ?? ''} required>
              <option value="">Select Customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.name}>
                  {customer.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Transaction Date</span>
            <input type="date" name="transactionDate" defaultValue={selectedCollectionCash?.transactionDate ?? ''} required />
          </label>
          <label>
            <span>Amount</span>
            <input type="number" step="0.01" name="amount" defaultValue={selectedCollectionCash?.amount ?? ''} required />
          </label>
          <label>
            <span>Account</span>
            <select name="accountName" defaultValue={selectedCollectionCash?.accountName ?? ''} required>
              <option value="">Select Account</option>
              {bankAccounts.map((account) => (
                <option key={account.id} value={account.accountName ?? ''}>
                  {account.accountName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Notes</span>
            <input name="notes" defaultValue={selectedCollectionCash?.notes ?? ''} />
          </label>
          <footer className={styles.footer}>
            <button type="button" onClick={() => setCollectionCashModalOpen(false)} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </footer>
        </form>
      </Modal>

      {/* Payment Cash Modal */}
      <Modal
        title={selectedPaymentCash ? 'Edit Payment Cash' : 'Add Payment Cash'}
        open={paymentCashModalOpen}
        onClose={() => setPaymentCashModalOpen(false)}
      >
        <form className={styles.form} onSubmit={async (e) => {
          e.preventDefault();
          const confirmed = window.confirm(selectedPaymentCash ? 'Are you sure you want to update this payment?' : 'Are you sure you want to create this payment?');
          if (!confirmed) return;
          setLoading(true);
          try {
            const formData = new FormData(e.currentTarget);
            const payload = {
              collectorName: formData.get('collectorName') as string,
              transactionDate: formData.get('transactionDate') as string,
              amount: formData.get('amount') as string,
              accountName: formData.get('accountName') as string,
              notes: formData.get('notes') as string || undefined,
              customerName: formData.get('customerName') as string || undefined,
            };
            if (selectedPaymentCash) {
              const updated = await apiPatch<typeof payload, PaymentsCash>(`/payments/cash/${selectedPaymentCash.id}`, payload);
              if (updated) { 
                await loadData();
                // Refresh customers to get updated balance
                void apiGet<Customer[]>('/customers', []).then((data) => {
                  setCustomers(data);
                });
                setPaymentCashModalOpen(false); 
              }
              else alert('Failed to update payment.');
            } else {
              const created = await apiPost<typeof payload, PaymentsCash>('/payments/cash', payload);
              if (created) { 
                await loadData();
                // Refresh customers to get updated balance
                void apiGet<Customer[]>('/customers', []).then((data) => {
                  setCustomers(data);
                });
                setPaymentCashModalOpen(false); 
              }
              else alert('Failed to create payment.');
            }
          } catch (error) {
            alert('An error occurred while saving the payment.');
          } finally {
            setLoading(false);
          }
        }}>
          <label>
            <span>Customer Name</span>
            <select name="customerName" defaultValue={(selectedPaymentCash as any)?.customerName ?? ''}>
              <option value="">Select Customer (Optional)</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.name}>
                  {customer.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Collector Name</span>
            <select name="collectorName" defaultValue={selectedPaymentCash?.collectorName ?? ''} required>
              <option value="">Select Supplier/Outsourcer</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.name ?? ''}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Transaction Date</span>
            <input type="date" name="transactionDate" defaultValue={selectedPaymentCash?.transactionDate ?? ''} required />
          </label>
          <label>
            <span>Amount</span>
            <input type="number" step="0.01" name="amount" defaultValue={selectedPaymentCash?.amount ?? ''} required />
          </label>
          <label>
            <span>Account</span>
            <select name="accountName" defaultValue={selectedPaymentCash?.accountName ?? ''} required>
              <option value="">Select Account</option>
              {bankAccounts.map((account) => (
                <option key={account.id} value={account.accountName ?? ''}>
                  {account.accountName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Notes</span>
            <input name="notes" defaultValue={selectedPaymentCash?.notes ?? ''} />
          </label>
          <footer className={styles.footer}>
            <button type="button" onClick={() => setPaymentCashModalOpen(false)} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </footer>
        </form>
      </Modal>
    </div>
  );
}
