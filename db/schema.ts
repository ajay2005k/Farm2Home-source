// Drizzle Schema for Farm2Home Cluster-Based Agricultural Supply Platform
// Ready for AWS RDS (PostgreSQL / Aurora) or Cloudflare D1 integration

import { pgTable, text, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";

export const clusters = pgTable("clusters", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  location: text("location").notNull(),
  managerId: text("manager_id").notNull(),
  managerName: text("manager_name").notNull(),
  capacityKg: integer("capacity_kg").notNull().default(5000),
  status: text("status").notNull().default("Active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(), // customer | farmer | cluster_manager
  clusterId: text("cluster_id"),
  clusterName: text("cluster_name"),
  farmName: text("farm_name"),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const farmerProduceSubmissions = pgTable("farmer_produce_submissions", {
  id: text("id").primaryKey(),
  farmerId: text("farmer_id").notNull(),
  farmerName: text("farmer_name").notNull(),
  farmName: text("farm_name").notNull(),
  clusterId: text("cluster_id").notNull(),
  productName: text("product_name").notNull(),
  category: text("category").notNull(),
  unit: text("unit").notNull(),
  estimatedQuantity: real("estimated_quantity").notNull(),
  pricePerUnit: real("price_per_unit").notNull(),
  organic: boolean("organic").notNull().default(false),
  harvestDate: text("harvest_date").notNull(),
  status: text("status").notNull().default("Submitted"), // Submitted | Collected | Accepted | Rejected
  receivedQuantity: real("received_quantity"),
  acceptedQuantity: real("accepted_quantity"),
  rejectedQuantity: real("rejected_quantity"),
  rejectionReason: text("rejection_reason"),
  verifiedAt: timestamp("verified_at"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const clusterInventories = pgTable("cluster_inventories", {
  id: text("id").primaryKey(),
  clusterId: text("cluster_id").notNull(),
  clusterName: text("cluster_name").notNull(),
  productName: text("product_name").notNull(),
  category: text("category").notNull(),
  unit: text("unit").notNull(),
  totalAcceptedQty: real("total_accepted_qty").notNull().default(0),
  availableStockQty: real("available_stock_qty").notNull().default(0),
  allocatedQty: real("allocated_qty").notNull().default(0),
  retailPrice: real("retail_price").notNull(),
  farmerCostPerUnit: real("farmer_cost_per_unit").notNull(),
  organic: boolean("organic").notNull().default(false),
  image: text("image"),
  lastAggregatedAt: timestamp("last_aggregated_at").defaultNow().notNull(),
});

export const customerOrders = pgTable("customer_orders", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull(),
  customerName: text("customer_name").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  subtotal: real("subtotal").notNull(),
  deliveryFee: real("delivery_fee").notNull(),
  discount: real("discount").notNull(),
  totalAmount: real("total_amount").notNull(),
  status: text("status").notNull().default("Placed"), // Placed | Confirmed | Allocated | OutForDelivery | Delivered
  clusterId: text("cluster_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
