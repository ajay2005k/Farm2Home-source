import type { Role, User } from "../types";

const AUTH_STORAGE_KEY = "farm2home_auth_user";

// Default accounts with cluster assignments
export const DEFAULT_ACCOUNTS: Record<Role, { email: string; pass: string; user: User }> = {
  customer: {
    email: "ajay@example.com",
    pass: "customer123",
    user: {
      id: "usr_cust_01",
      name: "Ajay Sharma",
      email: "ajay@example.com",
      role: "customer",
      location: "Velachery, Chennai",
      avatar: "AS",
    },
  },
  farmer: {
    email: "rajesh@greenvalley.com",
    pass: "farmer123",
    user: {
      id: "usr_farm_01",
      name: "Rajesh Kumar",
      email: "rajesh@greenvalley.com",
      role: "farmer",
      clusterId: "cluster_chn_south",
      clusterName: "Chengalpattu Agro Cluster",
      farmName: "Green Valley Farm",
      location: "Chengalpattu, Tamil Nadu",
      avatar: "RK",
    },
  },
  cluster_manager: {
    email: "anita.manager@farm2home.io",
    pass: "manager123",
    user: {
      id: "usr_mgr_01",
      name: "Anita Rao",
      email: "anita.manager@farm2home.io",
      role: "cluster_manager",
      clusterId: "cluster_chn_south",
      clusterName: "Chengalpattu Agro Cluster",
      location: "Chengalpattu Hub, TN",
      avatar: "AR",
    },
  },
};

export const authService = {
  getCurrentUser: (): User | null => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  login: async (email: string, _pass: string, role: Role): Promise<User> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const defaultAcc = DEFAULT_ACCOUNTS[role];
    const user: User = {
      id: `usr_${Date.now()}`,
      name:
        email.split("@")[0].replace(/[^a-zA-Z]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ||
        defaultAcc.user.name,
      email: email || defaultAcc.email,
      role,
      clusterId: "cluster_chn_south",
      clusterName: "Chengalpattu Agro Cluster",
      farmName: role === "farmer" ? "Green Valley Farm" : undefined,
      location: "Chengalpattu, Tamil Nadu",
      avatar: (email[0] || "U").toUpperCase() + (email[1] || "S").toUpperCase(),
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    }
    return user;
  },

  signup: async (
    name: string,
    email: string,
    _pass: string,
    role: Role,
    clusterId?: string,
    clusterName?: string
  ): Promise<User> => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const user: User = {
      id: `usr_${Date.now()}`,
      name: name || "New User",
      email: email,
      role,
      clusterId: clusterId || "cluster_chn_south",
      clusterName: clusterName || "Chengalpattu Agro Cluster",
      farmName: role === "farmer" ? `${name}'s Farm` : undefined,
      location: "Tamil Nadu",
      avatar:
        name
          .split(" ")
          .map((p) => p[0])
          .join("")
          .toUpperCase()
          .slice(0, 2) || "NU",
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    }
    return user;
  },

  logout: async (): Promise<void> => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  },
};
