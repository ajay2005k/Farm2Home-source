import { clusters, products } from "../mock-data";

export const customerApi = {
  baseUrl: "/api/customer",
  getProducts: async () => Promise.resolve(products),
  getProduct: async (id: number) => Promise.resolve(products.find((item) => item.id === id)),
  getCommunityClusters: async () =>
    Promise.resolve(clusters.filter((c) => c.type === "consumer_delivery" && c.status === "Active")),
  addToCart: async (productId: number) => Promise.resolve({ productId, success: true }),
  createOrder: async (deliveryType: "doorstep" | "cluster_pickup" = "cluster_pickup", clusterId?: string) =>
    Promise.resolve({ orderId: "FH10248", status: "placed", deliveryType, clusterId }),
};
