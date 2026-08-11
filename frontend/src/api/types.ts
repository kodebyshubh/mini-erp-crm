export type Role = "ADMIN" | "SALES" | "WAREHOUSE" | "ACCOUNTS";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: Pagination;
}

export type CustomerType = "RETAIL" | "WHOLESALE" | "DISTRIBUTOR";
export type CustomerStatus = "LEAD" | "ACTIVE" | "INACTIVE";

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  businessName?: string | null;
  gstNumber?: string | null;
  customerType: CustomerType;
  address?: string | null;
  status: CustomerStatus;
  followUpDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  followUps?: FollowUp[];
  challans?: Challan[];
}

export interface FollowUp {
  id: string;
  customerId: string;
  note: string;
  followUpDate?: string | null;
  createdAt: string;
  createdBy?: { name: string };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category?: string | null;
  unitPrice: string | number;
  stock: number;
  minStock: number;
  location?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  quantity: number;
  movementType: "IN" | "OUT";
  reason: string;
  reference?: string | null;
  createdAt: string;
  product?: { name: string; sku: string };
  createdBy?: { name: string };
}

export type ChallanStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";

export interface ChallanItem {
  id: string;
  productId: string;
  productNameSnapshot: string;
  productSkuSnapshot: string;
  unitPriceSnapshot: string | number;
  quantity: number;
  lineTotal: string | number;
  product?: { name: string; sku: string };
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  status: ChallanStatus;
  totalQuantity: number;
  totalAmount: string | number;
  createdAt: string;
  confirmedAt?: string | null;
  customer?: Customer;
  items: ChallanItem[];
  invoice?: Invoice | null;
}

export type POStatus = "DRAFT" | "ORDERED" | "RECEIVED" | "CANCELLED";

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productNameSnapshot: string;
  productSkuSnapshot: string;
  unitCostSnapshot: string | number;
  quantity: number;
  lineTotal: string | number;
  product?: { name: string; sku: string };
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  status: POStatus;
  totalQuantity: number;
  totalAmount: string | number;
  createdAt: string;
  receivedAt?: string | null;
  items: PurchaseOrderItem[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  challanId: string;
  customerId: string;
  totalAmount: string | number;
  createdAt: string;
  customer?: Customer;
  challan?: Challan;
}
