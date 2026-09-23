import type { ConsolidatedInventoryItem, Product } from "../types";
import { getStoredCollection, saveStoredCollection } from "./storage";

const INVENTORY_KEY = "cluster_inventory_v1";

// Image mapping helper for natural produce categories
const DEFAULT_IMAGES: Record<string, string> = {
  tomatoes: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=800&q=85",
  spinach: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=85",
  mangoes: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=85",
  milk: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=85",
  eggs: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=800&q=85",
  rice: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=85",
  vegetables: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=85",
  fruits: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=800&q=85",
  dairy: "https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=800&q=85",
  grains: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=85",
};

export const inventoryRepository = {
  getInventoryByCluster: async (clusterId: string): Promise<ConsolidatedInventoryItem[]> => {
    const list = getStoredCollection<ConsolidatedInventoryItem>(INVENTORY_KEY);
    return Promise.resolve(list.filter((i) => i.clusterId === clusterId));
  },

  getAllConsolidatedInventory: async (): Promise<ConsolidatedInventoryItem[]> => {
    const list = getStoredCollection<ConsolidatedInventoryItem>(INVENTORY_KEY);
    return Promise.resolve([...list]);
  },

  // Map consolidated cluster inventory items directly into consumer marketplace products
  getMarketplaceProducts: async (): Promise<Product[]> => {
    const list = getStoredCollection<ConsolidatedInventoryItem>(INVENTORY_KEY);
    const inStock = list.filter((item) => item.availableStockQty > 0);

    const products: Product[] = inStock.map((item, index) => ({
      id: index + 1,
      name: item.productName,
      farmer: `${item.clusterName} (Consolidated)`,
      farm: item.clusterName,
      location: "Local Farm Cluster",
      rating: 4.9,
      price: item.retailPrice,
      unit: item.unit,
      organic: item.organic,
      category: item.category,
      image: item.image,
      stock: item.availableStockQty,
      clusterId: item.clusterId,
      clusterName: item.clusterName,
    }));

    return Promise.resolve(products);
  },

  // Consolidate verified farmer quantity into cluster inventory
  consolidateProduce: async (params: {
    clusterId: string;
    clusterName: string;
    productName: string;
    category: string;
    unit: string;
    acceptedQuantity: number;
    pricePerUnit: number;
    organic: boolean;
  }): Promise<ConsolidatedInventoryItem> => {
    const list = getStoredCollection<ConsolidatedInventoryItem>(INVENTORY_KEY);
    const existingIndex = list.findIndex(
      (item) =>
        item.clusterId === params.clusterId &&
        item.productName.toLowerCase() === params.productName.toLowerCase() &&
        item.unit.toLowerCase() === params.unit.toLowerCase()
    );

    const matchKey = params.productName.toLowerCase();
    const fallbackImage =
      DEFAULT_IMAGES[matchKey] ||
      DEFAULT_IMAGES[params.category.toLowerCase()] ||
      DEFAULT_IMAGES.vegetables;

    if (existingIndex >= 0) {
      const existing = list[existingIndex];
      const updated: ConsolidatedInventoryItem = {
        ...existing,
        totalAcceptedQty: existing.totalAcceptedQty + params.acceptedQuantity,
        availableStockQty: existing.availableStockQty + params.acceptedQuantity,
        farmerCostPerUnit: params.pricePerUnit,
        retailPrice: Math.round(params.pricePerUnit * 1.25), // 25% fair operational markup for direct consumer retail
        organic: existing.organic || params.organic,
        lastAggregatedAt: new Date().toISOString(),
      };
      list[existingIndex] = updated;
      saveStoredCollection(INVENTORY_KEY, list);
      return Promise.resolve(updated);
    } else {
      const newItem: ConsolidatedInventoryItem = {
        id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        clusterId: params.clusterId,
        clusterName: params.clusterName,
        productName: params.productName,
        category: params.category,
        unit: params.unit,
        totalAcceptedQty: params.acceptedQuantity,
        availableStockQty: params.acceptedQuantity,
        allocatedQty: 0,
        farmerCostPerUnit: params.pricePerUnit,
        retailPrice: Math.round(params.pricePerUnit * 1.25),
        organic: params.organic,
        image: fallbackImage,
        lastAggregatedAt: new Date().toISOString(),
      };
      list.push(newItem);
      saveStoredCollection(INVENTORY_KEY, list);
      return Promise.resolve(newItem);
    }
  },

  // Deduct/allocate stock when customer orders
  allocateStock: async (productName: string, qty: number): Promise<boolean> => {
    const list = getStoredCollection<ConsolidatedInventoryItem>(INVENTORY_KEY);
    const item = list.find((i) => i.productName.toLowerCase() === productName.toLowerCase());
    if (!item || item.availableStockQty < qty) {
      return Promise.resolve(false);
    }
    item.availableStockQty = Math.max(0, item.availableStockQty - qty);
    item.allocatedQty += qty;
    saveStoredCollection(INVENTORY_KEY, list);
    return Promise.resolve(true);
  },
};
