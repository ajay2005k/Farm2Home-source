import { orders, products } from "../mock-data";
export const farmerApi = {
  baseUrl: "/api/farmer",
  getProducts: async () => Promise.resolve(products),
  getOrders: async () => Promise.resolve(orders),
  updateOrderStatus: async (id:string, status:string) => Promise.resolve({id,status}),
  getEarnings: async () => Promise.resolve({today:12480, week:78420, month:284900}),
};
