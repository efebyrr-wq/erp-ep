import { useEffect, useState, useMemo } from 'react';
import { DataTable } from '../components/common/DataTable';
import { Tabs } from '../components/common/Tabs';
import { Modal } from '../components/common/Modal';
import { DateTimeInput } from '../components/common/DateTimeInput';
import { convertDDMMYYYYHHMMToISO, convertISOToDDMMYYYYHHMM } from '../lib/dateTimeUtils';
import { apiGet, apiPost, apiDelete, apiPatch } from '../lib/api';
import { formatDateDDMMYYYY } from '../lib/dateUtils';
import {
  mockInternalOperations,
  mockOutsourceOperations,
  mockServiceOperations,
  mockTransportationOperations,
} from '../lib/mockData';
import type {
  InternalOperation,
  OutsourceOperation,
  ServiceOperation,
  TransportationOperation,
  Customer,
  Machinery,
  WorkingSite,
  Vehicle,
  Outsourcer,
  OperationDetails,
} from '../types';
import styles from './OperationsPage.module.css';
import { Trash2 } from 'lucide-react';

type OperationTab = 'internal' | 'outsource' | 'service' | 'transportation';

type InternalOperationForm = {
  customerName: string;
  machineNumber: string;
  machineCode: string;
  workingSiteName: string;
  startDate: string;
  endDate: string;
};

type OutsourceOperationForm = {
  customerName: string;
  outsourcerName: string;
  machineCode: string;
  workingSiteName: string;
  startDate: string;
  endDate: string;
};

type ServiceOperationForm = {
  machineNumber: string;
  type: string;
  description: string;
  usedParts: string;
};

type TransportationOperationForm = {
  plateNum: string;
  startingLoc: string;
  endingLoc: string;
  operationDate: string;
  notes: string;
};

