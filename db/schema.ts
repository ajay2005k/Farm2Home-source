import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tenants = sqliteTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  initials: text("initials").notNull(),
  status: text("status", { enum: ["Active", "Paused"] }).notNull().default("Active"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const clusters = sqliteTable("clusters", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id),
  name: text("name").notNull(),
  type: text("type", { enum: ["farm_production", "consumer_delivery"] }).notNull(),
  region: text("region").notNull(),
  hubLocation: text("hub_location").notNull(),
  activeCount: integer("active_count").notNull().default(0),
  capacity: text("capacity").notNull().default("Standard"),
  nextDispatchSlot: text("next_dispatch_slot").notNull(),
  savingsSummary: text("savings_summary").notNull(),
  status: text("status", { enum: ["Active", "Scheduled", "Paused"] }).notNull().default("Active"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  farmer: text("farmer").notNull(),
  farm: text("farm").notNull(),
  location: text("location").notNull(),
  clusterId: text("cluster_id").references(() => clusters.id),
  clusterName: text("cluster_name").notNull(),
  rating: integer("rating").notNull().default(5),
  price: integer("price").notNull(),
  unit: text("unit").notNull(),
  organic: integer("organic", { mode: "boolean" }).notNull().default(false),
  category: text("category").notNull(),
  image: text("image").notNull(),
  stock: integer("stock").notNull().default(0),
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  customer: text("customer").notNull(),
  product: text("product").notNull(),
  amount: integer("amount").notNull(),
  status: text("status", { enum: ["New", "Accepted", "Preparing", "Ready", "Completed"] }).notNull().default("New"),
  date: text("date").notNull(),
  deliveryType: text("delivery_type", { enum: ["doorstep", "cluster_pickup"] }).default("cluster_pickup"),
  clusterId: text("cluster_id").references(() => clusters.id),
  clusterName: text("cluster_name"),
  pickupPoint: text("pickup_point"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
