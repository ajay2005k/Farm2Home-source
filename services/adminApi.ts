import { tenants } from "../mock-data";
import type { Tenant } from "../types";

export const adminApi = {
  baseUrl: "/api/admin",
  getDashboard: async () => {
    return Promise.resolve({
      farmers: 524,
      customers: 10342,
      orders: 2847,
      revenue: 1842000,
      monthlyGrowth: 12.6,
    });
  },
  getTenants: async (): Promise<Tenant[]> => {
    return Promise.resolve([...tenants]);
  },
  toggleTenantStatus: async (id: string, currentStatus: "Active" | "Paused"): Promise<"Active" | "Paused"> => {
    const next = currentStatus === "Active" ? "Paused" : "Active";
    return Promise.resolve(next);
  },
  verifyFarmer: async (id: string) => {
    return Promise.resolve({ id, verified: true, verifiedAt: new Date().toISOString() });
  },
};
