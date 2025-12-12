import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataTable } from '../components/common/DataTable';
import { FilterBar } from '../components/common/FilterBar';
import { Modal } from '../components/common/Modal';
import { Drawer } from '../components/common/Drawer';
import { MachineryMap } from '../components/map/MachineryMap';
import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api';
import { mockMachinery } from '../lib/mockData';
import type {
  Machinery,
  MachinerySpec,
  InternalOperation,
  OutsourceOperation,
  WorkingSite,
  ServiceOperation,
  TransportationOperation,
  Vehicle,
} from '../types';
import styles from './MachineryPage.module.css';
import { Tabs } from '../components/common/Tabs';
import { Trash2 } from 'lucide-react';

type MachineryForm = {
  machineNumber: string;
  machineCode: string;
  status: string;
};

const defaultForm: MachineryForm = {
  machineNumber: '',
  machineCode: '',
  status: '',
};

type VehicleForm = {
  plateNumber: string;
  vehicleType: string;
  examinationDate: string;
  insuranceDate: string;
};

const defaultVehicleForm: VehicleForm = {
  plateNumber: '',
  vehicleType: '',
  examinationDate: '',
  insuranceDate: '',
};

type PageTab = 'machinery' | 'vehicles';

export default function MachineryPage() {
  const [tab, setTab] = useState<PageTab>('machinery');
  const [machinery, setMachinery] = useState<Machinery[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filter, setFilter] = useState('');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [vehicleFormModalOpen, setVehicleFormModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formState, setFormState] = useState<MachineryForm>(defaultForm);
  const [vehicleFormState, setVehicleFormState] = useState<VehicleForm>(defaultVehicleForm);
  const [selectedMachine, setSelectedMachine] = useState<Machinery | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [internalOps, setInternalOps] = useState<InternalOperation[]>([]);
  const [outsourceOps, setOutsourceOps] = useState<OutsourceOperation[]>([]);
  const [workingSites, setWorkingSites] = useState<WorkingSite[]>([]);
  const [serviceOps, setServiceOps] = useState<ServiceOperation[]>([]);
  const [transportOps, setTransportOps] = useState<TransportationOperation[]>([]);
  const [detailsTab, setDetailsTab] = useState<'specs' | 'history'>('specs');
  const [historyTab, setHistoryTab] = useState<'ops' | 'service' | 'transport'>('ops');
  const [specsEditMode, setSpecsEditMode] = useState(false);
  const [editedSpecs, setEditedSpecs] = useState<Record<string, string>>({});
  const [showAddSpecForm, setShowAddSpecForm] = useState(false);
  const [newSpec, setNewSpec] = useState({ specName: '', specValue: '' });
  const [isAddingSpec, setIsAddingSpec] = useState(false);
  const [deletingSpecId, setDeletingSpecId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingVehicle, setIsSubmittingVehicle] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(null);

  const fetchMachinery = useCallback(async () => {
    const data = await apiGet<Machinery[]>('/machinery', []);
    setMachinery(
      data.map((machine) => ({
        id: machine.id,
        machineNumber: machine.machineNumber,
        machineCode: machine.machineCode,
        status: machine.status,
        latitude: machine.latitude,
        longitude: machine.longitude,
        createdAt: machine.createdAt,
        specs: machine.specs ?? [],
      })),
    );
  }, []);

  const fetchVehicles = useCallback(async () => {
    const data = await apiGet<Vehicle[]>('/vehicles', []);
    setVehicles(data);
  }, []);

  useEffect(() => {
    void fetchMachinery();
    void fetchVehicles();

    void apiGet<InternalOperation[]>('/operations/internal', []).then((data) => {
      setInternalOps(data);
    });

    void apiGet<OutsourceOperation[]>('/operations/outsource', []).then((data) => {
      setOutsourceOps(data);
    });

    void apiGet<WorkingSite[]>('/working-sites', []).then((data) => {
      setWorkingSites(data);
    });

    void apiGet<ServiceOperation[]>('/operations/service', []).then((data) => {
      setServiceOps(data);
    });

    void apiGet<TransportationOperation[]>('/operations/transportation', []).then((data) => {
      setTransportOps(data);
    });
  }, [fetchMachinery, fetchVehicles]);

  const specsByMachine = useMemo(() => {
    const grouped: Record<string, MachinerySpec[]> = {};
    machinery.forEach((machine) => {
      if (machine.specs) {
        machine.specs.forEach((spec) => {
          if (!grouped[spec.machineryId]) {
            grouped[spec.machineryId] = [];
          }
          grouped[spec.machineryId].push(spec);
        });
      }
    });
    return grouped;
  }, [machinery]);

  const sortedMachinery = useMemo(() => {
    return [...machinery].sort((a, b) =>
      (a.machineNumber || '').localeCompare(b.machineNumber || ''),
    );
  }, [machinery]);

  const filteredMachinery = useMemo(() => {
    if (!filter) return sortedMachinery;
    return sortedMachinery.filter(
      (machine) =>
        machine.machineNumber.toLowerCase().includes(filter.toLowerCase()) ||
        machine.machineCode.toLowerCase().includes(filter.toLowerCase()),
    );
  }, [sortedMachinery, filter]);

  // Filter operations based on search filter to match map display
  // Filter operations to only show active ones (without endDate) for the map
  const activeInternalOps = useMemo(() => {
    return internalOps.filter((op) => !op.endDate || op.endDate === '');
  }, [internalOps]);

  const activeOutsourceOps = useMemo(() => {
    return outsourceOps.filter((op) => !op.endDate || op.endDate === '');
  }, [outsourceOps]);

  // Filtered active operations for the map (respects both filter and active status)
  const filteredActiveInternalOps = useMemo(() => {
    const active = activeInternalOps;
    if (!filter) return active;
    const filterLower = filter.toLowerCase();
    return active.filter(
      (op) =>
        (op.machineNumber?.toLowerCase().includes(filterLower) ?? false) ||
        (op.machineCode?.toLowerCase().includes(filterLower) ?? false),
    );
  }, [activeInternalOps, filter]);

  const filteredActiveOutsourceOps = useMemo(() => {
    const active = activeOutsourceOps;
    if (!filter) return active;
    const filterLower = filter.toLowerCase();
    return active.filter(
      (op) => op.machineCode?.toLowerCase().includes(filterLower) ?? false,
    );
  }, [activeOutsourceOps, filter]);

  const filteredInternalOps = useMemo(() => {
    if (!filter) return internalOps;
    const filterLower = filter.toLowerCase();
    return internalOps.filter(
      (op) =>
        (op.machineNumber?.toLowerCase().includes(filterLower) ?? false) ||
        (op.machineCode?.toLowerCase().includes(filterLower) ?? false),
    );
  }, [internalOps, filter]);

  const filteredOutsourceOps = useMemo(() => {
    if (!filter) return outsourceOps;
    const filterLower = filter.toLowerCase();
    return outsourceOps.filter(
      (op) => op.machineCode?.toLowerCase().includes(filterLower) ?? false,
    );
  }, [outsourceOps, filter]);

  const sortedVehicles = useMemo(() => {
    return [...vehicles].sort((a, b) =>
      (a.plateNumber || '').localeCompare(b.plateNumber || ''),
    );
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    if (!filter) return sortedVehicles;
    return sortedVehicles.filter(
      (vehicle) =>
        vehicle.plateNumber?.toLowerCase().includes(filter.toLowerCase()) ||
        vehicle.vehicleType?.toLowerCase().includes(filter.toLowerCase()),
    );
  }, [sortedVehicles, filter]);

  const openForm = (machine?: Machinery) => {
    setFormState(
      machine
        ? {
            machineNumber: machine.machineNumber,
            machineCode: machine.machineCode,
            status: machine.status?.toUpperCase() ?? '',
          }
        : defaultForm,
    );
    setSelectedMachine(machine ?? null);
    setFormModalOpen(true);
  };

  const openVehicleForm = (vehicle?: Vehicle) => {
    setVehicleFormState(
      vehicle
        ? {
            plateNumber: vehicle.plateNumber ?? '',
            vehicleType: vehicle.vehicleType ?? '',
            examinationDate: vehicle.examinationDate ?? '',
            insuranceDate: vehicle.insuranceDate ?? '',
          }
        : defaultVehicleForm,
    );
    setSelectedVehicle(vehicle ?? null);
    setVehicleFormModalOpen(true);
  };

  const openSpecs = (machine: Machinery) => {
    setSelectedMachine(machine);
    setDetailsTab('specs');
    setSpecsEditMode(false);
    setEditedSpecs({});
    setDrawerOpen(true);
  };

  const openHistory = (machine: Machinery) => {
    setSelectedMachine(machine);
    setDetailsTab('history');
    setHistoryTab('ops');
    setDrawerOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const payload = {
      machineNumber: formState.machineNumber.trim(),
      machineCode: formState.machineCode.trim(),
      status: formState.status ? formState.status.toUpperCase() : undefined,
    };

    const result = selectedMachine
      ? await apiPatch<typeof payload, Machinery>(`/machinery/${selectedMachine.id}`, payload)
      : await apiPost<typeof payload, Machinery>('/machinery', payload);

    if (result) {
      await fetchMachinery();
      setFormModalOpen(false);
      setSelectedMachine(null);
      setFormState(defaultForm);
    } else {
      alert('Failed to save machinery. Please try again.');
    }

    setIsSubmitting(false);
  };

  const operationsCombined = useMemo(() => {
    if (!selectedMachine) return [] as { id: string; type: string; date: string; customer: string }[];
    const machineNum = selectedMachine.machineNumber;
    const mCode = selectedMachine.machineCode;
    const combined: { id: string; type: string; date: string; customer: string }[] = [];
    internalOps
      .filter((op) => op.machineNumber === machineNum)
      .forEach((op) => combined.push({ id: String(op.id), type: 'Internal', date: op.startDate ?? '—', customer: op.customerName ?? '—' }));
    outsourceOps
      .filter((op) => op.machineCode === mCode)
      .forEach((op) => combined.push({ id: String(op.id), type: 'Outsource', date: op.startDate ?? '—', customer: op.customerName ?? op.outsourcerName ?? '—' }));
    return combined.sort((a, b) => (a.date === '—' ? 1 : b.date === '—' ? -1 : new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, [selectedMachine, internalOps, outsourceOps]);

  const beginEditSpecs = () => {
    if (!selectedMachine) return;
    const currentSpecs = specsByMachine[selectedMachine.id] ?? [];
    const initial: Record<string, string> = {};
    currentSpecs.forEach((s) => {
      initial[s.id] = s.specValue ?? '';
    });
    setEditedSpecs(initial);
    setSpecsEditMode(true);
  };

  const cancelEditSpecs = () => {
    setSpecsEditMode(false);
    setEditedSpecs({});
    setShowAddSpecForm(false);
    setNewSpec({ specName: '', specValue: '' });
  };

  const saveSpecs = async () => {
    if (!selectedMachine) return;
    
    // Update existing specs
    const updatePromises = Object.entries(editedSpecs).map(async ([specId, specValue]) => {
      const spec = specsByMachine[selectedMachine.id]?.find((s) => s.id === specId);
      if (spec && spec.specValue !== specValue) {
        await apiPatch<{ specName?: string; specValue?: string }, MachinerySpec>(
          `/machinery/specs/${specId}`,
          { specValue },
        );
      }
    });
    
    await Promise.all(updatePromises);
    await fetchMachinery();
    setSpecsEditMode(false);
    setEditedSpecs({});
  };

  const handleAddSpec = async () => {
    if (!selectedMachine || !newSpec.specName.trim() || !newSpec.specValue.trim()) return;
    
    setIsAddingSpec(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/machinery/specs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newSpec, machineryId: selectedMachine.id }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to add spec:', errorText);
        alert(`Failed to add specification: ${errorText}`);
        return;
      }
      
      const result = await response.json();
      if (result) {
        await fetchMachinery();
        setNewSpec({ specName: '', specValue: '' });
        setShowAddSpecForm(false);
      }
    } catch (error) {
      console.error('Error adding spec:', error);
      alert(`An error occurred while adding the specification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAddingSpec(false);
    }
  };

  const handleDeleteSpec = async (specId: string) => {
    if (!specId || deletingSpecId) return;
    const confirmed = window.confirm('Are you sure you want to delete this specification?');
    if (!confirmed) return;

    setDeletingSpecId(specId);
    try {
      const result = await apiDelete<{ message: string }>(`/machinery/specs/${specId}`);
      if (result !== null) {
        await fetchMachinery();
      } else {
        alert('Failed to delete specification. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting spec:', error);
      alert('An error occurred while deleting the specification.');
    } finally {
      setDeletingSpecId(null);
    }
  };

  const handleDelete = async (machine: Machinery) => {
    if (deletingId || !machine?.id) return;
    const confirmed = window.confirm(`Delete machinery ${machine.machineNumber}?`);
    if (!confirmed) return;

    setDeletingId(machine.id);
    const result = await apiDelete<{ message: string }>(`/machinery/${machine.id}`);
    if (result) {
      await fetchMachinery();
    } else {
      alert('Failed to delete machinery. Please try again.');
    }
    setDeletingId(null);
  };

  const handleVehicleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmittingVehicle) return;

    setIsSubmittingVehicle(true);
    const payload = {
      plateNumber: vehicleFormState.plateNumber.trim() || null,
      vehicleType: vehicleFormState.vehicleType.trim() || null,
      examinationDate: vehicleFormState.examinationDate.trim() || null,
      insuranceDate: vehicleFormState.insuranceDate.trim() || null,
    };

    const result = selectedVehicle
      ? await apiPatch<typeof payload, Vehicle>(`/vehicles/${selectedVehicle.id}`, payload)
      : await apiPost<typeof payload, Vehicle>('/vehicles', payload);

    if (result) {
      await fetchVehicles();
      setVehicleFormModalOpen(false);
      setSelectedVehicle(null);
      setVehicleFormState(defaultVehicleForm);
    } else {
      alert('Failed to save vehicle. Please try again.');
    }

    setIsSubmittingVehicle(false);
  };

  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    if (deletingVehicleId || !vehicle?.id) return;
    const confirmed = window.confirm(`Delete vehicle ${vehicle.plateNumber || 'with no plate number'}?`);
    if (!confirmed) return;

    setDeletingVehicleId(vehicle.id);
    const result = await apiDelete<{ message: string }>(`/vehicles/${vehicle.id}`);
    if (result) {
      await fetchVehicles();
    } else {
      alert('Failed to delete vehicle. Please try again.');
    }
    setDeletingVehicleId(null);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Makine Parkı &amp; Araçlar</h1>
          <p>Ekipman kayıtlarını ve detaylı özellik sayfalarını yönetin.</p>
        </div>
        <button type="button" onClick={() => (tab === 'machinery' ? openForm() : openVehicleForm())}>
          + {tab === 'machinery' ? 'Makine Ekle' : 'Araç Ekle'}
        </button>
      </header>

      <Tabs
        tabs={[
          { id: 'machinery', label: 'Makine Parkı', badge: String(machinery.length) },
          { id: 'vehicles', label: 'Araçlar', badge: String(vehicles.length) },
        ]}
        active={tab}
        onChange={(id) => setTab(id as PageTab)}
      >
        <FilterBar>
          <input
            placeholder={tab === 'machinery' ? 'Search machine number or code…' : 'Search plate number or vehicle type…'}
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
        </FilterBar>

        {tab === 'machinery' && (
          <div className={styles.contentGrid}>
            <div className={styles.tableSection}>
              <DataTable
                columns={[
                  { key: 'machineNumber', header: 'Makine #' },
                  { key: 'machineCode', header: 'Kod' },
                  { key: 'status', header: 'Durum' },
                  {
                    key: 'actions',
                    header: 'İşlemler',
                    render: (machine) => (
                      <div className={styles.actions}>
                        <button type="button" onClick={() => openSpecs(machine)}>
                          Detayları Gör
                        </button>
                        <button type="button" onClick={() => openHistory(machine)}>
                          Geçmiş
                        </button>
                        <button
                          type="button"
                          className={styles.deleteButton}
                          onClick={() => handleDelete(machine)}
                          disabled={deletingId === machine.id}
                          title="Remove machinery"
                          aria-label="Remove machinery"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ),
                  },
                ]}
                data={filteredMachinery}
              />
            </div>

            <div className={styles.mapSection}>
              <h2>Aktif Makine Konumları</h2>
              <MachineryMap
                internalOps={filteredActiveInternalOps}
                outsourceOps={filteredActiveOutsourceOps}
                workingSites={workingSites}
                showAllActive={true}
                activeMachinery={filteredMachinery.map((m) => ({
              id: m.id,
              machineNumber: m.machineNumber,
              machineCode: m.machineCode,
              status: m.status ?? 'IDLE',
              latitude: m.latitude,
              longitude: m.longitude,
              createdAt: m.createdAt,
            }))}
                hideLegend={formModalOpen}
              />
            </div>
          </div>
        )}

        {tab === 'vehicles' && (
          <div className={styles.contentGrid}>
            <div className={styles.tableSection}>
              <DataTable
                columns={[
                  { key: 'plateNumber', header: 'Plaka Numarası' },
                  { key: 'vehicleType', header: 'Araç Tipi' },
                  {
                    key: 'examinationDate',
                    header: 'Muayene Tarihi',
                    render: (vehicle: Vehicle) => vehicle.examinationDate ? new Date(vehicle.examinationDate).toLocaleDateString() : '—',
                  },
                  {
                    key: 'insuranceDate',
                    header: 'Sigorta Tarihi',
                    render: (vehicle: Vehicle) => vehicle.insuranceDate ? new Date(vehicle.insuranceDate).toLocaleDateString() : '—',
                  },
                  {
                    key: 'actions',
                    header: 'İşlemler',
                    render: (vehicle) => (
                      <div className={styles.actions}>
                        <button type="button" onClick={() => openVehicleForm(vehicle)}>
                          Düzenle
                        </button>
                        <button
                          type="button"
                          className={styles.deleteButton}
                          onClick={() => handleDeleteVehicle(vehicle)}
                          disabled={deletingVehicleId === vehicle.id}
                          title="Remove vehicle"
                          aria-label="Remove vehicle"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ),
                  },
                ]}
                data={filteredVehicles}
              />
            </div>
          </div>
        )}
      </Tabs>

      <Modal
        title={selectedMachine ? 'Makine Düzenle' : 'Makine Ekle'}
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            <span>Makine Numarası</span>
            <input
              value={formState.machineNumber}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, machineNumber: event.target.value }))
              }
              required
            />
          </label>
          <label>
            <span>Makine Kodu</span>
            <input
              value={formState.machineCode}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, machineCode: event.target.value }))
              }
              required
            />
          </label>
          <label>
            <span>Durum</span>
            <select
              value={formState.status}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, status: event.target.value }))
              }
            >
              <option value="">Durum Seç</option>
              <option value="IDLE">BOŞTA</option>
              <option value="ACTIVE">AKTİF</option>
              <option value="MAINTANANCE">BAKIMDA</option>
            </select>
          </label>
          <footer className={styles.footer}>
            <button type="button" onClick={() => setFormModalOpen(false)} disabled={isSubmitting}>
              İptal
            </button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Kaydediliyor...' : selectedMachine ? 'Makineyi Güncelle' : 'Makine Ekle'}
            </button>
          </footer>
        </form>
      </Modal>

      <Modal
        title={selectedVehicle ? 'Araç Düzenle' : 'Araç Ekle'}
        open={vehicleFormModalOpen}
        onClose={() => setVehicleFormModalOpen(false)}
      >
        <form className={styles.form} onSubmit={handleVehicleSubmit}>
          <label>
            <span>Plate Number</span>
            <input
              value={vehicleFormState.plateNumber}
              onChange={(event) =>
                setVehicleFormState((prev) => ({ ...prev, plateNumber: event.target.value }))
              }
            />
          </label>
          <label>
            <span>Vehicle Type</span>
            <input
              value={vehicleFormState.vehicleType}
              onChange={(event) =>
                setVehicleFormState((prev) => ({ ...prev, vehicleType: event.target.value }))
              }
            />
          </label>
          <label>
            <span>Examination Date</span>
            <input
              type="date"
              value={vehicleFormState.examinationDate}
              onChange={(event) =>
                setVehicleFormState((prev) => ({ ...prev, examinationDate: event.target.value }))
              }
            />
          </label>
          <label>
            <span>Insurance Date</span>
            <input
              type="date"
              value={vehicleFormState.insuranceDate}
              onChange={(event) =>
                setVehicleFormState((prev) => ({ ...prev, insuranceDate: event.target.value }))
              }
            />
          </label>
          <footer className={styles.footer}>
            <button type="button" onClick={() => setVehicleFormModalOpen(false)} disabled={isSubmittingVehicle}>
              İptal
            </button>
            <button type="submit" disabled={isSubmittingVehicle}>
              {isSubmittingVehicle ? 'Kaydediliyor...' : selectedVehicle ? 'Aracı Güncelle' : 'Araç Ekle'}
            </button>
          </footer>
        </form>
      </Modal>

      <Drawer
        title={`Detaylar — ${selectedMachine?.machineNumber ?? ''}`}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width="lg"
      >
        {selectedMachine ? (
          <div className={styles.details}>
            <div className={styles.machineryLabel}>
              <span className={styles.machineryNumber}>Makine #: {selectedMachine.machineNumber}</span>
              <span className={styles.machineryCode}>Kod: {selectedMachine.machineCode}</span>
            </div>
            {detailsTab === 'specs' ? (
              <div className={styles.specs}>
                <div className={styles.specsHeader}>
                  <h3 style={{ margin: 0 }}>Özellikler</h3>
                  {!specsEditMode ? (
                    <button type="button" className={styles.editSpecsBtn} onClick={beginEditSpecs}>Özellikleri Düzenle</button>
                  ) : (
                    <div className={styles.specActionBar}>
                      <button type="button" className={styles.cancelBtn} onClick={cancelEditSpecs}>Cancel</button>
                      <button type="button" className={styles.addSpecBtn} onClick={() => setShowAddSpecForm(true)}>Özellik Ekle</button>
                      <button type="button" className={styles.saveBtn} onClick={saveSpecs}>Kaydet</button>
                    </div>
                  )}
                </div>
                {(!specsByMachine[selectedMachine.id] || specsByMachine[selectedMachine.id].length === 0) && (
                  <p>Henüz özellik kaydedilmedi.</p>
                )}
                {(specsByMachine[selectedMachine.id] ?? []).map((spec) => (
                  <div key={spec.id} className={styles.specRow}>
                    <div className={styles.specContent}>
                      <span className={styles.specName}>{spec.specName}</span>
                      {!specsEditMode ? (
                        <strong className={styles.specValue}>{spec.specValue}</strong>
                      ) : (
                        <input
                          className={styles.specInput}
                          value={editedSpecs[spec.id] ?? spec.specValue ?? ''}
                          onChange={(e) =>
                            setEditedSpecs((prev) => ({ ...prev, [spec.id]: e.target.value }))
                          }
                        />
                      )}
                    </div>
                    {specsEditMode && (
                      <button
                        type="button"
                        className={styles.deleteSpecBtn}
                        onClick={() => handleDeleteSpec(spec.id)}
                        disabled={deletingSpecId === spec.id}
                        title="Delete specification"
                        aria-label="Delete specification"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
                {specsEditMode && showAddSpecForm && (
                  <div className={styles.addSpecForm}>
                    <div className={styles.specRow}>
                      <input
                        type="text"
                        placeholder="Özellik Adı"
                        value={newSpec.specName}
                        onChange={(e) => setNewSpec((prev) => ({ ...prev, specName: e.target.value }))}
                        className={styles.specInput}
                      />
                      <input
                        type="text"
                        placeholder="Özellik Değeri"
                        value={newSpec.specValue}
                        onChange={(e) => setNewSpec((prev) => ({ ...prev, specValue: e.target.value }))}
                        className={styles.specInput}
                      />
                      <div className={styles.addSpecActions}>
                        <button
                          type="button"
                          className={styles.addSpecSubmitBtn}
                          onClick={handleAddSpec}
                          disabled={isAddingSpec || !newSpec.specName.trim() || !newSpec.specValue.trim()}
                        >
                          {isAddingSpec ? 'Ekleniyor...' : 'Ekle'}
                        </button>
                        <button
                          type="button"
                          className={styles.addSpecCancelBtn}
                          onClick={() => {
                            setShowAddSpecForm(false);
                            setNewSpec({ specName: '', specValue: '' });
                          }}
                          disabled={isAddingSpec}
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Tabs
                tabs={[
                  { id: 'ops', label: 'Operasyonlar' },
                  { id: 'service', label: 'Servis' },
                  { id: 'transport', label: 'Nakliye' },
                ]}
                active={historyTab}
                onChange={(id) => setHistoryTab(id as typeof historyTab)}
              >
                {historyTab === 'ops' && (
                  <DataTable
                    columns={[
                      { key: 'type', header: 'Tip' },
                      { key: 'id', header: 'ID' },
                      { key: 'date', header: 'Tarih' },
                      { key: 'customer', header: 'Müşteri/Taşeron' },
                    ]}
                    data={operationsCombined}
                  />
                )}
                {historyTab === 'service' && (
                  <DataTable
                    columns={[
                      { key: 'id', header: 'ID' },
                      { key: 'type', header: 'Tip', render: (row: ServiceOperation) => row.type ?? 'Servis' },
                      { key: 'createdAt', header: 'Tarih' },
                      { key: 'usedParts', header: 'Detaylar', render: (row: ServiceOperation) => row.usedParts ?? '—' },
                    ]}
                    data={serviceOps.filter((op) => op.machineNumber === selectedMachine.machineNumber)}
                  />
                )}
                {historyTab === 'transport' && (
                  <DataTable
                    columns={[
                      { key: 'transportationOpId', header: 'ID' },
                      { key: 'plateNum', header: 'Plaka' },
                      { key: 'operationDate', header: 'Tarih' },
                      { key: 'notes', header: 'Notlar' },
                    ]}
                    data={transportOps.filter((op) => op.plateNum && selectedMachine.machineNumber && op.plateNum.includes(selectedMachine.machineNumber))}
                  />
                )}
              </Tabs>
            )}
          </div>
        ) : (
          <p>Detayları görmek için bir makine seçin.</p>
        )}
      </Drawer>
    </div>
  );
}





