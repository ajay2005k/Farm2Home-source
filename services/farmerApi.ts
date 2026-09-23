import { orders, products } from "../mock-data";
import type { Order, OrderStatus, Product } from "../types";

export const farmerApi = {
  baseUrl: "/api/farmer",
  getProducts: async (): Promise<Product[]> => {
    return Promise.resolve([...products]);
  },
  getOrders: async (): Promise<Order[]> => {
    return Promise.resolve([...orders]);
  },
  updateOrderStatus: async (id: string, status: OrderStatus): Promise<{ id: string; status: OrderStatus }> => {
    return Promise.resolve({ id, status });
  },
  getEarnings: async () => {
    return Promise.resolve({
      today: 12480,
      week: 78420,
      month: 284900,
      growthPercent: 16.8,
    });
  },
};