export default function OperationsPage() {
  const [tab, setTab] = useState<OperationTab>('internal');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [outsourcers, setOutsourcers] = useState<Outsourcer[]>([]);
  const [machinery, setMachinery] = useState<Machinery[]>([]);
  const [workingSites, setWorkingSites] = useState<WorkingSite[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [internalOps, setInternalOps] = useState<InternalOperation[]>([]);
  const [outsourceOps, setOutsourceOps] = useState<OutsourceOperation[]>([]);
  const [serviceOps, setServiceOps] = useState<ServiceOperation[]>([]);
  const [transportationOps, setTransportationOps] = useState<TransportationOperation[]>([]);
  const [deletingInternalId, setDeletingInternalId] = useState<string | null>(null);
  const [deletingOutsourceId, setDeletingOutsourceId] = useState<string | null>(null);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);
  const [deletingTransportationId, setDeletingTransportationId] = useState<string | null>(null);
  const [editingInternalId, setEditingInternalId] = useState<string | null>(null);
  const [editingOutsourceId, setEditingOutsourceId] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingTransportationId, setEditingTransportationId] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedOperationForDetails, setSelectedOperationForDetails] = useState<{
    id: string;
    type: 'internal' | 'outsource' | 'service' | 'transportation';
  } | null>(null);
  const [operationDetails, setOperationDetails] = useState<OperationDetails | null>(null);
  const [detailsForm, setDetailsForm] = useState({
    deliveryTransportation: '',
    pickupTransportation: '',
    // Binary data fields only
    pricingProposalPdf: null as File | null,
    invoicePdf: null as File | null,
    imageDeliveryBundle: [] as File[],
    imagePickupBundle: [] as File[],
  });

  // Create object URLs for image previews and clean them up
  const deliveryImageUrls = useMemo(() => {
    return detailsForm.imageDeliveryBundle.map(file => URL.createObjectURL(file));
  }, [detailsForm.imageDeliveryBundle]);

  const pickupImageUrls = useMemo(() => {
    return detailsForm.imagePickupBundle.map(file => URL.createObjectURL(file));
  }, [detailsForm.imagePickupBundle]);

  // Cleanup object URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      deliveryImageUrls.forEach(url => URL.revokeObjectURL(url));
      pickupImageUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [deliveryImageUrls, pickupImageUrls]);

  // Helper function to compress image (aggressive compression to avoid CloudFront 20MB limit)
  const compressImage = (file: File, maxWidth: number = 1024, maxHeight: number = 1024, quality: number = 0.6): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Only compress image files
      if (!file.type.startsWith('image/')) {
        // For non-image files (like PDFs), convert to base64 without compression
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions while maintaining aspect ratio
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with compression
          const mimeType = file.type || 'image/jpeg';
          const compressedBase64 = canvas.toDataURL(mimeType, quality).split(',')[1];
          resolve(compressedBase64);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Helper function to convert file to base64 (with compression for images)
  const fileToBase64 = (file: File): Promise<string> => {
    // Compress images, but keep PDFs as-is
    if (file.type.startsWith('image/')) {
      return compressImage(file);
    }
    // For PDFs and other files, convert without compression
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]; // Remove data:type;base64, prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Helper function to convert image files to bundle format (with compression)
  const filesToImageBundle = async (files: File[]): Promise<Array<{ data: string; mimeType: string; filename?: string }>> => {
    const bundle = await Promise.all(
      files.map(async (file) => {
        // Compress images before converting to base64
        const compressedBase64 = await compressImage(file);
        return {
          data: compressedBase64,
          mimeType: file.type.startsWith('image/') ? 'image/jpeg' : file.type, // Compressed images become JPEG
          filename: file.name,
        };
      })
    );
    return bundle;
  };

  const openDetailsForm = async (
    operationId: string,
    operationType: 'internal' | 'outsource' | 'service' | 'transportation',
  ) => {
    setSelectedOperationForDetails({ id: operationId, type: operationType });
    setDetailsModalOpen(true);

    // Fetch existing details if any
    try {
      console.log('Fetching operation details for:', operationId);
      const details = await apiGet<OperationDetails | null>(
        `/operation-details/${operationId}`,
        null,
      );
      console.log('Fetched operation details:', details);
      if (details) {
        setOperationDetails(details);
        setDetailsForm({
          deliveryTransportation: details.deliveryTransportation || '',
          pickupTransportation: details.pickupTransportation || '',
          pricingProposalPdf: null, // Files need to be re-uploaded if changed
          invoicePdf: null,
          imageDeliveryBundle: [],
          imagePickupBundle: [],
        });
        console.log('Operation details loaded:', {
          deliveryTransportation: details.deliveryTransportation,
          pickupTransportation: details.pickupTransportation,
          hasPricingPdf: !!details.pricingProposalPdf,
          hasInvoicePdf: !!details.invoicePdf,
          deliveryImagesCount: details.imageDeliveryBundle?.length || 0,
          pickupImagesCount: details.imagePickupBundle?.length || 0,
        });
      } else {
        console.log('No existing operation details found');
        setOperationDetails(null);
        setDetailsForm({
          deliveryTransportation: '',
          pickupTransportation: '',
          pricingProposalPdf: null,
          invoicePdf: null,
          imageDeliveryBundle: [],
          imagePickupBundle: [],
        });
      }
    } catch (error) {
      console.error('Error fetching operation details:', error);
      setOperationDetails(null);
      setDetailsForm({
        deliveryTransportation: '',
        pickupTransportation: '',
        pricingProposal: '',
        imageDelivery: '',
        imagePickup: '',
        invoiceOperation: '',
      });
    }
  };

  const closeDetailsForm = () => {
    setDetailsModalOpen(false);
    setSelectedOperationForDetails(null);
    setOperationDetails(null);
    setDetailsForm({
      deliveryTransportation: '',
      pickupTransportation: '',
      pricingProposalPdf: null,
      invoicePdf: null,
      imageDeliveryBundle: [],
      imagePickupBundle: [],
    });
  };

  const handleDetailsSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedOperationForDetails) return;

    try {
      // Convert files to base64
      const pricingProposalPdfBase64 = detailsForm.pricingProposalPdf 
        ? await fileToBase64(detailsForm.pricingProposalPdf) 
        : (operationDetails?.pricingProposalPdf || null);
      
      const invoicePdfBase64 = detailsForm.invoicePdf 
        ? await fileToBase64(detailsForm.invoicePdf) 
        : (operationDetails?.invoicePdf || null);

      const imageDeliveryBundle = detailsForm.imageDeliveryBundle.length > 0
        ? await filesToImageBundle(detailsForm.imageDeliveryBundle)
        : (operationDetails?.imageDeliveryBundle || null);

      const imagePickupBundle = detailsForm.imagePickupBundle.length > 0
        ? await filesToImageBundle(detailsForm.imagePickupBundle)
        : (operationDetails?.imagePickupBundle || null);

      const payload = {
        operationId: selectedOperationForDetails.id,
        operationType: selectedOperationForDetails.type,
        deliveryTransportation: detailsForm.deliveryTransportation || null,
        pickupTransportation: detailsForm.pickupTransportation || null,
        // Binary data only
        pricingProposalPdf: pricingProposalPdfBase64,
        invoicePdf: invoicePdfBase64,
        imageDeliveryBundle: imageDeliveryBundle,
        imagePickupBundle: imagePickupBundle,
      };

      // Check payload size (CloudFront has 20MB limit)
      // Calculate actual size including base64 overhead
      let totalSize = 0;
      if (pricingProposalPdfBase64) {
        totalSize += pricingProposalPdfBase64.length * 0.75; // Base64 is ~33% larger than binary
      }
      if (invoicePdfBase64) {
        totalSize += invoicePdfBase64.length * 0.75;
      }
      if (imageDeliveryBundle) {
        imageDeliveryBundle.forEach(img => {
          totalSize += img.data.length * 0.75;
        });
      }
      if (imagePickupBundle) {
        imagePickupBundle.forEach(img => {
          totalSize += img.data.length * 0.75;
        });
      }
      // Add overhead for JSON structure (estimate ~1KB)
      totalSize += 1024;
      
      const payloadSizeMB = totalSize / (1024 * 1024);
      const maxSizeMB = 18; // Leave 2MB buffer for CloudFront

      console.log('Saving operation details:', {
        operationId: payload.operationId,
        operationType: payload.operationType,
        hasPricingPdf: !!payload.pricingProposalPdf,
        hasInvoicePdf: !!payload.invoicePdf,
        deliveryImagesCount: payload.imageDeliveryBundle?.length || 0,
        pickupImagesCount: payload.imagePickupBundle?.length || 0,
        payloadSizeMB: payloadSizeMB.toFixed(2),
        pricingPdfSize: pricingProposalPdfBase64 ? `${(pricingProposalPdfBase64.length / (1024 * 1024)).toFixed(2)} MB` : '0 MB',
        invoicePdfSize: invoicePdfBase64 ? `${(invoicePdfBase64.length / (1024 * 1024)).toFixed(2)} MB` : '0 MB',
      });

      if (payloadSizeMB > maxSizeMB) {
        const message = 
          `Uyarı: Yüklenen dosyalar çok büyük (${payloadSizeMB.toFixed(2)} MB). ` +
          `Maksimum ${maxSizeMB} MB olmalıdır.\n\n` +
          `Lütfen:\n` +
          `- Daha az görüntü seçin\n` +
          `- PDF dosyalarını küçültün\n` +
          `- Görüntüleri daha küçük boyutlarda yükleyin`;
        alert(message);
        return;
      }

      let savedDetails: OperationDetails | null;
      if (operationDetails) {
        // Update existing
        console.log('Updating existing operation details');
        // Use large payload URL if payload is > 10MB (before CloudFront limit)
        const useLargePayloadUrl = payloadSizeMB > 10;
        savedDetails = await apiPatch<typeof payload, OperationDetails>(
          `/operation-details/${selectedOperationForDetails.id}`,
          payload,
          useLargePayloadUrl,
        );
      } else {
        // Create new
        console.log('Creating new operation details');
        // Use large payload URL if payload is > 10MB (before CloudFront limit)
        const useLargePayloadUrl = payloadSizeMB > 10;
        savedDetails = await apiPost<typeof payload, OperationDetails>(
          '/operation-details',
          payload,
          useLargePayloadUrl,
        );
      }

      if (!savedDetails) {
        throw new Error('Failed to save operation details: API returned null. Check backend logs for errors.');
      }

      console.log('Operation details saved:', savedDetails);
      
      // Refresh the details after saving
      setOperationDetails(savedDetails);
      
      // Update form with saved data
      setDetailsForm({
        deliveryTransportation: savedDetails.deliveryTransportation || '',
        pickupTransportation: savedDetails.pickupTransportation || '',
        pricingProposalPdf: null, // Reset file input
        invoicePdf: null, // Reset file input
        imageDeliveryBundle: [], // Reset file input
        imagePickupBundle: [], // Reset file input
      });
      
      alert('Operation details saved successfully! The form will now show the saved data.');
    } catch (error) {
      console.error('Error saving operation details:', error);
      alert(`Failed to save operation details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Form states
  const [internalForm, setInternalForm] = useState<InternalOperationForm>({
    customerName: '',
    machineNumber: '',
    machineCode: '',
    workingSiteName: '',
    startDate: '',
    endDate: '',
  });
  const [outsourceForm, setOutsourceForm] = useState<OutsourceOperationForm>({
    customerName: '',
    outsourcerName: '',
    machineCode: '',
    workingSiteName: '',
    startDate: '',
    endDate: '',
  });
  const [serviceForm, setServiceForm] = useState<ServiceOperationForm>({
    machineNumber: '',
    type: '',
    description: '',
    usedParts: '',
  });
  const [transportationForm, setTransportationForm] = useState<TransportationOperationForm>({
    plateNum: '',
    startingLoc: '',
    endingLoc: '',
    operationDate: '',
    notes: '',
  });

  useEffect(() => {
    void apiGet<Customer[]>('/customers', []).then((data) => {
      setCustomers(data);
    });
    void apiGet<Outsourcer[]>('/outsourcers', []).then((data) => {
      setOutsourcers(data);
    });
    void apiGet<Machinery[]>('/machinery', []).then((data) => {
      setMachinery(data);
    });
    void apiGet<WorkingSite[]>('/working-sites', []).then((data) => {
      setWorkingSites(data);
      // Ensure "Garage" working site exists with coordinates
      const garageExists = data.some((site) => site.workingSiteName.toLowerCase() === 'garage');
      if (!garageExists) {
        void apiPost<{ workingSiteName: string; location: string; latitude: string; longitude: string }, WorkingSite>(
          '/working-sites',
          {
            workingSiteName: 'Garage',
            location: 'Altınova Orta, 33. Sokak No:3 Kepez Antalya',
            latitude: '36.934308',
            longitude: '30.777931',
          },
        ).then(() => {
          // Refresh working sites after creating garage
          void apiGet<WorkingSite[]>('/working-sites', []).then((newData) => {
            setWorkingSites(newData);
          });
        });
      }
    });
    void apiGet<Vehicle[]>('/vehicles', []).then((data) => {
      setVehicles(data);
    });
    void apiGet<InternalOperation[]>('/operations/internal', []).then((data) => {
      console.log(`✅ Fetched ${data.length} internal operations`, data);
      setInternalOps(data);
    }).catch((error) => {
      console.error('❌ Error fetching internal operations:', error);
    });
    void apiGet<OutsourceOperation[]>('/operations/outsource', []).then((data) => {
      setOutsourceOps(data);
    });
    void apiGet<ServiceOperation[]>('/operations/service', []).then((data) => {
      setServiceOps(data);
    });
    void apiGet<TransportationOperation[]>('/operations/transportation', []).then(
      (data) => {
        setTransportationOps(
          data.map((op) => ({
            transportationOpId: op.transportationOpId,
            plateNum: op.plateNum,
            startingLoc: op.startingLoc,
            endingLoc: op.endingLoc,
            operationDate: op.operationDate,
            notes: op.notes,
          })),
        );
      },
    );
  }, []);

  // Filter idle machinery
  const idleMachinery = useMemo(() => {
    // Get idle machinery
    const idle = machinery.filter((m) => {
      const status = String(m.status || '').trim().toUpperCase();
      return status === 'IDLE' || status === '';
    });
    
    // When editing, include the currently selected machine even if it's not idle
    if (editingInternalId && internalForm.machineNumber) {
      const currentMachine = machinery.find((m) => m.machineNumber === internalForm.machineNumber);
      if (currentMachine && !idle.find((m) => m.machineNumber === currentMachine.machineNumber)) {
        return [...idle, currentMachine];
      }
    }
    
    return idle;
  }, [machinery, editingInternalId, internalForm.machineNumber]);

  // Show all operations including closed ones (no filtering by endDate)
  const filteredInternal = internalOps;
  const filteredOutsource = outsourceOps;
  const filteredService = serviceOps;
  const filteredTransportation = transportationOps;

  const openForm = () => {
    setFormModalOpen(true);
  };

  const closeForm = () => {
    setFormModalOpen(false);
    // Reset editing states
    setEditingInternalId(null);
    setEditingOutsourceId(null);
    setEditingServiceId(null);
    setEditingTransportationId(null);
    // Reset forms
    setInternalForm({
      customerName: '',
      machineNumber: '',
      machineCode: '',
      workingSiteName: '',
      startDate: '',
      endDate: '',
    });
    setOutsourceForm({
      customerName: '',
      outsourcerName: '',
      machineCode: '',
      workingSiteName: '',
      startDate: '',
      endDate: '',
    });
    setServiceForm({
      machineNumber: '',
      type: '',
      description: '',
      usedParts: '',
    });
    setTransportationForm({
      plateNum: '',
      startingLoc: '',
      endingLoc: '',
      operationDate: '',
      notes: '',
    });
  };

  const openEditForm = (operation: InternalOperation | OutsourceOperation | ServiceOperation | TransportationOperation) => {
    if ('customerName' in operation && 'machineNumber' in operation) {
      // Internal operation
      const internalOp = operation as InternalOperation;
      setEditingInternalId(internalOp.id || null);
      setInternalForm({
        customerName: internalOp.customerName || '',
        machineNumber: internalOp.machineNumber || '',
        machineCode: internalOp.machineCode || '',
        workingSiteName: internalOp.workingSiteName || '',
        startDate: internalOp.startDate ? convertISOToDDMMYYYYHHMM(internalOp.startDate) : '',
        endDate: internalOp.endDate ? convertISOToDDMMYYYYHHMM(internalOp.endDate) : '',
      });
      setTab('internal');
    } else if ('customerName' in operation && 'outsourcerName' in operation) {
      // Outsource operation
      const outsourceOp = operation as OutsourceOperation;
      setEditingOutsourceId(outsourceOp.id || null);
      setOutsourceForm({
        customerName: outsourceOp.customerName || '',
        outsourcerName: outsourceOp.outsourcerName || '',
        machineCode: outsourceOp.machineCode || '',
        workingSiteName: outsourceOp.workingSiteName || '',
        startDate: outsourceOp.startDate ? convertISOToDDMMYYYYHHMM(outsourceOp.startDate) : '',
        endDate: outsourceOp.endDate ? convertISOToDDMMYYYYHHMM(outsourceOp.endDate) : '',
      });
      setTab('outsource');
    } else if ('machineNumber' in operation && 'type' in operation) {
      // Service operation
      const serviceOp = operation as ServiceOperation;
      setEditingServiceId(serviceOp.id || null);
      setServiceForm({
        machineNumber: serviceOp.machineNumber || '',
        type: serviceOp.type || '',
        description: serviceOp.description || '',
        usedParts: serviceOp.usedParts || '',
      });
      setTab('service');
    } else if ('transportationOpId' in operation) {
      // Transportation operation
      const transportationOp = operation as TransportationOperation;
      setEditingTransportationId(transportationOp.transportationOpId || null);
      setTransportationForm({
        plateNum: transportationOp.plateNum || '',
        startingLoc: transportationOp.startingLoc || '',
        endingLoc: transportationOp.endingLoc || '',
        operationDate: transportationOp.operationDate ? convertISOToDDMMYYYYHHMM(transportationOp.operationDate) : '',
        notes: transportationOp.notes || '',
      });
      setTab('transportation');
    }
    setFormModalOpen(true);
  };

  const handleInternalSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const payload = {
        customerName: internalForm.customerName?.trim() || null,
        machineNumber: internalForm.machineNumber?.trim() || null,
        machineCode: internalForm.machineCode?.trim() || null,
        workingSiteName: internalForm.workingSiteName?.trim() || null,
        startDate: internalForm.startDate?.trim() ? (() => {
          const date = internalForm.startDate.trim();
          return /^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}$/.test(date) ? convertDDMMYYYYHHMMToISO(date) : date;
        })() : null,
        endDate: internalForm.endDate?.trim() ? (() => {
          const date = internalForm.endDate.trim();
          return /^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}$/.test(date) ? convertDDMMYYYYHHMMToISO(date) : date;
        })() : null,
      };

      const isEditing = editingInternalId !== null;
      
      if (isEditing) {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/operations/internal/${editingInternalId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = 'Failed to update internal operation.';
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
          alert(errorMessage);
          return;
        }

        const result = await response.json();
        if (result) {
          // Refresh internal operations list
          void apiGet<InternalOperation[]>('/operations/internal', []).then((data) => {
            setInternalOps(data);
          });
          // Refresh machinery data
          void apiGet<Machinery[]>('/machinery', []).then((data) => {
            setMachinery(data);
          });
          closeForm();
        }
      } else {
        const result = await apiPost<typeof payload, InternalOperation>('/operations/internal', payload);
        if (result) {
          // Refresh internal operations list
          void apiGet<InternalOperation[]>('/operations/internal', []).then((data) => {
            setInternalOps(data);
          });
          // Refresh machinery data
          void apiGet<Machinery[]>('/machinery', []).then((data) => {
            setMachinery(data);
          });
          closeForm();
        } else {
          alert('Failed to save internal operation. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error saving internal operation:', error);
      alert(`Failed to save internal operation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleOutsourceSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const payload = {
        customerName: outsourceForm.customerName?.trim() || null,
        outsourcerName: outsourceForm.outsourcerName?.trim() || null,
        machineCode: outsourceForm.machineCode?.trim() || null,
        workingSiteName: outsourceForm.workingSiteName?.trim() || null,
        startDate: outsourceForm.startDate?.trim() ? (() => {
          const date = outsourceForm.startDate.trim();
          return /^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}$/.test(date) ? convertDDMMYYYYHHMMToISO(date) : date;
        })() : null,
        endDate: outsourceForm.endDate?.trim() ? (() => {
          const date = outsourceForm.endDate.trim();
          return /^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}$/.test(date) ? convertDDMMYYYYHHMMToISO(date) : date;
        })() : null,
      };

      const isEditing = editingOutsourceId !== null;
      
      if (isEditing) {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/operations/outsource/${editingOutsourceId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = 'Failed to update outsource operation.';
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
          alert(errorMessage);
          return;
        }

        const result = await response.json();
        if (result) {
          // Refresh outsource operations list
          void apiGet<OutsourceOperation[]>('/operations/outsource', []).then((data) => {
            setOutsourceOps(data);
          });
          // Refresh machinery data
          void apiGet<Machinery[]>('/machinery', []).then((data) => {
            setMachinery(data);
          });
          closeForm();
        }
      } else {
        const result = await apiPost<typeof payload, OutsourceOperation>('/operations/outsource', payload);
        if (result) {
          // Refresh outsource operations list
          void apiGet<OutsourceOperation[]>('/operations/outsource', []).then((data) => {
            setOutsourceOps(data);
          });
          // Refresh machinery data
          void apiGet<Machinery[]>('/machinery', []).then((data) => {
            setMachinery(data);
          });
          closeForm();
        } else {
          alert('Failed to save outsource operation. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error saving outsource operation:', error);
      alert(`Failed to save outsource operation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleServiceSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const payload = {
        machineNumber: serviceForm.machineNumber.trim() || null,
        type: serviceForm.type.trim() || null,
        description: serviceForm.description.trim() || null,
        usedParts: serviceForm.usedParts.trim() || null,
      };

      const isEditing = editingServiceId !== null;
      
      if (isEditing) {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/operations/service/${editingServiceId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = 'Failed to update service operation.';
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
          alert(errorMessage);
          return;
        }

        const result = await response.json();
        if (result) {
          // Refresh service operations list
          void apiGet<ServiceOperation[]>('/operations/service', []).then((data) => {
            setServiceOps(data);
          });
          closeForm();
        }
      } else {
        const result = await apiPost<typeof payload, ServiceOperation>('/operations/service', payload);
        if (result) {
          // Refresh service operations list
          void apiGet<ServiceOperation[]>('/operations/service', []).then((data) => {
            setServiceOps(data);
          });
          closeForm();
        } else {
          alert('Failed to save service operation. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error saving service operation:', error);
      alert(`Failed to save service operation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTransportationSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const payload = {
        plateNum: transportationForm.plateNum.trim() || null,
        startingLoc: transportationForm.startingLoc.trim() || null,
        endingLoc: transportationForm.endingLoc.trim() || null,
        operationDate: transportationForm.operationDate.trim() ? (() => {
          const date = transportationForm.operationDate.trim();
          return /^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}$/.test(date) ? convertDDMMYYYYHHMMToISO(date) : date;
        })() : null,
        notes: transportationForm.notes.trim() || null,
      };

      const isEditing = editingTransportationId !== null;
      
      if (isEditing) {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/operations/transportation/${editingTransportationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = 'Failed to update transportation operation.';
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
          alert(errorMessage);
          return;
        }

        const result = await response.json();
        if (result) {
          // Refresh transportation operations list
          void apiGet<TransportationOperation[]>('/operations/transportation', []).then(
            (data) => {
              setTransportationOps(
                data.map((op) => ({
                  transportationOpId: op.transportationOpId,
                  plateNum: op.plateNum,
                  startingLoc: op.startingLoc,
                  endingLoc: op.endingLoc,
                  operationDate: op.operationDate,
                  notes: op.notes,
                })),
              );
            },
          );
          closeForm();
        }
      } else {
        const result = await apiPost<typeof payload, TransportationOperation>('/operations/transportation', payload);
        if (result) {
          // Refresh transportation operations list
          void apiGet<TransportationOperation[]>('/operations/transportation', []).then(
            (data) => {
              setTransportationOps(
                data.map((op) => ({
                  transportationOpId: op.transportationOpId,
                  plateNum: op.plateNum,
                  startingLoc: op.startingLoc,
                  endingLoc: op.endingLoc,
                  operationDate: op.operationDate,
                  notes: op.notes,
                })),
              );
            },
          );
          closeForm();
        } else {
          alert('Failed to save transportation operation. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error saving transportation operation:', error);
      alert(`Failed to save transportation operation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteInternal = async (operation: InternalOperation) => {
    if (deletingInternalId || !operation.id) return;
    const confirmed = window.confirm(`Delete internal operation for ${operation.customerName || 'customer'}?`);
    if (!confirmed) return;

    setDeletingInternalId(operation.id);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/operations/internal/${operation.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to delete internal operation.';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        alert(errorMessage);
        return;
      }

      // Refresh operations list
      void apiGet<InternalOperation[]>('/operations/internal', mockInternalOperations).then((data) => {
        setInternalOps(data);
      });
      // Refresh machinery data (status may have changed)
      void apiGet<Machinery[]>('/machinery', []).then((data) => {
        setMachinery(data);
      });
    } catch (error) {
      console.error('Error deleting internal operation:', error);
      alert(`Failed to delete internal operation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeletingInternalId(null);
    }
  };

  const handleDeleteOutsource = async (operation: OutsourceOperation) => {
    if (deletingOutsourceId || !operation.id) return;
    const confirmed = window.confirm(`Delete outsource operation for ${operation.customerName || 'customer'}?`);
    if (!confirmed) return;

    setDeletingOutsourceId(operation.id);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/operations/outsource/${operation.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to delete outsource operation.';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        alert(errorMessage);
        return;
      }

      // Refresh operations list
      void apiGet<OutsourceOperation[]>('/operations/outsource', mockOutsourceOperations).then((data) => {
        setOutsourceOps(data);
      });
      // Refresh machinery data (status may have changed)
      void apiGet<Machinery[]>('/machinery', []).then((data) => {
        setMachinery(data);
      });
    } catch (error) {
      console.error('Error deleting outsource operation:', error);
      alert(`Failed to delete outsource operation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeletingOutsourceId(null);
    }
  };

  const handleDeleteService = async (operation: ServiceOperation) => {
    if (deletingServiceId || !operation.id) return;
    const confirmed = window.confirm(`Delete service operation for machine ${operation.machineNumber || 'N/A'}?`);
    if (!confirmed) return;

    setDeletingServiceId(operation.id);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/operations/service/${operation.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to delete service operation.';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        alert(errorMessage);
        return;
      }

      // Refresh service operations list
      void apiGet<ServiceOperation[]>('/operations/service', mockServiceOperations).then((data) => {
        setServiceOps(data);
      });
    } catch (error) {
      console.error('Error deleting service operation:', error);
      alert(`Failed to delete service operation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeletingServiceId(null);
    }
  };

  const handleDeleteTransportation = async (operation: TransportationOperation) => {
    if (deletingTransportationId || !operation.transportationOpId) return;
    const confirmed = window.confirm(`Delete transportation operation ${operation.transportationOpId}?`);
    if (!confirmed) return;

    setDeletingTransportationId(operation.transportationOpId);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/operations/transportation/${operation.transportationOpId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to delete transportation operation.';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        alert(errorMessage);
        return;
      }

      // Refresh transportation operations list
      void apiGet<TransportationOperation[]>('/operations/transportation', mockTransportationOperations).then(
        (data) => {
          setTransportationOps(
            data.map((op) => ({
              transportationOpId: op.transportationOpId,
              plateNum: op.plateNum,
              startingLoc: op.startingLoc,
              endingLoc: op.endingLoc,
              operationDate: op.operationDate,
              notes: op.notes,
            })),
          );
        },
      );
    } catch (error) {
      console.error('Error deleting transportation operation:', error);
      alert(`Failed to delete transportation operation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeletingTransportationId(null);
    }
  };

  const tabContent = {
    internal: (
      <DataTable
        searchable={true}
        columns={[
          { key: 'customerName', header: 'Müşteri', searchable: true },
          { key: 'machineNumber', header: 'Makine #', searchable: true },
          { key: 'workingSiteName', header: 'Şantiye', searchable: true },
          {
            key: 'startDate',
            header: 'Başlangıç Tarihi',
            searchable: true,
            render: (operation: InternalOperation) => formatDate(operation.startDate),
          },
          {
            key: 'endDate',
            header: 'Bitiş Tarihi',
            searchable: true,
            render: (operation: InternalOperation) => formatDate(operation.endDate),
          },
          {
            key: 'actions',
            header: 'İşlemler',
            searchable: false,
            render: (operation: InternalOperation) => (
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.editButton}
                  onClick={() => openEditForm(operation)}
                  title="Operasyonu düzenle"
                  aria-label="Operasyonu düzenle"
                >
                  Düzenle
                </button>
                <button
                  type="button"
                  className={styles.editButton}
                  onClick={() => operation.id && openDetailsForm(operation.id, 'internal')}
                  title="Operasyon detayları"
                  aria-label="Operasyon detayları"
                >
                  Detaylar
                </button>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => handleDeleteInternal(operation)}
                  disabled={deletingInternalId === operation.id}
                  title="Operasyonu sil"
                  aria-label="Operasyonu sil"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ),
          },
        ]}
        data={filteredInternal}
      />
    ),
    outsource: (
      <DataTable
        searchable={true}
        columns={[
          { key: 'customerName', header: 'Müşteri', searchable: true },
          { key: 'outsourcerName', header: 'Taşeron', searchable: true },
          { key: 'machineCode', header: 'Makine Kodu', searchable: true },
          {
            key: 'startDate',
            header: 'Başlangıç Tarihi',
            searchable: true,
            render: (operation: OutsourceOperation) => formatDate(operation.startDate),
          },
          {
            key: 'endDate',
            header: 'Bitiş Tarihi',
            searchable: true,
            render: (operation: OutsourceOperation) => formatDate(operation.endDate),
          },
          {
            key: 'actions',
            header: 'İşlemler',
            searchable: false,
            render: (operation: OutsourceOperation) => (
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.editButton}
                  onClick={() => openEditForm(operation)}
                  title="Operasyonu düzenle"
                  aria-label="Operasyonu düzenle"
                >
                  Düzenle
                </button>
                <button
                  type="button"
                  className={styles.editButton}
                  onClick={() => operation.id && openDetailsForm(operation.id, 'outsource')}
                  title="Operasyon detayları"
                  aria-label="Operasyon detayları"
                >
                  Detaylar
                </button>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => handleDeleteOutsource(operation)}
                  disabled={deletingOutsourceId === operation.id}
                  title="Operasyonu sil"
                  aria-label="Operasyonu sil"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ),
          },
        ]}
        data={filteredOutsource}
      />
    ),
    service: (
      <DataTable
        searchable={true}
        columns={[
          { key: 'machineNumber', header: 'Makine #', searchable: true },
          { key: 'type', header: 'Tip', searchable: true },
          { key: 'description', header: 'Açıklama', searchable: true },
          {
            key: 'createdAt',
            header: 'Oluşturulma',
            searchable: true,
            render: (operation: ServiceOperation) => formatDate(operation.createdAt),
          },
          {
            key: 'actions',
            header: 'İşlemler',
            searchable: false,
            render: (operation: ServiceOperation) => (
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.editButton}
                  onClick={() => openEditForm(operation)}
                  title="Operasyonu düzenle"
                  aria-label="Operasyonu düzenle"
                >
                  Düzenle
                </button>
                <button
                  type="button"
                  className={styles.editButton}
                  onClick={() => operation.id && openDetailsForm(operation.id, 'service')}
                  title="Operasyon detayları"
                  aria-label="Operasyon detayları"
                >
                  Detaylar
                </button>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => handleDeleteService(operation)}
                  disabled={deletingServiceId === operation.id}
                  title="Operasyonu sil"
                  aria-label="Operasyonu sil"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ),
          },
        ]}
        data={filteredService}
      />
    ),
    transportation: (
      <DataTable
        searchable={true}
        columns={[
          { key: 'transportationOpId', header: 'ID', searchable: true },
          { key: 'plateNum', header: 'Plaka #', searchable: true },
          { key: 'startingLoc', header: 'Başlangıç Konumu', searchable: true },
          { key: 'endingLoc', header: 'Bitiş Konumu', searchable: true },
          {
            key: 'operationDate',
            header: 'Tarih',
            searchable: true,
            render: (operation: TransportationOperation) => formatDate(operation.operationDate),
          },
          { key: 'notes', header: 'Notlar', searchable: true },
          {
            key: 'actions',
            header: 'İşlemler',
            searchable: false,
            render: (operation: TransportationOperation) => (
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.editButton}
                  onClick={() => openEditForm(operation)}
                  title="Operasyonu düzenle"
                  aria-label="Operasyonu düzenle"
                >
                  Düzenle
                </button>
                <button
                  type="button"
                  className={styles.editButton}
                  onClick={() => openDetailsForm(operation.transportationOpId, 'transportation')}
                  title="Operasyon detayları"
                  aria-label="Operasyon detayları"
                >
                  Detaylar
                </button>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => handleDeleteTransportation(operation)}
                  disabled={deletingTransportationId === operation.transportationOpId}
                  title="Operasyonu sil"
                  aria-label="Operasyonu sil"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ),
          },
        ]}
        data={filteredTransportation}
      />
    ),
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Operasyonlar</h1>
          <p>İç, taşeron, servis ve nakliye faaliyetlerini inceleyin.</p>
        </div>
      </header>

      <Tabs
        tabs={[
          { id: 'internal', label: 'İç', badge: String(internalOps.length) },
          {
            id: 'outsource',
            label: 'Taşeron',
            badge: String(outsourceOps.length),
          },
          { id: 'service', label: 'Servis', badge: String(serviceOps.length) },
          {
            id: 'transportation',
            label: 'Nakliye',
            badge: String(transportationOps.length),
          },
        ]}
        active={tab}
        onChange={setTab}
        actions={
          <button type="button" className={styles.insertButton} onClick={openForm}>
            + Operasyon Ekle
          </button>
        }
      >
        {tabContent[tab]}
      </Tabs>

      {/* Internal Operation Form */}
      {tab === 'internal' && (
        <Modal
          title={editingInternalId ? "İç Operasyon Düzenle" : "İç Operasyon Ekle"}
          open={formModalOpen}
          onClose={closeForm}
        >
          <form className={styles.form} onSubmit={handleInternalSubmit}>
            <label>
              <span>Müşteri Adı</span>
              <select
                value={internalForm.customerName}
                onChange={(e) =>
                  setInternalForm((prev) => ({ ...prev, customerName: e.target.value }))
                }
              >
                <option value="">Müşteri Seç</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.name}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Makine</span>
              <select
                value={internalForm.machineNumber || ''}
                onChange={(e) => {
                  // Check both idleMachinery and all machinery to find the selected machine
                  const selectedMachine = idleMachinery.find(
                    (m) => m.machineNumber === e.target.value,
                  ) || machinery.find(
                    (m) => m.machineNumber === e.target.value,
                  );
                  if (selectedMachine) {
                    setInternalForm((prev) => ({
                      ...prev,
                      machineNumber: selectedMachine.machineNumber,
                      machineCode: selectedMachine.machineCode,
                    }));
                  } else {
                    setInternalForm((prev) => ({
                      ...prev,
                      machineNumber: '',
                      machineCode: '',
                    }));
                  }
                }}
              >
                <option value="">Boşta Makine Seç</option>
                {idleMachinery.map((machine) => (
                  <option key={machine.id} value={machine.machineNumber}>
                    {machine.machineNumber} - {machine.machineCode}
                  </option>
                ))}
              </select>
            </label>
            {internalForm.machineCode && (
              <label>
                <span>Makine Kodu</span>
                <input
                  type="text"
                  value={internalForm.machineCode}
                  readOnly
                  style={{
                    backgroundColor: '#f1f5f9',
                    cursor: 'not-allowed',
                  }}
                />
              </label>
            )}
            <label>
              <span>Şantiye Adı</span>
              <select
                value={internalForm.workingSiteName || ''}
                onChange={(e) =>
                  setInternalForm((prev) => ({ ...prev, workingSiteName: e.target.value }))
                }
              >
                <option value="">Şantiye Seç</option>
                {workingSites.map((site) => (
                  <option key={site.id} value={site.workingSiteName}>
                    {site.workingSiteName} {site.location ? `- ${site.location}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Başlangıç Tarihi (GG/AA/YYYY)</span>
              <DateTimeInput
                value={internalForm.startDate}
                onChange={(value) => setInternalForm((prev) => ({ ...prev, startDate: value }))}
              />
            </label>
            <label>
              <span>Bitiş Tarihi (GG/AA/YYYY SS:DD)</span>
              <DateTimeInput
                value={internalForm.endDate}
                onChange={(value) => setInternalForm((prev) => ({ ...prev, endDate: value }))}
              />
            </label>
            <footer className={styles.footer}>
              <button type="button" onClick={closeForm}>
                İptal
              </button>
              <button type="submit">{editingInternalId ? "Operasyonu Güncelle" : "Operasyon Ekle"}</button>
            </footer>
          </form>
        </Modal>
      )}

      {/* Outsource Operation Form */}
      {tab === 'outsource' && (
        <Modal title={editingOutsourceId ? "Taşeron Operasyon Düzenle" : "Taşeron Operasyon Ekle"} open={formModalOpen} onClose={closeForm}>
          <form className={styles.form} onSubmit={handleOutsourceSubmit}>
            <label>
              <span>Müşteri Adı</span>
              <select
                value={outsourceForm.customerName}
                onChange={(e) =>
                  setOutsourceForm((prev) => ({ ...prev, customerName: e.target.value }))
                }
              >
                <option value="">Müşteri Seç</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.name}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Taşeron Adı</span>
              <select
                value={outsourceForm.outsourcerName}
                onChange={(e) =>
                  setOutsourceForm((prev) => ({ ...prev, outsourcerName: e.target.value }))
                }
              >
                <option value="">Taşeron Seç</option>
                {outsourcers.map((outsourcer) => (
                  <option key={outsourcer.id} value={outsourcer.name}>
                    {outsourcer.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Makine Kodu</span>
              <input
                value={outsourceForm.machineCode}
                onChange={(e) =>
                  setOutsourceForm((prev) => ({ ...prev, machineCode: e.target.value }))
                }
                placeholder="Taşeronun makine kodunu girin"
              />
            </label>
            <label>
              <span>Şantiye Adı</span>
              <select
                value={outsourceForm.workingSiteName || ''}
                onChange={(e) =>
                  setOutsourceForm((prev) => ({ ...prev, workingSiteName: e.target.value }))
                }
              >
                <option value="">Şantiye Seç</option>
                {workingSites.map((site) => (
                  <option key={site.id} value={site.workingSiteName}>
                    {site.workingSiteName} {site.location ? `- ${site.location}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Başlangıç Tarihi (GG/AA/YYYY SS:DD)</span>
              <DateTimeInput
                value={outsourceForm.startDate}
                onChange={(value) => setOutsourceForm((prev) => ({ ...prev, startDate: value }))}
              />
            </label>
            <label>
              <span>Bitiş Tarihi (GG/AA/YYYY SS:DD)</span>
              <DateTimeInput
                value={outsourceForm.endDate}
                onChange={(value) => setOutsourceForm((prev) => ({ ...prev, endDate: value }))}
              />
            </label>
            <footer className={styles.footer}>
              <button type="button" onClick={closeForm}>
                İptal
              </button>
              <button type="submit">{editingOutsourceId ? "Operasyonu Güncelle" : "Operasyon Ekle"}</button>
            </footer>
          </form>
        </Modal>
      )}

      {/* Service Operation Form */}
      {tab === 'service' && (
        <Modal title={editingServiceId ? "Servis Operasyon Düzenle" : "Servis Operasyon Ekle"} open={formModalOpen} onClose={closeForm}>
          <form className={styles.form} onSubmit={handleServiceSubmit}>
            <label>
              <span>Makine Numarası</span>
              <select
                value={serviceForm.machineNumber || ''}
                onChange={(e) => {
                  setServiceForm((prev) => ({
                    ...prev,
                    machineNumber: e.target.value,
                  }));
                }}
              >
                <option value="">Boşta Makine Seç</option>
                {idleMachinery.map((machine) => (
                  <option key={machine.id} value={machine.machineNumber}>
                    {machine.machineNumber} - {machine.machineCode}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Tip</span>
              <input
                value={serviceForm.type}
                onChange={(e) =>
                  setServiceForm((prev) => ({ ...prev, type: e.target.value }))
                }
              />
            </label>
            <label>
              <span>Açıklama</span>
              <textarea
                value={serviceForm.description}
                onChange={(e) =>
                  setServiceForm((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={4}
              />
            </label>
            <label>
              <span>Kullanılan Parçalar</span>
              <input
                value={serviceForm.usedParts}
                onChange={(e) =>
                  setServiceForm((prev) => ({ ...prev, usedParts: e.target.value }))
                }
              />
            </label>
            <footer className={styles.footer}>
              <button type="button" onClick={closeForm}>
                İptal
              </button>
              <button type="submit">{editingServiceId ? "Operasyonu Güncelle" : "Operasyon Ekle"}</button>
            </footer>
          </form>
        </Modal>
      )}

      {/* Transportation Operation Form */}
      {tab === 'transportation' && (
        <Modal title={editingTransportationId ? "Nakliye Operasyon Düzenle" : "Nakliye Operasyon Ekle"} open={formModalOpen} onClose={closeForm}>
          <form className={styles.form} onSubmit={handleTransportationSubmit}>
            <label>
              <span>Plaka Numarası</span>
              <select
                value={transportationForm.plateNum || ''}
                onChange={(e) =>
                  setTransportationForm((prev) => ({ ...prev, plateNum: e.target.value }))
                }
              >
                <option value="">Araç Seç</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.plateNumber || ''}>
                    {vehicle.plateNumber || 'No Plate'} {vehicle.vehicleType ? `- ${vehicle.vehicleType}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Başlangıç Konumu</span>
              <select
                value={transportationForm.startingLoc || ''}
                onChange={(e) =>
                  setTransportationForm((prev) => ({ ...prev, startingLoc: e.target.value }))
                }
              >
                <option value="">Başlangıç Konumu Seç</option>
                {workingSites.map((site) => (
                  <option key={site.id} value={site.workingSiteName}>
                    {site.workingSiteName} {site.location ? `- ${site.location}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Bitiş Konumu</span>
              <select
                value={transportationForm.endingLoc || ''}
                onChange={(e) =>
                  setTransportationForm((prev) => ({ ...prev, endingLoc: e.target.value }))
                }
              >
                <option value="">Bitiş Konumu Seç</option>
                {workingSites.map((site) => (
                  <option key={site.id} value={site.workingSiteName}>
                    {site.workingSiteName} {site.location ? `- ${site.location}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Operasyon Tarihi (GG/AA/YYYY)</span>
              <DateTimeInput
                value={transportationForm.operationDate}
                onChange={(value) => setTransportationForm((prev) => ({ ...prev, operationDate: value }))}
              />
            </label>
            <label>
              <span>Notlar</span>
              <textarea
                value={transportationForm.notes}
                onChange={(e) =>
                  setTransportationForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={4}
              />
            </label>
            <footer className={styles.footer}>
              <button type="button" onClick={closeForm}>
                İptal
              </button>
              <button type="submit">{editingTransportationId ? "Operasyonu Güncelle" : "Operasyon Ekle"}</button>
            </footer>
          </form>
        </Modal>
      )}

      {/* Operation Details Form */}
      <Modal
        title="Operasyon Detayları"
        open={detailsModalOpen}
        onClose={closeDetailsForm}
      >
        <form className={styles.form} onSubmit={handleDetailsSubmit}>
          <label>
            <span>Teslimat Nakliyesi</span>
            <select
              value={detailsForm.deliveryTransportation}
              onChange={(e) =>
                setDetailsForm((prev) => ({ ...prev, deliveryTransportation: e.target.value }))
              }
            >
              <option value="">Nakliye Operasyonu Seç</option>
              {transportationOps.map((op) => (
                <option key={op.transportationOpId} value={op.transportationOpId}>
                  ID: {op.transportationOpId} - {op.plateNum || 'N/A'} ({op.startingLoc || 'N/A'} → {op.endingLoc || 'N/A'})
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Toplama Nakliyesi</span>
            <select
              value={detailsForm.pickupTransportation}
              onChange={(e) =>
                setDetailsForm((prev) => ({ ...prev, pickupTransportation: e.target.value }))
              }
            >
              <option value="">Nakliye Operasyonu Seç</option>
              {transportationOps.map((op) => (
                <option key={op.transportationOpId} value={op.transportationOpId}>
                  ID: {op.transportationOpId} - {op.plateNum || 'N/A'} ({op.startingLoc || 'N/A'} → {op.endingLoc || 'N/A'})
                </option>
              ))}
            </select>
          </label>
          {/* File uploads */}
          <label>
            <span>Fiyat Teklifi PDF</span>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setDetailsForm((prev) => ({ ...prev, pricingProposalPdf: file }));
              }}
            />
            {operationDetails?.pricingProposalPdf && (
              <div style={{ marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    const width = window.innerWidth * 0.7;
                    const height = window.innerHeight * 0.8;
                    const left = (window.innerWidth - width) / 2;
                    const top = (window.innerHeight - height) / 2;
                    const popup = window.open(
                      '',
                      'pdfViewer',
                      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
                    );
                    if (popup) {
                      popup.document.write(`
                        <html>
                          <head><title>Pricing Proposal PDF</title></head>
                          <body style="margin:0;padding:0;">
                            <embed src="data:application/pdf;base64,${operationDetails.pricingProposalPdf}" 
                                   type="application/pdf" 
                                   width="100%" 
                                   height="100%" 
                                   style="border:none;" />
                          </body>
                        </html>
                      `);
                      popup.document.close();
                    }
                  }}
                  style={{ 
                    color: '#2563eb', 
                    textDecoration: 'underline', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    padding: 0,
                    font: 'inherit'
                  }}
                >
                  Mevcut PDF'i Görüntüle
                </button>
              </div>
            )}
          </label>

          <label>
            <span>Fatura PDF</span>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setDetailsForm((prev) => ({ ...prev, invoicePdf: file }));
              }}
            />
            {operationDetails?.invoicePdf && (
              <div style={{ marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    const width = window.innerWidth * 0.7;
                    const height = window.innerHeight * 0.8;
                    const left = (window.innerWidth - width) / 2;
                    const top = (window.innerHeight - height) / 2;
                    const popup = window.open(
                      '',
                      'pdfViewer',
                      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
                    );
                    if (popup) {
                      popup.document.write(`
                        <html>
                          <head><title>Invoice PDF</title></head>
                          <body style="margin:0;padding:0;">
                            <embed src="data:application/pdf;base64,${operationDetails.invoicePdf}" 
                                   type="application/pdf" 
                                   width="100%" 
                                   height="100%" 
                                   style="border:none;" />
                          </body>
                        </html>
                      `);
                      popup.document.close();
                    }
                  }}
                  style={{ 
                    color: '#2563eb', 
                    textDecoration: 'underline', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    padding: 0,
                    font: 'inherit'
                  }}
                >
                  Mevcut PDF'i Görüntüle
                </button>
              </div>
            )}
          </label>

          <label>
            <span>Teslimat Görüntü Paketi (Çoklu Görüntü)</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setDetailsForm((prev) => ({ ...prev, imageDeliveryBundle: files }));
              }}
            />
            {detailsForm.imageDeliveryBundle.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: '#64748b' }}>
                  Yeni seçilen görüntüler ({detailsForm.imageDeliveryBundle.length}):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {detailsForm.imageDeliveryBundle.map((file, idx) => (
                      <img
                        key={idx}
                        src={deliveryImageUrls[idx]}
                        alt={file.name || `Delivery ${idx + 1}`}
                        onClick={() => {
                          const width = window.innerWidth * 0.7;
                          const height = window.innerHeight * 0.8;
                          const left = (window.innerWidth - width) / 2;
                          const top = (window.innerHeight - height) / 2;
                          const popup = window.open(
                            '',
                            `newImageViewer_delivery_${idx}`,
                            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
                          );
                          if (popup) {
                            popup.document.write(`
                              <html>
                                <head>
                                  <title>${file.name || `Delivery Image ${idx + 1}`}</title>
                                  <style>
                                    body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; background: #f5f5f5; }
                                    img { max-width: 100%; max-height: 100%; object-fit: contain; }
                                  </style>
                                </head>
                                <body>
                                  <img src="${deliveryImageUrls[idx]}" alt="${file.name || `Delivery ${idx + 1}`}" />
                                </body>
                              </html>
                            `);
                            popup.document.close();
                          }
                        }}
                        style={{ 
                          maxWidth: '100px', 
                          maxHeight: '100px', 
                          objectFit: 'contain', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    ))}
                </div>
              </div>
            )}
            {operationDetails?.imageDeliveryBundle && operationDetails.imageDeliveryBundle.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: '#64748b' }}>
                  Mevcut görüntüler ({operationDetails.imageDeliveryBundle.length}):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {operationDetails.imageDeliveryBundle.map((img, idx) => (
                    <img
                      key={idx}
                      src={`data:${img.mimeType};base64,${img.data}`}
                      alt={img.filename || `Delivery ${idx + 1}`}
                      onClick={() => {
                        const width = window.innerWidth * 0.7;
                        const height = window.innerHeight * 0.8;
                        const left = (window.innerWidth - width) / 2;
                        const top = (window.innerHeight - height) / 2;
                        const popup = window.open(
                          '',
                          `imageViewer_${idx}`,
                          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
                        );
                        if (popup) {
                          popup.document.write(`
                            <html>
                              <head>
                                <title>${img.filename || `Delivery Image ${idx + 1}`}</title>
                                <style>
                                  body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; background: #f5f5f5; }
                                  img { max-width: 100%; max-height: 100%; object-fit: contain; }
                                </style>
                              </head>
                              <body>
                                <img src="data:${img.mimeType};base64,${img.data}" alt="${img.filename || `Delivery ${idx + 1}`}" />
                              </body>
                            </html>
                          `);
                          popup.document.close();
                        }
                      }}
                      style={{ 
                        maxWidth: '100px', 
                        maxHeight: '100px', 
                        objectFit: 'contain', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </label>

          <label>
            <span>Toplama Görüntü Paketi (Çoklu Görüntü)</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setDetailsForm((prev) => ({ ...prev, imagePickupBundle: files }));
              }}
            />
            {detailsForm.imagePickupBundle.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: '#64748b' }}>
                  Yeni seçilen görüntüler ({detailsForm.imagePickupBundle.length}):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {detailsForm.imagePickupBundle.map((file, idx) => (
                      <img
                        key={idx}
                        src={pickupImageUrls[idx]}
                        alt={file.name || `Pickup ${idx + 1}`}
                        onClick={() => {
                          const width = window.innerWidth * 0.7;
                          const height = window.innerHeight * 0.8;
                          const left = (window.innerWidth - width) / 2;
                          const top = (window.innerHeight - height) / 2;
                          const popup = window.open(
                            '',
                            `newImageViewer_pickup_${idx}`,
                            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
                          );
                          if (popup) {
                            popup.document.write(`
                              <html>
                                <head>
                                  <title>${file.name || `Pickup Image ${idx + 1}`}</title>
                                  <style>
                                    body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; background: #f5f5f5; }
                                    img { max-width: 100%; max-height: 100%; object-fit: contain; }
                                  </style>
                                </head>
                                <body>
                                  <img src="${pickupImageUrls[idx]}" alt="${file.name || `Pickup ${idx + 1}`}" />
                                </body>
                              </html>
                            `);
                            popup.document.close();
                          }
                        }}
                        style={{ 
                          maxWidth: '100px', 
                          maxHeight: '100px', 
                          objectFit: 'contain', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '0.25rem',
                          cursor: 'pointer',
                          transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    ))}
                </div>
              </div>
            )}
            {operationDetails?.imagePickupBundle && operationDetails.imagePickupBundle.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: '#64748b' }}>
                  Mevcut görüntüler ({operationDetails.imagePickupBundle.length}):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {operationDetails.imagePickupBundle.map((img, idx) => (
                    <img
                      key={idx}
                      src={`data:${img.mimeType};base64,${img.data}`}
                      alt={img.filename || `Pickup ${idx + 1}`}
                      onClick={() => {
                        const width = window.innerWidth * 0.7;
                        const height = window.innerHeight * 0.8;
                        const left = (window.innerWidth - width) / 2;
                        const top = (window.innerHeight - height) / 2;
                        const popup = window.open(
                          '',
                          `imageViewer_pickup_${idx}`,
                          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
                        );
                        if (popup) {
                          popup.document.write(`
                            <html>
                              <head>
                                <title>${img.filename || `Pickup Image ${idx + 1}`}</title>
                                <style>
                                  body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; background: #f5f5f5; }
                                  img { max-width: 100%; max-height: 100%; object-fit: contain; }
                                </style>
                              </head>
                              <body>
                                <img src="data:${img.mimeType};base64,${img.data}" alt="${img.filename || `Pickup ${idx + 1}`}" />
                              </body>
                            </html>
                          `);
                          popup.document.close();
                        }
                      }}
                      style={{ 
                        maxWidth: '100px', 
                        maxHeight: '100px', 
                        objectFit: 'contain', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </label>
          <footer className={styles.footer}>
            <button type="button" onClick={closeDetailsForm}>
              Cancel
            </button>
            <button type="submit">{operationDetails ? 'Detayları Güncelle' : 'Detayları Kaydet'}</button>
          </footer>
        </form>
      </Modal>
    </div>
  );
}

function formatDate(value: string | null | undefined) {
  return formatDateDDMMYYYY(value);
}

