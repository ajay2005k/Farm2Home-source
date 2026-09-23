import type { CustomerOrder, OrderStatus } from "../types";
import { getStoredCollection, saveStoredCollection } from "./storage";

const ORDERS_KEY = "customer_orders_v1";

export const orderRepository = {
  getOrders: async (): Promise<CustomerOrder[]> => {
    const list = getStoredCollection<CustomerOrder>(ORDERS_KEY);
    return Promise.resolve([...list]);
  },

  getOrdersByCustomer: async (customerId: string): Promise<CustomerOrder[]> => {
    const list = getStoredCollection<CustomerOrder>(ORDERS_KEY);
    return Promise.resolve(list.filter((o) => o.customerId === customerId));
  },

  getOrdersByCluster: async (clusterId: string): Promise<CustomerOrder[]> => {
    const list = getStoredCollection<CustomerOrder>(ORDERS_KEY);
    return Promise.resolve(list.filter((o) => o.clusterId === clusterId));
  },

  createOrder: async (
    order: Omit<CustomerOrder, "id" | "status" | "createdAt">
  ): Promise<CustomerOrder> => {
    const list = getStoredCollection<CustomerOrder>(ORDERS_KEY);
    const newOrder: CustomerOrder = {
      ...order,
      id: `FH${Math.floor(10000 + Math.random() * 90000)}`,
      status: "Placed",
      createdAt: new Date().toISOString(),
    };
    list.unshift(newOrder);
    saveStoredCollection(ORDERS_KEY, list);
    return Promise.resolve(newOrder);
  },

  updateOrderStatus: async (
    orderId: string,
    status: OrderStatus
  ): Promise<CustomerOrder | undefined> => {
    const list = getStoredCollection<CustomerOrder>(ORDERS_KEY);
    const index = list.findIndex((o) => o.id === orderId);
    if (index === -1) return Promise.resolve(undefined);

    list[index].status = status;
    saveStoredCollection(ORDERS_KEY, list);
    return Promise.resolve(list[index]);
  },
};
