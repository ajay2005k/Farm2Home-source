"use client";

import { useMemo, useState } from "react";
import { clusters as seedClusters, orders as seedOrders, products, tenants as seedTenants } from "../mock-data";
import { clearStoredUser, getStoredUser } from "../services/authService";
import type { AuthUser, CartEntry, Cluster, OrderStatus, Product, ProductSource, Role } from "../types";
import DeliveryRouteMap from "./DeliveryRouteMap";
import LoginPage from "./LoginPage";

type View = "home"|"shop"|"product"|"cart"|"tracking"|"customer"|"farmer"|"admin"|"login";

const categories = [
  ["Vegetables","🥬","#e4f1d9"],["Fruits","🍊","#fff0d8"],["Dairy","🥛","#eef2da"],["Grains","🌾","#f5ebd5"],
  ["Eggs","🥚","#f8eddb"],["Organic","🌿","#e1f2df"],["Spices","✦","#f8e4d9"],["Other","＋","#edf0e8"],
];
const roleInfo = [
  {role:"customer" as Role,label:"Customer",caption:"Discover local produce",icon:"⌂"},
  {role:"farmer" as Role,label:"Farmer",caption:"Manage your farm",icon:"♧"},
  {role:"admin" as Role,label:"Admin",caption:"Run the marketplace",icon:"◇"},
];

export default function Home() {
  const [view,setView] = useState<View>("home");
  const [roleOpen,setRoleOpen] = useState(false);
  const [userMenuOpen,setUserMenuOpen] = useState(false);
  const [currentUser,setCurrentUser] = useState<AuthUser | null>(() => getStoredUser());

  const [cart,setCart] = useState<CartEntry[]>([
    { product: products[0], source: products[0].sources[0], quantity: 2 },
    { product: products[1], source: products[1].sources[0], quantity: 1 },
  ]);
  const [selected,setSelected] = useState<Product>(products[0]);
  const [selectedSource,setSelectedSource] = useState<ProductSource>(products[0].sources[0]);
  const [compareProduct,setCompareProduct] = useState<Product | null>(null);
  const [query,setQuery] = useState("");
  const [clusterFilter,setClusterFilter] = useState("all");
  const [sortBy,setSortBy] = useState("Recommended");
  const [deliveryType,setDeliveryType] = useState<"cluster_pickup"|"doorstep">("cluster_pickup");
  const [selectedDropCluster,setSelectedDropCluster] = useState<Cluster>(
    seedClusters.find(c => c.type === "consumer_delivery") || seedClusters[6]
  );
  const [userAddress,setUserAddress] = useState("Flat 4B, Lake View Enclave, Velachery, Chennai 600042");
  const [toast,setToast] = useState("");
  const notify = (message:string) => { setToast(message); window.setTimeout(()=>setToast(""),2200); };
  const navigate = (next:View) => { setView(next); setRoleOpen(false); window.scrollTo({top:0,behavior:"smooth"}); };
  
  const addToCart = (product:Product, source:ProductSource, qty:number = 1) => {
    setCart((items)=>{
      const existing = items.find(i=>i.product.id === product.id && i.source.clusterId === source.clusterId);
      if(existing){
        return items.map(i=>i.product.id === product.id && i.source.clusterId === source.clusterId ? {...i, quantity: i.quantity + qty} : i);
      }
      return [...items, { product, source, quantity: qty }];
    });
    notify(`Added ${product.name} from ${source.clusterName}`);
  };

  const showProduct = (product:Product, source?:ProductSource) => {
    setSelected(product);
    setSelectedSource(source || product.sources[0]);
    navigate("product");
  };

  const filtered = useMemo(()=>{
    let result = products.filter(p => {
      const matchQuery = `${p.name} ${p.category} ${p.farmer} ${p.clusterName} ${p.description}`.toLowerCase().includes(query.toLowerCase());
      const matchCluster = clusterFilter === "all" || p.clusterId === clusterFilter || p.sources.some(s=>s.clusterId === clusterFilter);
      return matchQuery && matchCluster;
    });

    if(sortBy === "Farmer Share: High to Low"){
      result = [...result].sort((a,b)=>b.breakdown.farmerPercentage - a.breakdown.farmerPercentage);
    } else if(sortBy === "Lowest Food Miles"){
      result = [...result].sort((a,b)=> (a.sources[0]?.distanceKm || 0) - (b.sources[0]?.distanceKm || 0));
    } else if(sortBy === "Price: Low to High"){
      result = [...result].sort((a,b)=>a.price - b.price);
    } else if(sortBy === "Price: High to Low"){
      result = [...result].sort((a,b)=>b.price - a.price);
    }

    return result;
  },[query,clusterFilter,sortBy]);

  const cartCount = cart.reduce((sum, item)=>sum + item.quantity, 0);

  if (view === "farmer") return <FarmerDashboard onExit={()=>navigate("home")} notify={notify} toast={toast}/>;
  if (view === "admin") return <AdminDashboard onExit={()=>navigate("home")} notify={notify} toast={toast}/>;
  if (view === "customer") return <CustomerDashboard onNavigate={navigate} cartCount={cartCount}/>;
  if (view === "login") {
    return (
      <LoginPage
        currentUser={currentUser}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          navigate("home");
        }}
        onLogout={() => {
          clearStoredUser();
          setCurrentUser(null);
        }}
        onExit={() => navigate("home")}
        notify={notify}
        onSelectRoleView={(role) => navigate(role)}
      />
    );
  }

  return <main>
    <CustomerHeader
      active={view}
      cart={cartCount}
      roleOpen={roleOpen}
      setRoleOpen={setRoleOpen}
      userMenuOpen={userMenuOpen}
      setUserMenuOpen={setUserMenuOpen}
      currentUser={currentUser}
      onLogout={() => {
        clearStoredUser();
        setCurrentUser(null);
        notify("Signed out successfully");
      }}
      navigate={navigate}
    />
    {view === "home" && <Landing navigate={navigate} addToCart={(p, s)=>addToCart(p, s || p.sources[0], 1)} showProduct={showProduct} onCompare={(p)=>setCompareProduct(p)} setClusterFilter={setClusterFilter}/>} 
    {view === "shop" && <Shop query={query} setQuery={setQuery} clusterFilter={clusterFilter} setClusterFilter={setClusterFilter} sortBy={sortBy} setSortBy={setSortBy} products={filtered} addToCart={(p, s)=>addToCart(p, s || p.sources[0], 1)} showProduct={showProduct} onCompare={(p)=>setCompareProduct(p)}/>} 
    {view === "product" && <ProductDetail product={selected} initialSource={selectedSource} addToCart={addToCart} navigate={navigate} onCompare={(p)=>setCompareProduct(p)}/>} 
    {view === "cart" && (
      <Cart
        cart={cart}
        setCart={setCart}
        navigate={navigate}
        deliveryType={deliveryType}
        setDeliveryType={setDeliveryType}
        selectedDropCluster={selectedDropCluster}
        setSelectedDropCluster={setSelectedDropCluster}
        userAddress={userAddress}
        setUserAddress={setUserAddress}
      />
    )} 
    {view === "tracking" && (
      <Tracking
        navigate={navigate}
        deliveryType={deliveryType}
        dropCluster={selectedDropCluster}
        cart={cart}
        userAddress={userAddress}
      />
    )} 
    <Footer navigate={navigate}/>
    {toast && <div className="toast"><span>✓</span>{toast}</div>}
    {compareProduct && (
      <CompareClustersModal
        product={compareProduct}
        onClose={()=>setCompareProduct(null)}
        onSelectSource={(prod, src)=>{
          addToCart(prod, src, 1);
          setCompareProduct(null);
        }}
      />
    )}
  </main>;
}

