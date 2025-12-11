import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../lib/api';
import type { Bill, Invoice, PersonelPayment, TaxPayment, Account } from '../types';
import { Modal } from '../components/common/Modal';
import { ChevronDown, Settings } from 'lucide-react';
import styles from './TaxCalculationPage.module.css';

export default function TaxCalculationPage() {
  const [sgkAmount, setSgkAmount] = useState<number>(0);
  const [kurumlarVergisiAmount, setKurumlarVergisiAmount] = useState<number>(0);
  const [kdvAmount, setKdvAmount] = useState<number>(0);

  // Settings states (KDV başlangıç tutarı ve amortisman)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [kdvBaslangicTutari, setKdvBaslangicTutari] = useState<string>('0');
  const [amortismanTutari, setAmortismanTutari] = useState<string>('0');

  // Tax-related income and expenses
  const [taxedBills, setTaxedBills] = useState<Bill[]>([]);
  const [taxedInvoices, setTaxedInvoices] = useState<Invoice[]>([]);
  const [taxedPersonelPayments, setTaxedPersonelPayments] = useState<PersonelPayment[]>([]);

  // Payment states
  const [sgkPayments, setSgkPayments] = useState<TaxPayment[]>([]);
  const [kurumlarPayments, setKurumlarPayments] = useState<TaxPayment[]>([]);
  const [kdvPayments, setKdvPayments] = useState<TaxPayment[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Expanded states
  const [sgkExpanded, setSgkExpanded] = useState(false);
  const [kurumlarExpanded, setKurumlarExpanded] = useState(false);
  const [kdvExpanded, setKdvExpanded] = useState(false);

  // Payment modal states
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedTaxType, setSelectedTaxType] = useState<string>('');
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    accountId: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Calculate monthly tax amounts
    const calculateTaxes = async () => {
      try {
        // Get current month's data
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        // Fetch bills and invoices for current month
        const bills = await apiGet<Bill[]>('/billing', []);
        const invoices = await apiGet<Invoice[]>('/invoices', []);
        const personelPayments = await apiGet<PersonelPayment[]>('/personel/payments', []);

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

        // Store taxed items for display
        const taxedBillsList = currentMonthBills.filter((bill) => bill.taxed);
        const taxedInvoicesList = currentMonthInvoices.filter((invoice) => invoice.taxed);
        setTaxedBills(taxedBillsList);
        setTaxedInvoices(taxedInvoicesList);
        setTaxedPersonelPayments(currentMonthPersonelPayments);

        // Calculate SGK Primleri (Social Security Premiums)
        // Typically calculated from personnel payments (e.g., 15% of total payments)
        const totalPersonelPayments = currentMonthPersonelPayments.reduce((sum, payment) => {
          return sum + (parseFloat(payment.amount || '0') || 0);
        }, 0);
        const sgk = totalPersonelPayments * 0.15; // 15% of personnel payments
        setSgkAmount(sgk);

        // Calculate Kurumlar Vergisi (Corporate Tax)
        // Kurumlar Vergisi = (Kesilmiş vergili faturalar) - (Alınmış vergili faturalar) - (Personel giderleri) - (Amortisman giderleri)
        // Sadece taxed (vergili) faturalar dahil edilir
        
        // Kesilmiş vergili faturaların toplamı (bills - sadece taxed olanlar)
        const taxedBillsForKurumlar = currentMonthBills.filter((bill) => bill.taxed);
        const totalTaxedBills = taxedBillsForKurumlar.reduce((sum, bill) => {
          return sum + (parseFloat(bill.totalAmount || '0') || 0);
        }, 0);

        // Alınmış vergili faturaların toplamı (invoices - sadece taxed olanlar)
        const taxedInvoicesForKurumlar = currentMonthInvoices.filter((invoice) => invoice.taxed);
        const totalTaxedInvoices = taxedInvoicesForKurumlar.reduce((sum, invoice) => {
          return sum + (parseFloat(invoice.totalAmount || '0') || 0);
        }, 0);

        // Personel giderleri (personel payments toplamı)
        const totalPersonelGiderleri = currentMonthPersonelPayments.reduce((sum, payment) => {
          return sum + (parseFloat(payment.amount || '0') || 0);
        }, 0);

        // Amortisman giderleri (kullanıcıdan girilen değer)
        const amortismanGiderleri = parseFloat(amortismanTutari) || 0;

        // Kar = Kesilmiş vergili faturalar - Alınmış vergili faturalar - Personel giderleri - Amortisman giderleri
        const profit = totalTaxedBills - totalTaxedInvoices - totalPersonelGiderleri - amortismanGiderleri;
        
        // Kurumlar Vergisi = Kar'ın %20'si (negatif olamaz)
        const kurumlarVergisi = Math.max(0, profit * 0.20);
        setKurumlarVergisiAmount(kurumlarVergisi);

        // Calculate KDV (VAT)
        // Ödenmesi gereken KDV = Başlangıç KDV - (Satış faturalarındaki KDV - Alış faturalarındaki KDV)
        // Satış faturalarındaki KDV: taxed bills'lerin KDV'si (totalTaxedBills zaten hesaplandı)
        const salesKdv = totalTaxedBills * 0.20; // 20% VAT on taxed bills (satış faturalarındaki KDV)

        // Alış faturalarındaki KDV: taxed invoices'ların KDV'si (totalTaxedInvoices zaten hesaplandı)
        const purchaseKdv = totalTaxedInvoices * 0.20; // 20% VAT on taxed invoices (alış faturalarındaki KDV)

        // Ödenmesi gereken KDV = (Satış KDV - Alış KDV) - Başlangıç KDV
        // Başlangıç KDV devletten alınması gereken tutar, ödenmesi gereken KDV'den çıkarılır
        const odenmesiGerekenKdv = salesKdv - purchaseKdv;
        const baslangicKdv = parseFloat(kdvBaslangicTutari) || 0;
        const kdv = Math.max(0, odenmesiGerekenKdv - baslangicKdv);
        setKdvAmount(kdv);
      } catch (error) {
        console.error('Error calculating taxes:', error);
      }
    };

    void calculateTaxes();
  }, [kdvBaslangicTutari, amortismanTutari]);

  useEffect(() => {
    // Load tax payments
    const loadPayments = async () => {
      try {
        const [sgk, kurumlar, kdv] = await Promise.all([
          apiGet<TaxPayment[]>('/tax-payments?taxType=SGK Primleri', []),
          apiGet<TaxPayment[]>('/tax-payments?taxType=Kurumlar Vergisi', []),
          apiGet<TaxPayment[]>('/tax-payments?taxType=KDV', []),
        ]);
        setSgkPayments(sgk);
        setKurumlarPayments(kurumlar);
        setKdvPayments(kdv);
      } catch (error) {
        console.error('Error loading tax payments:', error);
      }
    };

    void loadPayments();
  }, []);

  useEffect(() => {
    // Load accounts (only bank and credit card)
    const loadAccounts = async () => {
      try {
        const allAccounts = await apiGet<Account[]>('/accounts', []);
        // Filter only bank accounts and credit cards
        const bankAndCreditCardAccounts = allAccounts.filter((account) => {
          const accountType = account.type?.toLowerCase() || '';
          return (
            accountType.includes('bank') ||
            accountType.includes('credit card') ||
            accountType === 'banka hesabı' ||
            accountType === 'kredi kartı'
          );
        });
        setAccounts(bankAndCreditCardAccounts);
      } catch (error) {
        console.error('Error loading accounts:', error);
      }
    };

    void loadAccounts();
  }, []);

  const openPaymentModal = (taxType: string) => {
    setSelectedTaxType(taxType);
    setPaymentForm({
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      accountId: '',
      notes: '',
    });
    setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        taxType: selectedTaxType,
        amount: paymentForm.amount,
        paymentDate: paymentForm.paymentDate,
        accountId: paymentForm.accountId,
        accountName: accounts.find((a) => a.id === paymentForm.accountId)?.accountName || null,
        notes: paymentForm.notes || null,
      };

      await apiPost<typeof payload, TaxPayment>('/tax-payments', payload);

      // Reload payments
      const [sgk, kurumlar, kdv] = await Promise.all([
        apiGet<TaxPayment[]>('/tax-payments?taxType=SGK Primleri', []),
        apiGet<TaxPayment[]>('/tax-payments?taxType=Kurumlar Vergisi', []),
        apiGet<TaxPayment[]>('/tax-payments?taxType=KDV', []),
      ]);
      setSgkPayments(sgk);
      setKurumlarPayments(kurumlar);
      setKdvPayments(kdv);

      // Reload accounts to get updated balances
      const allAccounts = await apiGet<Account[]>('/accounts', []);
      const bankAndCreditCardAccounts = allAccounts.filter((account) => {
        const accountType = account.type?.toLowerCase() || '';
        return (
          accountType.includes('bank') ||
          accountType.includes('credit card') ||
          accountType === 'banka hesabı' ||
          accountType === 'kredi kartı'
        );
      });
      setAccounts(bankAndCreditCardAccounts);

      setPaymentModalOpen(false);
    } catch (error) {
      console.error('Error creating tax payment:', error);
      alert('Ödeme kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPaid = (payments: TaxPayment[]): number => {
    return payments.reduce((sum, payment) => {
      return sum + (parseFloat(payment.amount || '0') || 0);
    }, 0);
  };

  const calculateRemaining = (total: number, paid: number): number => {
    return Math.max(0, total - paid);
  };

  const TaxCard = ({
    title,
    totalAmount,
    payments,
    expanded,
    onToggleExpand,
    onPayClick,
    cardClass,
  }: {
    title: string;
    totalAmount: number;
    payments: TaxPayment[];
    expanded: boolean;
    onToggleExpand: () => void;
    onPayClick: () => void;
    cardClass: string;
  }) => {
    const totalPaid = calculateTotalPaid(payments);
    const remaining = calculateRemaining(totalAmount, totalPaid);

    return (
      <div className={`${styles.taxCard} ${styles[cardClass]}`}>
        <div className={styles.taxCardHeader}>
          <h3 className={styles.taxCardTitle}>{title}</h3>
          <div className={styles.taxCardActions}>
            <button
              type="button"
              className={styles.payButton}
              onClick={onPayClick}
            >
              Öde
            </button>
            <button
              type="button"
              className={styles.expandButton}
              onClick={onToggleExpand}
              title={expanded ? 'Listeyi daralt' : 'Listeyi genişlet'}
            >
              <ChevronDown
                size={18}
                className={expanded ? styles.expandedIcon : ''}
              />
            </button>
          </div>
        </div>
        <div className={styles.taxCardAmount}>
          ₺{remaining.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <p className={styles.taxCardDescription}>Ödenmesi Gereken Tutar</p>
        {totalPaid > 0 && (
          <div className={styles.paidInfo}>
            <span className={styles.paidLabel}>Ödenen:</span>
            <span className={styles.paidAmount}>
              ₺{totalPaid.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* Expanded payments list */}
        {expanded && (
          <div className={styles.paymentsList}>
            {payments.length === 0 ? (
              <div className={styles.noPayments}>Henüz ödeme yapılmadı</div>
            ) : (
              payments.map((payment) => (
                <div key={payment.id} className={styles.paymentItem}>
                  <div className={styles.paymentRow}>
                    <span className={styles.paymentDate}>
                      {new Date(payment.paymentDate).toLocaleDateString('tr-TR')}
                    </span>
                    <span className={styles.paymentAmount}>
                      ₺{parseFloat(payment.amount || '0').toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  {payment.accountName && (
                    <div className={styles.paymentAccount}>
                      <span className={styles.accountLabel}>Hesap:</span>
                      <span className={styles.accountValue}>{payment.accountName}</span>
                    </div>
                  )}
                  {payment.notes && (
                    <div className={styles.paymentNotes}>{payment.notes}</div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  const handleSettingsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSettingsModalOpen(false);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Vergi Hesaplama</h1>
          <p>Vergi ile ilgili işlemleri hesaplayın ve yönetin.</p>
        </div>
        <button
          type="button"
          className={styles.settingsButton}
          onClick={() => setSettingsModalOpen(true)}
          title="KDV ve Amortisman Ayarları"
        >
          <Settings size={20} />
        </button>
      </header>
      <div className={styles.cardsContainer}>
        <TaxCard
          title="SGK Primleri"
          totalAmount={sgkAmount}
          payments={sgkPayments}
          expanded={sgkExpanded}
          onToggleExpand={() => setSgkExpanded(!sgkExpanded)}
          onPayClick={() => openPaymentModal('SGK Primleri')}
          cardClass="sgkCard"
        />
        <TaxCard
          title="Kurumlar Vergisi"
          totalAmount={kurumlarVergisiAmount}
          payments={kurumlarPayments}
          expanded={kurumlarExpanded}
          onToggleExpand={() => setKurumlarExpanded(!kurumlarExpanded)}
          onPayClick={() => openPaymentModal('Kurumlar Vergisi')}
          cardClass="kurumlarCard"
        />
        <TaxCard
          title="KDV"
          totalAmount={kdvAmount}
          payments={kdvPayments}
          expanded={kdvExpanded}
          onToggleExpand={() => setKdvExpanded(!kdvExpanded)}
          onPayClick={() => openPaymentModal('KDV')}
          cardClass="kdvCard"
        />
      </div>

      {/* Payment Modal */}
      <Modal
        title={`${selectedTaxType} Ödemesi`}
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
      >
        <form className={styles.paymentForm} onSubmit={handlePaymentSubmit}>
          <label>
            <span>Tutar</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
              required
              placeholder="0.00"
            />
          </label>
          <label>
            <span>Ödeme Tarihi</span>
            <input
              type="date"
              value={paymentForm.paymentDate}
              onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentDate: e.target.value }))}
              required
            />
          </label>
          <label>
            <span>Hesap</span>
            <select
              value={paymentForm.accountId}
              onChange={(e) => setPaymentForm((prev) => ({ ...prev, accountId: e.target.value }))}
              required
            >
              <option value="">Hesap Seç</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.accountName} ({account.type})
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Notlar</span>
            <textarea
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="İsteğe bağlı notlar..."
            />
          </label>
          <footer className={styles.formFooter}>
            <button type="button" onClick={() => setPaymentModalOpen(false)} disabled={loading}>
              İptal
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Ödemeyi Kaydet'}
            </button>
          </footer>
        </form>
      </Modal>

      {/* Settings Modal */}
      <Modal
        title="KDV ve Amortisman Ayarları"
        open={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      >
        <form className={styles.settingsForm} onSubmit={handleSettingsSubmit}>
          <label>
            <span>KDV Başlangıç Tutarı</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={kdvBaslangicTutari}
              onChange={(e) => setKdvBaslangicTutari(e.target.value)}
              placeholder="0.00"
            />
            <small>Başlangıçta elimizde olan KDV miktarı</small>
          </label>
          <label>
            <span>Amortisman Tutarı</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amortismanTutari}
              onChange={(e) => setAmortismanTutari(e.target.value)}
              placeholder="0.00"
            />
            <small>Bu ay için amortisman gideri</small>
          </label>
          <footer className={styles.formFooter}>
            <button type="button" onClick={() => setSettingsModalOpen(false)}>
              Kapat
            </button>
            <button type="submit">
              Kaydet
            </button>
          </footer>
        </form>
      </Modal>

      {/* Tax-related Income and Expenses Section */}
      <div className={styles.incomeExpensesSection}>
        <h2 className={styles.sectionTitle}>Vergiye Muhatap Gelir ve Giderler</h2>
        <div className={styles.incomeExpensesGrid}>
          {/* Income (Gelir) - Left Side */}
          <div className={styles.incomeColumn}>
            <h3 className={styles.columnTitle}>Gelirler</h3>
            <div className={styles.itemsList}>
              {taxedBills.length === 0 ? (
                <div className={styles.noItems}>Vergili satış faturası bulunamadı</div>
              ) : (
                taxedBills.map((bill) => (
                  <div key={bill.id} className={styles.itemCard}>
                    <div className={styles.itemHeader}>
                      <span className={styles.itemName}>{bill.customerName || 'Müşteri Adı Yok'}</span>
                      <span className={styles.itemAmount}>
                        ₺{parseFloat(bill.totalAmount || '0').toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className={styles.itemDate}>
                      {bill.billDate ? new Date(bill.billDate).toLocaleDateString('tr-TR') : 'Tarih Yok'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Expenses (Gider) - Right Side */}
          <div className={styles.expensesColumn}>
            <h3 className={styles.columnTitle}>Giderler</h3>
            <div className={styles.itemsList}>
              {/* Taxed Invoices */}
              {taxedInvoices.map((invoice) => (
                <div key={invoice.id} className={styles.itemCard}>
                  <div className={styles.itemHeader}>
                    <span className={styles.itemName}>
                      {invoice.supplierOutsourcerName || 'Tedarikçi/Dış Kaynak Adı Yok'}
                    </span>
                    <span className={styles.itemAmount}>
                      ₺{parseFloat(invoice.totalAmount || '0').toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className={styles.itemDate}>
                    {invoice.billDate ? new Date(invoice.billDate).toLocaleDateString('tr-TR') : 'Tarih Yok'}
                  </div>
                  <div className={styles.itemType}>Fatura</div>
                </div>
              ))}

              {/* Personnel Payments */}
              {taxedPersonelPayments.map((payment) => (
                <div key={payment.id} className={styles.itemCard}>
                  <div className={styles.itemHeader}>
                    <span className={styles.itemName}>
                      {payment.personelName || 'Personel Adı Yok'}
                    </span>
                    <span className={styles.itemAmount}>
                      ₺{parseFloat(payment.amount || '0').toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className={styles.itemDate}>
                    {payment.date ? new Date(payment.date).toLocaleDateString('tr-TR') : 'Tarih Yok'}
                  </div>
                  <div className={styles.itemType}>Personel Ödemesi</div>
                </div>
              ))}

              {/* Amortisman */}
              {parseFloat(amortismanTutari) > 0 && (
                <div className={styles.itemCard}>
                  <div className={styles.itemHeader}>
                    <span className={styles.itemName}>Amortisman</span>
                    <span className={styles.itemAmount}>
                      ₺{parseFloat(amortismanTutari).toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className={styles.itemType}>Amortisman Gideri</div>
                </div>
              )}

              {taxedInvoices.length === 0 && taxedPersonelPayments.length === 0 && parseFloat(amortismanTutari) === 0 && (
                <div className={styles.noItems}>Vergiye muhatap gider bulunamadı</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
