import { clusterRepository } from "../repositories/clusterRepository";
import { inventoryRepository } from "../repositories/inventoryRepository";
import { orderRepository } from "../repositories/orderRepository";
import { produceRepository } from "../repositories/produceRepository";
import type {
  Cluster,
  CollectionRequest,
  ConsolidatedInventoryItem,
  CustomerOrder,
  ProduceSubmission,
  User,
} from "../types";

export const clusterService = {
  getClusterDetails: async (clusterId: string): Promise<Cluster | undefined> => {
    return clusterRepository.getClusterById(clusterId);
  },

  getAllClusters: async (): Promise<Cluster[]> => {
    return clusterRepository.getClusters();
  },

  getFarmersInCluster: async (clusterId: string): Promise<User[]> => {
    return clusterRepository.getFarmersByCluster(clusterId);
  },

  getClusterSubmissions: async (clusterId: string): Promise<ProduceSubmission[]> => {
    return produceRepository.getSubmissionsByCluster(clusterId);
  },

  getClusterCollections: async (clusterId: string): Promise<CollectionRequest[]> => {
    return produceRepository.getCollectionsByCluster(clusterId);
  },

  getConsolidatedInventory: async (clusterId: string): Promise<ConsolidatedInventoryItem[]> => {
    return inventoryRepository.getInventoryByCluster(clusterId);
  },

  getClusterOrders: async (clusterId: string): Promise<CustomerOrder[]> => {
    return orderRepository.getOrdersByCluster(clusterId);
  },

  // Quality verification workflow: manager inspects produce, specifies accepted quantity & rejects any damaged portion
  verifyProduceAndConsolidate: async (params: {
    submissionId: string;
    clusterId: string;
    clusterName: string;
    receivedQuantity: number;
    acceptedQuantity: number;
    rejectedQuantity: number;
    rejectionReason?: string;
  }): Promise<{ submission: ProduceSubmission; inventory?: ConsolidatedInventoryItem }> => {
    const isAccepted = params.acceptedQuantity > 0;
    const nextStatus = isAccepted ? "Accepted" : "Rejected";

    const updatedSubmission = await produceRepository.updateSubmissionStatus(params.submissionId, {
      status: nextStatus,
      receivedQuantity: params.receivedQuantity,
      acceptedQuantity: params.acceptedQuantity,
      rejectedQuantity: params.rejectedQuantity,
      rejectionReason: params.rejectionReason,
      verifiedAt: new Date().toISOString(),
    });

    if (!updatedSubmission) {
      throw new Error("Produce submission not found");
    }

    let consolidatedItem: ConsolidatedInventoryItem | undefined;

    // Only accepted produce becomes sellable cluster inventory
    if (isAccepted && params.acceptedQuantity > 0) {
      consolidatedItem = await inventoryRepository.consolidateProduce({
        clusterId: params.clusterId,
        clusterName: params.clusterName,
        productName: updatedSubmission.productName,
        category: updatedSubmission.category,
        unit: updatedSubmission.unit,
        acceptedQuantity: params.acceptedQuantity,
        pricePerUnit: updatedSubmission.pricePerUnit,
        organic: updatedSubmission.organic,
      });
    }

    return {
      submission: updatedSubmission,
      inventory: consolidatedItem,
    };
  },

  // Schedule collection batch from farmers
  scheduleCollection: async (params: {
    clusterId: string;
    farmerId: string;
    farmerName: string;
    submissionIds: string[];
    scheduledDate: string;
  }): Promise<CollectionRequest> => {
    const collection = await produceRepository.createCollection(params);
    // Mark submissions as Collected
    for (const subId of params.submissionIds) {
      await produceRepository.updateSubmissionStatus(subId, { status: "Collected" });
    }
    return collection;
  },

  // Calculate real-time supply and demand metrics for the cluster
  getSupplyDemandAnalytics: async (clusterId: string) => {
    const inventory = await inventoryRepository.getInventoryByCluster(clusterId);
    const submissions = await produceRepository.getSubmissionsByCluster(clusterId);
    const orders = await orderRepository.getOrders();

    const totalStockKg = inventory.reduce((sum, item) => sum + item.availableStockQty, 0);
    const totalAllocatedKg = inventory.reduce((sum, item) => sum + item.allocatedQty, 0);
    const pendingIncomingKg = submissions
      .filter((s) => s.status === "Submitted" || s.status === "Collected")
      .reduce((sum, s) => sum + s.estimatedQuantity, 0);

    return {
      totalStockKg,
      totalAllocatedKg,
      pendingIncomingKg,
      activeProductsCount: inventory.filter((i) => i.availableStockQty > 0).length,
      recentOrdersCount: orders.length,
    };
  },

  // Dispatch orders to Farm2Home central distribution
  dispatchToFarm2Home: async (orderId: string) => {
    return orderRepository.updateOrderStatus(orderId, "OutForDelivery");
  },
};