function CustomerHeader({
  active,
  cart,
  roleOpen,
  setRoleOpen,
  userMenuOpen,
  setUserMenuOpen,
  currentUser,
  onLogout,
  navigate,
}: {
  active: View;
  cart: number;
  roleOpen: boolean;
  setRoleOpen: (v: boolean) => void;
  userMenuOpen: boolean;
  setUserMenuOpen: (v: boolean) => void;
  currentUser: AuthUser | null;
  onLogout: () => void;
  navigate: (v: View) => void;
}) {
  return (
    <header className="topbar">
      <button className="brand" onClick={() => navigate("home")} aria-label="Farm2Home home">
        <span className="brand-mark"><span>⌂</span></span>
        <span>Farm<span>2</span>Home</span>
      </button>
      <nav aria-label="Main navigation">
        <button className={active === "home" ? "active" : ""} onClick={() => navigate("home")}>Home</button>
        <button className={active === "shop" ? "active" : ""} onClick={() => navigate("shop")}>Shop</button>
        <button onClick={() => { navigate("home"); setTimeout(() => document.querySelector("#farmers")?.scrollIntoView(), 100); }}>Farmers</button>
        <button onClick={() => { navigate("home"); setTimeout(() => document.querySelector("#transparency")?.scrollIntoView(), 100); }}>Transparency</button>
        <button onClick={() => { navigate("home"); setTimeout(() => document.querySelector("#how")?.scrollIntoView(), 100); }}>How It Works</button>
      </nav>
      <div className="nav-actions">
        <button className="icon-button" onClick={() => navigate("shop")} aria-label="Search">⌕</button>
        <button className="location-button"><span>⌖</span> Chennai Hubs <span className="chev">⌄</span></button>
        <button className="icon-button cart" onClick={() => navigate("cart")} aria-label={`Cart with ${cart} items`}>
          ⌑{cart > 0 && <b>{cart}</b>}
        </button>
        {currentUser ? (
          <button
            type="button"
            className="user-menu-pill"
            onClick={() => {
              setUserMenuOpen(!userMenuOpen);
              setRoleOpen(false);
            }}
            aria-label={`Logged in as ${currentUser.name}`}
          >
            <span className="user-avatar-small">{currentUser.avatarInitials}</span>
            <span>{currentUser.name}</span>
            <span className="chev">⌄</span>
          </button>
        ) : (
          <button type="button" className="login" onClick={() => navigate("login")}>
            Log in <span>↗</span>
          </button>
        )}
      </div>

      {userMenuOpen && currentUser && (
        <div className="user-dropdown">
          <div className="user-dropdown-head">
            <span className="user-avatar-small" style={{ width: "36px", height: "36px", fontSize: "14px" }}>
              {currentUser.avatarInitials}
            </span>
            <div>
              <h4>{currentUser.name}</h4>
              <small>{currentUser.email}</small>
              <span className="user-dropdown-badge">● {currentUser.role.toUpperCase()}</span>
            </div>
          </div>
          <div className="user-dropdown-links">
            <button type="button" onClick={() => { setUserMenuOpen(false); navigate("admin"); }}><i>◇</i> Admin Console</button>
            <button type="button" onClick={() => { setUserMenuOpen(false); navigate("farmer"); }}><i>♧</i> Farmer Portal</button>
            <button type="button" onClick={() => { setUserMenuOpen(false); navigate("customer"); }}><i>⌂</i> Customer Account</button>
            <button type="button" onClick={() => { setUserMenuOpen(false); navigate("login"); }}><i>⚙</i> Demo Credentials & Session</button>
            <button type="button" className="user-logout-btn" onClick={() => { setUserMenuOpen(false); onLogout(); }}><i>⎋</i> Log Out</button>
          </div>
        </div>
      )}

      {roleOpen && (
        <div className="role-menu">
          <p>Continue as</p>
          {roleInfo.map((item) => (
            <button type="button" key={item.role} onClick={() => navigate(item.role)}>
              <i>{item.icon}</i>
              <span>{item.label}<small>{item.caption}</small></span>
              <b>›</b>
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

function Landing({navigate,addToCart,showProduct,onCompare,setClusterFilter}:{navigate:(v:View)=>void;addToCart:(p:Product, s?:ProductSource)=>void;showProduct:(p:Product, s?:ProductSource)=>void;onCompare:(p:Product)=>void;setClusterFilter:(c:string)=>void}) {
  return <>
    <section className="hero" id="home"><div className="hero-copy"><div className="eyebrow"><span>●</span> 100% Financial & Supply Chain Transparency</div><h1>Choose your farm cluster.<br/><em>Know who grows your food.</em></h1><p>Compare regional farm clusters, view exact cost breakdowns, and see where every single rupee goes. 70%+ of your spend reaches the grower directly—zero exploitative middlemen.</p><div className="hero-actions"><button className="primary" onClick={()=>navigate("shop")}>Shop fresh produce <span>→</span></button><button className="secondary" onClick={()=>navigate("farmer")}>Farmer portal <span>↗</span></button></div><div className="trust-row"><div><strong>6 Hubs</strong><span>Regional production clusters</span></div><div><strong>71%</strong><span>Average farmer share</span></div><div><strong>₹0 Broker</strong><span>100% Disintermediated</span></div></div></div>
      <div className="hero-visual"><img src="https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=1200&q=88" alt="Farmer holding a basket of vegetables"/><div className="fresh-card"><span>✓</span><div><small>Audited price breakdown</small><strong>68–74% Direct to farmer</strong></div></div><div className="farmer-card"><div className="mini-avatar">RK</div><div><small>Chengalpattu Cluster Hub #4</small><strong>Rajesh Kumar</strong><span>★ 4.8 · 45 km food miles</span></div></div><div className="leaf">❧</div></div>
    </section>
    <section className="promise-strip"><span>✓ Verified Farm Clusters</span><span>◴ Pre-Cooling Cold Chain</span><span>♲ Transparent Price Breakdown</span><span>♡ Zero Middlemen Exploitation</span></section>
    
    <section className="section categories"><SectionTitle kicker="SHOP BY AGRO-CLIMATIC REGIONS" title="Freshness sourced from authentic soils" action={()=>navigate("shop")}/><div className="category-grid">{categories.map(([name,icon,color])=><button key={name} onClick={()=>navigate("shop")} style={{background:color}}><span>{icon}</span><strong>{name}</strong><small>Compare clusters</small><b>↗</b></button>)}</div></section>
    
    <section className="section products-section"><SectionTitle kicker="FRESH HARVESTS WITH MULTIPLE SOURCES" title="Compare clusters. Choose the most viable source." action={()=>navigate("shop")}/><div className="product-grid">{products.slice(0,4).map(p=><ProductCard key={p.id} product={p} addToCart={addToCart} showProduct={showProduct} onCompare={onCompare}/>)}</div></section>
    
    <section className="farmer-spotlight" id="farmers"><div className="farmer-photo"><img src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=85" alt="Farmer in a green field"/><span>Single-Estate Lot</span></div><div className="farmer-story"><span className="section-kicker">FULL FINANCIAL PROVENANCE</span><h2>Meet Rajesh Kumar: “We receive ₹28.50/kg on ₹42 tomatoes.”</h2><div className="verified">✓ Audited Direct Payout</div><p>“In traditional wholesale mandis, commission agents, brokers, and transport cartels take 65% of the consumer price. On Farm2Home, our cluster pools solar cold storage and trucks. Consumers pay less, and our family earns almost double.”</p><div className="story-meta"><div><strong>Green Valley Farm</strong><span>Chengalpattu Agro-Hub #4</span></div><div><strong>68% Payout</strong><span>Same-day bank settlement</span></div></div><button className="primary compact" onClick={()=>{setClusterFilter("CL-FARM-01");navigate("shop");}}>View Chengalpattu cluster produce →</button></div></section>

    <section className="section transparency-showcase" id="transparency" style={{background:"#f4f8f1",padding:"70px 6vw"}}>
      <SectionTitle kicker="THE TRANSPARENCY PROMISE" title="See where every rupee goes. Conventional vs Farm2Home."/>
      <div className="mandi-comparison-box" style={{maxWidth:"900px",margin:"20px auto 0",padding:"25px"}}>
        <div className="mandi-col traditional">
          <h5>❌ Conventional Supermarket / Mandi (Broker Chain)</h5>
          <div className="mandi-metric-row"><span>Retail shelf price</span><b>₹58.00 / kg</b></div>
          <div className="mandi-metric-row"><span>5 Middlemen & broker cuts</span><b className="bad">−₹41.00 (70%)</b></div>
          <div className="mandi-metric-row"><span>Farmer payout</span><b className="bad">₹17.00 / kg (only 29%)</b></div>
          <div className="mandi-metric-row"><span>Payment cycle</span><span>45–60 days credit</span></div>
        </div>
        <div className="mandi-col farm2home">
          <h5>✅ Farm2Home Cluster Model (Direct & Pooled)</h5>
          <div className="mandi-metric-row"><span>Customer price</span><b>₹42.00 / kg</b></div>
          <div className="mandi-metric-row"><span>Shared solar pre-cooling & transit</span><span>−₹10.00</span></div>
          <div className="mandi-metric-row"><span>Platform & QA operations</span><span>−₹3.50</span></div>
          <div className="mandi-metric-row"><span>Direct farmer take-home</span><b className="good">₹28.50 / kg (68%)</b></div>
          <div className="mandi-metric-row"><span>Farmer payment</span><span style={{color:"#1b633f",fontWeight:700}}>Instant same-day payout</span></div>
        </div>
        <div className="mandi-banner">
          <span>⚡ Impact Summary:</span>
          <b>You save ₹16.00/kg (28% cheaper) while the farmer earns +₹11.50/kg more (+67% income boost).</b>
        </div>
      </div>
    </section>

    <section className="section how" id="how"><SectionTitle kicker="HOW TO SOURCE RESPONSIBLY" title="Empowering you to pick the best source"/><div className="steps">{[["01","⌕","Browse","Pick a fresh produce item."],["02","⚖","Compare","Compare farm clusters by distance, price, and farmer payout."],["03","❖","Select Source","Lock in your preferred grower and financial breakdown."],["04","⌂","Track Provenance","Follow the refrigerated batch journey directly to your community."]].map((s,i)=><div className="step" key={s[0]}><span className="step-no">{s[0]}</span><i>{s[1]}</i><h3>{s[2]}</h3><p>{s[3]}</p>{i<3&&<b>→</b>}</div>)}</div></section>
  </>;
}

function SectionTitle({kicker,title,action}:{kicker:string;title:string;action?:()=>void}) { return <div className="section-head"><div><span className="section-kicker">{kicker}</span><h2>{title}</h2></div>{action&&<button onClick={action}>Explore all products <span>→</span></button>}</div>; }

function ProductCard({product,addToCart,showProduct,onCompare}:{product:Product;addToCart:(p:Product, s?:ProductSource)=>void;showProduct:(p:Product, s?:ProductSource)=>void;onCompare:(p:Product)=>void}) {
  const [activeSource, setActiveSource] = useState<ProductSource>(product.sources[0]);

  return <article className="product-card">
    <button className="product-image" onClick={()=>showProduct(product, activeSource)}>
      <img src={product.image} alt={product.name}/>
      {activeSource.organic && <span>Organic</span>}
      <i>♡</i>
    </button>
    <div className="product-body">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}}>
        <small>⌖ {activeSource.location} · {activeSource.distanceKm} km</small>
        <span className="farmer-share-badge">{activeSource.breakdown.farmerPercentage}% to farmer</span>
      </div>
      <button className="product-name" onClick={()=>showProduct(product, activeSource)}>{product.name}</button>
      <span className="farmer-name">by {activeSource.farmer} · <b>★ {product.rating}</b></span>
      
      {/* Interactive Cluster Selector directly on the card */}
      <div className="card-cluster-selector">
        <span className="card-cluster-label">Available from {product.sources.length} clusters:</span>
        <div className="card-cluster-chips">
          {product.sources.map(src => (
            <button
              type="button"
              key={src.clusterId}
              className={`card-cluster-chip ${activeSource.clusterId === src.clusterId ? "active" : ""}`}
              onClick={(e)=>{ e.stopPropagation(); setActiveSource(src); }}
              title={`Switch to ${src.clusterName} (${src.distanceKm} km, ₹${src.price})`}
            >
              ❖ {src.location.split(",")[0]} · ₹{src.price}
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="card-compare-btn" onClick={(e)=>{ e.stopPropagation(); onCompare(product); }}>
        ⚖ Compare {product.sources.length} Cluster Sources & Transparency
      </button>

      <div>
        <strong>₹{activeSource.price}<small> / {product.unit}</small></strong>
        <button onClick={()=>addToCart(product, activeSource)} aria-label={`Add ${product.name} from ${activeSource.clusterName} to cart`}>＋</button>
      </div>
    </div>
  </article>;
}

function Shop({query,setQuery,clusterFilter,setClusterFilter,sortBy,setSortBy,products:items,addToCart,showProduct,onCompare}:{query:string;setQuery:(s:string)=>void;clusterFilter:string;setClusterFilter:(s:string)=>void;sortBy:string;setSortBy:(s:string)=>void;products:Product[];addToCart:(p:Product, s?:ProductSource)=>void;showProduct:(p:Product, s?:ProductSource)=>void;onCompare:(p:Product)=>void}) {
  const farmClusters = seedClusters.filter(c => c.type === "farm_production");
  return <section className="market-page">
    <div className="market-hero"><span className="section-kicker">REGIONAL CLUSTER SOURCING</span><h1>Transparent marketplace.</h1><p>Compare sources across regional farm clusters, inspect exact farmer margins, and choose the most viable origin.</p></div>
    <div className="market-tools">
      <label>⌕<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products, regions, or farm clusters..."/></label>
      <select aria-label="Sort products" value={sortBy} onChange={(e)=>setSortBy(e.target.value)}>
        <option>Recommended</option>
        <option>Farmer Share: High to Low</option>
        <option>Lowest Food Miles</option>
        <option>Price: Low to High</option>
        <option>Price: High to Low</option>
      </select>
    </div>
    <div className="market-layout">
      <aside>
        <h3>Source Clusters</h3>
        <details open><summary>Regional Hubs<span>⌄</span></summary><div className="filter-options"><label><input type="radio" name="cluster" checked={clusterFilter==="all"} onChange={()=>setClusterFilter("all")}/> All Regional Hubs ({farmClusters.length})</label>{farmClusters.map(c=><label key={c.id}><input type="radio" name="cluster" checked={clusterFilter===c.id} onChange={()=>setClusterFilter(c.id)}/> {c.name}</label>)}</div></details>
        {["Category","Farmer Share %","Organic only"].map((f,i)=><details key={f} open={i<1}><summary>{f}<span>⌄</span></summary><div className="filter-options"><label><input type="checkbox"/> {i===0?"Vegetables & Fruits":i===1?"> 70% direct to grower":"Certified Organic"}</label><label><input type="checkbox"/> {i===0?"Dairy, Grains & Eggs":i===1?"Low food miles (< 100km)":"Single estate"}</label></div></details>)}
      </aside>
      <div className="market-results">
        <div className="cluster-filter-row">
          <button className={`cluster-filter-chip ${clusterFilter==="all"?"active":""}`} onClick={()=>setClusterFilter("all")}>All Farm Clusters ({products.length})</button>
          {farmClusters.map(c=><button key={c.id} className={`cluster-filter-chip ${clusterFilter===c.id?"active":""}`} onClick={()=>setClusterFilter(c.id)}>❖ {c.name}</button>)}
        </div>
        <div className="results-label"><span><b>{items.length}</b> verified items available</span><span>Delivering to <b>Chennai Urban Clusters</b></span></div>
        {items.length?<div className="product-grid">{items.map(p=><ProductCard key={p.id} product={p} addToCart={addToCart} showProduct={showProduct} onCompare={onCompare}/>)}</div>:<div className="empty-state"><i>⌕</i><h3>No fresh picks found in this cluster</h3><p>Try switching to another regional cluster or clear your search.</p><button onClick={()=>{setQuery("");setClusterFilter("all");}}>Reset cluster filters</button></div>}
      </div>
    </div>
  </section>;
}

function CompareClustersModal({product, onClose, onSelectSource}:{product:Product; onClose:()=>void; onSelectSource:(p:Product, s:ProductSource)=>void}) {
  return <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div className="compare-modal">
      <button type="button" className="modal-close" onClick={onClose} aria-label="Close comparison modal">×</button>
      <span className="section-kicker">TRANSPARENT SOURCING COMPARATOR</span>
      <h2 id="modal-title" style={{font:"500 28px Georgia,serif",margin:"6px 0 10px",color:"#173d2a"}}>Available Clusters for {product.name}</h2>
      <p style={{fontSize:"11px",color:"#687a70",margin:"0 0 20px",lineHeight:"1.6"}}>
        This item is currently supplied by <b>{product.sources.length} regional clusters</b>. Inspect each option below to pick the best source based on food miles, farmer take-home pay, and price.
      </p>

      <div className="compare-grid">
        {product.sources.map(src => {
          const bd = src.breakdown;
          const minMiles = Math.min(...product.sources.map(s=>s.distanceKm));
          const maxMargin = Math.max(...product.sources.map(s=>s.breakdown.farmerPercentage));
          const minPrice = Math.min(...product.sources.map(s=>s.price));
          const isLowestMiles = src.distanceKm === minMiles;
          const isHighestMargin = bd.farmerPercentage === maxMargin;
          const isLowestPrice = src.price === minPrice;

          return <div key={src.clusterId} className={`compare-card ${isLowestMiles || isHighestMargin ? "highlight-card" : ""}`}>
            <div>
              <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"6px"}}>
                {src.tag && <span className={`compare-tag ${src.highlight || "miles"}`}>{src.tag}</span>}
                {isLowestMiles && <span className="compare-tag miles">🌿 Lowest Miles</span>}
                {isHighestMargin && <span className="compare-tag organic">💚 Best Grower Cut</span>}
                {isLowestPrice && <span className="compare-tag price">💰 Lowest Price</span>}
              </div>

              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:"4px"}}>
                <h3 style={{fontSize:"15px",margin:0,color:"#173d2a"}}>{src.clusterName}</h3>
                <strong style={{fontSize:"19px",color:"#185a37"}}>₹{src.price} <small style={{fontSize:"10px",color:"#6d7f75"}}>/{product.unit}</small></strong>
              </div>
              <p style={{fontSize:"10px",color:"#627768",margin:"0 0 12px"}}>
                Grower: <b>{src.farmer}</b> ({src.farm}, {src.location})
              </p>

              <div className="compare-payout-box">
                <span style={{color:"#4f7f62",fontWeight:700,textTransform:"uppercase",letterSpacing:".5px",fontSize:"8px"}}>Direct Farmer Payout</span>
                <strong>₹{bd.farmerPayout.toFixed(2)} ({bd.farmerPercentage}%)</strong>
                <span>Instant bank transfer · Zero broker cuts</span>
              </div>

              <table className="compare-breakdown-table">
                <tbody>
                  <tr>
                    <td>📍 Food Miles / Distance</td>
                    <td><b>{src.distanceKm} km</b> {isLowestMiles && "🌿"}</td>
                  </tr>
                  <tr>
                    <td>❄ Solar Pre-Cooling Hub</td>
                    <td>₹{bd.clusterHubFee.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>🚚 Refrigerated Bulk Transit</td>
                    <td>₹{bd.coldTransitFee.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>🔬 QA Testing & Platform Ops</td>
                    <td>₹{bd.platformFee.toFixed(2)}</td>
                  </tr>
                  <tr style={{borderTop:"1.5px solid #dce5d8"}}>
                    <td style={{color:"#a25327"}}>Traditional Supermarket Retail</td>
                    <td style={{color:"#a25327"}}>₹{bd.retailEquivalentMandi.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={{color:"#1b633f",fontWeight:700}}>Your Savings vs Supermarket</td>
                    <td style={{color:"#1b633f",fontWeight:700}}>Save ₹{(bd.retailEquivalentMandi - src.price).toFixed(2)} ({( ((bd.retailEquivalentMandi - src.price)/bd.retailEquivalentMandi)*100 ).toFixed(0)}%)</td>
                  </tr>
                  <tr>
                    <td style={{color:"#1b633f",fontWeight:700}}>Farmer Income Boost</td>
                    <td style={{color:"#1b633f",fontWeight:700}}>+₹{(bd.farmerPayout - bd.traditionalFarmerPayout).toFixed(2)} extra</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <button type="button" className="compare-select-btn" onClick={()=>onSelectSource(product, src)}>
              Choose {src.location.split(",")[0]} Cluster & Add to Basket →
            </button>
          </div>;
        })}
      </div>
    </div>
  </div>;
}

function ProductDetail({product,initialSource,addToCart,navigate,onCompare}:{product:Product;initialSource:ProductSource;addToCart:(p:Product,s:ProductSource,q:number)=>void;navigate:(v:View)=>void;onCompare:(p:Product)=>void}) {
  const [activeSource,setActiveSource] = useState<ProductSource>(initialSource || product.sources[0]);
  const [qty,setQty] = useState(1);
  const bd = activeSource.breakdown;

  return <section className="detail-page">
    <button className="back-link" onClick={()=>navigate("shop")}>← Back to marketplace</button>
    <div className="detail-grid">
      <div className="detail-gallery">
        <img src={product.image} alt={product.name}/>
        <div className="thumbs">
          <img src={product.image} alt=""/>
          <div>
            <b>Direct Sourcing Provenance</b><br/>
            <span>{activeSource.breakdown.farmerPercentage}% Farmer Share</span>
          </div>
        </div>
      </div>
      <div className="detail-info">
        <div style={{display:"flex",gap:"8px",alignItems:"center",marginBottom:"8px"}}>
          {activeSource.organic&&<span className="organic-pill">❧ Certified organic</span>}
          <span className="cluster-tag">❖ {activeSource.clusterName}</span>
          <span className="farmer-share-badge">{bd.farmerPercentage}% to farmer</span>
        </div>
        <h1>{product.name}</h1>
        <div className="rating-line"><b>★ {product.rating}</b><span>126 reviews</span><span>·</span><span className="stock">● {activeSource.stock} {product.unit} available</span></div>
        <p>{product.description}</p>
        
        {/* Source Cluster Selector */}
        <div className="source-selector-title">
          <span>Choose Sourcing Cluster ({product.sources.length} available)</span>
          <button type="button" onClick={()=>onCompare(product)} style={{background:"none",border:0,color:"#1b633f",fontWeight:800,fontSize:"11px",cursor:"pointer"}}>
            ⚖ Compare Side-by-Side →
          </button>
        </div>
        <div className="source-grid">
          {product.sources.map(src => {
            const isSelected = src.clusterId === activeSource.clusterId;
            return <button type="button" key={src.clusterId} className={`source-card ${isSelected?"selected":""}`} onClick={()=>setActiveSource(src)}>
              <span className="source-card-badge">{src.distanceKm} km · {src.location}</span>
              <h4>{src.clusterName}</h4>
              <p>Grower: <b>{src.farmer}</b> ({src.farm})</p>
              <div className="source-price-row">
                <strong>₹{src.price} <small style={{fontSize:"10px",color:"#728379"}}>/{product.unit}</small></strong>
                <span>{src.breakdown.farmerPercentage}% to grower</span>
              </div>
            </button>;
          })}
        </div>

        <div className="price-line">
          <strong>₹{activeSource.price}</strong><span>/ {product.unit}</span>
          <span style={{fontSize:"12px",color:"#5f7d6a",marginLeft:"12px"}}>({bd.farmerPercentage}% direct payout to {activeSource.farmer})</span>
        </div>
        <div className="qty-row">
          <span>Quantity</span>
          <div><button onClick={()=>setQty(Math.max(1,qty-1))}>−</button><b>{qty}</b><button onClick={()=>setQty(qty+1)}>＋</button></div>
        </div>
        <button className="primary buy-wide" onClick={()=>{addToCart(product, activeSource, qty);navigate("cart");}}>
          Add to basket · ₹{activeSource.price * qty}
        </button>
        <button className="secondary buy-wide" onClick={()=>{addToCart(product, activeSource, qty);navigate("cart");}}>Buy now</button>
        <div className="delivery-note">
          <span>▣</span>
          <div>
            <b>Harvested {activeSource.harvestTime} · {activeSource.distanceKm} km away</b>
            <small>Dispatches via {activeSource.clusterName} refrigerated batch route</small>
          </div>
        </div>
      </div>
    </div>

    {/* Financial Transparency & Cost Breakdown Engine */}
    <div className="transparency-panel">
      <div className="transparency-head">
        <div>
          <span className="section-kicker">FINANCIAL AUDIT & DISINTERMEDIATION</span>
          <h3>Where does your money go for {product.name}?</h3>
          <p>Every rupee accounted for. Zero anonymous commissions.</p>
        </div>
        <button type="button" className="transparency-pill" style={{border:0,cursor:"pointer"}} onClick={()=>onCompare(product)}>
          ⚖ Compare All {product.sources.length} Clusters
        </button>
      </div>

      {/* Visual Horizontal Cost Bar */}
      <div className="cost-bar" title="Financial cost breakdown">
        <div className="cost-bar-farmer" style={{width: `${bd.farmerPercentage}%`}} title={`Farmer: ₹${bd.farmerPayout}`}></div>
        <div className="cost-bar-hub" style={{width: `${Math.round((bd.clusterHubFee/activeSource.price)*100)}%`}} title={`Cluster Hub: ₹${bd.clusterHubFee}`}></div>
        <div className="cost-bar-transit" style={{width: `${Math.round((bd.coldTransitFee/activeSource.price)*100)}%`}} title={`Transit: ₹${bd.coldTransitFee}`}></div>
        <div className="cost-bar-platform" style={{width: `${Math.round((bd.platformFee/activeSource.price)*100)}%`}} title={`Platform: ₹${bd.platformFee}`}></div>
      </div>

      {/* Cost Legend */}
      <div className="cost-legend">
        <div className="cost-legend-item">
          <span><i style={{background:"#257347"}}></i> Direct Farmer Take-Home</span>
          <b>₹{bd.farmerPayout.toFixed(2)}</b>
          <small>{bd.farmerPercentage}% to {activeSource.farmer}</small>
        </div>
        <div className="cost-legend-item">
          <span><i style={{background:"#58a46b"}}></i> Solar Pre-Cooling & Hub</span>
          <b>₹{bd.clusterHubFee.toFixed(2)}</b>
          <small>Grading, sorting & cold bins</small>
        </div>
        <div className="cost-legend-item">
          <span><i style={{background:"#e5a842"}}></i> Refrigerated Transit</span>
          <b>₹{bd.coldTransitFee.toFixed(2)}</b>
          <small>Mileage based ({activeSource.distanceKm} km)</small>
        </div>
        <div className="cost-legend-item">
          <span><i style={{background:"#7899b8"}}></i> Quality & Platform Fee</span>
          <b>₹{bd.platformFee.toFixed(2)}</b>
          <small>Organic testing & app ops</small>
        </div>
      </div>

      {/* Traditional Mandi vs Farm2Home Comparison Box */}
      <div className="mandi-comparison-box">
        <div className="mandi-col traditional">
          <h5>Conventional Mandi / Supermarket Chain</h5>
          <div className="mandi-metric-row"><span>Typical retail price</span><b>₹{bd.retailEquivalentMandi.toFixed(2)}</b></div>
          <div className="mandi-metric-row"><span>Middlemen & commission agents</span><b className="bad">−₹{bd.traditionalMiddlemenCut.toFixed(2)} ({( (bd.traditionalMiddlemenCut/bd.retailEquivalentMandi)*100 ).toFixed(0)}%)</b></div>
          <div className="mandi-metric-row"><span>Farmer payout in traditional mandi</span><b className="bad">₹{bd.traditionalFarmerPayout.toFixed(2)} (only {( (bd.traditionalFarmerPayout/bd.retailEquivalentMandi)*100 ).toFixed(0)}%)</b></div>
          <div className="mandi-metric-row"><span>Middleman intermediaries</span><span>5–6 layers (traders, brokers, mandis)</span></div>
        </div>
        <div className="mandi-col farm2home">
          <h5>Farm2Home Direct Cluster Model</h5>
          <div className="mandi-metric-row"><span>Your price on Farm2Home</span><b>₹{activeSource.price.toFixed(2)}</b></div>
          <div className="mandi-metric-row"><span>Unfair middleman markups</span><b className="good">₹0.00 (Zero brokers)</b></div>
          <div className="mandi-metric-row"><span>Farmer take-home on Farm2Home</span><b className="good">₹{bd.farmerPayout.toFixed(2)} ({bd.farmerPercentage}%)</b></div>
          <div className="mandi-metric-row"><span>Producer impact</span><span style={{color:"#1b633f",fontWeight:700}}>+₹{(bd.farmerPayout - bd.traditionalFarmerPayout).toFixed(2)} extra to grower (+{Math.round(((bd.farmerPayout - bd.traditionalFarmerPayout)/bd.traditionalFarmerPayout)*100)}%)</span></div>
        </div>
        <div className="mandi-banner">
          <span>💡 Why this matters:</span>
          By choosing <b>{activeSource.clusterName}</b>, you save <b>₹{(bd.retailEquivalentMandi - activeSource.price).toFixed(2)}</b> versus supermarket retail while putting <b>₹{(bd.farmerPayout - bd.traditionalFarmerPayout).toFixed(2)} more</b> directly into {activeSource.farmer}&apos;s hands.
        </div>
      </div>
    </div>

    <div className="detail-below">
      <article><span className="section-kicker">MEET YOUR GROWER</span><div className="farmer-profile"><img src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=300&q=80" alt={activeSource.farmer}/><div><h3>{activeSource.farmer} <span>✓</span></h3><p>{activeSource.farm} · {activeSource.clusterName}</p><b>★ 4.9 farmer rating</b></div><button>View farm →</button></div></article>
      <article><span className="section-kicker">CLUSTER LOGISTICS & TRACEABILITY</span><dl><div><dt>Harvest time</dt><dd>{activeSource.harvestTime}</dd></div><div><dt>Source Cluster</dt><dd>{activeSource.clusterName}</dd></div><div><dt>Food miles</dt><dd>{activeSource.distanceKm} km from distribution center</dd></div><div><dt>Direct Farmer Margin</dt><dd>{bd.farmerPercentage}% (₹{bd.farmerPayout} / {product.unit})</dd></div></dl></article>
    </div>
  </section>;
}

function Cart({
  cart,
  setCart,
  navigate,
  deliveryType,
  setDeliveryType,
  selectedDropCluster,
  setSelectedDropCluster,
  userAddress,
  setUserAddress,
}: {
  cart: CartEntry[];
  setCart: (v: CartEntry[]) => void;
  navigate: (v: View) => void;
  deliveryType: "cluster_pickup" | "doorstep";
  setDeliveryType: (v: "cluster_pickup" | "doorstep") => void;
  selectedDropCluster: Cluster;
  setSelectedDropCluster: (c: Cluster) => void;
  userAddress: string;
  setUserAddress: (addr: string) => void;
}) {
  const subtotal = cart.reduce((s,item)=>s + (item.source.price * item.quantity), 0);
  const totalFarmerPayout = cart.reduce((s,item)=>s + (item.source.breakdown.farmerPayout * item.quantity), 0);
  const deliveryFee = deliveryType === "cluster_pickup" ? 0 : 35;
  const consumerClusters = seedClusters.filter(c => c.type === "consumer_delivery");

  return <section className="cart-page">
    <div className="cart-title"><span className="section-kicker">YOUR TRANSPARENT BASKET</span><h1>Farm-fresh picks</h1><p>{cart.reduce((s,i)=>s+i.quantity,0)} items from verified regional clusters</p></div>
    {cart.length?<div className="cart-layout">
      <div className="cart-items">
        {cart.map((entry,i)=><article key={`${entry.product.id}-${entry.source.clusterId}-${i}`}>
          <img src={entry.product.image} alt={entry.product.name}/>
          <div>
            <h3>{entry.product.name}</h3>
            <p>From: <b>{entry.source.farmer}</b> ({entry.source.clusterName})</p>
            <span style={{background:"#e6f4dc",color:"#276d3e"}}>₹{(entry.source.breakdown.farmerPayout * entry.quantity).toFixed(2)} to grower ({entry.source.breakdown.farmerPercentage}%)</span>
          </div>
          <div className="cart-qty">
            <button onClick={()=>{
              if(entry.quantity > 1){
                setCart(cart.map((it,idx)=>idx===i ? {...it, quantity: it.quantity - 1} : it));
              }
            }}>−</button>
            <b>{entry.quantity}</b>
            <button onClick={()=>{
              setCart(cart.map((it,idx)=>idx===i ? {...it, quantity: it.quantity + 1} : it));
            }}>＋</button>
          </div>
          <strong>₹{entry.source.price * entry.quantity}</strong>
          <button className="remove" onClick={()=>setCart(cart.filter((_,index)=>index!==i))}>×</button>
        </article>)}

        <div className="delivery-mode-box">
          <div className="delivery-mode-title">Choose Delivery Method</div>
          <button type="button" className={`delivery-option ${deliveryType==="cluster_pickup"?"selected":""}`} onClick={()=>setDeliveryType("cluster_pickup")}>
            <input type="radio" checked={deliveryType==="cluster_pickup"} onChange={()=>setDeliveryType("cluster_pickup")}/>
            <div className="delivery-option-info">
              <strong><span>Community Cluster Drop (Zero Delivery Fee)</span><b className="saving">FREE</b></strong>
              <small>Delivered in bulk to your apartment or community drop point with zero transport carbon waste.</small>
              {deliveryType==="cluster_pickup"&&(
                <select className="cluster-dropdown" value={selectedDropCluster.id} onChange={(e)=>{
                  const found = consumerClusters.find(c => c.id === e.target.value);
                  if (found) setSelectedDropCluster(found);
                }} onClick={(e)=>e.stopPropagation()}>
                  {consumerClusters.map(c=><option key={c.id} value={c.id}>{c.name} — {c.hubLocation} ({c.nextDispatchSlot})</option>)}
                </select>
              )}
            </div>
          </button>
          <button type="button" className={`delivery-option ${deliveryType==="doorstep"?"selected":""}`} onClick={()=>setDeliveryType("doorstep")}>
            <input type="radio" checked={deliveryType==="doorstep"} onChange={()=>setDeliveryType("doorstep")}/>
            <div className="delivery-option-info">
              <strong><span>Standard Doorstep Delivery</span><b>₹35</b></strong>
              <small>Direct personal courier delivery directly to your home address.</small>
            </div>
          </button>
        </div>

        {/* Delivery Cluster & Warehouse-to-Location Route Map */}
        <DeliveryRouteMap
          cart={cart}
          deliveryCluster={selectedDropCluster}
          deliveryType={deliveryType}
          userAddress={userAddress}
          onAddressChange={setUserAddress}
          onSelectCluster={(id)=>{
            const found = consumerClusters.find(c => c.id === id);
            if (found) setSelectedDropCluster(found);
          }}
          availableDeliveryClusters={consumerClusters}
        />
      </div>
      <aside className="order-summary">
        <h3>Order summary</h3>
        <div><span>Subtotal</span><b>₹{subtotal.toFixed(2)}</b></div>
        <div><span>Delivery</span><b>{deliveryFee===0?"FREE (Community Drop)":"₹35.00"}</b></div>
        <div><span>Freshness savings</span><b className="saving">−₹20.00</b></div>
        {deliveryType==="cluster_pickup"&&<div><span>Cluster eco-credit</span><b className="saving">−₹35.00</b></div>}
        <hr/>
        <div className="total"><span>Total</span><b>₹{(subtotal + deliveryFee - 20).toFixed(2)}</b></div>

        {/* Direct to Farmer Impact Counter */}
        <div style={{background:"rgba(255,255,255,.09)",padding:"12px",borderRadius:"10px",marginTop:"15px",fontSize:"10px"}}>
          <div style={{color:"#abd571",fontWeight:800,marginBottom:"3px"}}>🌱 Farmer Impact Metric:</div>
          <div style={{color:"#d9ebd5"}}><b>₹{totalFarmerPayout.toFixed(2)}</b> ({( (totalFarmerPayout/subtotal)*100 ).toFixed(0)}%) goes directly into the bank accounts of your chosen farm growers.</div>
        </div>

        <button className="primary" onClick={()=>navigate("tracking")}>Proceed to checkout →</button>
        <small>▣ Audited disintermediated supply chain</small>
      </aside>
    </div>:<div className="empty-state"><i>⌑</i><h3>Your basket is waiting</h3><p>Fresh produce from verified farm clusters is only a click away.</p><button onClick={()=>navigate("shop")}>Explore the marketplace</button></div>}
  </section>;
}

function Tracking({
  navigate,
  deliveryType,
  dropCluster,
  cart,
  userAddress,
}: {
  navigate: (v: View) => void;
  deliveryType: "cluster_pickup" | "doorstep";
  dropCluster: Cluster;
  cart: CartEntry[];
  userAddress: string;
}) {
  const isClusterDrop = deliveryType === "cluster_pickup";
  const primarySource = cart[0]?.source || products[0].sources[0];
  const farmerTotal = cart.reduce((s,i)=>s + (i.source.breakdown.farmerPayout * i.quantity), 0);

  return <section className="tracking-page">
    <div className="success-banner"><span>✓</span><div><h3>Order placed successfully & disintermediated</h3><p>Direct payment confirmed to {primarySource.farmer} and cluster logistics.</p></div><b>Order #FH10248</b></div>
    
    {/* Full Warehouse-to-User Route Map on Live Tracking */}
    <div style={{marginBottom:"24px"}}>
      <DeliveryRouteMap
        cart={cart}
        deliveryCluster={dropCluster}
        deliveryType={deliveryType}
        userAddress={userAddress}
      />
    </div>

    <div className="tracking-grid">
      <article>
        <div className="tracking-head"><div><span className="section-kicker">LIVE CLUSTER ROUTE</span><h1>Arriving tomorrow</h1><p>Batch window: 7:00–9:00 AM</p></div><div className="delivery-avatar">AK</div></div>
        <div className="timeline">
          {[
            ["Order pooled & payment settled","Today · 7:42 PM (100% transparent split)",true],
            [`Farmer confirmed (${primarySource.farmer} · ${primarySource.farm})`,"Today · 7:48 PM",true],
            [`Consolidating at ${primarySource.clusterName}`,"In progress · Solar pre-cooling active",true],
            [isClusterDrop?`Refrigerated batch route to ${dropCluster.name}`:"Dispatched for doorstep courier","Tomorrow morning",false],
            [isClusterDrop?`Ready for pickup at ${dropCluster.hubLocation}`:"Delivered to home","Before 9:00 AM",false],
          ].map((s,i)=><div className={s[2]?"done":""} key={String(s[0])}><i>{s[2]?(i===2?"●":"✓"):"○"}</i><span><b>{s[0]}</b><small>{s[1]}</small></span></div>)}
        </div>
      </article>
      <aside>
        <h3>Provenance certificate</h3>
        <p><b>Destination: {isClusterDrop?`Community Drop: ${dropCluster.name}`:"Direct Doorstep"}</b><br/>{isClusterDrop?dropCluster.hubLocation:userAddress}<br/>Chennai, Tamil Nadu</p>
        <hr/>
        <div style={{fontSize:"10px",color:"#627768",lineHeight:"1.6"}}>
          <div><b>Direct Farmer Settlement:</b> <span style={{color:"#1b633f",fontWeight:700}}>₹{farmerTotal.toFixed(2)} transferred</span></div>
          <div><b>Origin:</b> {primarySource.clusterName} ({primarySource.distanceKm} km)</div>
          <div><b>Middlemen involved:</b> 0 (Direct to Farm Cluster)</div>
        </div>
        <button style={{marginTop:"15px"}} onClick={()=>navigate("customer")}>Go to my dashboard →</button>
      </aside>
    </div>
  </section>;
}

function CustomerDashboard({onNavigate,cartCount}:{onNavigate:(v:View)=>void;cartCount:number}) {
  return <DashboardShell portalRole="customer" title="Customer" user="Ajay Sharma" onExit={()=>onNavigate("home")} nav={["Overview","My Orders","Wishlist","Favorite Farmers","Community Drops","Transparency","Profile"]}>
    <div className="dash-welcome"><div><p>WEDNESDAY, 19 AUGUST</p><h1>Welcome back, Ajay 👋</h1><span>Your next farm cluster delivery arrives tomorrow at Velachery Community Drop.</span></div><button onClick={()=>onNavigate("shop")}>Browse fresh produce ＋</button></div>
    <Stats data={[["Active orders","2","+1 this week","▣"],["Completed orders","18","Since joining","✓"],["Direct to growers","₹4,230","71% of all purchases","♧"],["Basket items",String(cartCount),"Ready to order","♡"]]}/>
    <div className="dash-two">
      <article className="panel"><PanelHead title="Recent orders & sourcing clusters" action="View all"/><table><thead><tr><th>Order</th><th>Source Cluster</th><th>Farmer</th><th>Total</th><th>Status</th></tr></thead><tbody><tr><td><b>#FH10248</b><small>Tomorrow, 7–9 AM</small></td><td>Chengalpattu Cluster</td><td>Rajesh Kumar</td><td>₹342</td><td><Status text="Preparing"/></td></tr><tr><td><b>#FH10192</b><small>12 Aug 2026</small></td><td>Kaveri Delta Hub</td><td>Meena Selvam</td><td>₹216</td><td><Status text="Delivered"/></td></tr></tbody></table></article>
      <article className="panel delivery-card"><PanelHead title="Next cluster drop"/><div className="delivery-illustration">⌂<span>━━━━━━</span>▣</div><b>Tomorrow · 7:00–9:00 AM</b><p>Velachery Community Drop · Lake View Clubhouse</p><button onClick={()=>onNavigate("tracking")}>Track live route →</button></article>
    </div>
  </DashboardShell>;
}

function FarmerDashboard({onExit,notify,toast}:{onExit:()=>void;notify:(s:string)=>void;toast:string}) {
  const [orders,setOrders] = useState(seedOrders);
  const [tab,setTab] = useState("Dashboard");
  const cycle = (id:string)=>{
    const flow:OrderStatus[] = ["New","Accepted","Preparing","Ready","Completed"];
    setOrders(list=>list.map(o=>o.id===id?{...o,status:flow[Math.min(flow.indexOf(o.status)+1,4)]}:o));
    notify("Order status updated");
  };

  return <DashboardShell portalRole="farmer" title="Farmer portal" user="Rajesh Kumar" onExit={onExit} active={tab} onTab={setTab} nav={["Dashboard","My Products","Orders","Cluster Logistics","Financial Transparency","Inventory","Earnings","Settings"]}>
    <div className="dash-welcome">
      <div>
        <p>GREEN VALLEY FARM · CHENGALPATTU CLUSTER HUB #4</p>
        <h1>{tab==="Dashboard"?"Good morning, Rajesh 👋":tab}</h1>
        <span>{tab==="Cluster Logistics"?"Live aggregation status at GST Agro-Hub #4.":"Your farm is thriving. Here’s what needs your attention today."}</span>
      </div>
      <button onClick={()=>notify("Add product form opened")}>＋ Add new product</button>
    </div>

    <div className="farmer-cluster-panel">
      <h3>❖ Assigned Production Cluster: Chengalpattu Agri-Cluster</h3>
      <p>GST Agro-Aggregation Hub #4 · Serving 28 partner farmers across Kanchipuram and Chengalpattu with direct-to-bank daily payouts.</p>
      <div className="farmer-cluster-metrics">
        <div className="farmer-cluster-metric"><span>Next Bulk Pickup</span><b>Today, 5:30 PM</b><small>Truck ETA: 2h 15m</small></div>
        <div className="farmer-cluster-metric"><span>Shared Cold Storage</span><b>4 / 20 Crates</b><small>Active 3.8°C Pre-Cooling</small></div>
        <div className="farmer-cluster-metric"><span>Direct Payout Rate</span><b>68.5%</b><small>₹28.50/kg on tomatoes</small></div>
        <div className="farmer-cluster-metric"><span>Pooled Savings</span><b>₹4,200 / mo</b><small>42% cheaper than solo vans</small></div>
      </div>
    </div>

    <Stats data={[["Today's orders","18","↑ 12% vs yesterday","▣"],["Total sales","₹24,840","↑ 8.4% this week","↗"],["Net Farmer Take-home","₹17,388","Direct bank credit","♧"],["Pending pickup","7 Orders","Due by 5:15 PM","◷"]]}/>
    <div className="dash-two farmer-main">
      <article className="panel revenue-panel"><PanelHead title="Daily payout & logistics performance" action="This week⌄"/><div className="chart-label"><b>₹78,420</b><span>+16.8% from last week</span></div><BarChart/></article>
      <article className="panel farm-score"><PanelHead title="Cluster health"/><div className="score-ring"><b>92</b><span>/100</span></div><h3>Excellent work!</h3><p>Your pre-cooling dispatch times are optimal.</p><div><span>Hub arrival rate</span><b>98%</b></div><div><span>Cold-chain integrity</span><b>100%</b></div></article>
    </div>
    <article className="panel orders-panel"><PanelHead title="Recent orders" action="View all orders"/><table><thead><tr><th>Order ID</th><th>Customer</th><th>Products</th><th>Gross Amount</th><th>Your Take-Home</th><th>Status</th><th>Delivery Target</th><th>Action</th></tr></thead><tbody>{orders.map(o=><tr key={o.id}><td><b>{o.id}</b></td><td>{o.customer}</td><td>{o.product}</td><td>₹{o.amount}</td><td style={{color:"#22683e",fontWeight:700}}>₹{o.farmerPayoutTotal || Math.round(o.amount*0.7)} (70%)</td><td><Status text={o.status}/></td><td>{o.deliveryType==="cluster_pickup"?`Cluster: ${o.clusterName||"Community Drop"}`:"Doorstep"}</td><td><button className="table-action" onClick={()=>cycle(o.id)}>{o.status==="Completed"?"View":"Advance →"}</button></td></tr>)}</tbody></table></article>
    {toast && <div className="toast"><span>✓</span>{toast}</div>}
  </DashboardShell>;
}

function AdminDashboard({onExit,notify,toast}:{onExit:()=>void;notify:(s:string)=>void;toast:string}) {
  const [tab,setTab] = useState("Dashboard");
  const [tenants,setTenants] = useState(seedTenants);
  const [clustersList,setClustersList] = useState(seedClusters);
  const [clusterTypeFilter,setClusterTypeFilter] = useState<"all"|"farm_production"|"consumer_delivery">("all");

  const toggleTenant = (id:string)=>{
    setTenants(ts=>ts.map(t=>t.id===id?{...t,status:t.status==="Active"?"Paused":"Active"}:t));
    notify("Tenant status changed");
  };
  const toggleCluster = (id:string)=>{
    setClustersList(cs=>cs.map(c=>c.id===id?{...c,status:c.status==="Active"?"Paused":"Active"}:c));
    notify("Cluster operational status changed");
  };

  const filteredClusters = clustersList.filter(c => clusterTypeFilter === "all" || c.type === clusterTypeFilter);

  return <DashboardShell portalRole="admin" title="Admin console" user="Anita Rao" onExit={onExit} active={tab} onTab={setTab} nav={["Dashboard","Farmers","Clusters","Tenants","Transparency","Products","Orders","Deliveries","Analytics","Settings"]}>
    <div className="dash-welcome">
      <div>
        <p>FARM2HOME SAAS · PLATFORM OPERATIONS</p>
        <h1>{tab==="Clusters"?"Cluster Logistics Command Center":tab==="Tenants"?"Tenant management":"Marketplace command center"}</h1>
        <span>{tab==="Clusters"?"Manage 6 regional farm aggregation hubs and 4 urban community delivery drop zones.":tab==="Tenants"?"Manage independent regional farming organizations operating on Farm2Home.":"Live performance across all regional clusters, tenants, and consumers."}</span>
      </div>
      <button onClick={()=>notify(tab==="Clusters"?"New cluster hub configured":tab==="Tenants"?"New tenant form opened":"Report exported")}>{tab==="Clusters"?"＋ Add new cluster":tab==="Tenants"?"＋ Add tenant":"Export report ↗"}</button>
    </div>

    {tab === "Clusters" ? (
      <>
        <Stats data={[
          ["Active clusters",String(clustersList.filter(c=>c.status==="Active").length),"6 supply / 4 demand","▣"],
          ["Pooled members","825","237 farmers · 588 consumers","♧"],
          ["Avg farmer share","71.2%","vs 28% conventional mandis","↗"],
          ["Carbon saved","44%","Pooled cold-chain routes","♡"],
        ]}/>

        <div className="cluster-filter-tabs">
          <button className={clusterTypeFilter==="all"?"active":""} onClick={()=>setClusterTypeFilter("all")}>All Clusters ({clustersList.length})</button>
          <button className={clusterTypeFilter==="farm_production"?"active":""} onClick={()=>setClusterTypeFilter("farm_production")}>Production Hubs ({clustersList.filter(c=>c.type==="farm_production").length})</button>
          <button className={clusterTypeFilter==="consumer_delivery"?"active":""} onClick={()=>setClusterTypeFilter("consumer_delivery")}>Consumer Drop Zones ({clustersList.filter(c=>c.type==="consumer_delivery").length})</button>
        </div>

        <div className="cluster-grid">
          {filteredClusters.map(c=>(
            <article className="panel cluster-card" key={c.id}>
              <div>
                <div className="cluster-card-head">
                  <span className={`cluster-type-badge ${c.type}`}>{c.type==="farm_production"?"Farm Production Hub":"Consumer Drop Point"}</span>
                  <Status text={c.status}/>
                </div>
                <h3 style={{margin:"0 0 4px",fontSize:"14px"}}>{c.name}</h3>
                <div className="cluster-hub-loc"><span>⌖</span> {c.hubLocation} ({c.region})</div>
                <div className="cluster-stats-row">
                  <div><span>{c.type==="farm_production"?"Active Farmers":"Community Members"}</span><b>{c.activeCount}</b></div>
                  <div><span>Next Dispatch / Pickup</span><b>{c.nextDispatchSlot}</b></div>
                </div>
                <div className="cluster-savings-bar"><span>♲</span> {c.savingsSummary}</div>
              </div>
              <div className="cluster-actions">
                <button onClick={()=>notify(`Inspecting telemetry for ${c.name}`)}>View Hub Route</button>
                <button onClick={()=>toggleCluster(c.id)}>{c.status==="Active"?"Pause Hub":"Activate Hub"}</button>
              </div>
            </article>
          ))}
        </div>
      </>
    ) : tab === "Tenants" ? (
      <>
        <div className="tenant-flow">
          <div><span className="brand-mark">⌂</span><b>Farm2Home SaaS</b><small>One platform</small></div>
          <span>→</span>
          <div className="tenant-nodes">{tenants.map(t=><i key={t.id}>{t.initials}</i>)}</div>
          <div><b>Independent tenants</b><small>Isolated data, hubs & operations</small></div>
        </div>
        <div className="tenant-grid">
          {tenants.map(t=><article className="panel tenant-card" key={t.id}>
            <div className="tenant-head"><i>{t.initials}</i><div><h3>{t.name}</h3><span>{t.id} · {t.clustersCount} Clusters</span></div><Status text={t.status}/></div>
            <div className="tenant-stats"><div><b>{t.farmers}</b><span>Farmers</span></div><div><b>{t.customers.toLocaleString()}</b><span>Consumers</span></div><div><b>{t.clustersCount}</b><span>Clusters</span></div><div><b>{t.revenue}</b><span>Revenue</span></div></div>
            <div className="tenant-actions"><button onClick={()=>notify(`Opened ${t.name} details`)}>View details</button><button onClick={()=>toggleTenant(t.id)}>{t.status==="Active"?"Pause":"Activate"}</button></div>
          </article>)}
        </div>
      </>
    ) : (
      <>
        <Stats data={[
          ["Total farmers","524","In 6 production clusters","♧"],
          ["Total consumers","10,342","In 4 community drops","♙"],
          ["Total orders","2,847","↑ 12.6% this month","▣"],
          ["Direct to farmers","₹13.10L","71.1% of gross volume","↗"]
        ]}/>
        <div className="dash-two admin-main">
          <article className="panel revenue-panel"><PanelHead title="Platform revenue & farmer payouts" action="Last 6 months⌄"/><div className="chart-label"><b>₹18.42 lakh GMV</b><span>₹13.10L to farmers · ₹1.84L platform fee</span></div><BarChart admin/></article>
          <article className="panel"><PanelHead title="Marketplace mix"/><div className="donut"><div><b>62%</b><span>Produce</span></div></div><ul className="legend"><li><i></i>Vegetables <b>38%</b></li><li><i></i>Fruits <b>24%</b></li><li><i></i>Dairy & eggs <b>21%</b></li><li><i></i>Other <b>17%</b></li></ul></article>
        </div>
        <article className="panel orders-panel"><PanelHead title="Farmers awaiting verification" action="View all farmers"/><table><thead><tr><th>Farmer</th><th>Farm</th><th>Proposed Cluster</th><th>Submitted</th><th>Status</th><th>Action</th></tr></thead><tbody>{[["Murugan S","Riverbend Farm","Chengalpattu Agri-Cluster","Today"],["Balan Nanjan","Highland Organic","Nilgiris High-Altitude Cold-Chain","Yesterday"],["Rahim Khan","Harvest Hills","Kaveri Delta Heritage Hub","17 Aug"]].map(r=><tr key={r[0]}><td><b>{r[0]}</b></td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td><Status text="Review"/></td><td><button className="approve" onClick={()=>notify(`${r[0]} approved and assigned to ${r[2]}`)}>Approve</button><button className="table-action">Review</button></td></tr>)}</tbody></table></article>
      </>
    )}
    {toast && <div className="toast"><span>✓</span>{toast}</div>}
  </DashboardShell>;
}

function DashboardShell({portalRole,title,user,onExit,nav,active="Dashboard",onTab=()=>{},children}:{portalRole:Role;title:string;user:string;onExit:()=>void;nav:string[];active?:string;onTab?:(s:string)=>void;children:React.ReactNode}) {
  return <main className={`dashboard ${portalRole}`}>
    <aside className="sidebar">
      <button className="brand dash-brand" onClick={onExit}><span className="brand-mark"><span>⌂</span></span><span>Farm<span>2</span>Home</span></button>
      <span className="portal-label">{title}</span>
      <nav>{nav.map((n,i)=><button key={n} className={active===n?"active":""} onClick={()=>onTab(n)}><i>{["▦","♧","❖","◇","⚖","▣","□","↗","♙","⌂","⚙","◎"][i]||"·"}</i>{n}{n==="Orders"&&<b>7</b>}</button>)}</nav>
      <div className="sidebar-foot"><button><span className="avatar">{user.split(" ").map(x=>x[0]).join("")}</span><span>{user}<small>{portalRole==="farmer"?"Green Valley Farm":portalRole==="admin"?"Platform administrator":"Customer account"}</small></span><b>⌄</b></button><button onClick={onExit}>← Back to marketplace</button></div>
    </aside>
    <section className="dash-content">
      <header><div className="dash-search">⌕ <span>Search clusters, farms, or financial audits...</span><kbd>⌘ K</kbd></div><div><button>◷</button><button className="bell">♢<i></i></button><span>Live data <b>●</b></span></div></header>
      <div className="dash-body">{children}</div>
    </section>
  </main>;
}

function Stats({data}:{data:string[][]}) { return <div className="stats-grid">{data.map(s=><article className="stat-card" key={s[0]}><div><span>{s[0]}</span><b>{s[1]}</b><small>{s[2]}</small></div><i>{s[3]}</i></article>)}</div>; }
function PanelHead({title,action}:{title:string;action?:string}) { return <div className="panel-head"><h3>{title}</h3>{action&&<button>{action}</button>}</div>; }
function Status({text}:{text:string}) { return <span className={`status ${text.toLowerCase().replaceAll(" ","-")}`}>● {text}</span>; }
function BarChart({admin=false}:{admin?:boolean}) { const values=admin?[32,48,43,67,61,86,74,98,91,113,104,132]:[42,57,49,78,65,89,76]; return <div className="bar-chart"><div className="grid-lines"><i/><i/><i/><i/></div>{values.map((v,i)=><div className="bar-column" key={i}><span style={{height:`${v}px`}}></span><small>{admin?["Mar","","May","","Jul","","Sep","","Nov","","Jan","Feb"][i]:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i]}</small></div>)}</div>; }
function Footer({navigate}:{navigate:(v:View)=>void}) { return <footer><div className="footer-brand"><button className="brand" onClick={()=>navigate("home")}><span className="brand-mark"><span>⌂</span></span><span>Farm<span>2</span>Home</span></button><p>From regional farm clusters, directly to your community with complete financial transparency.</p></div><div><b>Marketplace</b><button onClick={()=>navigate("shop")}>Shop fresh</button><button>Farm clusters</button><button>Financial audit</button></div><div><b>For partners</b><button onClick={()=>navigate("farmer")}>Farmer portal</button><button onClick={()=>navigate("admin")}>Admin console</button><button onClick={()=>navigate("login")}>Sign in / Demo login</button><button>Cluster hub operators</button></div><div><b>Prototype</b><span>Review 1 · Web UI</span><span>100% Provenance enabled</span><span>API-ready architecture</span></div></footer>; }
