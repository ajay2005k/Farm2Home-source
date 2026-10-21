import { clusters, orders, products } from "../mock-data";

export const farmerApi = {
  baseUrl: "/api/farmer",
  getProducts: async () => Promise.resolve(products),
  getOrders: async () => Promise.resolve(orders),
  updateOrderStatus: async (id: string, status: string) => Promise.resolve({ id, status }),
  getAssignedCluster: async () =>
    Promise.resolve({
      cluster: clusters.find((c) => c.id === "CL-FARM-01"),
      pooledSavingsMonth: 4200,
      coldStorageCratesUsed: 4,
      coldStorageTotalCrates: 20,
      nextCutoff: "Today, 5:30 PM",
    }),
  getEarnings: async () => Promise.resolve({ today: 12480, week: 78420, month: 284900 }),
};
