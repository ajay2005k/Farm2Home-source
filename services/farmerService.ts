import { clusterRepository } from "../repositories/clusterRepository";
import { produceRepository } from "../repositories/produceRepository";
import type { Cluster, ProduceSubmission } from "../types";

export const farmerService = {
  getAssignedCluster: async (clusterId: string): Promise<Cluster | undefined> => {
    return clusterRepository.getClusterById(clusterId);
  },

  getFarmerSubmissions: async (farmerId: string): Promise<ProduceSubmission[]> => {
    return produceRepository.getSubmissionsByFarmer(farmerId);
  },

  submitProduceAvailability: async (params: {
    farmerId: string;
    farmerName: string;
    farmName: string;
    clusterId: string;
    productName: string;
    category: string;
    unit: string;
    estimatedQuantity: number;
    pricePerUnit: number;
    organic: boolean;
    harvestDate: string;
  }): Promise<ProduceSubmission> => {
    return produceRepository.createSubmission({
      farmerId: params.farmerId,
      farmerName: params.farmerName,
      farmName: params.farmName,
      clusterId: params.clusterId,
      productName: params.productName,
      category: params.category,
      unit: params.unit,
      estimatedQuantity: params.estimatedQuantity,
      pricePerUnit: params.pricePerUnit,
      organic: params.organic,
      harvestDate: params.harvestDate,
    });
  },

  // Calculate earnings strictly from verified and accepted quantities
  getFarmerEarnings: async (farmerId: string) => {
    const submissions = await produceRepository.getSubmissionsByFarmer(farmerId);
    const accepted = submissions.filter((s) => s.status === "Accepted");

    const totalEarned = accepted.reduce(
      (sum, s) => sum + (s.acceptedQuantity ?? s.estimatedQuantity) * s.pricePerUnit,
      0
    );

    const pendingReview = submissions.filter(
      (s) => s.status === "Submitted" || s.status === "Collected"
    ).length;

    const totalAcceptedQty = accepted.reduce(
      (sum, s) => sum + (s.acceptedQuantity ?? s.estimatedQuantity),
      0
    );

    return {
      totalEarned,
      totalAcceptedQty,
      pendingCount: pendingReview,
      acceptedCount: accepted.length,
      rejectedCount: submissions.filter((s) => s.status === "Rejected").length,
    };
  },
};
