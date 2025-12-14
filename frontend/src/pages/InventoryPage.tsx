import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { DataTable } from '../components/common/DataTable';
import { FilterBar } from '../components/common/FilterBar';
import { Modal } from '../components/common/Modal';
import { DateTimeInput } from '../components/common/DateTimeInput';
import { apiGet } from '../lib/api';
import { convertDDMMYYYYHHMMToISO, convertISOToDDMMYYYYHHMM } from '../lib/dateTimeUtils';
import { mockInventory } from '../lib/mockData';
import type { InventoryItem, Supplier, Supply } from '../types';
import styles from './InventoryPage.module.css';

type InventoryFilter = {
  reference: string;
  since: string;
  until: string;
};

const defaultFilter: InventoryFilter = {
  reference: '',
  since: '',
  until: '',
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filter, setFilter] = useState<InventoryFilter>(defaultFilter);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [selectedSupplyId, setSelectedSupplyId] = useState<string>('');
  const [usedAt, setUsedAt] = useState<string>('');

  useEffect(() => {
    void apiGet<InventoryItem[]>('/inventory', []).then((data) => {
      setItems(
        data.map((item) => ({
          id: item.id,
          itemName: item.itemName,
          quantity: item.quantity,
          referenceBillId: item.referenceBillId,
          usedAt: item.usedAt,
        })),
      );
    });
  }, []);

  useEffect(() => {
    void apiGet<Supplier[]>('/suppliers', []).then((data) => {
      // Extract all supplies from all suppliers
      const allSupplies: Supply[] = [];
      data.forEach((supplier) => {
        if (supplier.supplies && Array.isArray(supplier.supplies)) {
          allSupplies.push(...supplier.supplies);
        }
      });
      setSupplies(allSupplies);
    });
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesReference = filter.reference
        ? item.referenceBillId?.toString().includes(filter.reference)
        : true;
      const usedAt = item.usedAt ? new Date(item.usedAt) : null;
      const matchesSince = filter.since
        ? usedAt
          ? usedAt >= new Date(filter.since)
          : false
        : true;
      const matchesUntil = filter.until
        ? usedAt
          ? usedAt <= new Date(filter.until)
          : false
        : true;
      return matchesReference && matchesSince && matchesUntil;
    });
  }, [items, filter]);

  const openForm = (item?: InventoryItem) => {
    setSelectedItem(item ?? null);
    setSelectedSupplyId(item?.referenceBillId ?? '');
    setUsedAt(item?.usedAt ? convertISOToDDMMYYYYHHMM(item.usedAt) : '');
    setFormModalOpen(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload: InventoryItem = {
      id: selectedItem?.id ?? String(Date.now()),
      itemName: (formData.get('itemName') as string) ?? '',
      quantity: Number(formData.get('quantity') ?? 0),
      referenceBillId: selectedSupplyId || null,
      usedAt: usedAt ? convertDDMMYYYYHHMMToISO(usedAt) : null,
    };

    setItems((prev) => {
      const exists = prev.some((item) => item.id === payload.id);
      if (exists) {
        return prev.map((item) => (item.id === payload.id ? payload : item));
      }
      return [payload, ...prev];
    });

    setFormModalOpen(false);
    setSelectedSupplyId('');
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Envanter</h1>
          <p>Stok seviyelerini, tüketim tarihlerini ve kaynak belgelerini takip edin.</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" onClick={() => openForm()}>
            + Öğe Ekle
          </button>
          <button type="button" onClick={() => openForm()}>
            Stok Güncelle
          </button>
        </div>
      </header>

      <FilterBar>
        <input
          placeholder="Referans fatura #"
          value={filter.reference}
          onChange={(event) =>
            setFilter((prev) => ({ ...prev, reference: event.target.value }))
          }
        />
        <DateTimeInput
          value={filter.since}
          onChange={(value) => setFilter((prev) => ({ ...prev, since: value }))}
        />
        <DateTimeInput
          value={filter.until}
          onChange={(value) => setFilter((prev) => ({ ...prev, until: value }))}
        />
      </FilterBar>

      <DataTable
        columns={[
          { key: 'itemName', header: 'Item' },
          { key: 'quantity', header: 'Quantity' },
          {
            key: 'usedAt',
            header: 'Used At',
            render: (item) => (item.usedAt ? new Date(item.usedAt).toLocaleDateString() : '—'),
          },
          {
            key: 'referenceBillId',
            header: 'Reference Bill',
            render: (item) => item.referenceBillId ?? '—',
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (item) => (
              <div className={styles.actions}>
                <button type="button" onClick={() => openForm(item)}>
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setItems((prev) => prev.filter((record) => record.id !== item.id))
                  }
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]}
        data={filteredItems}
      />

      <Modal
        title={selectedItem ? 'Update Inventory Item' : 'Add Inventory Item'}
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            <span>Item Name</span>
            <input name="itemName" defaultValue={selectedItem?.itemName ?? ''} required />
          </label>
          <label>
            <span>Quantity</span>
            <input
              name="quantity"
              type="number"
              min={0}
              defaultValue={selectedItem?.quantity ?? 0}
              required
            />
          </label>
          <label>
            <span>Reference Supply ID</span>
            <select
              value={selectedSupplyId}
              onChange={(e) => setSelectedSupplyId(e.target.value)}
            >
              <option value="">Select a supply (optional)</option>
              {supplies.map((supply) => (
                <option key={supply.id} value={supply.id}>
                  ID: {supply.id} - {supply.productName} ({supply.type})
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Used At</span>
            <DateTimeInput
              value={usedAt}
              onChange={(value) => setUsedAt(value)}
            />
          </label>

          <footer className={styles.footer}>
            <button type="button" onClick={() => setFormModalOpen(false)}>
              Cancel
            </button>
            <button type="submit">{selectedItem ? 'Update Item' : 'Add Item'}</button>
          </footer>
        </form>
      </Modal>
    </div>
  );
}

