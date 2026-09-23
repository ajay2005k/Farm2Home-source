import type { Cluster, User } from "../types";
import { getStoredCollection, saveStoredCollection } from "./storage";

const CLUSTERS_KEY = "clusters_v1";
const USERS_KEY = "users_v1";

// Standard regional cluster hubs in the system
const INITIAL_CLUSTERS: Cluster[] = [
  {
    id: "cluster_chn_south",
    name: "Chengalpattu Agro Cluster",
    code: "CAC-01",
    location: "Chengalpattu, Tamil Nadu",
    managerId: "usr_mgr_01",
    managerName: "Anita Rao",
    capacityKg: 10000,
    status: "Active",
  },
  {
    id: "cluster_kpm_north",
    name: "Kanchipuram Organic Cluster",
    code: "KOC-02",
    location: "Kanchipuram, Tamil Nadu",
    managerId: "usr_mgr_02",
    managerName: "Venkatesh S",
    capacityKg: 8000,
    status: "Active",
  },
];

export const clusterRepository = {
  getClusters: async (): Promise<Cluster[]> => {
    let list = getStoredCollection<Cluster>(CLUSTERS_KEY);
    if (list.length === 0) {
      list = INITIAL_CLUSTERS;
      saveStoredCollection(CLUSTERS_KEY, list);
    }
    return Promise.resolve([...list]);
  },

  getClusterById: async (id: string): Promise<Cluster | undefined> => {
    const list = await clusterRepository.getClusters();
    return list.find((c) => c.id === id);
  },

  getFarmersByCluster: async (clusterId: string): Promise<User[]> => {
    const users = getStoredCollection<User>(USERS_KEY);
    return Promise.resolve(users.filter((u) => u.role === "farmer" && u.clusterId === clusterId));
  },

  createCluster: async (cluster: Omit<Cluster, "id">): Promise<Cluster> => {
    const list = await clusterRepository.getClusters();
    const newCluster: Cluster = {
      ...cluster,
      id: `cluster_${Date.now()}`,
    };
    list.push(newCluster);
    saveStoredCollection(CLUSTERS_KEY, list);
    return Promise.resolve(newCluster);
  },
};
