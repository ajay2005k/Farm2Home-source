import { products } from "../mock-data";
import type { Product } from "../types";

export const customerApi = {
  baseUrl: "/api/customer",
  getProducts: async (): Promise<Product[]> => {
    return Promise.resolve([...products]);
  },
  getProduct: async (id: number): Promise<Product | undefined> => {
    return Promise.resolve(products.find((item) => item.id === id));
  },
  addToCart: async (productId: number) => {
    return Promise.resolve({ productId, success: true });
  },
  createOrder: async (items: { productId: number; qty: number }[]) => {
    return Promise.resolve({
      orderId: `FH${Math.floor(10000 + Math.random() * 90000)}`,
      status: "placed",
      items,
      createdAt: new Date().toISOString(),
    });
  },
};
