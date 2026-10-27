"use client";

import { useMemo, useState } from "react";
import type { CartEntry, Cluster, ProductSource } from "../types";

export type DeliveryRouteMapProps = {
  cart: CartEntry[];
  deliveryCluster: Cluster;
  deliveryType: "cluster_pickup" | "doorstep";
  userAddress: string;
  onAddressChange?: (address: string) => void;
  onSelectCluster?: (clusterId: string) => void;
  availableDeliveryClusters?: Cluster[];
};

// Geographic node definitions for map projection
type MapCoord = { x: number; y: number; label: string; sub: string };

const WAREHOUSE_COORDS: Record<string, MapCoord> = {
  "CL-FARM-01": { x: 380, y: 200, label: "Chengalpattu Agro-Hub #4", sub: "45 km · Pre-Cooling Terminal" },
  "CL-FARM-02": { x: 90, y: 240, label: "Nilgiris Valley Terminal", sub: "520 km · Mountain Cold-Chain" },
  "CL-FARM-03": { x: 250, y: 250, label: "Kaveri Delta Transit Hub", sub: "340 km · Alluvial Depot" },
  "CL-FARM-04": { x: 190, y: 280, label: "Oddanchatram Central Hub", sub: "410 km · Veg Collective" },
  "CL-FARM-05": { x: 110, y: 300, label: "Anaimalai Agroforestry Hub", sub: "530 km · Shade Grove" },
  "CL-FARM-06": { x: 140, y: 110, label: "Hosur Polyhouse Terminal", sub: "295 km · Green Valley" },
};

const DELIVERY_CLUSTER_COORDS: Record<string, MapCoord> = {
  "CL-DROP-01": { x: 580, y: 175, label: "Velachery Delivery Hub", sub: "South Chennai Community Drop" },
  "CL-DROP-02": { x: 620, y: 220, label: "OMR Cyber Gateway Hub", sub: "Tidel IT Corridor Drop" },
  "CL-DROP-03": { x: 550, y: 115, label: "Anna Nagar Delivery Hub", sub: "Central Chennai Collective" },
  "CL-DROP-04": { x: 640, y: 170, label: "Adyar & Besant Nagar Hub", sub: "Coastal Eco-Drop Point" },
};

