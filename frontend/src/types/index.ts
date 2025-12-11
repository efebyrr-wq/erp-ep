export type Customer = {
  id: string;
  name: string;
  balance: string;
  phoneNumber?: string | null;
  address?: string | null;
  email?: string | null;
  vergiDairesi?: string | null;
  vkn?: string | null;
  createdAt?: string;
  contacts?: ContactPerson[];
};

export type ContactPerson = {
  id: string;
  customerId?: string;
  name: string;
  role: string;
  email: string;
  phoneNumber: string;
  createdAt?: string;
};

export type WorkingSite = {
  id: string;
  workingSiteName: string;
  location: string;
  latitude?: string | null;
  longitude?: string | null;
  createdAt?: string;
};

export type Supplier = {
  id: string;
  name: string;
  balance: string;
  createdAt?: string;
  contacts?: SupplierContact[];
  supplies?: Supply[];
};

export type SupplierContact = {
  id: string;
  supplierId?: string;
  name: string;
  role: string;
  email: string;
  phoneNumber: string;
  createdAt?: string;
};

export type Outsourcer = {
  id: string;
  name: string;
  balance: string;
  createdAt?: string;
  contacts?: OutsourcerContact[];
};

export type OutsourcerContact = {
  id: string;
  outsourcerId?: string;
  name: string;
  role?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  createdAt?: string;
};

export type Supply = {
  id: string;
  supplierId?: string;
  type: string;
  productName: string;
  quantity: number;
  price: string;
  createdAt?: string;
};

export type InventoryItem = {
  id: string;
  itemName: string;
  quantity: number;
  referenceBillId?: string | null;
  usedAt?: string | null;
};

export type Machinery = {
  id: string;
  machineNumber: string;
  machineCode: string;
  status?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  createdAt?: string;
  specs?: MachinerySpec[];
};

export type MachinerySpec = {
  id: string;
  machineryId: string;
  specName: string;
  specValue: string;
};

export type InternalOperation = {
  id: string;
  customerName: string | null;
  machineNumber: string | null;
  machineCode: string | null;
  workingSiteName: string | null;
  startDate: string | null;
  endDate: string | null;
};

export type OutsourceOperation = {
  id: string;
  customerName: string | null;
  outsourcerName: string | null;
  machineCode: string | null;
  workingSiteName: string | null;
  startDate: string | null;
  endDate: string | null;
};

export type ServiceOperation = {
  id: string;
  machineNumber: string | null;
  type: string | null;
  description: string | null;
  createdAt?: string;
  usedParts: string | null;
};

export type TransportationOperation = {
  transportationOpId: string;
  plateNum: string | null;
  startingLoc: string | null;
  endingLoc: string | null;
  operationDate: string | null;
  notes: string | null;
};

export type ImageBundleItem = {
  data: string; // base64 encoded image
  mimeType: string; // e.g., 'image/jpeg', 'image/png'
  filename?: string;
};

export type OperationDetails = {
  operationId: string;
  operationType: 'internal' | 'outsource' | 'service' | 'transportation';
  deliveryTransportation: string | null;
  pickupTransportation: string | null;
  // Legacy text fields
  pricingProposal: string | null;
  imageDelivery: string | null;
  imagePickup: string | null;
  invoiceOperation: string | null;
  // Binary data fields
  pricingProposalPdf: string | null; // base64 encoded PDF
  invoicePdf: string | null; // base64 encoded PDF
  imageDeliveryBundle: ImageBundleItem[] | null;
  imagePickupBundle: ImageBundleItem[] | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Bill = {
  id: string;
  customerName: string | null;
  totalAmount: string | null;
  billDate: string | null;
  taxed: boolean | null;
  billLines?: BillLine[];
};

export type BillLine = {
  id?: string;
  billLineId?: string | null;
  customerName: string | null;
  type: string | null;
  details: string | null;
  unitPrice: string | null;
  amount: string | null;
  totalPrice: string | null;
  billId?: string | null;
  operationId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

export type Invoice = {
  id: string;
  supplierOutsourcerName: string | null;
  totalAmount: string | null;
  billDate: string | null;
  taxed: boolean | null;
};

export type CollectionsCheck = {
  id: string;
  customerName: string | null;
  checkDate: string | null;
  amount: string | null;
  collectionDate: string | null;
  accountName: string | null;
  notes: string | null;
};

export type CollectionCreditCard = {
  id: string;
  customerName: string | null;
  transactionDate: string | null;
  amount: string | null;
  paymentTo: string | null;
  creditCardFee: string | null;
  notes: string | null;
};

export type CollectionCash = {
  id: string;
  customerName: string | null;
  transactionDate: string | null;
  amount: string | null;
  accountName: string | null;
  notes: string | null;
};

export type PaymentCheck = {
  id: string;
  collectorName: string | null;
  checkDate: string | null;
  amount: string | null;
  collectionDate: string | null;
  accountName: string | null;
  customerName: string | null;
  notes: string | null;
};

export type PaymentCreditCard = {
  id: string;
  collectorName: string | null;
  transactionDate: string | null;
  amount: string | null;
  paymentFrom: string | null;
  creditCardFee: string | null;
  notes: string | null;
  installmentPeriod?: number | null;
  customerName: string | null;
};

export type PaymentsCash = {
  id: string;
  collectorName: string | null;
  transactionDate: string | null;
  amount: string | null;
  accountName: string | null;
  customerName: string | null;
  notes: string | null;
};

export type Account = {
  id: string;
  type: string | null;
  accountName: string | null;
  balance: string | null;
  createdAt?: string;
  cutoffDay?: number | null;
};

export type Personel = {
  id: string;
  personelName: string;
  startDate?: string | null;
  endDate?: string | null;
  tcKimlik?: string | null;
  birthDate?: string | null;
  role?: string | null;
  createdAt?: string;
  details?: PersonelDetail[];
};

export type PersonelDetail = {
  id: string;
  personelId: string;
  detailName: string;
  detailValue: string;
  createdAt?: string;
};

export type PersonelPayment = {
  id: string;
  personelName: string;
  paymentAccount?: string | null;
  amount?: string | null;
  date?: string | null;
  notes?: string | null;
  createdAt?: string;
};

export type Vehicle = {
  id: string;
  plateNumber: string | null;
  vehicleType: string | null;
  examinationDate: string | null;
  insuranceDate: string | null;
  createdAt?: string;
};

export type TaxPayment = {
  id: string;
  taxType: string; // 'SGK Primleri', 'Kurumlar Vergisi', 'KDV'
  amount: string;
  paymentDate: string;
  accountId: string;
  accountName: string | null;
  notes: string | null;
  createdAt?: string;
};




