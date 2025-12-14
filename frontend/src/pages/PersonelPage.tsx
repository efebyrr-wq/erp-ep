import { useEffect, useState, useMemo } from 'react';
import type { FormEvent } from 'react';
import { DataTable } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Drawer } from '../components/common/Drawer';
import { Tabs } from '../components/common/Tabs';
import { DateTimeInput } from '../components/common/DateTimeInput';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';
import { convertDDMMYYYYHHMMToISO, convertISOToDDMMYYYYHHMM } from '../lib/dateTimeUtils';
import type { Personel, PersonelPayment, Account, PersonelDetail } from '../types';
import styles from './PersonelPage.module.css';
import { Trash2 } from 'lucide-react';

export default function PersonelPage() {
  const [personel, setPersonel] = useState<Personel[]>([]);
  const [payments, setPayments] = useState<PersonelPayment[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeTab, setActiveTab] = useState<'personel' | 'payments'>('personel');
  const [personelModalOpen, setPersonelModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPersonel, setSelectedPersonel] = useState<Personel | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PersonelPayment | null>(null);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailsEditMode, setDetailsEditMode] = useState(false);
  const [editedDetails, setEditedDetails] = useState<Record<string, string>>({});
  const [showAddDetailForm, setShowAddDetailForm] = useState(false);
  const [newDetail, setNewDetail] = useState({ detailName: '', detailValue: '' });
  const [isAddingDetail, setIsAddingDetail] = useState(false);
  const [deletingDetailId, setDeletingDetailId] = useState<string | null>(null);
  const [personelForm, setPersonelForm] = useState({
    personelName: '',
    role: '',
    tcKimlik: '',
    birthDate: '',
    startDate: '',
    endDate: '',
  });
  const [paymentForm, setPaymentForm] = useState({
    personelName: '',
    paymentAccount: '',
    amount: '',
    date: '',
    notes: '',
  });

  const loadPersonel = async () => {
    const data = await apiGet<Personel[]>('/personel', []);
    setPersonel(data);
  };

  const loadPayments = async () => {
    const data = await apiGet<PersonelPayment[]>('/personel/payments', []);
    setPayments(data);
  };

  const loadAccounts = async () => {
    const data = await apiGet<Account[]>('/accounts', []);
    setAccounts(data);
  };

  useEffect(() => {
    void loadPersonel();
    void loadPayments();
    void loadAccounts();
  }, []);

  const openPersonelModal = (p?: Personel) => {
    setSelectedPersonel(p ?? null);
    if (p) {
      setPersonelForm({
        personelName: p.personelName ?? '',
        role: p.role ?? '',
        tcKimlik: p.tcKimlik ?? '',
        birthDate: p.birthDate ? convertISOToDDMMYYYYHHMM(p.birthDate) : '',
        startDate: p.startDate ? convertISOToDDMMYYYYHHMM(p.startDate) : '',
        endDate: p.endDate ? convertISOToDDMMYYYYHHMM(p.endDate) : '',
      });
    } else {
      setPersonelForm({
        personelName: '',
        role: '',
        tcKimlik: '',
        birthDate: '',
        startDate: '',
        endDate: '',
      });
    }
    setPersonelModalOpen(true);
  };

  const openPaymentModal = (payment?: PersonelPayment) => {
    setSelectedPayment(payment ?? null);
    if (payment) {
      setPaymentForm({
        personelName: payment.personelName ?? '',
        paymentAccount: payment.paymentAccount ?? '',
        amount: payment.amount ?? '',
        date: payment.date ? convertISOToDDMMYYYYHHMM(payment.date) : '',
        notes: payment.notes ?? '',
      });
    } else {
      setPaymentForm({
        personelName: '',
        paymentAccount: '',
        amount: '',
        date: '',
        notes: '',
      });
    }
    setPaymentModalOpen(true);
  };

  const handlePersonelSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const confirmed = window.confirm(
      selectedPersonel
        ? 'Are you sure you want to update this personel?'
        : 'Are you sure you want to create this personel?'
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        personelName: personelForm.personelName || undefined,
        startDate: personelForm.startDate ? convertDDMMYYYYHHMMToISO(personelForm.startDate) : undefined,
        endDate: personelForm.endDate ? convertDDMMYYYYHHMMToISO(personelForm.endDate) : undefined,
        tcKimlik: personelForm.tcKimlik || undefined,
        birthDate: personelForm.birthDate ? convertDDMMYYYYHHMMToISO(personelForm.birthDate) : undefined,
        role: personelForm.role || undefined,
      };

      if (selectedPersonel) {
        const updated = await apiPatch<typeof payload, Personel>(
          `/personel/${selectedPersonel.id}`,
          payload
        );
        if (updated) {
          await loadPersonel();
          setPersonelModalOpen(false);
        } else {
          alert('Failed to update personel. Please try again.');
        }
      } else {
        const created = await apiPost<typeof payload, Personel>('/personel', payload);
        if (created) {
          await loadPersonel();
          setPersonelModalOpen(false);
        } else {
          alert('Failed to create personel. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error saving personel:', error);
      alert('An error occurred while saving the personel.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const confirmed = window.confirm(
      selectedPayment
        ? 'Are you sure you want to update this payment?'
        : 'Are you sure you want to create this payment?'
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        personelName: paymentForm.personelName || undefined,
        paymentAccount: paymentForm.paymentAccount || undefined,
        amount: paymentForm.amount ? Number(paymentForm.amount) : undefined,
        date: paymentForm.date ? convertDDMMYYYYHHMMToISO(paymentForm.date) : undefined,
        notes: paymentForm.notes || undefined,
      };

      if (selectedPayment) {
        const updated = await apiPatch<typeof payload, PersonelPayment>(
          `/personel/payments/${selectedPayment.id}`,
          payload
        );
        if (updated) {
          await loadPayments();
          setPaymentModalOpen(false);
        } else {
          alert('Failed to update payment. Please try again.');
        }
      } else {
        const created = await apiPost<typeof payload, PersonelPayment>(
          '/personel/payments',
          payload
        );
        if (created) {
          await loadPayments();
          setPaymentModalOpen(false);
        } else {
          alert('Failed to create payment. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('An error occurred while saving the payment.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePersonel = async (p: Personel) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${p.personelName}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    try {
      const result = await apiDelete<{ message: string }>(`/personel/${p.id}`);
      if (result) {
        await loadPersonel();
      } else {
        alert('Failed to delete personel. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting personel:', error);
      alert('An error occurred while deleting the personel.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (payment: PersonelPayment) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this payment? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    try {
      const result = await apiDelete<{ message: string }>(`/personel/payments/${payment.id}`);
      if (result) {
        await loadPayments();
      } else {
        alert('Failed to delete payment. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('An error occurred while deleting the payment.');
    } finally {
      setLoading(false);
    }
  };

  // Get unique personel names for payment form dropdown
  const personelNames = Array.from(new Set(personel.map((p) => p.personelName)));

  // Group details by personel ID
  const detailsByPersonel = useMemo(() => {
    const grouped: Record<string, PersonelDetail[]> = {};
    personel.forEach((p) => {
      if (p.details) {
        grouped[p.id] = p.details;
      }
    });
    return grouped;
  }, [personel]);

  const openDetails = (p: Personel) => {
    setSelectedPersonel(p);
    setDetailsEditMode(false);
    setEditedDetails({});
    setDrawerOpen(true);
  };

  const beginEditDetails = () => {
    if (!selectedPersonel) return;
    const currentDetails = detailsByPersonel[selectedPersonel.id] ?? [];
    const initial: Record<string, string> = {};
    currentDetails.forEach((d) => {
      initial[d.id] = d.detailValue ?? '';
    });
    setEditedDetails(initial);
    setDetailsEditMode(true);
  };

  const cancelEditDetails = () => {
    setDetailsEditMode(false);
    setEditedDetails({});
    setShowAddDetailForm(false);
    setNewDetail({ detailName: '', detailValue: '' });
  };

  const saveDetails = async () => {
    if (!selectedPersonel) return;
    
    // Update existing details
    const updatePromises = Object.entries(editedDetails).map(async ([detailId, detailValue]) => {
      const detail = detailsByPersonel[selectedPersonel.id]?.find((d) => d.id === detailId);
      if (detail && detail.detailValue !== detailValue) {
        await apiPatch<{ detailValue?: string }, PersonelDetail>(
          `/personel/details/${detailId}`,
          { detailValue },
        );
      }
    });
    
    await Promise.all(updatePromises);
    await loadPersonel();
    setDetailsEditMode(false);
    setEditedDetails({});
  };

  const handleAddDetail = async () => {
    if (!selectedPersonel || !newDetail.detailName.trim() || !newDetail.detailValue.trim()) return;
    
    setIsAddingDetail(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/personel/details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newDetail, personelId: selectedPersonel.id }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to add detail:', errorText);
        alert(`Failed to add detail: ${errorText}`);
        return;
      }
      
      const result = await response.json();
      if (result) {
        await loadPersonel();
        setNewDetail({ detailName: '', detailValue: '' });
        setShowAddDetailForm(false);
      }
    } catch (error) {
      console.error('Error adding detail:', error);
      alert(`An error occurred while adding the detail: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAddingDetail(false);
    }
  };

  const handleDeleteDetail = async (detailId: string) => {
    if (!detailId || deletingDetailId) return;
    const confirmed = window.confirm('Are you sure you want to delete this detail?');
    if (!confirmed) return;

    setDeletingDetailId(detailId);
    try {
      const result = await apiDelete<{ message: string }>(`/personel/details/${detailId}`);
      if (result !== null) {
        await loadPersonel();
      } else {
        alert('Failed to delete detail. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting detail:', error);
      alert('An error occurred while deleting the detail.');
    } finally {
      setDeletingDetailId(null);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Personel</h1>
          <p>Personel kayıtlarını ve ödeme geçmişini yönetin.</p>
        </div>
        <button
          type="button"
          onClick={() => (activeTab === 'personel' ? openPersonelModal() : openPaymentModal())}
        >
          + {activeTab === 'personel' ? 'Personel Ekle' : 'Ödeme Ekle'}
        </button>
      </header>

      <Tabs
        tabs={[
          { id: 'personel', label: 'Personel' },
          { id: 'payments', label: 'Ödemeler' },
        ]}
        active={activeTab}
        onChange={(id) => setActiveTab(id as typeof activeTab)}
      >
        {activeTab === 'personel' && (
          <DataTable
            columns={[
              { key: 'personelName', header: 'Ad' },
              { key: 'role', header: 'Rol' },
              { key: 'tcKimlik', header: 'TC Kimlik' },
              { key: 'startDate', header: 'Başlangıç Tarihi' },
              { key: 'endDate', header: 'Bitiş Tarihi' },
              {
                key: 'actions',
                header: 'İşlemler',
                render: (p) => (
                  <div className={styles.actions}>
                    <button type="button" onClick={() => openDetails(p)}>
                      View Details
                    </button>
                    <button type="button" onClick={() => openPersonelModal(p)}>
                      Düzenle
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePersonel(p)}
                      disabled={loading}
                    >
                      Sil
                    </button>
                  </div>
                ),
              },
            ]}
            data={personel}
          />
        )}

        {activeTab === 'payments' && (
          <DataTable
            columns={[
              { key: 'personelName', header: 'Personel Adı' },
              { key: 'paymentAccount', header: 'Ödeme Hesabı' },
              {
                key: 'amount',
                header: 'Tutar',
                render: (payment) => (
                  <span className={styles.greenAmount}>
                    ₺{payment.amount ?? '0.00'}
                  </span>
                ),
              },
              { key: 'date', header: 'Tarih' },
              { key: 'notes', header: 'Notlar' },
              {
                key: 'actions',
                header: 'İşlemler',
                render: (payment) => (
                  <div className={styles.actions}>
                    <button type="button" onClick={() => openPaymentModal(payment)}>
                      Düzenle
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePayment(payment)}
                      disabled={loading}
                    >
                      Sil
                    </button>
                  </div>
                ),
              },
            ]}
            data={payments}
          />
        )}
      </Tabs>

      {/* Personel Modal */}
      <Modal
        title={selectedPersonel ? 'Personel Düzenle' : 'Personel Ekle'}
        open={personelModalOpen}
        onClose={() => setPersonelModalOpen(false)}
      >
        <form className={styles.form} onSubmit={handlePersonelSubmit}>
          <label>
            <span>Personel Adı</span>
            <input
              value={personelForm.personelName}
              onChange={(e) => setPersonelForm(prev => ({ ...prev, personelName: e.target.value }))}
              required
            />
          </label>
          <label>
            <span>Rol</span>
            <input
              value={personelForm.role}
              onChange={(e) => setPersonelForm(prev => ({ ...prev, role: e.target.value }))}
            />
          </label>
          <label>
            <span>TC Kimlik</span>
            <input
              value={personelForm.tcKimlik}
              onChange={(e) => setPersonelForm(prev => ({ ...prev, tcKimlik: e.target.value }))}
            />
          </label>
          <label>
            <span>Birth Date</span>
            <DateTimeInput
              value={personelForm.birthDate}
              onChange={(value) => setPersonelForm(prev => ({ ...prev, birthDate: value }))}
            />
          </label>
          <label>
            <span>Başlangıç Tarihi</span>
            <DateTimeInput
              value={personelForm.startDate}
              onChange={(value) => setPersonelForm(prev => ({ ...prev, startDate: value }))}
            />
          </label>
          <label>
            <span>Bitiş Tarihi (Hala çalışıyorsa boş bırakın)</span>
            <DateTimeInput
              value={personelForm.endDate}
              onChange={(value) => setPersonelForm(prev => ({ ...prev, endDate: value }))}
              placeholder="Only fill when personel leaves"
            />
          </label>
          <footer className={styles.footer}>
            <button type="button" onClick={() => setPersonelModalOpen(false)} disabled={loading}>
              İptal
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </footer>
        </form>
      </Modal>

      {/* Payment Modal */}
      <Modal
        title={selectedPayment ? 'Ödeme Düzenle' : 'Ödeme Ekle'}
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
      >
        <form className={styles.form} onSubmit={handlePaymentSubmit}>
          <label>
            <span>Personel Adı</span>
            <select
              value={paymentForm.personelName}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, personelName: e.target.value }))}
              required
            >
              <option value="" disabled>
                Select personel
              </option>
              {personelNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Ödeme Hesabı</span>
            <select
              value={paymentForm.paymentAccount}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentAccount: e.target.value }))}
            >
              <option value="">Select account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.accountName ?? ''}>
                  {account.accountName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Amount</span>
            <input
              type="number"
              step="0.01"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
            />
          </label>
          <label>
            <span>Date</span>
            <DateTimeInput
              value={paymentForm.date}
              onChange={(value) => setPaymentForm(prev => ({ ...prev, date: value }))}
            />
          </label>
          <label>
            <span>Notes</span>
            <textarea
              rows={3}
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </label>
          <footer className={styles.footer}>
            <button type="button" onClick={() => setPaymentModalOpen(false)} disabled={loading}>
              İptal
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </footer>
        </form>
      </Modal>

      <Drawer
        title={`Detaylar — ${selectedPersonel?.personelName ?? ''}`}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width="lg"
      >
        {selectedPersonel ? (
          <div className={styles.details}>
            <div className={styles.personelLabel}>
              <span className={styles.personelName}>Ad: {selectedPersonel.personelName}</span>
              {selectedPersonel.role && (
                <span className={styles.personelRole}>Rol: {selectedPersonel.role}</span>
              )}
            </div>
            <div className={styles.detailsSection}>
              <div className={styles.detailsHeader}>
                  <h3 style={{ margin: 0 }}>Detaylar</h3>
                {!detailsEditMode ? (
                  <button type="button" className={styles.editDetailsBtn} onClick={beginEditDetails}>
                    Detayları Düzenle
                  </button>
                ) : (
                  <div className={styles.detailActionBar}>
                    <button type="button" className={styles.cancelBtn} onClick={cancelEditDetails}>
                      İptal
                    </button>
                    <button type="button" className={styles.addDetailBtn} onClick={() => setShowAddDetailForm(true)}>
                      Add Detail
                    </button>
                    <button type="button" className={styles.saveBtn} onClick={saveDetails}>
                      Kaydet
                    </button>
                  </div>
                )}
              </div>
              {(!detailsByPersonel[selectedPersonel.id] || detailsByPersonel[selectedPersonel.id].length === 0) && (
                <p>Henüz detay kaydedilmedi.</p>
              )}
              {(detailsByPersonel[selectedPersonel.id] ?? []).map((detail) => (
                <div key={detail.id} className={styles.detailRow}>
                  <div className={styles.detailContent}>
                    <span className={styles.detailName}>{detail.detailName}</span>
                    {!detailsEditMode ? (
                      <strong className={styles.detailValue}>{detail.detailValue}</strong>
                    ) : (
                      <input
                        className={styles.detailInput}
                        value={editedDetails[detail.id] ?? detail.detailValue ?? ''}
                        onChange={(e) =>
                          setEditedDetails((prev) => ({ ...prev, [detail.id]: e.target.value }))
                        }
                      />
                    )}
                  </div>
                  {detailsEditMode && (
                    <button
                      type="button"
                      className={styles.deleteDetailBtn}
                      onClick={() => handleDeleteDetail(detail.id)}
                      disabled={deletingDetailId === detail.id}
                      title="Delete detail"
                      aria-label="Delete detail"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
              {detailsEditMode && showAddDetailForm && (
                <div className={styles.addDetailForm}>
                  <div className={styles.detailRow}>
                    <input
                      type="text"
                      placeholder="Detay Adı"
                      value={newDetail.detailName}
                      onChange={(e) => setNewDetail((prev) => ({ ...prev, detailName: e.target.value }))}
                      className={styles.detailInput}
                    />
                    <input
                      type="text"
                      placeholder="Detay Değeri"
                      value={newDetail.detailValue}
                      onChange={(e) => setNewDetail((prev) => ({ ...prev, detailValue: e.target.value }))}
                      className={styles.detailInput}
                    />
                    <div className={styles.addDetailActions}>
                      <button
                        type="button"
                        className={styles.addDetailSubmitBtn}
                        onClick={handleAddDetail}
                        disabled={isAddingDetail || !newDetail.detailName.trim() || !newDetail.detailValue.trim()}
                      >
                        {isAddingDetail ? 'Ekleniyor...' : 'Ekle'}
                      </button>
                      <button
                        type="button"
                        className={styles.addDetailCancelBtn}
                        onClick={() => {
                          setShowAddDetailForm(false);
                          setNewDetail({ detailName: '', detailValue: '' });
                        }}
                        disabled={isAddingDetail}
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p>Detayları görmek için bir personel seçin.</p>
        )}
      </Drawer>
    </div>
  );
}

