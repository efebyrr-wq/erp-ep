import type {
  Account,
  Bill,
  CollectionCash,
  CollectionCreditCard,
  CollectionsCheck,
  Customer,
  InventoryItem,
  Machinery,
  MachinerySpec,
  OutsourceOperation,
  InternalOperation,
  ServiceOperation,
  Supplier,
  TransportationOperation,
  Invoice,
  PaymentCheck,
  PaymentCreditCard,
  PaymentsCash,
} from '../types';

export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Acme Construction',
    balance: '12500.00',
    createdAt: new Date().toISOString(),
    contacts: [
      {
        id: '1',
        name: 'Jane Miller',
        role: 'Procurement',
        email: 'jane@acme.com',
        phoneNumber: '+1 (555) 200-1234',
      },
    ],
  },
];

export const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'Global Steel Ltd',
    balance: '8200.00',
    contacts: [
      {
        id: '1',
        name: 'Carlos Ramirez',
        role: 'Sales Manager',
        email: 'c.ramirez@globalsteel.com',
        phoneNumber: '+1 (555) 441-2030',
      },
    ],
    supplies: [
      {
        id: '1',
        type: 'Material',
        productName: 'Reinforced Steel Bars',
        quantity: 120,
        price: '58.50',
      },
    ],
  },
];

export const mockInventory: InventoryItem[] = [
  {
    id: '1',
    itemName: 'Hydraulic Pump',
    quantity: 6,
    referenceBillId: '101',
    usedAt: new Date().toISOString(),
  },
];

export const mockMachinery: Machinery[] = [
  {
    id: '1',
    machineNumber: 'MCH-204',
    machineCode: 'DRL-700',
    status: 'Active',
  },
];

export const mockMachinerySpecs: MachinerySpec[] = [
  {
    id: '1',
    machineryId: '1',
    specName: 'Power Output',
    specValue: '700W',
  },
  {
    id: '2',
    machineryId: '1',
    specName: 'Maintenance Interval',
    specValue: '500 hours',
  },
];

export const mockInternalOperations: InternalOperation[] = [
  {
    id: '1',
    customerName: 'Acme Construction',
    machineNumber: 'MCH-204',
    machineCode: 'DRL-700',
    workingSiteName: 'North Plant',
    startDate: '2025-01-02',
    endDate: '2025-02-15',
    transportationOperationId: null,
  },
];

export const mockOutsourceOperations: OutsourceOperation[] = [
  {
    id: '1',
    customerName: 'Acme Construction',
    outsourcerName: 'IronWorks Outsourcing',
    machineCode: 'CUT-900',
    workingSiteName: 'East Yard',
    startDate: '2025-01-10',
    endDate: '2025-03-08',
    transportationOperationId: null,
  },
];

export const mockServiceOperations: ServiceOperation[] = [
  {
    id: '1',
    machineNumber: 'MCH-204',
    type: 'Preventive Maintenance',
    description: 'Replaced hydraulic seals and recalibrated power unit.',
    createdAt: new Date().toISOString(),
    usedParts: 'Hydraulic seal kit, calibration fluid',
  },
];

export const mockTransportationOperations: TransportationOperation[] = [
  {
    transportationOpId: '1',
    plateNum: '34 ERP 2045',
    startingLoc: 'North Plant',
    endingLoc: 'South Yard',
    operationDate: '2025-02-04',
    notes: 'Machinery relocation for maintenance',
  },
];

export const mockBills: Bill[] = [
  {
    id: '1',
    customerName: 'Acme Construction',
    totalAmount: '14,500.00',
    billDate: '2025-02-01',
    taxed: true,
  },
];

export const mockInvoices: Invoice[] = [
  {
    id: '1',
    supplierOutsourcerName: 'Global Steel Ltd',
    totalAmount: '9,200.00',
    billDate: '2025-01-28',
    taxed: false,
  },
];

export const mockCollectionsCheck: CollectionsCheck[] = [
  {
    id: '1',
    customerName: 'Acme Construction',
    checkDate: '2025-01-25',
    amount: '5,000.00',
    collectionDate: '2025-01-27',
    accountName: 'Corporate Account',
    notes: 'January installment',
  },
];

export const mockCollectionCreditCard: CollectionCreditCard[] = [
  {
    id: '1',
    customerName: 'StoneWorks LLC',
    transactionDate: '2025-02-03',
    amount: '3,200.00',
    paymentTo: 'ERP Services',
    creditCardFee: '48.00',
    notes: 'Service operation payment',
  },
];

export const mockCollectionCash: CollectionCash[] = [
  {
    id: '1',
    customerName: 'MetroBuild Corp',
    transactionDate: '2025-02-05',
    amount: '1,250.00',
    accountName: 'On-site register',
    notes: 'Equipment rental fee',
  },
];

export const mockPaymentCheck: PaymentCheck[] = [
  {
    id: '1',
    collectorName: 'Global Steel Ltd',
    checkDate: '2025-01-18',
    amount: '4,100.00',
    collectionDate: '2025-01-20',
    accountName: 'Accounts Payable',
    notes: 'Steel supply invoice #208',
  },
];

export const mockPaymentCreditCard: PaymentCreditCard[] = [
  {
    id: '1',
    collectorName: 'LogiTrans Delivery',
    transactionDate: '2025-01-30',
    amount: '980.00',
    paymentFrom: 'ERP Logistics',
    creditCardFee: '14.70',
    notes: 'Transportation operation settlement',
  },
];

export const mockPaymentsCash: PaymentsCash[] = [
  {
    id: '1',
    collectorName: 'Field Technician',
    transactionDate: '2025-02-04',
    amount: '320.00',
    accountName: 'Petty Cash',
    notes: 'Spare parts reimbursement',
  },
];

export const mockAccounts: Account[] = [
  {
    id: '1',
    type: 'Asset',
    accountName: 'Main Operating Account',
    balance: '52,300.00',
  },
  {
    id: '2',
    type: 'Liability',
    accountName: 'Accounts Payable',
    balance: '18,750.00',
  },
];

