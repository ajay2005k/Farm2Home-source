import { tenants } from "../mock-data";
export const adminApi = {
  baseUrl: "/api/admin",
  getDashboard: async () => Promise.resolve({farmers:524,customers:10342,orders:2847,revenue:1842000}),
  getTenants: async () => Promise.resolve(tenants),
  verifyFarmer: async (id:string) => Promise.resolve({id,verified:true}),
};
