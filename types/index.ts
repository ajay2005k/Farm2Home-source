export type Role = "customer" | "farmer" | "admin";

export type AuthUser = {
  username: string;
  name: string;
  email: string;
  role: Role;
  avatarInitials: string;
};

export type ClusterType = "farm_production" | "consumer_delivery";

export type Cluster = {
  id: string;
  name: string;
  type: ClusterType;
  region: string;
  hubLocation: string;
  activeCount: number; // farmers for production clusters, residents for consumer delivery drops
  capacity: string;
  nextDispatchSlot: string;
  savingsSummary: string;
  distanceToCityKm: number;
  carbonFootprintKg: number;
  status: "Active" | "Scheduled" | "Paused";
};

export type PriceBreakdown = {
  farmerPayout: number; // Direct to farmer bank
  farmerPercentage: number; // % of total price
  clusterHubFee: number; // Solar pre-cooling, grading, sorting
  coldTransitFee: number; // Consolidated freight based on mileage
  platformFee: number; // Quality certification & platform ops
  retailEquivalentMandi: number; // Conventional supermarket / mandi retail price
  traditionalMiddlemenCut: number; // What broker layers take conventionally
  traditionalFarmerPayout: number; // What farmer typically receives in conventional chain
};

export type ProductSource = {
  clusterId: string;
  clusterName: string;
  farmer: string;
  farm: string;
  location: string;
  distanceKm: number;
  price: number;
  stock: number;
  harvestTime: string;
  organic: boolean;
  tag?: string;
  highlight?: "miles" | "margin" | "price" | "organic";
  breakdown: PriceBreakdown;
};

export type Product = {
  id: number;
  name: string;
  category: string;
  image: string;
  unit: string;
  rating: number;
  description: string;
  // Primary / default source fields:
  farmer: string;
  farm: string;
  location: string;
  clusterId: string;
  clusterName: string;
  price: number;
  organic: boolean;
  stock: number;
  breakdown: PriceBreakdown;
  // Multi-cluster sourcing options for full transparency:
  sources: ProductSource[];
};

export type OrderStatus = "New" | "Accepted" | "Preparing" | "Ready" | "Completed";

export type CartItem = {
  productId: number;
  sourceClusterId: string;
  quantity: number;
};

export type Order = {
  id: string;
  customer: string;
  product: string;
  amount: number;
  farmerPayoutTotal?: number;
  status: OrderStatus;
  date: string;
  deliveryType?: "doorstep" | "cluster_pickup";
  sourceClusterId?: string;
  sourceClusterName?: string;
  farmer?: string;
  clusterId?: string;
  clusterName?: string;
  pickupPoint?: string;
};

export type Tenant = {
  id: string;
  name: string;
  initials: string;
  farmers: number;
  customers: number;
  orders: number;
  revenue: string;
  clustersCount: number;
  status: "Active" | "Paused";
};
