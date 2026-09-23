"use client";

import { useEffect, useMemo, useState } from "react";
import { authService, DEFAULT_ACCOUNTS } from "../services/authService";
import { clusterService } from "../services/clusterService";
import { customerService } from "../services/customerService";
import { farmerService } from "../services/farmerService";
import type {
  Cluster,
  ConsolidatedInventoryItem,
  CustomerOrder,
  ProduceSubmission,
  Product,
  Role,
  User,
} from "../types";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  BuildingIcon,
  CartIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  DashboardIcon,
  HeartIcon,
  LeafIcon,
  LocationIcon,
  PackageIcon,
  SearchIcon,
  SettingsIcon,
  ShieldCheckIcon,
  StarIcon,
  TrendUpIcon,
  TruckIcon,
  UserIcon,
} from "./icons";

type View = "home" | "shop" | "product" | "cart" | "tracking" | "customer" | "farmer" | "cluster_manager";

const categories = [
  ["Vegetables", "🥬", "#eaf4df"],
  ["Fruits", "🍊", "#fff4e5"],
  ["Dairy", "🥛", "#f1f5e2"],
  ["Grains", "🌾", "#f8f0de"],
  ["Eggs", "🥚", "#faf0e4"],
  ["Organic", "🌿", "#e6f5e4"],
  ["Spices", "🌶️", "#fbeae0"],
  ["Herbs", "🌱", "#f0f4ed"],
];

