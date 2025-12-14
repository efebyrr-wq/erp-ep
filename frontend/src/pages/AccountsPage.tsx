import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { DataTable } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';
import { mockAccounts } from '../lib/mockData';
import type { Account } from '../types';
import styles from './AccountsPage.module.css';

const accountTypes = ['Banka Hesabı', 'Kredi Kartı', 'Vadesiz Hesap'];

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');

  const loadAccounts = async () => {
    console.log('[AccountsPage] 🔄 Loading accounts...');
    try {
      // Fetch with cache-busting to ensure fresh data
      const timestamp = Date.now();
      // Use the same API_BASE_URL logic as api.ts
      const apiBaseUrl = (() => {
        if (import.meta.env.VITE_API_BASE_URL) {
          return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
        }
        if (import.meta.env.MODE === 'production' && typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
          return 'https://d31tialuhzl449.cloudfront.net';
        }
        return 'http://localhost:3000';
      })();
      const response = await fetch(`${apiBaseUrl}/accounts?t=${timestamp}`, {
        cache: 'no-store', // Prevent browser caching
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      const data = (await response.json()) as Account[];
      console.log(`[AccountsPage] ✅ Loaded ${data.length} accounts`);
      console.log('[AccountsPage] 📊 Raw API response (first 3):', data.slice(0, 3));
      const balances = data.map(a => `${a.accountName}: ${a.balance}`);
      console.log('[AccountsPage] 💰 Account balances:', balances);
      
      // Verify IsBankası Checking Account specifically
      const isBankasi = data.find(a => a.accountName?.includes('IsBankası Checking'));
      if (isBankasi) {
        console.log(`[AccountsPage] 🔍 IsBankası Checking Account raw data:`, isBankasi);
        console.log(`[AccountsPage] 🔍 IsBankası Checking Account balance (raw):`, isBankasi.balance, typeof isBankasi.balance);
      }
      
      setAccounts(data);
      
      // Log specific accounts
      const garantiChecking = data.find(a => a.accountName?.includes('Garanti Checking'));
      if (garantiChecking) {
        console.log(`[AccountsPage] 🏦 Garanti Checking Account balance: ${garantiChecking.balance}`);
      }
      const isBankasiAccount = data.find(a => a.accountName?.includes('IsBankası Checking'));
      if (isBankasiAccount) {
        console.log(`[AccountsPage] 🏦 IsBankası Checking Account balance: ${isBankasiAccount.balance}`);
      }
    } catch (error) {
      console.error('[AccountsPage] ❌ Error loading accounts:', error);
    }
  };

  useEffect(() => {
    void loadAccounts();
  }, []);

  // Refresh accounts when page becomes visible (user navigates to this page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, refresh accounts
        void loadAccounts();
      }
    };

    const handleFocus = () => {
      // Window gained focus, refresh accounts
      void loadAccounts();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const openModal = (account?: Account) => {
    setSelectedAccount(account ?? null);
    setSelectedType(account?.type ?? '');
    setModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const confirmed = window.confirm(
      selectedAccount
        ? 'Are you sure you want to update this account?'
        : 'Are you sure you want to create this account?'
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData(event.currentTarget);
      const formCutoff = (formData.get('cutoffDay') as string) || '';
      const cutoffDayNum = formCutoff ? Number(formCutoff) : undefined;
      const payload = {
        accountName: (formData.get('name') as string) ?? '',
        type: (formData.get('type') as string) ?? '',
        balance: (formData.get('balance') as string) ?? '0',
        ...(formData.get('type') === 'Credit Card'
          ? { cutoffDay: cutoffDayNum }
          : { cutoffDay: undefined }),
      };

      if (selectedAccount) {
        // Update existing account
        const updated = await apiPatch<typeof payload, Account>(
          `/accounts/${selectedAccount.id}`,
          payload
        );
        if (updated) {
          await loadAccounts();
          setModalOpen(false);
        } else {
          alert('Failed to update account. Please try again.');
        }
      } else {
        // Create new account
        const created = await apiPost<typeof payload, Account>(
          '/accounts',
          payload
        );
        if (created) {
          await loadAccounts();
          setModalOpen(false);
        } else {
          alert('Failed to create account. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error saving account:', error);
      alert('An error occurred while saving the account.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (account: Account) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the account "${account.accountName}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    try {
      const result = await apiDelete<{ message: string }>(`/accounts/${account.id}`);
      if (result) {
        await loadAccounts();
      } else {
        alert('Failed to delete account. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('An error occurred while deleting the account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Hesaplar</h1>
          <p>Genel muhasebe hesaplarını yönetin ve mevcut bakiyeleri takip edin.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={() => void loadAccounts()}>
            🔄 Yenile
          </button>
          <button type="button" onClick={() => openModal()}>
            + Hesap Ekle
          </button>
        </div>
      </header>

      <DataTable
        columns={[
          { key: 'accountName', header: 'Hesap Adı' },
          { key: 'type', header: 'Tip' },
          {
            key: 'balance',
            header: 'Bakiye',
            render: (account) => (
              <span className={
                account.type === 'Credit Card' 
                  ? styles.creditCardBalance 
                  : styles.positiveBalance
              }>
                ₺{account.balance ?? '0.00'}
              </span>
            ),
          },
          {
            key: 'cutoffDay',
            header: 'Kesim Günü',
            render: (account) =>
              account.type === 'Credit Card' && account.cutoffDay
                ? account.cutoffDay
                : '—',
          },
          {
            key: 'actions',
            header: 'İşlemler',
            render: (account) => (
              <div className={styles.actions}>
                <button type="button" onClick={() => openModal(account)}>
                  Düzenle
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(account)}
                  disabled={loading}
                >
                  Sil
                </button>
              </div>
            ),
          },
        ]}
        data={accounts}
      />

      <Modal
        title={selectedAccount ? 'Hesap Düzenle' : 'Hesap Ekle'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            <span>Hesap Adı</span>
            <input name="name" defaultValue={selectedAccount?.accountName ?? ''} required />
          </label>
          <label>
            <span>Tip</span>
            <select
              name="type"
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value)}
              required
            >
              <option value="" disabled>
                Select type
              </option>
              {accountTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          {selectedType === 'Credit Card' && (
            <label>
              <span>Kesim Günü (1-31)</span>
              <input
                name="cutoffDay"
                type="number"
                min={1}
                max={31}
                defaultValue={(selectedAccount?.cutoffDay as number) ?? ''}
                placeholder="e.g., 25"
              />
            </label>
          )}
          <label>
            <span>Bakiye</span>
            <input
              name="balance"
              type="number"
              step="0.01"
              defaultValue={selectedAccount?.balance ?? ''}
              required
            />
          </label>
          <footer className={styles.footer}>
            <button type="button" onClick={() => setModalOpen(false)} disabled={loading}>
              İptal
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </footer>
        </form>
      </Modal>
    </div>
  );
}

