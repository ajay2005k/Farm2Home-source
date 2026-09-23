import { inventoryRepository } from "../repositories/inventoryRepository";
import { orderRepository } from "../repositories/orderRepository";
import type { CustomerOrder, OrderItem, Product } from "../types";

export const customerService = {
  // Get live products aggregated from accepted cluster inventories
  getMarketplaceProducts: async (): Promise<Product[]> => {
    return inventoryRepository.getMarketplaceProducts();
  },

  getProductById: async (id: number): Promise<Product | undefined> => {
    const products = await inventoryRepository.getMarketplaceProducts();
    return products.find((p) => p.id === id);
  },

  // Customer order placement
  createCustomerOrder: async (params: {
    customerId: string;
    customerName: string;
    deliveryAddress: string;
    items: OrderItem[];
    subtotal: number;
    deliveryFee: number;
    discount: number;
    totalAmount: number;
  }): Promise<CustomerOrder> => {
    // Allocate inventory from cluster stocks
    for (const item of params.items) {
      await inventoryRepository.allocateStock(item.productName, item.qty);
    }

    return orderRepository.createOrder({
      customerId: params.customerId,
      customerName: params.customerName,
      deliveryAddress: params.deliveryAddress,
      items: params.items,
      subtotal: params.subtotal,
      deliveryFee: params.deliveryFee,
      discount: params.discount,
      totalAmount: params.totalAmount,
    });
  },

  getCustomerOrders: async (customerId: string): Promise<CustomerOrder[]> => {
    return orderRepository.getOrdersByCustomer(customerId);
  },
};
