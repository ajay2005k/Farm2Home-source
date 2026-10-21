import { clusters, tenants } from "../mock-data";

export const adminApi = {
  baseUrl: "/api/admin",
  getDashboard: async () =>
    Promise.resolve({ farmers: 524, customers: 10342, orders: 2847, revenue: 1842000, clusters: 6 }),
  getTenants: async () => Promise.resolve(tenants),
  getClusters: async () => Promise.resolve(clusters),
  toggleClusterStatus: async (id: string, status: "Active" | "Scheduled" | "Paused") =>
    Promise.resolve({ id, status }),
  verifyFarmer: async (id: string) => Promise.resolve({ id, verified: true }),
};
