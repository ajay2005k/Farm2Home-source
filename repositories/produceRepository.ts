import type { CollectionRequest, ProduceSubmission } from "../types";
import { getStoredCollection, saveStoredCollection } from "./storage";

const PRODUCE_SUBMISSIONS_KEY = "produce_submissions_v1";
const COLLECTIONS_KEY = "collections_v1";

export const produceRepository = {
  // Produce Submissions
  getSubmissions: async (): Promise<ProduceSubmission[]> => {
    const list = getStoredCollection<ProduceSubmission>(PRODUCE_SUBMISSIONS_KEY);
    return Promise.resolve([...list]);
  },

  getSubmissionsByFarmer: async (farmerId: string): Promise<ProduceSubmission[]> => {
    const list = getStoredCollection<ProduceSubmission>(PRODUCE_SUBMISSIONS_KEY);
    return Promise.resolve(list.filter((s) => s.farmerId === farmerId));
  },

  getSubmissionsByCluster: async (clusterId: string): Promise<ProduceSubmission[]> => {
    const list = getStoredCollection<ProduceSubmission>(PRODUCE_SUBMISSIONS_KEY);
    return Promise.resolve(list.filter((s) => s.clusterId === clusterId));
  },

  createSubmission: async (
    submission: Omit<ProduceSubmission, "id" | "status" | "submittedAt">
  ): Promise<ProduceSubmission> => {
    const list = getStoredCollection<ProduceSubmission>(PRODUCE_SUBMISSIONS_KEY);
    const newSubmission: ProduceSubmission = {
      ...submission,
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      status: "Submitted",
      submittedAt: new Date().toISOString(),
    };
    list.unshift(newSubmission);
    saveStoredCollection(PRODUCE_SUBMISSIONS_KEY, list);
    return Promise.resolve(newSubmission);
  },

  updateSubmissionStatus: async (
    id: string,
    updates: Partial<ProduceSubmission>
  ): Promise<ProduceSubmission | undefined> => {
    const list = getStoredCollection<ProduceSubmission>(PRODUCE_SUBMISSIONS_KEY);
    const index = list.findIndex((s) => s.id === id);
    if (index === -1) return Promise.resolve(undefined);

    list[index] = {
      ...list[index],
      ...updates,
    };
    saveStoredCollection(PRODUCE_SUBMISSIONS_KEY, list);
    return Promise.resolve(list[index]);
  },

  // Collections
  getCollectionsByCluster: async (clusterId: string): Promise<CollectionRequest[]> => {
    const list = getStoredCollection<CollectionRequest>(COLLECTIONS_KEY);
    return Promise.resolve(list.filter((c) => c.clusterId === clusterId));
  },

  createCollection: async (
    req: Omit<CollectionRequest, "id" | "createdAt" | "status">
  ): Promise<CollectionRequest> => {
    const list = getStoredCollection<CollectionRequest>(COLLECTIONS_KEY);
    const newReq: CollectionRequest = {
      ...req,
      id: `col_${Date.now()}`,
      status: "Scheduled",
      createdAt: new Date().toISOString(),
    };
    list.unshift(newReq);
    saveStoredCollection(COLLECTIONS_KEY, list);
    return Promise.resolve(newReq);
  },
};
