export type Role = "customer" | "farmer" | "cluster_manager";

export interface Cluster {
  id: string;
  name: string;
  code: string;
  location: string;
  managerId: string;
  managerName: string;
  capacityKg: number;
  status: "Active" | "Maintenance";
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  clusterId?: string;
  clusterName?: string;
  farmName?: string;
  location?: string;
}

export type ProduceStatus = "Submitted" | "Collected" | "Accepted" | "Rejected";

export interface ProduceSubmission {
  id: string;
  farmerId: string;
  farmerName: string;
  farmName: string;
  clusterId: string;
  productName: string;
  category: string;
  unit: string;
  estimatedQuantity: number;
  pricePerUnit: number;
  organic: boolean;
  harvestDate: string;
  status: ProduceStatus;
  receivedQuantity?: number;
  acceptedQuantity?: number;
  rejectedQuantity?: number;
  rejectionReason?: string;
  verifiedAt?: string;
  submittedAt: string;
}

export type CollectionStatus = "Scheduled" | "In_Transit" | "Received" | "Verified";

export interface CollectionRequest {
  id: string;
  clusterId: string;
  farmerId: string;
  farmerName: string;
  submissionIds: string[];
  scheduledDate: string;
  status: CollectionStatus;
  createdAt: string;
}

export interface ConsolidatedInventoryItem {
  id: string;
  clusterId: string;
  clusterName: string;
  productName: string;
  category: string;
  unit: string;
  totalAcceptedQty: number;
  availableStockQty: number;
  allocatedQty: number;
  retailPrice: number;
  farmerCostPerUnit: number;
  organic: boolean;
  image: string;
  lastAggregatedAt: string;
}

export type OrderStatus = "Placed" | "Confirmed" | "Allocated" | "OutForDelivery" | "Delivered" | "Cancelled";

export interface OrderItem {
  productId: string;
  productName: string;
  qty: number;
  unit: string;
  price: number;
  clusterId?: string;
}

export interface CustomerOrder {
  id: string;
  customerId: string;
  customerName: string;
  deliveryAddress: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  status: OrderStatus;
  clusterId?: string;
  createdAt: string;
}

// Backward-compatibility alias for consumer product views
export type Product = {
  id: number;
  name: string;
  farmer: string;
  farm: string;
  location: string;
  rating: number;
  price: number;
  unit: string;
  organic: boolean;
  category: string;
  image: string;
  stock: number;
  clusterId?: string;
  clusterName?: string;
};

// Backward-compatibility alias for legacy types if needed
export type Order = {
  id: string;
  customer: string;
  product: string;
  amount: number;
  status: "New" | "Accepted" | "Preparing" | "Ready" | "Completed";
  date: string;
};