const roleInfo = [
  { role: "customer" as Role, label: "Customer", caption: "Shop farm-fresh produce", Icon: UserIcon },
  { role: "farmer" as Role, label: "Farmer", caption: "Submit harvest to cluster", Icon: LeafIcon },
  { role: "cluster_manager" as Role, label: "Cluster Manager", caption: "Verify & consolidate supply", Icon: BuildingIcon },
];

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [roleOpen, setRoleOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTargetRole, setAuthTargetRole] = useState<Role>("customer");
  
  // Real active user session
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return authService.getCurrentUser();
  });

  // Data states from service layer
  const [productList, setProductList] = useState<Product[]>([]);
  const [cart, setCart] = useState<number[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  // Load marketplace products from consolidated cluster inventory
  const refreshProducts = async () => {
    const products = await customerService.getMarketplaceProducts();
    setProductList(products);
    if (products.length > 0) {
      setSelected((prev) => prev ?? products[0]);
    }
  };

  useEffect(() => {
    refreshProducts();
  }, []);

  const navigate = (next: View) => {
    // Role guard checks
    if (next === "farmer") {
      if (!currentUser || currentUser.role !== "farmer") {
        setAuthTargetRole("farmer");
        setAuthOpen(true);
        setRoleOpen(false);
        return;
      }
    } else if (next === "cluster_manager") {
      if (!currentUser || currentUser.role !== "cluster_manager") {
        setAuthTargetRole("cluster_manager");
        setAuthOpen(true);
        setRoleOpen(false);
        return;
      }
    } else if (next === "customer") {
      if (!currentUser) {
        setAuthTargetRole("customer");
        setAuthOpen(true);
        setRoleOpen(false);
        return;
      }
    }

    setView(next);
    setRoleOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addToCart = (id: number) => {
    setCart((items) => [...items, id]);
    notify("Added to your farm basket");
  };

  const showProduct = (product: Product) => {
    setSelected(product);
    navigate("product");
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setRoleOpen(false);
    notify("Signed out successfully");
    if (view === "farmer" || view === "cluster_manager" || view === "customer") {
      setView("home");
    }
  };

  const filtered = useMemo(
    () =>
      productList.filter((p) =>
        `${p.name} ${p.category} ${p.farmer}`.toLowerCase().includes(query.toLowerCase())
      ),
    [productList, query]
  );

  if (view === "farmer" && currentUser?.role === "farmer") {
    return (
      <FarmerDashboard
        currentUser={currentUser}
        onExit={() => navigate("home")}
        notify={notify}
        toast={toast}
        onInventoryUpdated={refreshProducts}
      />
    );
  }

  if (view === "cluster_manager" && currentUser?.role === "cluster_manager") {
    return (
      <ClusterManagerDashboard
        currentUser={currentUser}
        onExit={() => navigate("home")}
        notify={notify}
        toast={toast}
        onInventoryUpdated={refreshProducts}
      />
    );
  }

  if (view === "customer" && currentUser) {
    return (
      <CustomerDashboard
        currentUser={currentUser}
        onNavigate={navigate}
        cart={cart.length}
      />
    );
  }

  return (
    <main>
      <CustomerHeader
        active={view}
        cart={cart.length}
        currentUser={currentUser}
        roleOpen={roleOpen}
        setRoleOpen={setRoleOpen}
        navigate={navigate}
        onOpenAuth={(role) => {
          setAuthTargetRole(role || "customer");
          setAuthOpen(true);
          setRoleOpen(false);
        }}
        onLogout={handleLogout}
      />

      {view === "home" && (
        <Landing
          products={productList}
          navigate={navigate}
          addToCart={addToCart}
          showProduct={showProduct}
        />
      )}

      {view === "shop" && (
        <Shop
          query={query}
          setQuery={setQuery}
          products={filtered}
          addToCart={addToCart}
          showProduct={showProduct}
        />
      )}

      {view === "product" && selected && (
        <ProductDetail
          product={selected}
          addToCart={addToCart}
          navigate={navigate}
        />
      )}

      {view === "cart" && (
        <Cart
          cart={cart}
          setCart={setCart}
          products={productList}
          navigate={navigate}
          notify={notify}
          currentUser={currentUser}
          onOrderPlaced={refreshProducts}
        />
      )}

      {view === "tracking" && (
        <Tracking currentUser={currentUser} navigate={navigate} />
      )}

      <Footer navigate={navigate} />

      {authOpen && (
        <AuthModal
          initialRole={authTargetRole}
          onClose={() => setAuthOpen(false)}
          onSuccess={(user) => {
            setCurrentUser(user);
            setAuthOpen(false);
            notify(`Welcome back, ${user.name}!`);
            if (user.role === "farmer") setView("farmer");
            else if (user.role === "cluster_manager") setView("cluster_manager");
            else setView("customer");
          }}
        />
      )}

      {toast && (
        <div className="toast">
          <CheckIcon size={14} />
          {toast}
        </div>
      )}
    </main>
  );
}

/* ========================================================
   HEADER & NAVBAR
   ======================================================== */
function CustomerHeader({
  active,
  cart,
  currentUser,
  roleOpen,
  setRoleOpen,
  navigate,
  onOpenAuth,
  onLogout,
}: {
  active: View;
  cart: number;
  currentUser: User | null;
  roleOpen: boolean;
  setRoleOpen: (v: boolean) => void;
  navigate: (v: View) => void;
  onOpenAuth: (role?: Role) => void;
  onLogout: () => void;
}) {
  return (
    <header className="topbar">
      <button className="brand" onClick={() => navigate("home")} aria-label="Farm2Home home">
        <svg width="36" height="36" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="rl" x1="100" y1="220" x2="220" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#045a27" />
              <stop offset="1" stopColor="#a7e126" />
            </linearGradient>
            <linearGradient id="ll" x1="60" y1="180" x2="120" y2="80" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0c6b32" />
              <stop offset="1" stopColor="#96cf1e" />
            </linearGradient>
          </defs>
          <path d="M128 230 C 130 130, 200 80, 240 40 C 220 160, 160 200, 128 230 Z" fill="url(#rl)" />
          <path d="M124 220 C 110 140, 60 110, 40 100 C 60 170, 90 190, 124 220 Z" fill="url(#ll)" />
          <path d="M128 230 C 140 150, 180 100, 240 40 C 170 120, 140 160, 128 230 Z" fill="#ffffff" opacity="0.3" />
          <path d="M124 220 C 110 150, 80 120, 40 100 C 70 140, 90 160, 124 220 Z" fill="#ffffff" opacity="0.3" />
        </svg>
        <span>
          Farm<span>2</span>Home
        </span>
      </button>

      <nav aria-label="Main navigation">
        <button className={active === "home" ? "active" : ""} onClick={() => navigate("home")}>
          Home
        </button>
        <button className={active === "shop" ? "active" : ""} onClick={() => navigate("shop")}>
          Shop
        </button>
        <button
          onClick={() => {
            navigate("home");
            setTimeout(() => document.querySelector("#farmers")?.scrollIntoView(), 100);
          }}
        >
          Farmers & Clusters
        </button>
        <button
          onClick={() => {
            navigate("home");
            setTimeout(() => document.querySelector("#how")?.scrollIntoView(), 100);
          }}
        >
          How It Works
        </button>
        <button
          onClick={() => {
            navigate("home");
            setTimeout(() => document.querySelector("#impact")?.scrollIntoView(), 100);
          }}
        >
          About Us
        </button>
      </nav>

      <div className="nav-actions">
        <button className="icon-button" onClick={() => navigate("shop")} aria-label="Search">
          <SearchIcon size={16} />
        </button>
        <button className="location-button">
          <span><LocationIcon size={15} /></span> Chennai <span className="chev"><ChevronDownIcon size={12} /></span>
        </button>
        <button
          className="icon-button cart"
          onClick={() => navigate("cart")}
          aria-label={`Cart with ${cart} items`}
          style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <CartIcon size={18} />
          {cart > 0 && <b>{cart}</b>}
        </button>

        {currentUser ? (
          <button className="user-nav-btn" onClick={() => setRoleOpen(!roleOpen)}>
            <div className="user-nav-avatar">{currentUser.avatar || "U"}</div>
            <span>{currentUser.name.split(" ")[0]}</span>
            <span className="chev"><ChevronDownIcon size={12} /></span>
          </button>
        ) : (
          <button className="login" onClick={() => onOpenAuth("customer")}>
            Sign In <ArrowUpRightIcon size={13} />
          </button>
        )}
      </div>

      {roleOpen && (
        <div className="role-menu">
          {currentUser ? (
            <>
              <p>Active Account</p>
              <div style={{ padding: "6px 10px 12px", display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="user-nav-avatar" style={{ width: "36px", height: "36px" }}>
                  {currentUser.avatar || "U"}
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "13px" }}>{currentUser.name}</strong>
                  <span style={{ fontSize: "10.5px", color: "#6a7c73" }}>{currentUser.email}</span>
                </div>
              </div>

              <p>Switch Portal</p>
              {roleInfo.map((item) => {
                const IconComponent = item.Icon;
                return (
                  <button
                    key={item.role}
                    onClick={() => {
                      if (currentUser.role === item.role) {
                        navigate(item.role);
                      } else {
                        onOpenAuth(item.role);
                      }
                    }}
                  >
                    <i><IconComponent size={16} /></i>
                    <span>
                      {item.label}
                      <small>{currentUser.role === item.role ? "Active session" : item.caption}</small>
                    </span>
                    <ArrowRightIcon size={13} />
                  </button>
                );
              })}

              <hr />
              <button className="menu-signout" onClick={onLogout}>
                <i>✕</i>
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <>
              <p>Sign In Portal</p>
              {roleInfo.map((item) => {
                const IconComponent = item.Icon;
                return (
                  <button key={item.role} onClick={() => onOpenAuth(item.role)}>
                    <i><IconComponent size={16} /></i>
                    <span>
                      {item.label}
                      <small>{item.caption}</small>
                    </span>
                    <ArrowRightIcon size={13} />
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </header>
  );
}

/* ========================================================
   AUTHENTICATION MODAL
   ======================================================== */
function AuthModal({
  initialRole,
  onClose,
  onSuccess,
}: {
  initialRole: Role;
  onClose: () => void;
  onSuccess: (u: User) => void;
}) {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<Role>(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(DEFAULT_ACCOUNTS[initialRole]?.email || "");
  const [password, setPassword] = useState(DEFAULT_ACCOUNTS[initialRole]?.pass || "");
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (r: Role) => {
    setRole(r);
    setEmail(DEFAULT_ACCOUNTS[r]?.email || "");
    setPassword(DEFAULT_ACCOUNTS[r]?.pass || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let user: User;
      if (tab === "login") {
        user = await authService.login(email, password, role);
      } else {
        user = await authService.signup(name, email, password, role);
      }
      onSuccess(user);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-backdrop" role="dialog" aria-modal="true">
      <button
        type="button"
        className="auth-overlay-button"
        onClick={onClose}
        aria-label="Close modal"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: "transparent", border: 0, cursor: "default" }}
      />
      <div className="auth-modal" style={{ position: "relative", zIndex: 1 }}>
        <button className="auth-close" onClick={onClose} aria-label="Close modal">
          ✕
        </button>

        <div className="auth-header">
          <span className="section-kicker">FARM2HOME ACCESS</span>
          <h2>{tab === "login" ? "Sign In to Farm2Home" : "Create an Account"}</h2>
          <p>Cluster-powered direct farm produce supply chain.</p>
        </div>

        <div className="auth-tabs">
          <button className={tab === "login" ? "active" : ""} onClick={() => setTab("login")}>
            Sign In
          </button>
          <button className={tab === "signup" ? "active" : ""} onClick={() => setTab("signup")}>
            Register
          </button>
        </div>

        <div className="role-selector">
          <button
            type="button"
            className={role === "customer" ? "selected" : ""}
            onClick={() => handleRoleChange("customer")}
          >
            <i><UserIcon size={16} /></i> Customer
          </button>
          <button
            type="button"
            className={role === "farmer" ? "selected" : ""}
            onClick={() => handleRoleChange("farmer")}
          >
            <i><LeafIcon size={16} /></i> Farmer
          </button>
          <button
            type="button"
            className={role === "cluster_manager" ? "selected" : ""}
            onClick={() => handleRoleChange("cluster_manager")}
          >
            <i><BuildingIcon size={16} /></i> Cluster Mgr
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {tab === "signup" && (
            <label>
              Full Name
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
              />
            </label>
          )}

          <label>
            Email Address
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Authenticating..." : tab === "login" ? `Sign In as ${role.replace("_", " ").toUpperCase()}` : "Create Account"}
          </button>
        </form>

        <div className="auth-hint">
          <span>Role access: <strong>{role.replace("_", " ")}</strong> (Assigned Cluster Hub).</span>
        </div>
      </div>
    </div>
  );
}

/* ========================================================
   LANDING VIEW
   ======================================================== */
function Landing({
  products,
  navigate,
  addToCart,
  showProduct,
}: {
  products: Product[];
  navigate: (v: View) => void;
  addToCart: (id: number) => void;
  showProduct: (p: Product) => void;
}) {
  return (
    <>
      <section className="hero" id="home">
        <div className="hero-copy">
          <div className="eyebrow">
            <span>●</span> Fresh from regional farm clusters
          </div>
          <h1>
            Fresh from local farms.<br />
            <em>Straight to your home.</em>
          </h1>
          <p>
            Consolidating fresh harvests from trusted regional farmer clusters directly to your doorstep. Fair earnings for farmers, farm-fresh goodness for you.
          </p>
          <div className="hero-actions">
            <button className="primary" onClick={() => navigate("shop")}>
              Shop fresh produce <span><ArrowRightIcon size={16} /></span>
            </button>
            <button className="secondary" onClick={() => navigate("farmer")}>
              Farmer portal <span><ArrowUpRightIcon size={14} /></span>
            </button>
          </div>
          <div className="trust-row">
            <div>
              <strong>100%</strong>
              <span>Verified harvests</span>
            </div>
            <div>
              <strong>Direct</strong>
              <span>Cluster supply</span>
            </div>
            <div>
              <strong>Daily</strong>
              <span>Fresh promise</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <img
            src="https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=1200&q=88"
            alt="Farmer holding a basket of vegetables"
          />
          <div className="fresh-card">
            <span><CheckIcon size={15} /></span>
            <div>
              <small>Quality verified</small>
              <strong>Cluster-fresh guarantee</strong>
            </div>
          </div>
          <div className="farmer-card">
            <div className="mini-avatar">CAC</div>
            <div>
              <small>Regional Farm Cluster</small>
              <strong>Chengalpattu Cluster</strong>
              <span><StarIcon size={12} /> Consolidated supply</span>
            </div>
          </div>
          <div className="leaf"><LeafIcon size={20} /></div>
        </div>
      </section>

      <section className="promise-strip">
        <span><CheckIcon size={14} /> Multi-farmer clusters</span>
        <span><ClockIcon size={14} /> Same-day collection</span>
        <span><LeafIcon size={14} /> Verified quality intake</span>
        <span><ShieldCheckIcon size={14} /> Transparent farm prices</span>
      </section>

      <section className="section categories">
        <SectionTitle
          kicker="SHOP BY CATEGORY"
          title="Freshness in every category"
          action={() => navigate("shop")}
        />
        <div className="category-grid">
          {categories.map(([name, icon, color]) => (
            <button key={name} onClick={() => navigate("shop")} style={{ background: color }}>
              <span>{icon}</span>
              <strong>{name}</strong>
              <small>Explore cluster picks</small>
              <b><ArrowUpRightIcon size={12} /></b>
            </button>
          ))}
        </div>
      </section>

      <section className="section products-section">
        <SectionTitle
          kicker="CONSOLIDATED FRESH INVENTORY"
          title="Just aggregated from local clusters"
          action={() => navigate("shop")}
        />
        {products.length > 0 ? (
          <div className="product-grid">
            {products.slice(0, 4).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                addToCart={addToCart}
                showProduct={showProduct}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <i><LeafIcon size={36} /></i>
            <h3>No cluster inventory published yet</h3>
            <p>Farmers can submit harvests in the Farmer portal and Cluster Managers can verify produce to build available stock.</p>
            <button onClick={() => navigate("farmer")}>Go to Farmer portal</button>
          </div>
        )}
      </section>

      <section className="farmer-spotlight" id="farmers">
        <div className="farmer-photo">
          <img
            src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=85"
            alt="Farmer in a green field"
          />
          <span>Regional Network</span>
        </div>
        <div className="farmer-story">
          <span className="section-kicker">COMMUNITY SUPPLY MODEL</span>
          <h2>Empowering local farmers through agricultural clusters.</h2>
          <div className="verified"><CheckIcon size={13} /> Consolidated Quality Model</div>
          <p>
            “By uniting under farm clusters, we aggregate high-quality harvests, reduce post-harvest waste, and deliver peak freshness to household kitchens.”
          </p>
          <div className="story-meta">
            <div>
              <strong>Chengalpattu Agro Cluster</strong>
              <span>Chengalpattu Hub, Tamil Nadu</span>
            </div>
            <div>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ShieldCheckIcon size={14} /> Quality Verified</strong>
              <span>Direct supply chain</span>
            </div>
          </div>
          <button className="primary compact" onClick={() => navigate("shop")}>
            Explore cluster marketplace →
          </button>
        </div>
      </section>

      <section className="section how" id="how">
        <SectionTitle kicker="HOW CLUSTER SUPPLY WORKS" title="From farm clusters to your table" />
        <div className="steps">
          {[
            ["01", LeafIcon, "Farmers Harvest", "Member farmers submit fresh available produce."],
            ["02", BuildingIcon, "Cluster Intake", "Cluster Manager collects & inspects quality."],
            ["03", PackageIcon, "Consolidation", "Accepted produce forms consolidated cluster stock."],
            ["04", TruckIcon, "Home Delivery", "Consumers order small daily grocery portions."],
          ].map((s, i) => {
            const StepIcon = s[1] as React.ElementType;
            return (
              <div className="step" key={String(s[0])}>
                <span className="step-no">{s[0]}</span>
                <i><StepIcon size={24} /></i>
                <h3>{s[2]}</h3>
                <p>{s[3]}</p>
                {i < 3 && <b>→</b>}
              </div>
            );
          })}
        </div>
      </section>

      <section className="impact" id="impact">
        <div>
          <span className="section-kicker light">WHY CLUSTERS WORK</span>
          <h2>
            Better for farmers.<br />
            <em>Fresher for you.</em>
          </h2>
        </div>
        <div className="impact-grid">
          {[
            [TrendUpIcon, "Consolidated Scale", "Smallholder farmers gain collective market access."],
            [LeafIcon, "Fresh Quality Verification", "Every harvest batch is checked and certified at cluster intake."],
            [ShieldCheckIcon, "Zero Middlemen Markups", "Direct farmer-to-cluster-to-consumer value chain."],
            [CheckIcon, "Household Portions", "Customers purchase normal 500g, 1kg household quantities."],
          ].map(([IconItem, title, desc]) => {
            const IconComp = IconItem as React.ElementType;
            return (
              <article key={String(title)}>
                <i><IconComp size={22} /></i>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}

function SectionTitle({ kicker, title, action }: { kicker: string; title: string; action?: () => void }) {
  return (
    <div className="section-head">
      <div>
        <span className="section-kicker">{kicker}</span>
        <h2>{title}</h2>
      </div>
      {action && (
        <button onClick={action}>
          Explore all products <ArrowRightIcon size={14} />
        </button>
      )}
    </div>
  );
}

function ProductCard({
  product,
  addToCart,
  showProduct,
}: {
  product: Product;
  addToCart: (id: number) => void;
  showProduct: (p: Product) => void;
}) {
  return (
    <article className="product-card">
      <button className="product-image" onClick={() => showProduct(product)}>
        <img src={product.image} alt={product.name} />
        {product.organic && <span>Organic</span>}
        <i><HeartIcon size={16} /></i>
      </button>
      <div className="product-body">
        <small><LocationIcon size={11} /> {product.location}</small>
        <button className="product-name" onClick={() => showProduct(product)}>
          {product.name}
        </button>
        <span className="farmer-name">
          by {product.farmer}
        </span>
        <div>
          <strong>
            ₹{product.price}
            <small> / {product.unit}</small>
          </strong>
          <button onClick={() => addToCart(product.id)} aria-label={`Add ${product.name} to cart`}>
            ＋
          </button>
        </div>
      </div>
    </article>
  );
}

/* ========================================================
   SHOP VIEW
   ======================================================== */
function Shop({
  query,
  setQuery,
  products: items,
  addToCart,
  showProduct,
}: {
  query: string;
  setQuery: (s: string) => void;
  products: Product[];
  addToCart: (id: number) => void;
  showProduct: (p: Product) => void;
}) {
  return (
    <section className="market-page">
      <div className="market-hero">
        <span className="section-kicker">CLUSTER MARKETPLACE</span>
        <h1>Fresh produce from regional clusters.</h1>
        <p>Harvested by local member farmers, verified at cluster hubs, and delivered at peak freshness.</p>
      </div>

      <div className="market-tools">
        <label>
          <SearchIcon size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, clusters or categories"
          />
        </label>
        <select aria-label="Sort products">
          <option>Recommended</option>
          <option>Price: Low to High</option>
          <option>Price: High to Low</option>
          <option>Highest Rated</option>
        </select>
      </div>

      <div className="market-layout">
        <aside>
          <h3>Filters</h3>
          {["Category", "Price range", "Organic only", "Availability"].map(
            (f, i) => (
              <details key={f} open={i < 2}>
                <summary>
                  {f}
                  <span><ChevronDownIcon size={12} /></span>
                </summary>
                <div className="filter-options">
                  <label>
                    <input type="checkbox" /> {i ? "Under ₹100" : "Vegetables"}
                  </label>
                  <label>
                    <input type="checkbox" /> {i ? "₹100 – ₹250" : "Fruits & grains"}
                  </label>
                </div>
              </details>
            )
          )}
        </aside>

        <div className="market-results">
          <div className="results-label">
            <span>
              <b>{items.length}</b> fresh cluster products available
            </span>
            <span>
              Delivering to <b>Chennai & Regional Hubs</b>
            </span>
          </div>

          {items.length ? (
            <div className="product-grid">
              {items.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  addToCart={addToCart}
                  showProduct={showProduct}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <i><SearchIcon size={36} /></i>
              <h3>No cluster produce in stock yet</h3>
              <p>When farmers submit harvests and their cluster manager verifies the produce, it will appear here for ordering!</p>
              <button onClick={() => setQuery("")}>Refresh catalog</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ========================================================
   PRODUCT DETAIL VIEW
   ======================================================== */
function ProductDetail({
  product,
  addToCart,
  navigate,
}: {
  product: Product;
  addToCart: (id: number) => void;
  navigate: (v: View) => void;
}) {
  const [qty, setQty] = useState(1);

  return (
    <section className="detail-page">
      <button className="back-link" onClick={() => navigate("shop")}>
        ← Back to marketplace
      </button>
      <div className="detail-grid">
        <div className="detail-gallery">
          <img src={product.image} alt={product.name} />
          <div className="thumbs">
            <img src={product.image} alt="" />
            <div>
              Cluster Verified
              <br />
              guaranteed <span><CheckIcon size={16} /></span>
            </div>
          </div>
        </div>

        <div className="detail-info">
          {product.organic && <span className="organic-pill"><LeafIcon size={12} /> Certified organic</span>}
          <h1>{product.name}</h1>
          <div className="rating-line">
            <b><StarIcon size={13} /> 4.9</b>
            <span>Cluster verified</span>
            <span>·</span>
            <span className="stock">● In stock — {product.stock} {product.unit}</span>
          </div>
          <p>
            Naturally grown by regional cluster farmers. Quality verified and consolidated at {product.farm} with no harmful chemicals.
          </p>
          <div className="price-line">
            <strong>₹{product.price}</strong>
            <span>/ {product.unit}</span>
          </div>
          <div className="qty-row">
            <span>Quantity</span>
            <div>
              <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <b>{qty}</b>
              <button onClick={() => setQty(qty + 1)}>＋</button>
            </div>
          </div>
          <button
            className="primary buy-wide"
            onClick={() => {
              addToCart(product.id);
              navigate("cart");
            }}
          >
            Add to basket · ₹{product.price * qty}
          </button>
          <button className="secondary buy-wide" onClick={() => navigate("cart")}>
            Buy now
          </button>
          <div className="delivery-note">
            <span><TruckIcon size={20} /></span>
            <div>
              <b>Direct cluster dispatch</b>
              <small>Consolidated from local farms for optimal freshness</small>
            </div>
          </div>
        </div>
      </div>

      <div className="detail-below">
        <article>
          <span className="section-kicker">SUPPLY ORIGIN</span>
          <div className="farmer-profile">
            <div className="mini-avatar" style={{ width: "50px", height: "50px" }}>CAC</div>
            <div>
              <h3>
                {product.farm} <span><CheckIcon size={14} /></span>
              </h3>
              <p>
                Regional Agricultural Cluster · Tamil Nadu
              </p>
              <b style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><ShieldCheckIcon size={12} /> Verified Cluster Intake</b>
            </div>
            <button onClick={() => navigate("shop")}>View cluster →</button>
          </div>
        </article>

        <article>
          <span className="section-kicker">PRODUCT INFORMATION</span>
          <dl>
            <div>
              <dt>Supply model</dt>
              <dd>Multi-Farmer Cluster Consolidation</dd>
            </div>
            <div>
              <dt>Farming method</dt>
              <dd>{product.organic ? "Certified organic" : "Natural farming"}</dd>
            </div>
            <div>
              <dt>Origin Hub</dt>
              <dd>{product.farm}</dd>
            </div>
            <div>
              <dt>Delivery estimate</dt>
              <dd>Within 24 hours</dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  );
}

/* ========================================================
   CART VIEW
   ======================================================== */
function Cart({
  cart,
  setCart,
  products,
  navigate,
  notify,
  currentUser,
  onOrderPlaced,
}: {
  cart: number[];
  setCart: (v: number[]) => void;
  products: Product[];
  navigate: (v: View) => void;
  notify: (s: string) => void;
  currentUser: User | null;
  onOrderPlaced: () => void;
}) {
  const itemCounts = cart.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const uniqueItems = Object.keys(itemCounts)
    .map((id) => products.find((p) => p.id === Number(id)))
    .filter(Boolean) as Product[];

  const subtotal = uniqueItems.reduce((s, p) => s + p.price * itemCounts[p.id], 0);

  const handleCheckout = async () => {
    const customerId = currentUser?.id || "usr_guest";
    const customerName = currentUser?.name || "Ajay Sharma";
    const deliveryAddress = currentUser?.location || "Velachery, Chennai 600042";

    await customerService.createCustomerOrder({
      customerId,
      customerName,
      deliveryAddress,
      items: uniqueItems.map((p) => ({
        productId: String(p.id),
        productName: p.name,
        qty: itemCounts[p.id],
        unit: p.unit,
        price: p.price,
        clusterId: p.clusterId,
      })),
      subtotal,
      deliveryFee: 35,
      discount: 20,
      totalAmount: subtotal + 15,
    });

    setCart([]);
    onOrderPlaced();
    notify("Order placed! Cluster inventory allocated successfully.");
    navigate("tracking");
  };

  return (
    <section className="cart-page">
      <div className="cart-title">
        <span className="section-kicker">YOUR BASKET</span>
        <h1>Farm-fresh grocery picks</h1>
        <p>{cart.length} items from local farm clusters</p>
      </div>

      {cart.length ? (
        <div className="cart-layout">
          <div className="cart-items">
            {uniqueItems.map((p) => (
              <article key={p.id}>
                <img src={p.image} alt={p.name} />
                <div>
                  <h3>{p.name}</h3>
                  <p>
                    {p.farm}
                  </p>
                  <span>Cluster Verified</span>
                </div>
                <div className="cart-qty">
                  <button
                    onClick={() => {
                      const idx = cart.lastIndexOf(p.id);
                      if (idx !== -1) {
                        const newCart = [...cart];
                        newCart.splice(idx, 1);
                        setCart(newCart);
                      }
                    }}
                  >
                    −
                  </button>
                  <b>{itemCounts[p.id]}</b>
                  <button onClick={() => setCart([...cart, p.id])}>＋</button>
                </div>
                <strong>₹{p.price * itemCounts[p.id]}</strong>
                <button
                  className="remove"
                  onClick={() => setCart(cart.filter((id) => id !== p.id))}
                >
                  ×
                </button>
              </article>
            ))}
          </div>

          <aside className="order-summary">
            <h3>Order summary</h3>
            <div>
              <span>Subtotal</span>
              <b>₹{subtotal}</b>
            </div>
            <div>
              <span>Cluster-to-home delivery</span>
              <b>₹35</b>
            </div>
            <div>
              <span>Cluster direct savings</span>
              <b className="saving">−₹20</b>
            </div>
            <hr />
            <div className="total">
              <span>Total</span>
              <b>₹{subtotal + 15}</b>
            </div>
            <button className="primary" onClick={handleCheckout}>
              Proceed to checkout →
            </button>
            <small><ShieldCheckIcon size={13} /> Freshness guaranteed from local clusters</small>
          </aside>
        </div>
      ) : (
        <div className="empty-state">
          <i><CartIcon size={44} /></i>
          <h3>Your basket is waiting</h3>
          <p>Fresh produce from nearby clusters is only a click away.</p>
          <button onClick={() => navigate("shop")}>Explore the marketplace</button>
        </div>
      )}
    </section>
  );
}

/* ========================================================
   TRACKING VIEW
   ======================================================== */
function Tracking({ currentUser, navigate }: { currentUser: User | null; navigate: (v: View) => void }) {
  const userName = currentUser?.name || "Ajay Sharma";
  const userLoc = currentUser?.location || "Velachery, Chennai 600042";

  return (
    <section className="tracking-page">
      <div className="success-banner">
        <span><CheckIcon size={16} /></span>
        <div>
          <h3>Order placed successfully</h3>
          <p>Allocated from Chengalpattu Agro Cluster consolidated stock.</p>
        </div>
        <b>Order #FH10248</b>
      </div>

      <div className="tracking-grid">
        <article>
          <div className="tracking-head">
            <div>
              <span className="section-kicker">LIVE CLUSTER DISPATCH</span>
              <h1>Arriving tomorrow</h1>
              <p>Estimated 8:00–11:00 AM</p>
            </div>
            <div className="delivery-avatar">CAC</div>
          </div>
          <div className="timeline">
            {[
              ["Order placed", "Today · Just now", true],
              ["Cluster inventory allocated", "Today · Confirmed", true],
              ["Packaging at cluster hub", "In progress", true],
              ["Dispatched to Farm2Home courier", "Tomorrow morning", false],
              ["Delivered to your doorstep", "Before 11:00 AM", false],
            ].map((s, i) => (
              <div className={s[2] ? "done" : ""} key={String(s[0])}>
                <i>{s[2] ? (i === 2 ? "●" : <CheckIcon size={13} />) : "○"}</i>
                <span>
                  <b>{s[0]}</b>
                  <small>{s[1]}</small>
                </span>
              </div>
            ))}
          </div>
        </article>

        <aside>
          <div className="map-placeholder">
            <span>REGIONAL CLUSTER HUB</span>
            <i><LeafIcon size={16} /></i>
            <div className="route"></div>
            <i><LocationIcon size={16} /></i>
            <span>YOUR HOME</span>
          </div>
          <h3>Delivery details</h3>
          <p>
            <b>{userName}</b>
            <br />
            {userLoc}
          </p>
          <hr />
          <p>
            <b>Direct Cluster Delivery</b>
            <br />
            Consolidated produce packed at source cluster
          </p>
          <button onClick={() => navigate("customer")}>Go to my dashboard →</button>
        </aside>
      </div>
    </section>
  );
}

/* ========================================================
   CUSTOMER DASHBOARD
   ======================================================== */
function CustomerDashboard({
  currentUser,
  onNavigate,
  cart,
}: {
  currentUser: User;
  onNavigate: (v: View) => void;
  cart: number;
}) {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);

  useEffect(() => {
    customerService.getCustomerOrders(currentUser.id).then(setOrders);
  }, [currentUser.id]);

  return (
    <DashboardShell
      userRole="customer"
      title="Customer"
      user={currentUser.name}
      onExit={() => onNavigate("home")}
      nav={["Overview", "My Orders", "Wishlist", "Clusters", "Addresses", "Profile"]}
    >
      <div className="dash-welcome">
        <div>
          <p>CUSTOMER PORTAL · VERIFIED ACCOUNT</p>
          <h1>Welcome back, {currentUser.name.split(" ")[0]} 👋</h1>
          <span>Your next farm-fresh delivery arrives tomorrow from local clusters.</span>
        </div>
        <button onClick={() => onNavigate("shop")}>Browse fresh produce ＋</button>
      </div>

      <Stats
        data={[
          ["Active orders", String(orders.filter((o) => o.status !== "Delivered").length || 1), "Live tracking", "orders"],
          ["Completed orders", String(orders.filter((o) => o.status === "Delivered").length), "Since joining", "check"],
          ["Connected clusters", "2", "In Tamil Nadu", "farmer"],
          ["Basket items", String(cart), "Ready to order", "cart"],
        ]}
      />

      <div className="dash-two">
        <article className="panel">
          <PanelHead title="Recent orders" action="View all" />
          {orders.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <b>#{o.id}</b>
                      <small>{new Date(o.createdAt).toLocaleDateString()}</small>
                    </td>
                    <td>{o.items.map((i) => `${i.productName} (${i.qty})`).join(", ")}</td>
                    <td>₹{o.totalAmount}</td>
                    <td>
                      <Status text={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: "30px 10px", textAlign: "center", color: "#6a7c73", fontSize: "12px" }}>
              No orders placed yet. Browse the marketplace to place your first order!
            </div>
          )}
        </article>

        <article className="panel delivery-card">
          <PanelHead title="Next delivery" />
          <div className="delivery-illustration">
            <LeafIcon size={16} /> ━━━━━━ <TruckIcon size={18} />
          </div>
          <b>Tomorrow · 8:00–11:00 AM</b>
          <p>Direct from Chengalpattu Agro Cluster</p>
          <button onClick={() => onNavigate("tracking")}>Track order →</button>
        </article>
      </div>
    </DashboardShell>
  );
}

/* ========================================================
   FARMER DASHBOARD (Submit Produce to Cluster)
   ======================================================== */
function FarmerDashboard({
  currentUser,
  onExit,
  notify,
  toast,
  onInventoryUpdated,
}: {
  currentUser: User;
  onExit: () => void;
  notify: (s: string) => void;
  toast: string;
  onInventoryUpdated: () => void;
}) {
  const [tab, setTab] = useState("Dashboard");
  const [submissions, setSubmissions] = useState<ProduceSubmission[]>([]);
  const [earnings, setEarnings] = useState({
    totalEarned: 0,
    totalAcceptedQty: 0,
    pendingCount: 0,
    acceptedCount: 0,
    rejectedCount: 0,
  });

  // Produce Submission Modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [prodName, setProdName] = useState("");
  const [prodCategory, setProdCategory] = useState("Vegetables");
  const [prodUnit, setProdUnit] = useState("kg");
  const [prodQty, setProdQty] = useState(100);
  const [prodPrice, setProdPrice] = useState(40);
  const [prodOrganic, setProdOrganic] = useState(true);
  const [prodHarvestDate, setProdHarvestDate] = useState("Tomorrow Morning");

  const clusterId = currentUser.clusterId || "cluster_chn_south";
  const clusterName = currentUser.clusterName || "Chengalpattu Agro Cluster";

  const refreshFarmerData = async () => {
    const list = await farmerService.getFarmerSubmissions(currentUser.id);
    setSubmissions(list);
    const stats = await farmerService.getFarmerEarnings(currentUser.id);
    setEarnings(stats);
  };

  useEffect(() => {
    refreshFarmerData();
  }, [currentUser.id]);

  const handleProduceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName) return;

    await farmerService.submitProduceAvailability({
      farmerId: currentUser.id,
      farmerName: currentUser.name,
      farmName: currentUser.farmName || `${currentUser.name}'s Farm`,
      clusterId,
      productName: prodName,
      category: prodCategory,
      unit: prodUnit,
      estimatedQuantity: Number(prodQty),
      pricePerUnit: Number(prodPrice),
      organic: prodOrganic,
      harvestDate: prodHarvestDate,
    });

    setShowSubmitModal(false);
    setProdName("");
    await refreshFarmerData();
    onInventoryUpdated();
    notify(`Submitted ${prodQty} ${prodUnit} of ${prodName} to ${clusterName}!`);
  };

  return (
    <DashboardShell
      userRole="farmer"
      title="Farmer portal"
      user={currentUser.name}
      onExit={onExit}
      active={tab}
      onTab={setTab}
      nav={[
        "Dashboard",
        "Produce Submissions",
        "Cluster Collections",
        "Earnings",
        "Farm Profile",
      ]}
    >
      <div className="dash-welcome">
        <div>
          <p>ASSIGNED TO: {clusterName.toUpperCase()} · HUB</p>
          <h1>{tab === "Dashboard" ? `Welcome, ${currentUser.name.split(" ")[0]} 👋` : tab}</h1>
          <span>
            Submit your crop availability for cluster collection and track verified intake earnings.
          </span>
        </div>
        <button onClick={() => setShowSubmitModal(true)}>＋ Submit produce availability</button>
      </div>

      <Stats
        data={[
          ["Verified earnings", `₹${earnings.totalEarned.toLocaleString()}`, "From accepted produce", "trend"],
          ["Accepted supply", `${earnings.totalAcceptedQty} kg`, "In consolidated cluster stock", "farmer"],
          ["In review", String(earnings.pendingCount), "Awaiting cluster intake", "clock"],
          ["Accepted batches", String(earnings.acceptedCount), "Quality approved", "check"],
        ]}
      />

      <div className="dash-two farmer-main">
        <article className="panel">
          <PanelHead title="Assigned Cluster Information" />
          <div style={{ display: "flex", gap: "16px", marginTop: "16px", alignItems: "center" }}>
            <div className="mini-avatar" style={{ width: "48px", height: "48px", fontSize: "14px" }}>CAC</div>
            <div>
              <h4 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: "700" }}>{clusterName}</h4>
              <p style={{ margin: "0", fontSize: "11px", color: "#6a7c73" }}>Manager: Anita Rao · Chengalpattu Hub, TN</p>
              <span style={{ fontSize: "10.5px", color: "#55962f", fontWeight: "600" }}>● Daily morning collection active</span>
            </div>
          </div>
        </article>

        <article className="panel farm-score">
          <PanelHead title="Supply Acceptance Rate" />
          <div className="score-ring">
            <b>{submissions.length > 0 ? Math.round((earnings.acceptedCount / Math.max(1, submissions.length)) * 100) : 100}%</b>
            <span>Accepted</span>
          </div>
          <p>Consistently meeting cluster quality standards.</p>
        </article>
      </div>

      <article className="panel orders-panel">
        <PanelHead title="My Produce Submissions & Cluster Intake Status" />
        {submissions.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Submission ID</th>
                <th>Produce</th>
                <th>Est. Quantity</th>
                <th>Price / Unit</th>
                <th>Harvest Date</th>
                <th>Intake Status</th>
                <th>Accepted Qty</th>
                <th>Total Payout</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id}>
                  <td>
                    <b>#{s.id.slice(-6).toUpperCase()}</b>
                  </td>
                  <td>
                    {s.productName} {s.organic && <span style={{ color: "#55962f", fontSize: "9px" }}>(Organic)</span>}
                  </td>
                  <td>{s.estimatedQuantity} {s.unit}</td>
                  <td>₹{s.pricePerUnit}</td>
                  <td>{s.harvestDate}</td>
                  <td>
                    <Status text={s.status} />
                  </td>
                  <td>
                    <b>{s.acceptedQuantity !== undefined ? `${s.acceptedQuantity} ${s.unit}` : "Pending Verification"}</b>
                    {s.rejectedQuantity ? <small style={{ color: "#dc2626" }}>({s.rejectedQuantity} {s.unit} rejected: {s.rejectionReason})</small> : null}
                  </td>
                  <td>
                    <strong>
                      ₹{((s.acceptedQuantity ?? (s.status === "Accepted" ? s.estimatedQuantity : 0)) * s.pricePerUnit).toLocaleString()}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: "40px 10px", textAlign: "center", color: "#6a7c73", fontSize: "12px" }}>
            <LeafIcon size={32} />
            <p style={{ margin: "10px 0 0" }}>No produce submitted yet. Click <strong>＋ Submit produce availability</strong> to declare your upcoming harvest!</p>
          </div>
        )}
      </article>

      {/* Produce Submission Modal */}
      {showSubmitModal && (
        <div className="auth-backdrop" role="dialog" aria-modal="true">
          <button
            type="button"
            className="auth-overlay-button"
            onClick={() => setShowSubmitModal(false)}
            aria-label="Close modal"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: "transparent", border: 0 }}
          />
          <div className="auth-modal" style={{ position: "relative", zIndex: 1 }}>
            <button className="auth-close" onClick={() => setShowSubmitModal(false)} aria-label="Close modal">
              ✕
            </button>
            <div className="auth-header">
              <span className="section-kicker">CLUSTER HARVEST SUBMISSION</span>
              <h2>Submit Produce to Cluster</h2>
              <p>Your harvest will be collected and inspected by {clusterName}.</p>
            </div>
            <form className="auth-form" onSubmit={handleProduceSubmit}>
              <label>
                Produce Name
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g. Organic Tomatoes, Fresh Spinach"
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <label>
                  Category
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    style={{ height: "42px", borderRadius: "10px", border: "1px solid #cadbc5", padding: "0 10px", background: "white" }}
                  >
                    {categories.map(([c]) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Unit
                  <select
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    style={{ height: "42px", borderRadius: "10px", border: "1px solid #cadbc5", padding: "0 10px", background: "white" }}
                  >
                    <option value="kg">kg</option>
                    <option value="bundle">bundle</option>
                    <option value="litre">litre</option>
                    <option value="6 pcs">6 pcs</option>
                  </select>
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <label>
                  Estimated Quantity
                  <input
                    type="number"
                    min="1"
                    required
                    value={prodQty}
                    onChange={(e) => setProdQty(Number(e.target.value))}
                  />
                </label>
                <label>
                  Farmer Price / Unit (₹)
                  <input
                    type="number"
                    min="1"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(Number(e.target.value))}
                  />
                </label>
              </div>

              <label>
                Harvest Date / Availability
                <input
                  type="text"
                  required
                  value={prodHarvestDate}
                  onChange={(e) => setProdHarvestDate(e.target.value)}
                  placeholder="e.g. Today 6:00 AM, Tomorrow Morning"
                />
              </label>

              <label style={{ flexDirection: "row", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={prodOrganic}
                  onChange={(e) => setProdOrganic(e.target.checked)}
                />
                Certified Organic Produce
              </label>

              <button type="submit" className="auth-submit">
                Submit to Cluster Hub →
              </button>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast">
          <CheckIcon size={14} />
          {toast}
        </div>
      )}
    </DashboardShell>
  );
}

/* ========================================================
   CLUSTER MANAGER DASHBOARD
   ======================================================== */
function ClusterManagerDashboard({
  currentUser,
  onExit,
  notify,
  toast,
  onInventoryUpdated,
}: {
  currentUser: User;
  onExit: () => void;
  notify: (s: string) => void;
  toast: string;
  onInventoryUpdated: () => void;
}) {
  const [tab, setTab] = useState("Dashboard");
  const [cluster, setCluster] = useState<Cluster | null>(null);
  const [submissions, setSubmissions] = useState<ProduceSubmission[]>([]);
  const [inventory, setInventory] = useState<ConsolidatedInventoryItem[]>([]);
  const [analytics, setAnalytics] = useState({
    totalStockKg: 0,
    totalAllocatedKg: 0,
    pendingIncomingKg: 0,
    activeProductsCount: 0,
    recentOrdersCount: 0,
  });

  // Quality Verification Dialog state
  const [inspectingSub, setInspectingSub] = useState<ProduceSubmission | null>(null);
  const [verifyReceivedQty, setVerifyReceivedQty] = useState(0);
  const [verifyAcceptedQty, setVerifyAcceptedQty] = useState(0);
  const [verifyRejectedQty, setVerifyRejectedQty] = useState(0);
  const [verifyRejectReason, setVerifyRejectReason] = useState("");

  const clusterId = currentUser.clusterId || "cluster_chn_south";

  const refreshClusterData = async () => {
    const details = await clusterService.getClusterDetails(clusterId);
    if (details) setCluster(details);
    const subList = await clusterService.getClusterSubmissions(clusterId);
    setSubmissions(subList);
    const invList = await clusterService.getConsolidatedInventory(clusterId);
    setInventory(invList);
    const stats = await clusterService.getSupplyDemandAnalytics(clusterId);
    setAnalytics(stats);
  };

  useEffect(() => {
    refreshClusterData();
  }, [clusterId]);

  const openInspection = (sub: ProduceSubmission) => {
    setInspectingSub(sub);
    setVerifyReceivedQty(sub.estimatedQuantity);
    setVerifyAcceptedQty(sub.estimatedQuantity);
    setVerifyRejectedQty(0);
    setVerifyRejectReason("");
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingSub || !cluster) return;

    await clusterService.verifyProduceAndConsolidate({
      submissionId: inspectingSub.id,
      clusterId: cluster.id,
      clusterName: cluster.name,
      receivedQuantity: Number(verifyReceivedQty),
      acceptedQuantity: Number(verifyAcceptedQty),
      rejectedQuantity: Number(verifyRejectedQty),
      rejectionReason: verifyRejectedQty > 0 ? verifyRejectReason : undefined,
    });

    setInspectingSub(null);
    await refreshClusterData();
    onInventoryUpdated();
    notify(`Produce verified! ${verifyAcceptedQty} ${inspectingSub.unit} consolidated into cluster inventory.`);
  };

  return (
    <DashboardShell
      userRole="cluster_manager"
      title="Cluster Console"
      user={currentUser.name}
      onExit={onExit}
      active={tab}
      onTab={setTab}
      nav={[
        "Dashboard",
        "Quality Verification",
        "Consolidated Inventory",
        "Member Farmers",
        "Dispatch to Farm2Home",
        "Settings",
      ]}
    >
      <div className="dash-welcome">
        <div>
          <p>{(cluster?.name || "CHENGALPATTU AGRO CLUSTER").toUpperCase()} · COMMAND</p>
          <h1>{tab === "Dashboard" ? `Cluster Operations Hub 👋` : tab}</h1>
          <span>
            Manage farmer collection batches, quality inspection intake, and consolidated inventory ready for Farm2Home.
          </span>
        </div>
        <button onClick={() => notify("Cluster capacity report generated")}>Export cluster report ↗</button>
      </div>

      <Stats
        data={[
          ["Consolidated stock", `${analytics.totalStockKg} kg`, "Ready for customer orders", "orders"],
          ["Pending collection", `${analytics.pendingIncomingKg} kg`, "Farmer submissions in queue", "clock"],
          ["Dispatched & allocated", `${analytics.totalAllocatedKg} kg`, "Allocated to orders", "truck"],
          ["Active varieties", String(analytics.activeProductsCount), "Sellable products in hub", "farmer"],
        ]}
      />

      {tab === "Dashboard" || tab === "Quality Verification" ? (
        <article className="panel orders-panel" style={{ marginBottom: "20px" }}>
          <PanelHead title="Farmer Produce Submissions — Quality Verification Queue" />
          {submissions.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Farmer</th>
                  <th>Farm</th>
                  <th>Produce</th>
                  <th>Est. Qty</th>
                  <th>Farmer Price</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <b>{s.farmerName}</b>
                    </td>
                    <td>{s.farmName}</td>
                    <td>{s.productName} {s.organic && <small style={{ color: "#55962f" }}>Organic</small>}</td>
                    <td>{s.estimatedQuantity} {s.unit}</td>
                    <td>₹{s.pricePerUnit} / {s.unit}</td>
                    <td>
                      <Status text={s.status} />
                    </td>
                    <td>
                      {s.status === "Submitted" || s.status === "Collected" ? (
                        <button
                          className="approve"
                          onClick={() => openInspection(s)}
                        >
                          Inspect & Verify
                        </button>
                      ) : (
                        <span style={{ fontSize: "10px", color: "#55962f", fontWeight: "600" }}>
                          ✓ Consolidated ({s.acceptedQuantity} {s.unit})
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: "35px 10px", textAlign: "center", color: "#6a7c73", fontSize: "12px" }}>
              <CheckIcon size={30} />
              <p style={{ margin: "8px 0 0" }}>No pending farmer submissions in this cluster.</p>
            </div>
          )}
        </article>
      ) : null}

      {tab === "Dashboard" || tab === "Consolidated Inventory" ? (
        <article className="panel orders-panel">
          <PanelHead title="Consolidated Cluster Inventory (Available to Farm2Home Customers)" />
          {inventory.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Total Accepted</th>
                  <th>Available Stock</th>
                  <th>Allocated / Sold</th>
                  <th>Farmer Cost</th>
                  <th>Retail Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <b>{item.productName}</b>
                    </td>
                    <td>{item.category}</td>
                    <td>{item.totalAcceptedQty} {item.unit}</td>
                    <td>
                      <strong style={{ color: item.availableStockQty > 0 ? "#155e3b" : "#dc2626" }}>
                        {item.availableStockQty} {item.unit}
                      </strong>
                    </td>
                    <td>{item.allocatedQty} {item.unit}</td>
                    <td>₹{item.farmerCostPerUnit} / {item.unit}</td>
                    <td>₹{item.retailPrice} / {item.unit}</td>
                    <td>
                      <Status text={item.availableStockQty > 0 ? "In Stock" : "Out of Stock"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: "35px 10px", textAlign: "center", color: "#6a7c73", fontSize: "12px" }}>
              <PackageIcon size={30} />
              <p style={{ margin: "8px 0 0" }}>No consolidated inventory yet. When you verify and accept farmer produce, it automatically consolidates here!</p>
            </div>
          )}
        </article>
      ) : null}

      {/* Quality Verification Modal */}
      {inspectingSub && (
        <div className="auth-backdrop" role="dialog" aria-modal="true">
          <button
            type="button"
            className="auth-overlay-button"
            onClick={() => setInspectingSub(null)}
            aria-label="Close modal"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: "transparent", border: 0 }}
          />
          <div className="auth-modal" style={{ position: "relative", zIndex: 1 }}>
            <button className="auth-close" onClick={() => setInspectingSub(null)} aria-label="Close modal">
              ✕
            </button>
            <div className="auth-header">
              <span className="section-kicker">CLUSTER QUALITY VERIFICATION</span>
              <h2>Inspect & Accept Produce</h2>
              <p>Farmer: <strong>{inspectingSub.farmerName}</strong> ({inspectingSub.farmName})</p>
            </div>
            <form className="auth-form" onSubmit={handleVerifySubmit}>
              <div style={{ background: "rgba(235, 244, 230, 0.7)", padding: "10px", borderRadius: "10px", fontSize: "11px", marginBottom: "6px" }}>
                <strong>Produce:</strong> {inspectingSub.productName} ({inspectingSub.category})<br />
                <strong>Declared Quantity:</strong> {inspectingSub.estimatedQuantity} {inspectingSub.unit}<br />
                <strong>Agreed Farmer Rate:</strong> ₹{inspectingSub.pricePerUnit} / {inspectingSub.unit}
              </div>

              <label>
                Physical Quantity Received ({inspectingSub.unit})
                <input
                  type="number"
                  min="0"
                  required
                  value={verifyReceivedQty}
                  onChange={(e) => {
                    const rec = Number(e.target.value);
                    setVerifyReceivedQty(rec);
                    setVerifyAcceptedQty(rec);
                    setVerifyRejectedQty(0);
                  }}
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <label>
                  Accepted Quantity ({inspectingSub.unit})
                  <input
                    type="number"
                    min="0"
                    max={verifyReceivedQty}
                    required
                    value={verifyAcceptedQty}
                    onChange={(e) => {
                      const acc = Number(e.target.value);
                      setVerifyAcceptedQty(acc);
                      setVerifyRejectedQty(Math.max(0, verifyReceivedQty - acc));
                    }}
                  />
                </label>
                <label>
                  Rejected Quantity ({inspectingSub.unit})
                  <input
                    type="number"
                    min="0"
                    value={verifyRejectedQty}
                    onChange={(e) => {
                      const rej = Number(e.target.value);
                      setVerifyRejectedQty(rej);
                      setVerifyAcceptedQty(Math.max(0, verifyReceivedQty - rej));
                    }}
                  />
                </label>
              </div>

              {verifyRejectedQty > 0 && (
                <label>
                  Reason for Rejection
                  <input
                    type="text"
                    required
                    value={verifyRejectReason}
                    onChange={(e) => setVerifyRejectReason(e.target.value)}
                    placeholder="e.g. Overripe, transit damage"
                  />
                </label>
              )}

              <button type="submit" className="auth-submit">
                ✓ Approve & Consolidate to Inventory
              </button>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast">
          <CheckIcon size={14} />
          {toast}
        </div>
      )}
    </DashboardShell>
  );
}

/* ========================================================
   DASHBOARD SHELL
   ======================================================== */
function DashboardShell({
  userRole,
  title,
  user,
  onExit,
  nav,
  active = "Dashboard",
  onTab = () => {},
  children,
}: {
  userRole: Role;
  title: string;
  user: string;
  onExit: () => void;
  nav: string[];
  active?: string;
  onTab?: (s: string) => void;
  children: React.ReactNode;
}) {
  const getNavIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "dashboard":
      case "overview":
        return <DashboardIcon size={16} />;
      case "produce submissions":
      case "quality verification":
      case "products":
        return <LeafIcon size={16} />;
      case "consolidated inventory":
      case "inventory":
        return <PackageIcon size={16} />;
      case "cluster collections":
      case "dispatch to farm2home":
      case "deliveries":
        return <TruckIcon size={16} />;
      case "earnings":
        return <TrendUpIcon size={16} />;
      case "member farmers":
      case "farmers":
        return <UserIcon size={16} />;
      case "settings":
      case "farm profile":
      case "profile":
        return <SettingsIcon size={16} />;
      default:
        return <DashboardIcon size={16} />;
    }
  };

  return (
    <main className={`dashboard ${userRole}`}>
      <aside className="sidebar">
        <button className="brand dash-brand" onClick={onExit}>
          <svg width="36" height="36" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="rl-d" x1="100" y1="220" x2="220" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#045a27" />
                <stop offset="1" stopColor="#a7e126" />
              </linearGradient>
              <linearGradient id="ll-d" x1="60" y1="180" x2="120" y2="80" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0c6b32" />
                <stop offset="1" stopColor="#96cf1e" />
              </linearGradient>
            </defs>
            <path d="M128 230 C 130 130, 200 80, 240 40 C 220 160, 160 200, 128 230 Z" fill="url(#rl-d)" />
            <path d="M124 220 C 110 140, 60 110, 40 100 C 60 170, 90 190, 124 220 Z" fill="url(#ll-d)" />
            <path d="M128 230 C 140 150, 180 100, 240 40 C 170 120, 140 160, 128 230 Z" fill="#ffffff" opacity="0.3" />
            <path d="M124 220 C 110 150, 80 120, 40 100 C 70 140, 90 160, 124 220 Z" fill="#ffffff" opacity="0.3" />
          </svg>
          <span>
            Farm<span>2</span>Home
          </span>
        </button>
        <span className="portal-label">{title}</span>
        <nav>
          {nav.map((n) => (
            <button
              key={n}
              className={active === n ? "active" : ""}
              onClick={() => onTab(n)}
            >
              <i>{getNavIcon(n)}</i>
              <span>{n}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button>
            <span className="avatar">
              {user
                .split(" ")
                .map((x) => x[0])
                .join("")}
            </span>
            <span>
              {user}
              <small>
                {userRole === "farmer"
                  ? "Member Farmer"
                  : userRole === "cluster_manager"
                  ? "Cluster Hub Manager"
                  : "Customer"}
              </small>
            </span>
            <ChevronDownIcon size={12} />
          </button>
          <button onClick={onExit}>← Back to marketplace</button>
        </div>
      </aside>

      <section className="dash-content">
        <header>
          <div className="dash-search">
            <SearchIcon size={14} /> <span>Search in cluster...</span>
            <kbd>⌘ K</kbd>
          </div>
          <div>
            <button><ClockIcon size={15} /></button>
            <button className="bell">
              <StarIcon size={14} /><i></i>
            </button>
            <span>
              Live cluster session <b>●</b>
            </span>
          </div>
        </header>
        <div className="dash-body">{children}</div>
      </section>
    </main>
  );
}

function Stats({ data }: { data: string[][] }) {
  const renderStatIcon = (type: string) => {
    switch (type) {
      case "orders":
        return <PackageIcon size={18} />;
      case "trend":
        return <TrendUpIcon size={18} />;
      case "farmer":
        return <LeafIcon size={18} />;
      case "user":
        return <UserIcon size={18} />;
      case "cart":
        return <CartIcon size={18} />;
      case "clock":
        return <ClockIcon size={18} />;
      case "truck":
        return <TruckIcon size={18} />;
      case "check":
      default:
        return <CheckIcon size={16} />;
    }
  };

  return (
    <div className="stats-grid">
      {data.map((s) => (
        <article className="stat-card" key={s[0]}>
          <div>
            <span>{s[0]}</span>
            <b>{s[1]}</b>
            <small>{s[2]}</small>
          </div>
          <i>{renderStatIcon(s[3])}</i>
        </article>
      ))}
    </div>
  );
}

function PanelHead({ title, action }: { title: string; action?: string }) {
  return (
    <div className="panel-head">
      <h3>{title}</h3>
      {action && <button>{action}</button>}
    </div>
  );
}

function Status({ text }: { text: string }) {
  return <span className={`status ${text.toLowerCase().replaceAll(" ", "-").replaceAll("_", "-")}`}>● {text}</span>;
}

function Footer({ navigate }: { navigate: (v: View) => void }) {
  return (
    <footer>
      <div className="footer-brand">
        <button className="brand" onClick={() => navigate("home")}>
          <svg width="36" height="36" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="rl-f" x1="100" y1="220" x2="220" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#045a27" />
                <stop offset="1" stopColor="#a7e126" />
              </linearGradient>
              <linearGradient id="ll-f" x1="60" y1="180" x2="120" y2="80" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0c6b32" />
                <stop offset="1" stopColor="#96cf1e" />
              </linearGradient>
            </defs>
            <path d="M128 230 C 130 130, 200 80, 240 40 C 220 160, 160 200, 128 230 Z" fill="url(#rl-f)" />
            <path d="M124 220 C 110 140, 60 110, 40 100 C 60 170, 90 190, 124 220 Z" fill="url(#ll-f)" />
            <path d="M128 230 C 140 150, 180 100, 240 40 C 170 120, 140 160, 128 230 Z" fill="#ffffff" opacity="0.3" />
            <path d="M124 220 C 110 150, 80 120, 40 100 C 70 140, 90 160, 124 220 Z" fill="#ffffff" opacity="0.3" />
          </svg>
          <span>
            Farm<span>2</span>Home
          </span>
        </button>
        <p>Direct from regional farm clusters to your home.</p>
      </div>
      <div>
        <b>Marketplace</b>
        <button onClick={() => navigate("shop")}>Shop fresh</button>
        <button onClick={() => navigate("home")}>Farm clusters</button>
        <button onClick={() => navigate("home")}>How it works</button>
      </div>
      <div>
        <b>Supply Portals</b>
        <button onClick={() => navigate("farmer")}>Farmer portal</button>
        <button onClick={() => navigate("cluster_manager")}>Cluster Manager console</button>
      </div>
      <div>
        <b>Architecture</b>
        <span>Multi-Farmer Cluster Consolidation</span>
        <span>Quality Verification Pipeline</span>
        <span>Decoupled AWS-Ready Data Layer</span>
      </div>
    </footer>
  );
}