export default function DeliveryRouteMap({
  cart,
  deliveryCluster,
  deliveryType,
  userAddress,
  onAddressChange,
  onSelectCluster,
  availableDeliveryClusters = [],
}: DeliveryRouteMapProps) {
  // Extract unique origin warehouses from the cart
  const uniqueSources = useMemo(() => {
    const map = new Map<string, { source: ProductSource; items: { name: string; qty: number }[] }>();
    for (const item of cart) {
      const existing = map.get(item.source.clusterId);
      if (existing) {
        existing.items.push({ name: item.product.name, qty: item.quantity });
      } else {
        map.set(item.source.clusterId, {
          source: item.source,
          items: [{ name: item.product.name, qty: item.quantity }],
        });
      }
    }
    return Array.from(map.values());
  }, [cart]);

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("all");
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [customAddress, setCustomAddress] = useState(userAddress);

  // Delivery destination coordinates
  const deliveryCoord = DELIVERY_CLUSTER_COORDS[deliveryCluster.id] || {
    x: 580,
    y: 175,
    label: deliveryCluster.name,
    sub: deliveryCluster.hubLocation,
  };

  // If doorstep delivery, offset the customer pin slightly closer to home street
  const userPinCoord = deliveryType === "doorstep"
    ? { x: deliveryCoord.x + 35, y: deliveryCoord.y + 15, label: "Your Doorstep", sub: userAddress }
    : { x: deliveryCoord.x, y: deliveryCoord.y, label: deliveryCluster.name, sub: deliveryCluster.hubLocation };

  // Central Urban Consolidation Warehouse (Gateway to Chennai metro)
  const urbanTransitHub = { x: 470, y: 170, label: "Chennai Metro Regional Depot", sub: "Cold Consolidation Terminal" };

  const activeSources = selectedWarehouseId === "all"
    ? uniqueSources
    : uniqueSources.filter(s => s.source.clusterId === selectedWarehouseId);

  const primarySource = uniqueSources[0]?.source;
  const totalFoodMiles = Math.max(...uniqueSources.map(s => s.source.distanceKm || 45));

  const handleSaveAddress = () => {
    setIsEditingAddress(false);
    if (onAddressChange && customAddress.trim()) {
      onAddressChange(customAddress.trim());
    }
  };

  return (
    <div className="delivery-cluster-map-card">
      <div className="delivery-map-header">
        <div>
          <span className="section-kicker">LIVE CLUSTER ROUTING & DISPATCH</span>
          <h3 style={{ margin: "4px 0 2px", fontSize: "17px", color: "#163d2a" }}>
            Warehouse-to-Destination Route Map
          </h3>
          <p style={{ margin: 0, fontSize: "11px", color: "#65776c" }}>
            Visualizing direct provenance from harvest collection hubs through the urban delivery cluster to your location.
          </p>
        </div>

        <div className="delivery-cluster-badge-row">
          <span className="delivery-badge-item">
            <i>❖</i> Delivery Cluster: <b>{deliveryCluster.name.split(" ")[0]} Hub</b>
          </span>
          <span className="delivery-badge-item cold">
            <i>❄</i> Active Cold-Chain: <b>3.8°C Solar Reefer</b>
          </span>
        </div>
      </div>

      {/* Warehouse Selector Filter if multiple origins */}
      {uniqueSources.length > 1 && (
        <div className="warehouse-tabs-row">
          <span className="warehouse-tabs-label">Items sourced from {uniqueSources.length} farm warehouses:</span>
          <div className="warehouse-tab-buttons">
            <button
              type="button"
              className={`warehouse-tab ${selectedWarehouseId === "all" ? "active" : ""}`}
              onClick={() => setSelectedWarehouseId("all")}
            >
              All Routes ({uniqueSources.length})
            </button>
            {uniqueSources.map(({ source, items }) => (
              <button
                type="button"
                key={source.clusterId}
                className={`warehouse-tab ${selectedWarehouseId === source.clusterId ? "active" : ""}`}
                onClick={() => setSelectedWarehouseId(source.clusterId)}
              >
                🏭 {source.clusterName.split(" ")[0]} ({items.length} {items.length === 1 ? "item" : "items"})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Map Visual */}
      <div className="map-canvas-container">
        <svg
          viewBox="0 0 760 360"
          className="delivery-route-svg"
          preserveAspectRatio="xMidYMid meet"
          aria-label="Route map showing warehouse to user location"
        >
          <defs>
            {/* Linear Gradients for route lines */}
            <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#76b82a" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#43ba6d" stopOpacity="1" />
              <stop offset="100%" stopColor="#25a2b8" stopOpacity="0.9" />
            </linearGradient>

            <linearGradient id="corridorGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e4e37" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#123524" stopOpacity="0.2" />
            </linearGradient>

            {/* Filter for glowing elements */}
            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Marker defs */}
            <radialGradient id="hubRadar" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#76b82a" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#76b82a" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Regional Map Background & Coastal Land Contour */}
          <rect width="760" height="360" fill="#0d2419" rx="16" />

          {/* Decorative Terrain Contours */}
          <path
            d="M 0,0 L 520,0 C 560,50 630,80 670,120 C 710,160 740,240 760,360 L 0,360 Z"
            fill="url(#corridorGlow)"
          />

          {/* Coastal Water Margin (Bay of Bengal on East) */}
          <path
            d="M 680,0 Q 720,100 750,220 L 760,220 L 760,0 Z"
            fill="#091b13"
            opacity="0.85"
          />
          <text x="705" y="60" fill="#325946" fontSize="9" fontWeight="800" letterSpacing="2">
            BAY OF BENGAL
          </text>

          {/* Major Transit Corridors (Background lines) */}
          <path
            d="M 120,90 Q 300,130 470,170"
            stroke="#1d4833"
            strokeWidth="2"
            strokeDasharray="4 4"
            fill="none"
          />
          <text x="240" y="118" fill="#46725b" fontSize="8">NH-48 Golden Quadrilateral</text>

          <path
            d="M 230,260 Q 340,210 470,170"
            stroke="#1d4833"
            strokeWidth="2"
            strokeDasharray="4 4"
            fill="none"
          />
          <text x="310" y="235" fill="#46725b" fontSize="8">NH-45 GST Expressway Corridor</text>

          {/* Regional Chennai Urban Zone Shading */}
          <ellipse cx="610" cy="165" rx="85" ry="95" fill="#133d2a" opacity="0.6" stroke="#256242" strokeWidth="1" strokeDasharray="3 3" />
          <text x="545" y="70" fill="#6ba783" fontSize="9" fontWeight="800" letterSpacing="1">
            CHENNAI METRO DELIVERY CLUSTER ZONE
          </text>

          {/* Dynamic Route Paths from each active Warehouse to the Delivery Hub */}
          {activeSources.map(({ source }) => {
            const origin = WAREHOUSE_COORDS[source.clusterId] || { x: 380, y: 200 };
            
            // Generate curved Bezier path from origin warehouse -> Urban Depot -> Delivery Hub
            const pathData = `M ${origin.x},${origin.y} Q ${urbanTransitHub.x},${urbanTransitHub.y} ${deliveryCoord.x},${deliveryCoord.y}`;
            const isHovered = hoveredNode === source.clusterId;

            return (
              <g key={`route-${source.clusterId}`}>
                {/* Thick underlying glow line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={isHovered ? "#77e63b" : "#459c5c"}
                  strokeWidth={isHovered ? "4.5" : "3"}
                  strokeOpacity="0.4"
                  filter="url(#glowEffect)"
                />

                {/* Animated active cold-chain dashed route */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="url(#routeGlow)"
                  strokeWidth="2.5"
                  strokeDasharray="8 6"
                  className="animated-transit-path"
                />

                {/* Animated traveling vehicle on the route */}
                <circle r="4" fill="#ffffff" filter="url(#glowEffect)">
                  <animateMotion
                    path={pathData}
                    dur={`${Math.max(3.5, (source.distanceKm || 45) / 50)}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            );
          })}

          {/* Last-Mile Route: Delivery Cluster Hub -> User Exact Location (if doorstep) */}
          {deliveryType === "doorstep" && (
            <g>
              <path
                d={`M ${deliveryCoord.x},${deliveryCoord.y} Q ${deliveryCoord.x + 15},${deliveryCoord.y - 10} ${userPinCoord.x},${userPinCoord.y}`}
                fill="none"
                stroke="#f4c46f"
                strokeWidth="2.5"
                strokeDasharray="4 3"
                className="animated-transit-path-fast"
              />
              <circle r="3.5" fill="#f4c46f">
                <animateMotion
                  path={`M ${deliveryCoord.x},${deliveryCoord.y} Q ${deliveryCoord.x + 15},${deliveryCoord.y - 10} ${userPinCoord.x},${userPinCoord.y}`}
                  dur="1.8s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          )}

          {/* Warehouse Nodes (Origin) */}
          {activeSources.map(({ source, items }) => {
            const coord = WAREHOUSE_COORDS[source.clusterId] || { x: 380, y: 200, label: source.clusterName, sub: source.farm };
            const isHovered = hoveredNode === source.clusterId;

            return (
              <g
                key={`node-${source.clusterId}`}
                className="map-node warehouse-node"
                onMouseEnter={() => setHoveredNode(source.clusterId)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: "pointer" }}
              >
                {/* Radar pulse around warehouse */}
                <circle cx={coord.x} cy={coord.y} r="22" fill="url(#hubRadar)" className="pulse-radar" />
                
                {/* Node circle */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r="9"
                  fill="#1b633f"
                  stroke={isHovered ? "#9deb46" : "#72b52b"}
                  strokeWidth="2.5"
                />
                
                {/* Inner dot */}
                <circle cx={coord.x} cy={coord.y} r="3.5" fill="#ffffff" />

                {/* Warehouse Badge Card */}
                <g transform={`translate(${coord.x - 70}, ${coord.y - 38})`}>
                  <rect width="140" height="26" rx="6" fill="rgba(16, 44, 31, 0.92)" stroke="#2b744b" strokeWidth="1" />
                  <text x="70" y="12" fill="#ffffff" fontSize="9" fontWeight="800" textAnchor="middle">
                    🏭 {source.clusterName.split(" ")[0]} Hub
                  </text>
                  <text x="70" y="21" fill="#9ec5af" fontSize="7.5" textAnchor="middle">
                    {source.distanceKm} km · {items.length} {items.length === 1 ? "item" : "items"}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Urban Consolidation Gateway Hub Pin */}
          <g className="map-node">
            <rect
              x={urbanTransitHub.x - 5}
              y={urbanTransitHub.y - 5}
              width="10"
              height="10"
              rx="2"
              fill="#2c7750"
              stroke="#83c85c"
              strokeWidth="1.5"
              transform={`rotate(45 ${urbanTransitHub.x} ${urbanTransitHub.y})`}
            />
            <text x={urbanTransitHub.x} y={urbanTransitHub.y + 17} fill="#8cb99e" fontSize="7.5" textAnchor="middle">
              Metro Pre-Cooling Hub
            </text>
          </g>

          {/* Serving Delivery Cluster Hub Pin */}
          <g
            className="map-node delivery-hub-node"
            onMouseEnter={() => setHoveredNode("delivery-hub")}
            onMouseLeave={() => setHoveredNode(null)}
          >
            <circle cx={deliveryCoord.x} cy={deliveryCoord.y} r="26" fill="#1e5c8e" opacity="0.25" className="pulse-radar" />
            <circle cx={deliveryCoord.x} cy={deliveryCoord.y} r="10" fill="#1a5a8a" stroke="#4fc3f7" strokeWidth="2.5" />
            <circle cx={deliveryCoord.x} cy={deliveryCoord.y} r="4" fill="#ffffff" />

            <g transform={`translate(${deliveryCoord.x - 75}, ${deliveryCoord.y - 40})`}>
              <rect width="150" height="28" rx="7" fill="rgba(14, 38, 58, 0.94)" stroke="#3892cb" strokeWidth="1.2" />
              <text x="75" y="12" fill="#ffffff" fontSize="9" fontWeight="800" textAnchor="middle">
                ❖ {deliveryCluster.name.split(" ")[0]} Delivery Hub
              </text>
              <text x="75" y="22" fill="#81c4ee" fontSize="7.5" textAnchor="middle">
                Batch: {deliveryCluster.nextDispatchSlot.split("(")[0]}
              </text>
            </g>
          </g>

          {/* Customer Location Pin (Doorstep or Community Gate) */}
          <g
            className="map-node user-pin-node"
            onMouseEnter={() => setHoveredNode("user-location")}
            onMouseLeave={() => setHoveredNode(null)}
          >
            <circle cx={userPinCoord.x} cy={userPinCoord.y} r="18" fill="#e59832" opacity="0.3" className="pulse-radar" />
            
            {/* Location marker pin */}
            <path
              d={`M ${userPinCoord.x},${userPinCoord.y} L ${userPinCoord.x - 7},${userPinCoord.y - 14} A 8 8 0 1 1 ${userPinCoord.x + 7},${userPinCoord.y - 14} Z`}
              fill="#e59832"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <circle cx={userPinCoord.x} cy={userPinCoord.y - 14} r="3" fill="#ffffff" />

            {/* User Location Label */}
            <g transform={`translate(${userPinCoord.x - 65}, ${userPinCoord.y + 12})`}>
              <rect width="130" height="24" rx="6" fill="rgba(38, 26, 12, 0.94)" stroke="#e59832" strokeWidth="1" />
              <text x="65" y="11" fill="#fbd18b" fontSize="8" fontWeight="800" textAnchor="middle">
                📍 {deliveryType === "doorstep" ? "Your Doorstep" : "Community Drop Point"}
              </text>
              <text x="65" y="19" fill="#e8d5be" fontSize="7" textAnchor="middle">
                {deliveryType === "doorstep" ? userAddress.slice(0, 18) + "..." : deliveryCluster.hubLocation.slice(0, 18)}
              </text>
            </g>
          </g>
        </svg>

        {/* Live Route Telemetry Overlay Card */}
        <div className="map-telemetry-panel">
          <div className="telemetry-col">
            <span className="telemetry-label">ORIGIN WAREHOUSE</span>
            <strong className="telemetry-value">
              {primarySource ? primarySource.clusterName : "Chengalpattu Agro-Hub #4"}
            </strong>
            <small className="telemetry-sub">
              {primarySource ? `${primarySource.farm} · ${primarySource.location}` : "GST Aggregation Hub #4"}
            </small>
          </div>

          <div className="telemetry-arrow">➔</div>

          <div className="telemetry-col">
            <span className="telemetry-label">SERVING DELIVERY CLUSTER</span>
            <strong className="telemetry-value" style={{ color: "#74c2f2" }}>
              {deliveryCluster.name}
            </strong>
            <small className="telemetry-sub">{deliveryCluster.hubLocation}</small>
          </div>

          <div className="telemetry-arrow">➔</div>

          <div className="telemetry-col">
            <span className="telemetry-label">FINAL DESTINATION</span>
            <strong className="telemetry-value" style={{ color: "#f8cf89" }}>
              {deliveryType === "doorstep" ? "Your Home Doorstep" : "Consolidated Gate Locker"}
            </strong>
            <small className="telemetry-sub">
              {deliveryType === "doorstep" ? userAddress : deliveryCluster.hubLocation}
            </small>
          </div>

          <div className="telemetry-stat-pills">
            <div className="stat-pill">
              <span>Distance</span>
              <b>{totalFoodMiles} km</b>
            </div>
            <div className="stat-pill">
              <span>Cooling</span>
              <b style={{ color: "#85d562" }}>❄ 3.8°C</b>
            </div>
            <div className="stat-pill">
              <span>CO₂ Saved</span>
              <b style={{ color: "#85d562" }}>42%</b>
            </div>
          </div>
        </div>
      </div>

      {/* Cluster & Location Details & Switcher at Checkout */}
      <div className="delivery-cluster-controls">
        <div className="cluster-control-group">
          <label htmlFor="delivery-cluster-select">
            <strong>Delivery Cluster Serving Your Area:</strong>
            <small>Orders in this cluster are batched together to eliminate individual vehicle emissions.</small>
          </label>
          <div className="cluster-select-wrap">
            <select
              id="delivery-cluster-select"
              className="cluster-select"
              value={deliveryCluster.id}
              onChange={(e) => onSelectCluster && onSelectCluster(e.target.value)}
            >
              {availableDeliveryClusters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.hubLocation} ({c.nextDispatchSlot})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="cluster-address-group">
          <strong>Delivery Destination Address:</strong>
          {isEditingAddress ? (
            <div className="address-edit-row">
              <input
                type="text"
                className="address-input"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                placeholder="Enter your street address, apartment, door number..."
              />
              <button type="button" className="save-addr-btn" onClick={handleSaveAddress}>
                Save
              </button>
            </div>
          ) : (
            <div className="address-display-row">
              <span className="current-addr">
                📍 {deliveryType === "doorstep" ? userAddress : `${deliveryCluster.name} (${deliveryCluster.hubLocation})`}
              </span>
              {deliveryType === "doorstep" && (
                <button
                  type="button"
                  className="edit-addr-btn"
                  onClick={() => setIsEditingAddress(true)}
                >
                  Edit Address ✎
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Item Origin Warehouse Breakdown Table */}
      <div className="warehouse-items-table-wrap">
        <div className="items-table-head">
          <span>Items in Basket & Origin Warehouses</span>
          <small>{cart.length} item{cart.length === 1 ? "" : "s"} tracked via Farm2Home Disintermediated Ledger</small>
        </div>
        <div className="warehouse-items-list">
          {cart.map((entry, idx) => (
            <div className="warehouse-item-row" key={`${entry.product.id}-${idx}`}>
              <div className="item-meta">
                <span className="item-name">🥬 {entry.product.name} × {entry.quantity}</span>
                <span className="item-farmer">grown by <b>{entry.source.farmer}</b> ({entry.source.farm})</span>
              </div>
              <div className="warehouse-badge">
                <span>Warehouse Origin:</span>
                <strong>🏭 {entry.source.clusterName}</strong>
                <small>{entry.source.distanceKm} km transit · Harvested {entry.source.harvestTime}</small>
              </div>
              <div className="route-arrow-col">
                <span>Direct transit ➔</span>
                <b>{deliveryCluster.name.split(" ")[0]} Cluster</b>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
