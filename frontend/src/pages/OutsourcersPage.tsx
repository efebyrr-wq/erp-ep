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
  mockInvoices,
  mockPaymentCheck,
  mockPaymentCreditCard,
  mockPaymentsCash,
} from '../lib/mockData';
import type {
  Outsourcer,
  OutsourcerContact,
  Invoice,
  PaymentCheck,
  PaymentCreditCard,
  PaymentsCash,
} from '../types';
import styles from './SuppliersPage.module.css';

type OutsourcerWithRelations = Outsourcer & {
  contacts: OutsourcerContact[];
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

const emptyOutsourcer: OutsourcerWithRelations = {
  id: '',
  name: '',
  balance: '0.00',
  contacts: [],
};

const initialOutsourcers: OutsourcerWithRelations[] = [];

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

export default function OutsourcersPage() {
  const navigate = useNavigate();
  const [outsourcers, setOutsourcers] = useState<OutsourcerWithRelations[]>(initialOutsourcers);
  const [filter, setFilter] = useState('');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedOutsourcer, setSelectedOutsourcer] = useState<OutsourcerWithRelations | null>(
    null,
  );
  const [cardIndex, setCardIndex] = useState(0);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [outsourcerTab, setOutsourcerTab] = useState<'invoices' | 'payments' | 'details'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [paymentsCheck, setPaymentsCheck] = useState<PaymentCheck[]>(mockPaymentCheck);
  const [paymentsCreditCard, setPaymentsCreditCard] =
    useState<PaymentCreditCard[]>(mockPaymentCreditCard);
  const [paymentsCash, setPaymentsCash] = useState<PaymentsCash[]>(mockPaymentsCash);

  useEffect(() => {
    void apiGet<OutsourcerWithRelations[]>('/outsourcers', initialOutsourcers).then((data) => {
      setOutsourcers(
        data.map((outsourcer) => ({
          ...outsourcer,
          contacts: outsourcer.contacts ?? [],
        })),
      );
    });
    void apiGet<Invoice[]>('/invoices', mockInvoices).then((data) => setInvoices(data));
    void apiGet<PaymentCheck[]>('/payments/check', mockPaymentCheck).then((data) =>
      setPaymentsCheck(data),
    );
    void apiGet<PaymentCreditCard[]>('/payments/credit-card', mockPaymentCreditCard).then((data) =>
      setPaymentsCreditCard(data),
    );
    void apiGet<PaymentsCash[]>('/payments/cash', mockPaymentsCash).then((data) =>
      setPaymentsCash(data),
    );
  }, []);

  const filteredOutsourcers = useMemo(() => {
    if (!filter) return outsourcers;
    return outsourcers.filter((outsourcer) =>
      outsourcer.name.toLowerCase().includes(filter.toLowerCase()),
    );
  }, [outsourcers, filter]);

  const outsourcerCards = useMemo<SummaryCard[]>(() => {
    const last30Threshold = new Date();
    last30Threshold.setDate(last30Threshold.getDate() - 30);

    return outsourcers.map((outsourcer) => {
      const outsourcerName = outsourcer.name;

      // Invoices count (last 30 days)
      const recentInvoices = invoices.filter((invoice) => {
        if (invoice.supplierOutsourcerName !== outsourcerName) return false;
        if (!invoice.billDate) return false;
        return new Date(invoice.billDate) >= last30Threshold;
      });
      const invoiceCount = recentInvoices.length;

      // Payments count (last 30 days)
      const paymentsCheckLast = paymentsCheck.filter((payment) => {
        if (payment.collectorName !== outsourcerName) return false;
        if (!payment.checkDate) return false;
        return new Date(payment.checkDate) >= last30Threshold;
      });
      const paymentsCreditCardLast = paymentsCreditCard.filter((payment) => {
        if (payment.collectorName !== outsourcerName) return false;
        if (!payment.transactionDate) return false;
        return new Date(payment.transactionDate) >= last30Threshold;
      });
      const paymentsCashLast = paymentsCash.filter((payment) => {
        if (payment.collectorName !== outsourcerName) return false;
        if (!payment.transactionDate) return false;
        return new Date(payment.transactionDate) >= last30Threshold;
      });
      const paymentCount =
        paymentsCheckLast.length + paymentsCreditCardLast.length + paymentsCashLast.length;

      return {
        id: outsourcer.id,
        title: outsourcer.name,
        subtitle: currencyFormatter.format(Number(outsourcer.balance ?? 0)),
        metrics: [
          { label: 'Invoices (30 days)', value: String(invoiceCount) },
          { label: 'Payments (30 days)', value: String(paymentCount) },
        ],
      };
    });
  }, [outsourcers, invoices, paymentsCheck, paymentsCreditCard, paymentsCash]);

  useEffect(() => {
    if (!outsourcerCards.length) {
      setCardIndex(0);
    } else if (cardIndex >= outsourcerCards.length) {
      setCardIndex(outsourcerCards.length - 1);
    }
  }, [cardIndex, outsourcerCards]);

  const openForm = (outsourcer?: OutsourcerWithRelations) => {
    setSelectedOutsourcer(outsourcer ?? emptyOutsourcer);
    setFormModalOpen(true);
  };

  const openDetails = (outsourcer: OutsourcerWithRelations) => {
    setSelectedOutsourcer(outsourcer);
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
      ].filter((contact) => contact.name),
    };

    if (selectedOutsourcer?.id) {
      // Update existing outsourcer
      const result = await apiPatch<typeof payload, OutsourcerWithRelations>(
        `/outsourcers/${selectedOutsourcer.id}`,
        payload,
      );

      if (result) {
        // Refresh outsourcers list to get updated data
        const data = await apiGet<OutsourcerWithRelations[]>('/outsourcers', initialOutsourcers);
        setOutsourcers(
          data.map((outsourcer) => ({
            ...outsourcer,
            contacts: outsourcer.contacts ?? [],
          })),
        );
        setFormModalOpen(false);
        setSelectedOutsourcer(null);
      } else {
        alert('Failed to update outsourcer.');
      }
    } else {
      // Create new outsourcer
      const result = await apiPost<typeof payload, OutsourcerWithRelations>(
        '/outsourcers',
        payload,
      );

      if (result) {
        // Refresh outsourcers list to get the new outsourcer with all relations
        const data = await apiGet<OutsourcerWithRelations[]>('/outsourcers', initialOutsourcers);
        setOutsourcers(
          data.map((outsourcer) => ({
            ...outsourcer,
            contacts: outsourcer.contacts ?? [],
          })),
        );
        setFormModalOpen(false);
        setSelectedOutsourcer(null);
      } else {
        alert('Failed to create outsourcer.');
      }
    }
  };

  const handleDelete = async (outsourcer: OutsourcerWithRelations) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete outsourcer "${outsourcer.name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    const result = await apiDelete(`/outsourcers/${outsourcer.id}`);
    if (result !== null) {
      // Refresh outsourcers list
      const data = await apiGet<OutsourcerWithRelations[]>('/outsourcers', initialOutsourcers);
      setOutsourcers(
        data.map((o) => ({
          ...o,
          contacts: o.contacts ?? [],
        })),
      );
      // Close any open modals if the deleted outsourcer was selected
      if (selectedOutsourcer?.id === outsourcer.id) {
        setFormModalOpen(false);
        setDetailsModalOpen(false);
        setSelectedOutsourcer(null);
      }
    } else {
      alert('Failed to delete outsourcer.');
    }
  };

  function OutsourcerInvoices({ outsourcerName }: { outsourcerName: string }) {
    const outsourcerInvoices = invoices
      .filter((invoice) => invoice.supplierOutsourcerName === outsourcerName)
      .sort((a, b) => {
        if (!a.billDate && !b.billDate) return 0;
        if (!a.billDate) return 1;
        if (!b.billDate) return -1;
        return new Date(b.billDate).getTime() - new Date(a.billDate).getTime();
      });

    if (outsourcerInvoices.length === 0) {
      return <p className={styles.noData}>No invoices found for this outsourcer.</p>;
    }

    return (
      <div className={styles.transactionsList}>
        <h4>Invoices</h4>
        <div className={styles.transactionsTable}>
          {outsourcerInvoices.map((invoice) => (
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

  function OutsourcerPayments({ outsourcerName }: { outsourcerName: string }) {
    const outsourcerPaymentsCheck = paymentsCheck.filter(
      (payment) => payment.collectorName === outsourcerName,
    );
    const outsourcerPaymentsCreditCard = paymentsCreditCard.filter(
      (payment) => payment.collectorName === outsourcerName,
    );
    const outsourcerPaymentsCash = paymentsCash.filter(
      (payment) => payment.collectorName === outsourcerName,
    );

    const allPayments = [
      ...outsourcerPaymentsCheck.map((payment) => ({
        type: 'Payment (Check)',
        date: payment.checkDate ?? '—',
        amount: payment.amount ?? '—',
        details: payment.notes ?? '—',
        paymentId: payment.id,
        paymentType: 'check' as const,
      })),
      ...outsourcerPaymentsCreditCard.map((payment) => ({
        type: 'Payment (Credit Card)',
        date: payment.transactionDate ?? '—',
        amount: payment.amount ?? '—',
        details: payment.notes ?? '—',
        paymentId: payment.id,
        paymentType: 'credit-card' as const,
      })),
      ...outsourcerPaymentsCash.map((payment) => ({
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
      return <p className={styles.noData}>No payments found for this outsourcer.</p>;
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

  function OutsourcerDetails({ outsourcer }: { outsourcer?: OutsourcerWithRelations }) {
    if (!outsourcer) {
      return <p className={styles.noData}>Outsourcer details unavailable.</p>;
    }

    return (
      <div className={styles.detailsGrid}>
        <section>
          <h4>Contacts</h4>
          {outsourcer.contacts?.length ? (
            <ul className={styles.detailList}>
              {outsourcer.contacts.map((contact) => (
                <li key={contact.id ?? contact.email ?? contact.name}>
                  <strong>{contact.name}</strong>
                  {contact.role && ` · ${contact.role}`}
                  {contact.email && ` · ${contact.email}`}
                  {contact.phoneNumber && ` · ${contact.phoneNumber}`}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.noData}>No contacts registered.</p>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Taşeronlar</h1>
          <p>Taşeronları takip edin ve faaliyetleri inceleyin.</p>
        </div>
      </header>

      <section className={styles.cards}>
        <h2 className={styles.sectionTitle}>Özet</h2>
        {outsourcerCards.length ? (
          <div className={styles.cardCarousel}>
            <button
              type="button"
              className={styles.cardArrow}
              aria-label="Previous outsourcer"
              onClick={() => setCardIndex((prev) => Math.max(0, prev - 1))}
              disabled={cardIndex === 0}
            >
              <ChevronLeft size={20} />
            </button>
            <div className={styles.cardWrapper}>
              {outsourcerCards[cardIndex] && (
                <div className={clsx(styles.supplierCard, expandedCardId === outsourcerCards[cardIndex].id && styles.supplierCardExpanded)}>
                  <header>
                    <div>
                      <h3>{outsourcerCards[cardIndex].title}</h3>
                      {outsourcerCards[cardIndex].subtitle && (
                        <span className={styles.cardSubtitle}>{outsourcerCards[cardIndex].subtitle}</span>
                      )}
                    </div>
                  </header>
                  <div className={styles.supplierCardMetrics}>
                    {outsourcerCards[cardIndex].metrics.map((metric) => (
                      <div key={`${outsourcerCards[cardIndex].id}-${metric.label}`}>
                        <span>{metric.label}</span>
                        <span className={styles.metricValue}>{metric.value}</span>
                      </div>
                    ))}
                  </div>
                  {expandedCardId === outsourcerCards[cardIndex].id && (
                    <div className={styles.expandedContent}>
                      <Tabs
                        tabs={[
                          { id: 'invoices', label: 'Invoices' },
                          { id: 'payments', label: 'Payments' },
                          { id: 'details', label: 'Details' },
                        ]}
                        active={outsourcerTab}
                        onChange={(tab) => setOutsourcerTab(tab as 'invoices' | 'payments' | 'details')}
                      >
                        {outsourcerTab === 'invoices' ? (
                          <OutsourcerInvoices outsourcerName={outsourcerCards[cardIndex].title} />
                        ) : outsourcerTab === 'payments' ? (
                          <OutsourcerPayments outsourcerName={outsourcerCards[cardIndex].title} />
                        ) : (
                          <OutsourcerDetails
                            outsourcer={outsourcers.find(
                              (outsourcer) => outsourcer.id === outsourcerCards[cardIndex].id,
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
                        expandedCardId === outsourcerCards[cardIndex].id
                          ? null
                          : outsourcerCards[cardIndex].id;
                      setExpandedCardId(newExpandedId);
                      if (newExpandedId) {
                        setOutsourcerTab('invoices');
                      }
                    }}
                    aria-label={expandedCardId === outsourcerCards[cardIndex].id ? 'Collapse' : 'Expand'}
                  >
                    {expandedCardId === outsourcerCards[cardIndex].id ? (
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
              aria-label="Next outsourcer"
              onClick={() => setCardIndex((prev) => Math.min(outsourcerCards.length - 1, prev + 1))}
              disabled={cardIndex >= outsourcerCards.length - 1}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        ) : (
          <p>No outsourcers available.</p>
        )}
      </section>

      <FilterBar
        actions={
          <button type="button" onClick={() => openForm()}>
            New Outsourcer
          </button>
        }
      >
        <input
          placeholder="Filter by outsourcer name…"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />
      </FilterBar>
      <DataTable
        columns={[
          { key: 'name', header: 'Taşeron' },
          {
            key: 'balance',
            header: 'Bakiye',
            render: (outsourcer) => <span>₺{outsourcer.balance}</span>,
          },
          {
            key: 'createdAt',
            header: 'Kayıt Tarihi',
            render: (outsourcer) =>
              outsourcer.createdAt
                ? new Date(outsourcer.createdAt).toLocaleDateString()
                : '—',
          },
          {
            key: 'actions',
            header: 'İşlemler',
            render: (outsourcer) => (
              <div className={styles.actions}>
                <button type="button" onClick={() => openDetails(outsourcer)}>
                  Detayları Gör
                </button>
                <button type="button" onClick={() => openForm(outsourcer)}>
                  Düzenle
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(outsourcer)}
                  className={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]}
        data={filteredOutsourcers}
      />

      <Modal
        title={selectedOutsourcer?.id ? 'Edit Outsourcer' : 'Add Outsourcer'}
        open={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setSelectedOutsourcer(null);
        }}
        width="lg"
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          <section>
            <h3>Profile</h3>
            <label>
              <span>Name</span>
              <input name="name" defaultValue={selectedOutsourcer?.name ?? ''} required />
            </label>
            <label>
              <span>Balance</span>
              <input
                name="balance"
                type="number"
                step="0.01"
                defaultValue={selectedOutsourcer?.balance ?? ''}
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
                  defaultValue={selectedOutsourcer?.contacts?.[0]?.name ?? ''}
                />
              </label>
              <label>
                <span>Role</span>
                <input
                  name="contactRole"
                  defaultValue={selectedOutsourcer?.contacts?.[0]?.role ?? ''}
                />
              </label>
            </div>
            <div className={styles.grid}>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  name="contactEmail"
                  defaultValue={selectedOutsourcer?.contacts?.[0]?.email ?? ''}
                />
              </label>
              <label>
                <span>Phone</span>
                <input
                  name="contactPhone"
                  defaultValue={selectedOutsourcer?.contacts?.[0]?.phoneNumber ?? ''}
                />
              </label>
            </div>
          </section>

          <footer className={styles.footer}>
            <button type="button" onClick={() => setFormModalOpen(false)}>
              Cancel
            </button>
            <button type="submit">Save Outsourcer</button>
          </footer>
        </form>
      </Modal>

      <Modal
        title="Outsourcer Details"
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        width="lg"
      >
        {selectedOutsourcer && (
          <div className={styles.details}>
            <section>
              <h3>Contact Persons</h3>
              {selectedOutsourcer.contacts?.length ? (
                <ul>
                  {selectedOutsourcer.contacts.map((contact) => (
                    <li key={contact.id}>
                      <strong>{contact.name}</strong>
                      {contact.role && ` · ${contact.role}`}
                      {contact.email && ` · ${contact.email}`}
                      {contact.phoneNumber && ` · ${contact.phoneNumber}`}
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
    </div>
  );
}






