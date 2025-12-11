import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { DataTable } from '../components/common/DataTable';
import { FilterBar } from '../components/common/FilterBar';
import { Modal } from '../components/common/Modal';
import { Tabs } from '../components/common/Tabs';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';
import {
  mockSuppliers,
  mockInvoices,
  mockPaymentCheck,
  mockPaymentCreditCard,
  mockPaymentsCash,
} from '../lib/mockData';
import type {
  Supplier,
  SupplierContact,
  Supply,
  Invoice,
  PaymentCheck,
  PaymentCreditCard,
  PaymentsCash,
} from '../types';
import styles from './SuppliersPage.module.css';

type SupplierWithRelations = Supplier & {
  contacts: SupplierContact[];
  supplies: Supply[];
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

const emptySupplier: SupplierWithRelations = {
  id: '',
  name: '',
  balance: '0.00',
  contacts: [],
  supplies: [],
};

const initialSuppliers: SupplierWithRelations[] = [];

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

export default function SuppliersPage() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<SupplierWithRelations[]>(initialSuppliers);
  const [filter, setFilter] = useState('');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [supplyModalOpen, setSupplyModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierWithRelations | null>(
    null,
  );
  const [cardIndex, setCardIndex] = useState(0);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'suppliers' | 'supplies'>('suppliers');
  const [supplierTab, setSupplierTab] = useState<'invoices' | 'payments' | 'details'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentsCheck, setPaymentsCheck] = useState<PaymentCheck[]>([]);
  const [paymentsCreditCard, setPaymentsCreditCard] =
    useState<PaymentCreditCard[]>([]);
  const [paymentsCash, setPaymentsCash] = useState<PaymentsCash[]>([]);

  useEffect(() => {
    void apiGet<SupplierWithRelations[]>('/suppliers', initialSuppliers).then((data) => {
      setSuppliers(
        data.map((supplier) => ({
          ...supplier,
          contacts: supplier.contacts ?? [],
          supplies: supplier.supplies ?? [],
        })),
      );
    });
    void apiGet<Invoice[]>('/invoices', []).then((data) => setInvoices(data));
    void apiGet<PaymentCheck[]>('/payments/check', []).then((data) =>
      setPaymentsCheck(data),
    );
    void apiGet<PaymentCreditCard[]>('/payments/credit-card', []).then((data) =>
      setPaymentsCreditCard(data),
    );
    void apiGet<PaymentsCash[]>('/payments/cash', []).then((data) =>
      setPaymentsCash(data),
    );
  }, []);

  const filteredSuppliers = useMemo(() => {
    if (!filter) return suppliers;
    return suppliers.filter((supplier) =>
      supplier.name.toLowerCase().includes(filter.toLowerCase()),
    );
  }, [suppliers, filter]);

  const supplierCards = useMemo<SummaryCard[]>(() => {
    const last30Threshold = new Date();
    last30Threshold.setDate(last30Threshold.getDate() - 30);

    return suppliers.map((supplier) => {
      const supplierName = supplier.name;
      
      // Total supplies
      const totalSupplies = supplier.supplies?.length ?? 0;
      
      // Active supplies (last 30 days) - based on invoices
      const recentInvoices = invoices.filter((invoice) => {
        if (invoice.supplierOutsourcerName !== supplierName) return false;
        if (!invoice.billDate) return false;
        return new Date(invoice.billDate) >= last30Threshold;
      });
      
      // Invoices count (last 30 days)
      const invoiceCount = recentInvoices.length;
      
      // Payments count (last 30 days)
      const paymentsCheckLast = paymentsCheck.filter((payment) => {
        if (payment.collectorName !== supplierName) return false;
        if (!payment.checkDate) return false;
        return new Date(payment.checkDate) >= last30Threshold;
      });
      const paymentsCreditCardLast = paymentsCreditCard.filter((payment) => {
        if (payment.collectorName !== supplierName) return false;
        if (!payment.transactionDate) return false;
        return new Date(payment.transactionDate) >= last30Threshold;
      });
      const paymentsCashLast = paymentsCash.filter((payment) => {
        if (payment.collectorName !== supplierName) return false;
        if (!payment.transactionDate) return false;
        return new Date(payment.transactionDate) >= last30Threshold;
      });
      const paymentCount =
        paymentsCheckLast.length + paymentsCreditCardLast.length + paymentsCashLast.length;

      return {
        id: supplier.id,
        title: supplier.name,
        subtitle: currencyFormatter.format(Number(supplier.balance ?? 0)),
        metrics: [
          { label: 'Total Supplies', value: String(totalSupplies) },
          { label: 'Invoices (30 days)', value: String(invoiceCount) },
          { label: 'Payments (30 days)', value: String(paymentCount) },
        ],
      };
    });
  }, [suppliers]);

  useEffect(() => {
    if (!supplierCards.length) {
      setCardIndex(0);
    } else if (cardIndex >= supplierCards.length) {
      setCardIndex(supplierCards.length - 1);
    }
  }, [cardIndex, supplierCards]);

  const openForm = (supplier?: SupplierWithRelations) => {
    setSelectedSupplier(supplier ?? emptySupplier);
    setFormModalOpen(true);
  };

  const openSupplyForm = () => {
    setSupplyModalOpen(true);
  };

  const openDetails = (supplier: SupplierWithRelations) => {
    setSelectedSupplier(supplier);
    setDetailsModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get('name') as string,
      balance: formData.get('balance') as string,
      contacts: [
        {
          name: formData.get('contactName') as string,
          role: formData.get('contactRole') as string,
          email: formData.get('contactEmail') as string,
          phoneNumber: formData.get('contactPhone') as string,
        },
      ].filter((contact) => contact.name && contact.email),
      supplies: [
        {
          type: formData.get('supplyType') as string,
          productName: formData.get('productName') as string,
          quantity: Number(formData.get('quantity') ?? 0),
          price: formData.get('price') as string,
        },
      ].filter((supply) => supply.productName),
    };

    if (selectedSupplier?.id) {
      // Update existing supplier
      const result = await apiPatch<typeof payload, SupplierWithRelations>(
        `/suppliers/${selectedSupplier.id}`,
        payload,
      );

      if (result) {
        // Refresh suppliers list to get updated data
        const data = await apiGet<SupplierWithRelations[]>('/suppliers', initialSuppliers);
        setSuppliers(
          data.map((supplier) => ({
            ...supplier,
            contacts: supplier.contacts ?? [],
            supplies: supplier.supplies ?? [],
          })),
        );
        setFormModalOpen(false);
        setSelectedSupplier(null);
      } else {
        alert('Failed to update supplier.');
      }
    } else {
      // Create new supplier
    const result = await apiPost<typeof payload, SupplierWithRelations>(
      '/suppliers',
      payload,
    );

      if (result) {
        // Refresh suppliers list to get the new supplier with all relations
        const data = await apiGet<SupplierWithRelations[]>('/suppliers', initialSuppliers);
        setSuppliers(
          data.map((supplier) => ({
            ...supplier,
            contacts: supplier.contacts ?? [],
            supplies: supplier.supplies ?? [],
          })),
        );
    setFormModalOpen(false);
        setSelectedSupplier(null);
      } else {
        alert('Failed to create supplier.');
      }
    }
  };

  const handleDelete = async (supplier: SupplierWithRelations) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete supplier "${supplier.name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    const result = await apiDelete(`/suppliers/${supplier.id}`);
    if (result !== null) {
      // Refresh suppliers list
      const data = await apiGet<SupplierWithRelations[]>('/suppliers', initialSuppliers);
      setSuppliers(
        data.map((s) => ({
          ...s,
          contacts: s.contacts ?? [],
          supplies: s.supplies ?? [],
        })),
      );
      // Close any open modals if the deleted supplier was selected
      if (selectedSupplier?.id === supplier.id) {
        setFormModalOpen(false);
        setDetailsModalOpen(false);
        setSelectedSupplier(null);
      }
    } else {
      alert('Failed to delete supplier.');
    }
  };

  function SupplierInvoices({ supplierName }: { supplierName: string }) {
    const supplierInvoices = invoices
      .filter((invoice) => invoice.supplierOutsourcerName === supplierName)
      .sort((a, b) => {
        if (!a.billDate && !b.billDate) return 0;
        if (!a.billDate) return 1;
        if (!b.billDate) return -1;
        return new Date(b.billDate).getTime() - new Date(a.billDate).getTime();
      });

    if (supplierInvoices.length === 0) {
      return <p className={styles.noData}>No invoices found for this supplier.</p>;
    }

    return (
      <div className={styles.transactionsList}>
        <h4>Invoices</h4>
        <div className={styles.transactionsTable}>
          {supplierInvoices.map((invoice) => (
            <div key={invoice.id} className={styles.transactionRow}>
              <div className={styles.transactionType}>Invoice</div>
              <div className={styles.transactionDate}>{invoice.billDate ?? '—'}</div>
              <div className={styles.transactionAmount}>
                {invoice.totalAmount
                  ? currencyFormatter.format(Number(String(invoice.totalAmount).replace(/,/g, '')))
                  : '—'}
              </div>
              <div className={styles.transactionDetails}>
                Invoice #{invoice.id}{invoice.taxed ? ' (Taxed)' : ''}
              </div>
              <div className={styles.transactionActions}>
                <button
                  type="button"
                  className={styles.navButton}
                  onClick={() => navigate('/billing', { state: { invoiceId: invoice.id } })}
                >
                  <ExternalLink size={14} />
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function SupplierPayments({ supplierName }: { supplierName: string }) {
    const supplierPaymentsCheck = paymentsCheck.filter(
      (payment) => payment.collectorName === supplierName,
    );
    const supplierPaymentsCreditCard = paymentsCreditCard.filter(
      (payment) => payment.collectorName === supplierName,
    );
    const supplierPaymentsCash = paymentsCash.filter(
      (payment) => payment.collectorName === supplierName,
    );

    const allPayments = [
      ...supplierPaymentsCheck.map((payment) => ({
        type: 'Payment (Check)',
        date: payment.checkDate ?? '—',
        amount: payment.amount ?? '—',
        details: payment.notes ?? '—',
        paymentId: payment.id,
        paymentType: 'check' as const,
      })),
      ...supplierPaymentsCreditCard.map((payment) => ({
        type: 'Payment (Credit Card)',
        date: payment.transactionDate ?? '—',
        amount: payment.amount ?? '—',
        details: payment.notes ?? '—',
        paymentId: payment.id,
        paymentType: 'credit-card' as const,
      })),
      ...supplierPaymentsCash.map((payment) => ({
        type: 'Payment (Cash)',
        date: payment.transactionDate ?? '—',
        amount: payment.amount ?? '—',
        details: payment.notes ?? '—',
        paymentId: payment.id,
        paymentType: 'cash' as const,
      })),
    ].sort((a, b) => {
      if (a.date === '—' && b.date === '—') return 0;
      if (a.date === '—') return 1;
      if (b.date === '—') return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    if (allPayments.length === 0) {
      return <p className={styles.noData}>No payments found for this supplier.</p>;
    }

    return (
      <div className={styles.transactionsList}>
        <h4>Payments</h4>
        <div className={styles.transactionsTable}>
          {allPayments.map((payment, index) => (
            <div key={index} className={styles.transactionRow}>
              <div className={styles.transactionType}>{payment.type}</div>
              <div className={styles.transactionDate}>{payment.date}</div>
              <div className={styles.transactionAmount}>
                {payment.amount !== '—'
                  ? currencyFormatter.format(Number(String(payment.amount).replace(/,/g, '')))
                  : '—'}
              </div>
              <div className={styles.transactionDetails}>{payment.details}</div>
              <div className={styles.transactionActions}>
                <button
                  type="button"
                  className={styles.navButton}
                  onClick={() =>
                    navigate('/collections', {
                      state: {
                        paymentId: payment.paymentId,
                        paymentType: payment.paymentType,
                        viewMode: 'payments',
                      },
                    })
                  }
                >
                  <ExternalLink size={14} />
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function SupplierDetails({ supplier }: { supplier?: SupplierWithRelations }) {
    if (!supplier) {
      return <p className={styles.noData}>Supplier details unavailable.</p>;
    }

    return (
      <div className={styles.detailsGrid}>
        <section>
          <h4>Contacts</h4>
          {supplier.contacts?.length ? (
            <ul className={styles.detailList}>
              {supplier.contacts.map((contact) => (
                <li key={contact.id ?? contact.email}>
                  <strong>{contact.name}</strong> · {contact.role} · {contact.email} ·{' '}
                  {contact.phoneNumber}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.noData}>No contacts registered.</p>
          )}
        </section>
        <section>
          <h4>Supplies</h4>
          {supplier.supplies?.length ? (
            <ul className={styles.detailList}>
              {supplier.supplies.map((supply) => (
                <li key={supply.id ?? `${supply.productName}-${supply.type}`}>
                  <strong>{supply.productName}</strong> • {supply.type} • Qty: {supply.quantity} •{' '}
                  Price: {currencyFormatter.format(Number(supply.price ?? 0))}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.noData}>No supplies recorded.</p>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Tedarikçiler &amp; Malzemeler</h1>
          <p>Tedarikçileri takip edin, malzemeleri kaydedin ve faaliyetleri inceleyin.</p>
        </div>
        <div className={styles.cardToggle}>
          <span className={clsx(styles.toggleLabel, viewMode === 'suppliers' && styles.activeToggleLabel)}>
            Suppliers
          </span>
          <button
            type="button"
            className={clsx(styles.toggleSwitch, viewMode === 'supplies' && styles.toggleSwitchActive)}
            aria-label="Toggle view mode"
            onClick={() => setViewMode((prev) => (prev === 'suppliers' ? 'supplies' : 'suppliers'))}
          >
            <span className={styles.toggleThumb} />
          </button>
          <span className={clsx(styles.toggleLabel, viewMode === 'supplies' && styles.activeToggleLabel)}>
            Supplies
          </span>
        </div>
      </header>

      {viewMode === 'suppliers' && (
      <section className={styles.cards}>
        <h2 className={styles.sectionTitle}>Summary</h2>
        {supplierCards.length ? (
          <div className={styles.cardCarousel}>
            <button
              type="button"
              className={styles.cardArrow}
              aria-label="Previous supplier"
              onClick={() => setCardIndex((prev) => Math.max(0, prev - 1))}
              disabled={cardIndex === 0}
            >
              <ChevronLeft size={20} />
            </button>
            <div className={styles.cardWrapper}>
              {supplierCards[cardIndex] && (
                <div className={clsx(styles.supplierCard, expandedCardId === supplierCards[cardIndex].id && styles.supplierCardExpanded)}>
                  <header>
                    <div>
                      <h3>{supplierCards[cardIndex].title}</h3>
                      {supplierCards[cardIndex].subtitle && (
                        <span className={styles.cardSubtitle}>{supplierCards[cardIndex].subtitle}</span>
                      )}
                    </div>
                  </header>
                  <div className={styles.supplierCardMetrics}>
                    {supplierCards[cardIndex].metrics.map((metric) => (
                      <div key={`${supplierCards[cardIndex].id}-${metric.label}`}>
                        <span>{metric.label}</span>
                        <span className={styles.metricValue}>{metric.value}</span>
                      </div>
                    ))}
                  </div>
                  {expandedCardId === supplierCards[cardIndex].id && (
                    <div className={styles.expandedContent}>
                      <Tabs
                        tabs={[
                          { id: 'invoices', label: 'Invoices' },
                          { id: 'payments', label: 'Payments' },
                          { id: 'details', label: 'Details' },
                        ]}
                        active={supplierTab}
                        onChange={(tab) => setSupplierTab(tab as 'invoices' | 'payments' | 'details')}
                      >
                        {supplierTab === 'invoices' ? (
                          <SupplierInvoices supplierName={supplierCards[cardIndex].title} />
                        ) : supplierTab === 'payments' ? (
                          <SupplierPayments supplierName={supplierCards[cardIndex].title} />
                        ) : (
                          <SupplierDetails
                            supplier={suppliers.find(
                              (supplier) => supplier.id === supplierCards[cardIndex].id,
                            )}
                          />
                        )}
                      </Tabs>
                    </div>
                  )}
                  <button
                    type="button"
                    className={styles.expandButton}
                    onClick={() => {
                      const newExpandedId =
                        expandedCardId === supplierCards[cardIndex].id
                          ? null
                          : supplierCards[cardIndex].id;
                      setExpandedCardId(newExpandedId);
                      if (newExpandedId) {
                        setSupplierTab('invoices');
                      }
                    }}
                    aria-label={expandedCardId === supplierCards[cardIndex].id ? 'Collapse' : 'Expand'}
                  >
                    {expandedCardId === supplierCards[cardIndex].id ? (
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
              aria-label="Next supplier"
              onClick={() => setCardIndex((prev) => Math.min(supplierCards.length - 1, prev + 1))}
              disabled={cardIndex >= supplierCards.length - 1}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        ) : (
          <p>No suppliers available.</p>
        )}
      </section>
      )}

      {viewMode === 'suppliers' ? (
        <>
          <FilterBar
            actions={
              <button type="button" onClick={() => openForm()}>
                New Supplier
              </button>
            }
          >
            <input
              placeholder="Filter by supplier name…"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
          </FilterBar>
          <DataTable
            columns={[
              { key: 'name', header: 'Tedarikçi' },
              {
                key: 'balance',
                header: 'Bakiye',
                render: (supplier) => <span>₺{supplier.balance}</span>,
              },
              {
                key: 'createdAt',
                header: 'Kayıt Tarihi',
                render: (supplier) =>
                  supplier.createdAt
                    ? new Date(supplier.createdAt).toLocaleDateString()
                    : '—',
              },
              {
                key: 'actions',
                header: 'İşlemler',
                render: (supplier) => (
                  <div className={styles.actions}>
                    <button type="button" onClick={() => openDetails(supplier)}>
                      Detayları Gör
                    </button>
                    <button type="button" onClick={() => openForm(supplier)}>
                      Düzenle
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(supplier)}
                      className={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </div>
                ),
              },
            ]}
            data={filteredSuppliers}
          />
        </>
      ) : (
        <>
          <FilterBar
            actions={
              <button type="button" onClick={openSupplyForm}>
                New Supply
              </button>
            }
          >
            <input
              placeholder="Filter by product or supplier…"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
          </FilterBar>
          <DataTable
            columns={[
              { key: 'supplier', header: 'Supplier', render: (row) => row.name },
              { key: 'type', header: 'Type', render: (row) => row.type ?? '—' },
              { key: 'productName', header: 'Product', render: (row) => row.productName ?? '—' },
              { key: 'quantity', header: 'Qty', render: (row) => row.quantity ?? '—' },
              { key: 'price', header: 'Unit Price', render: (row) => `₺${row.price ?? '0.00'}` },
            ]}
            data={suppliers
              .flatMap((s) =>
                (s.supplies ?? []).map((sup) => ({
                  ...sup,
                  name: s.name,
                })),
              )
              .filter((r) => {
                const q = filter.toLowerCase();
                return (
                  r.name.toLowerCase().includes(q) ||
                  (r.productName ?? '').toLowerCase().includes(q) ||
                  (r.type ?? '').toLowerCase().includes(q)
                );
              })}
          />
        </>
      )}

      <Modal
        title={selectedSupplier?.id ? 'Edit Supplier' : 'Add Supplier'}
        open={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setSelectedSupplier(null);
        }}
        width="lg"
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          <section>
            <h3>Profile</h3>
            <label>
              <span>Name</span>
              <input name="name" defaultValue={selectedSupplier?.name ?? ''} required />
            </label>
            <label>
              <span>Balance</span>
              <input
                name="balance"
                type="number"
                step="0.01"
                defaultValue={selectedSupplier?.balance ?? ''}
              />
            </label>
          </section>

          <section>
            <h3>Primary Contact</h3>
            <div className={styles.grid}>
              <label>
                <span>Name</span>
                <input
                  name="contactName"
                  defaultValue={selectedSupplier?.contacts?.[0]?.name ?? ''}
                />
              </label>
              <label>
                <span>Role</span>
                <input
                  name="contactRole"
                  defaultValue={selectedSupplier?.contacts?.[0]?.role ?? ''}
                />
              </label>
            </div>
            <div className={styles.grid}>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  name="contactEmail"
                  defaultValue={selectedSupplier?.contacts?.[0]?.email ?? ''}
                />
              </label>
              <label>
                <span>Phone</span>
                <input
                  name="contactPhone"
                  defaultValue={selectedSupplier?.contacts?.[0]?.phoneNumber ?? ''}
                />
              </label>
            </div>
          </section>

          <section>
            <h3>Supply</h3>
            <div className={styles.grid}>
              <label>
                <span>Type</span>
                <input
                  name="supplyType"
                  defaultValue={selectedSupplier?.supplies?.[0]?.type ?? ''}
                />
              </label>
              <label>
                <span>Product Name</span>
                <input
                  name="productName"
                  defaultValue={selectedSupplier?.supplies?.[0]?.productName ?? ''}
                />
              </label>
            </div>
            <div className={styles.grid}>
              <label>
                <span>Quantity</span>
                <input
                  name="quantity"
                  type="number"
                  defaultValue={selectedSupplier?.supplies?.[0]?.quantity ?? 0}
                />
              </label>
              <label>
                <span>Unit Price</span>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  defaultValue={selectedSupplier?.supplies?.[0]?.price ?? ''}
                />
              </label>
            </div>
          </section>

          <footer className={styles.footer}>
            <button type="button" onClick={() => setFormModalOpen(false)}>
              Cancel
            </button>
            <button type="submit">Save Supplier</button>
          </footer>
        </form>
      </Modal>

      <Modal
        title="Add Supply"
        open={supplyModalOpen}
        onClose={() => setSupplyModalOpen(false)}
      >
        <form
          className={styles.form}
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const supplierId = formData.get('supplierId') as string;
            const payload = {
              type: formData.get('type') as string,
              productName: formData.get('productName') as string,
              quantity: String(formData.get('quantity') ?? '0'),
              price: String(formData.get('price') ?? '0'),
            };
            const created = await apiPost<typeof payload, unknown>(`/suppliers/${supplierId}/supplies`, payload);
            if (created !== null) {
              // Refresh suppliers
              const data = await apiGet<SupplierWithRelations[]>('/suppliers', initialSuppliers);
              setSuppliers(data.map((s) => ({ ...s, contacts: s.contacts ?? [], supplies: s.supplies ?? [] })));
              setSupplyModalOpen(false);
            } else {
              alert('Failed to create supply.');
            }
          }}
        >
          <label>
            <span>Supplier</span>
            <select name="supplierId" required defaultValue="">
              <option value="" disabled>Select Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <div className={styles.grid}>
            <label>
              <span>Type</span>
              <input name="type" required />
            </label>
            <label>
              <span>Product Name</span>
              <input name="productName" required />
            </label>
          </div>
          <div className={styles.grid}>
            <label>
              <span>Quantity</span>
              <input name="quantity" type="number" min={0} defaultValue={0} />
            </label>
            <label>
              <span>Unit Price</span>
              <input name="price" type="number" step="0.01" defaultValue="0.00" />
            </label>
          </div>
          <footer className={styles.footer}>
            <button type="button" onClick={() => setSupplyModalOpen(false)}>Cancel</button>
            <button type="submit">Save Supply</button>
          </footer>
        </form>
      </Modal>

      <Modal
        title="Supplier Details"
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        width="lg"
      >
        {selectedSupplier && (
          <div className={styles.details}>
            <section>
              <h3>Contact Persons</h3>
              {selectedSupplier.contacts?.length ? (
                <ul>
                  {selectedSupplier.contacts.map((contact) => (
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

            <section>
              <h3>Supplies</h3>
              {selectedSupplier.supplies?.length ? (
                <ul>
                  {selectedSupplier.supplies.map((supply) => (
                    <li key={supply.id}>
                      <strong>{supply.productName}</strong> · {supply.type} · Qty:{' '}
                      {supply.quantity} · ₺{supply.price}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No supplies registered.</p>
              )}
            </section>
          </div>
        )}
      </Modal>
    </div>
  );
}

