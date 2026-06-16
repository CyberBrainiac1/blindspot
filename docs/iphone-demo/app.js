const SUPABASE_CONFIG_STORAGE_KEY = "blindspot.supabase.config";
const SAN_JOSE = [37.3382, -121.8863];
const DEFAULT_SUPABASE_URL = "https://uyfopvdeiprsidzlxrzj.supabase.co";

const hazardTypes = {
  pothole: { label: "Pothole", color: "#ee5634", icon: "pothole" },
  debris: { label: "Debris", color: "#e6bc00", icon: "leaf" },
  glass: { label: "Glass", color: "#2bb3c0", icon: "box" },
  water: { label: "Water", color: "#3b82f6", icon: "drop" },
  blockedLane: { label: "Blocked Lane", color: "#e5484d", icon: "x-octagon" },
  construction: { label: "Construction", color: "#ff8a00", icon: "cone" },
  noBikeLane: { label: "No Bike Lane", color: "#e5484d", icon: "x-octagon" },
  roughSurface: { label: "Rough Surface", color: "#ff8a00", icon: "wave" },
  capturedPhoto: { label: "Captured Photo", color: "#ee5634", icon: "camera" }
};

let hazards = [
  { id: "h1", type: "pothole", lat: 37.3419, lng: -121.8907, status: "Confirmed", confirmations: 12, age: "2h ago" },
  { id: "h2", type: "glass", lat: 37.3368, lng: -121.8847, status: "Confirmed", confirmations: 5, age: "6h ago" },
  { id: "h3", type: "construction", lat: 37.3432, lng: -121.8795, status: "Reported", confirmations: 1, age: "8h ago" },
  { id: "h4", type: "blockedLane", lat: 37.3331, lng: -121.8920, status: "Confirmed", confirmations: 9, age: "3h ago" },
  { id: "h5", type: "water", lat: 37.3324, lng: -121.8811, status: "Reported", confirmations: 1, age: "3h ago" }
];

let rides = [
  {
    id: "r1",
    date: "Jun 12, 2026",
    distance: "1.62",
    duration: "07:07",
    avg: "13.6",
    safety: 82,
    rating: 4,
    favorite: true,
    hazards: 2,
    potholes: 1,
    summary: "Protected crossings and clear pavement for most of the route, with one confirmed pothole near the north end.",
    ratingWord: "Good",
    score: 82,
    tags: ["green_lane", "pothole", "smooth_surface"],
    events: [{ x: 36, y: 56, icon: "flag" }, { x: 67, y: 38, icon: "warning" }],
    photos: ["manual", "machine", "machine"]
  },
  {
    id: "r2",
    date: "Jun 9, 2026",
    distance: "1.81",
    duration: "09:08",
    avg: "12.1",
    safety: 67,
    rating: 3,
    favorite: false,
    hazards: 3,
    potholes: 1,
    summary: "Paint-only bike access with glass and debris flags. The route is rideable, but traffic exposure is higher.",
    ratingWord: "Fair",
    score: 67,
    tags: ["painted_lane", "glass", "debris", "hard_brake"],
    events: [{ x: 29, y: 63, icon: "flag" }, { x: 58, y: 45, icon: "warning" }, { x: 71, y: 34, icon: "warning" }],
    photos: ["machine", "machine", "manual"]
  },
  {
    id: "r3",
    date: "Jun 5, 2026",
    distance: "1.16",
    duration: "04:15",
    avg: "16.1",
    safety: 91,
    rating: 0,
    favorite: false,
    hazards: 1,
    potholes: 0,
    summary: "Smooth surface and low hazard density. The app found no obvious potholes in the captured frames.",
    ratingWord: "Good",
    score: 91,
    tags: ["smooth_surface", "low_traffic", "no_potholes"],
    events: [{ x: 48, y: 48, icon: "flag" }],
    photos: []
  }
];

let map;
let hazardLayer;
let recapMap;
let currentTab = "screen-map";
let currentRide = null;
let recordTimer = null;
let startedAt = 0;
let elapsedSeconds = 0;
let flaggedDuringRide = 0;
let sosTimer = null;
let sosCount = 8;
let bleLog = ["advertising started", "connected: BlindSpot-Pi", "rx ride_start -> ready"];
let supabaseClient = null;
let supabaseChannel = null;
let supabaseConfig = null;
let syncBusy = false;
let syncDebounce = null;
let openRecapRideId = null;
let toastTimer = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const clone = (value) => JSON.parse(JSON.stringify(value));
const seedHazards = clone(hazards);
const seedRides = clone(rides);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function titleCase(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function unique(values) {
  return [...new Set(values.filter(Boolean).map(String))];
}

function arrayFrom(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}

function numberFrom(...values) {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function formatDuration(seconds) {
  const min = Math.floor(seconds / 60).toString().padStart(2, "0");
  const sec = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}

function formatRideDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "Today";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatMilesFromMeters(meters) {
  return (Math.max(0, meters) / 1609.344).toFixed(2);
}

function formatMphFromMps(mps) {
  return (Math.max(0, mps) * 2.236936).toFixed(1);
}

function getHazardType(type) {
  return hazardTypes[type] || hazardTypes.capturedPhoto;
}

function normalizeHazardType(type) {
  const value = String(type || "").trim();
  const normalized = value
    .replace(/[-_\s]+([a-z])/g, (_, letter) => letter.toUpperCase())
    .replace(/^[A-Z]/, (letter) => letter.toLowerCase());
  return hazardTypes[normalized] ? normalized : "capturedPhoto";
}

function toSnakeHazardType(type) {
  return String(type).replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function seededPosition(seed) {
  const text = String(seed || "seed");
  let hash = 0;
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return {
    x: 20 + (hash % 60),
    y: 24 + ((hash >> 8) % 54)
  };
}

function seededCoordinate(seed) {
  const pos = seededPosition(seed);
  return {
    lat: 37.326 + ((100 - pos.y) / 100) * 0.024,
    lng: -121.899 + (pos.x / 100) * 0.024
  };
}

function icon(name) {
  const path = {
    map: '<path d="M3 6.5 9 4l6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5V6.5Zm6-2.5v13.5m6-11v13.5"/>',
    record: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1.2"/><circle cx="4" cy="12" r="1.2"/><circle cx="4" cy="18" r="1.2"/>',
    person: '<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/>',
    flag: '<path d="M6 21V4h10l-1.3 4L16 12H6"/>',
    warning: '<path d="M12 3 22 20H2L12 3Z"/><path d="M12 9v5M12 17h.01"/>',
    shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="M12 2v20"/>',
    star: '<path d="m12 2.5 2.9 6 6.6 1-4.8 4.6 1.1 6.5L12 17.5l-5.8 3.1 1.1-6.5-4.8-4.6 6.6-1L12 2.5Z"/>',
    "star-fill": '<path d="m12 2.5 2.9 6 6.6 1-4.8 4.6 1.1 6.5L12 17.5l-5.8 3.1 1.1-6.5-4.8-4.6 6.6-1L12 2.5Z"/>',
    camera: '<path d="M4 8h4l1.8-2h4.4L16 8h4v11H4V8Z"/><circle cx="12" cy="13.5" r="3"/>',
    photo: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8" cy="10" r="1.5"/><path d="m5 17 4.5-4.5 3.5 3 2-2 4 3.5"/>',
    sparkles: '<path d="M12 3 14 9l6 2-6 2-2 6-2-6-6-2 6-2 2-6Z"/><path d="M19 3v4M17 5h4M5 17v3M3.5 18.5h3"/>',
    antenna: '<path d="M12 18v-6"/><circle cx="12" cy="19" r="2"/><path d="M8.5 12.5a5 5 0 0 1 7 0M5.5 9.5a9 9 0 0 1 13 0M2.5 6.5a13 13 0 0 1 19 0"/>',
    "person-plus": '<path d="M15 21a7 7 0 0 0-14 0"/><circle cx="8" cy="7" r="4"/><path d="M19 8v6M16 11h6"/>',
    pothole: '<path d="M4 13a8 8 0 0 0 16 0H4Z"/><path d="M6 13c1.5-2 10.5-2 12 0"/>',
    leaf: '<path d="M20 4C12 4 5 8 5 16c0 2 1 4 3 5 8-1 12-8 12-17Z"/><path d="M5 21c3-6 7-9 15-17"/>',
    box: '<path d="M4 8 12 4l8 4-8 4-8-4Z"/><path d="M4 8v8l8 4 8-4V8"/><path d="M12 12v8"/>',
    drop: '<path d="M12 3s7 7.2 7 12a7 7 0 0 1-14 0c0-4.8 7-12 7-12Z"/>',
    "x-octagon": '<path d="M8 2h8l6 6v8l-6 6H8l-6-6V8l6-6Z"/><path d="m9 9 6 6M15 9l-6 6"/>',
    cone: '<path d="M12 3 7 19h10L12 3Z"/><path d="M6 21h12M9 13h6M10 9h4"/>',
    wave: '<path d="M3 12c2-4 4 4 6 0s4 4 6 0 4 4 6 0"/>'
  }[name] || '<circle cx="12" cy="12" r="8"/>';

  const filled = ["star-fill"].includes(name);
  return `<svg class="bs-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" ${filled ? "" : 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'}>${path}</svg>`;
}

function mountStaticIcons() {
  $$("[data-icon]").forEach((slot) => {
    slot.innerHTML = icon(slot.dataset.icon);
  });
}

function toast(text) {
  const node = $("#toast");
  if (!node) return;
  window.clearTimeout(toastTimer);
  node.textContent = text;
  node.classList.remove("hidden");
  toastTimer = window.setTimeout(() => node.classList.add("hidden"), 1700);
}

function openActions(title, actions) {
  const sheet = $("#actionSheet");
  const backdrop = $("#actionBackdrop");
  sheet.innerHTML = `
    <div class="action-group">
      <div class="action-title">${escapeHtml(title)}</div>
      ${actions.map((action, index) => `
        <button class="action-button ${action.danger ? "danger" : ""}" type="button" data-action-index="${index}">
          ${escapeHtml(action.label)}
        </button>
      `).join("")}
    </div>
    <div class="action-group">
      <button class="action-button danger" type="button" data-action-cancel>Cancel</button>
    </div>
  `;
  sheet._actions = actions;
  sheet.classList.remove("hidden");
  backdrop.classList.remove("hidden");
}

function closeActions() {
  $("#actionSheet").classList.add("hidden");
  $("#actionBackdrop").classList.add("hidden");
}

function showScreen(screenId) {
  $$(".screen").forEach((screen) => {
    screen.classList.toggle("is-active", screen.id === screenId);
  });
  window.setTimeout(() => {
    if (map) map.invalidateSize();
    if (recapMap) recapMap.invalidateSize();
  }, 100);
}

function showMainTab(screenId) {
  currentTab = screenId;
  showScreen(screenId);
  $$(".tab-link").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.tabTarget === screenId);
  });
}

function showDetail(screenId) {
  showScreen(screenId);
}

window.bsShowTab = (selector) => showMainTab(String(selector).replace("#", ""));

function initMap() {
  map = L.map("hazardMapCanvas", {
    zoomControl: false,
    attributionControl: true
  }).setView(SAN_JOSE, 14);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);

  L.control.zoom({ position: "bottomright" }).addTo(map);
  hazardLayer = L.layerGroup().addTo(map);

  map.on("click", (event) => {
    addHazardAtCoordinate(event.latlng.lat, event.latlng.lng);
  });
}

function renderHazards() {
  if (!hazardLayer) return;
  hazardLayer.clearLayers();

  const points = [];
  hazards.forEach((hazard) => {
    const type = getHazardType(hazard.type);
    const coord = Number.isFinite(Number(hazard.lat)) && Number.isFinite(Number(hazard.lng))
      ? { lat: Number(hazard.lat), lng: Number(hazard.lng) }
      : seededCoordinate(hazard.id);
    points.push([coord.lat, coord.lng]);
    const marker = L.marker([coord.lat, coord.lng], {
      icon: L.divIcon({
        className: "",
        html: `<button class="hazard-marker" type="button" style="--pin-color:${type.color}" aria-label="${escapeAttribute(type.label)}">${icon(type.icon)}</button>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      })
    });
    marker.on("click", (event) => {
      event.originalEvent?.stopPropagation();
      openHazardActions(hazard.id);
    });
    marker.addTo(hazardLayer);
  });

  if (points.length && (!map._blindspotFitted || hazards.length > seedHazards.length)) {
    map._blindspotFitted = true;
    map.fitBounds(points, { padding: [42, 42], maxZoom: 14 });
  }
}

function addHazardAtCoordinate(lat, lng) {
  openActions("Add a hazard here", Object.entries(hazardTypes)
    .filter(([key]) => key !== "capturedPhoto" && key !== "noBikeLane" && key !== "roughSurface")
    .map(([key, type]) => ({
      label: type.label,
      onClick: async () => {
        const hazard = {
          id: `h${Date.now()}`,
          type: key,
          lat,
          lng,
          status: "Reported",
          confirmations: 1,
          age: "now"
        };
        hazards.unshift(hazard);
        renderHazards();
        toast(`${type.label} added`);
        await saveHazardToSupabase(hazard);
      }
    })));
}

function openHazardActions(id) {
  const hazard = hazards.find((item) => item.id === id);
  if (!hazard) return;
  const type = getHazardType(hazard.type);
  openActions(type.label, [
    { label: "Report (email)", onClick: () => toast("Report draft opened") },
    {
      label: "Confirm still here",
      onClick: () => {
        hazard.status = "Confirmed";
        hazard.confirmations += 1;
        hazard.age = "now";
        renderHazards();
        toast("Hazard confirmed");
      }
    },
    {
      label: "Delete",
      danger: true,
      onClick: () => {
        hazards = hazards.filter((item) => item.id !== id);
        renderHazards();
        toast("Hazard deleted");
      }
    }
  ]);
}

function renderRides() {
  $("#rideList").innerHTML = rides.map((ride) => `
    <button class="ride-card" data-open-ride="${escapeAttribute(ride.id)}" type="button">
      <div class="ride-top">
        <span class="ride-date">
          ${ride.favorite ? '<span class="favorite-star" aria-hidden="true">' + icon("star-fill") + '</span>' : ""}
          <strong>${escapeHtml(ride.date)}</strong>
        </span>
        ${safetyBadge(ride.safety)}
      </div>
      <div class="row-stats">
        ${rowStat(ride.distance, "mi", "Distance")}
        ${rowStat(ride.duration, "", "Duration")}
        ${rowStat(ride.avg, "mph", "Avg")}
      </div>
      ${ride.rating ? `<div class="rating-row" aria-label="${ride.rating} star rating">${starsMarkup(ride.rating, false)}</div>` : ""}
    </button>
  `).join("");
}

function rowStat(value, unit, label) {
  return `
    <span class="row-stat">
      <span><strong>${escapeHtml(value)}</strong>${unit ? `<em>${escapeHtml(unit)}</em>` : ""}</span>
      <small>${escapeHtml(label.toUpperCase())}</small>
    </span>
  `;
}

function safetyBadge(score) {
  const displayScore = Number.isFinite(Number(score)) ? Number(score) : 0;
  const color = displayScore >= 80 ? "#30a46c" : displayScore >= 60 ? "#ff8a00" : "#e5484d";
  return `<span class="safety-badge" style="--badge-color:${color}">${icon("shield")}${displayScore || "-"}</span>`;
}

function aiBadge(word, score) {
  const displayScore = Number.isFinite(Number(score)) ? Number(score) : 0;
  const color = displayScore >= 80 ? "#30a46c" : displayScore >= 50 ? "#ff8a00" : "#e5484d";
  return `<span class="ai-badge" style="--badge-color:${color}">${escapeHtml(word || "Ride")} ${displayScore || "-"}</span>`;
}

function starsMarkup(rating, interactive, rideId = "") {
  let html = "";
  for (let i = 1; i <= 5; i += 1) {
    const filled = i <= Number(rating || 0);
    html += interactive
      ? `<button class="star-button ${filled ? "filled" : ""}" type="button" data-rate="${escapeAttribute(`${rideId}:${i}`)}" aria-label="${i} stars">${icon(filled ? "star-fill" : "star")}</button>`
      : `<span class="star ${filled ? "filled" : ""}">${icon(filled ? "star-fill" : "star")}</span>`;
  }
  return html;
}

function openRecap(id) {
  const ride = rides.find((item) => item.id === id);
  if (!ride) return;
  openRecapRideId = id;

  $("#recapContent").innerHTML = `
    <div class="recap-stack">
      <div class="route-preview">
        <div id="recapRouteMap" class="recap-map" aria-label="Ride route map"></div>
      </div>
      <div class="bs-card">
        <div class="stat-grid">
          <div class="stat-tile"><span><strong>${escapeHtml(ride.distance)}</strong><em>mi</em></span><small>DISTANCE</small></div>
          <div class="stat-tile"><span><strong>${escapeHtml(ride.duration)}</strong></span><small>DURATION</small></div>
          <div class="stat-tile"><span><strong>${escapeHtml(ride.avg)}</strong><em>mph</em></span><small>AVG SPEED</small></div>
          <div class="stat-tile"><span><strong>${escapeHtml(ride.hazards)}</strong></span><small>HAZARDS</small></div>
        </div>
      </div>
      <div class="bs-card">
        <div class="ride-top">
          <div class="section-heading">AI RIDE SUMMARY</div>
          ${aiBadge(ride.ratingWord, ride.score)}
        </div>
        <p class="summary-text">${escapeHtml(ride.summary)}</p>
        ${ride.potholes ? `<p class="muted">${ride.potholes} pothole${ride.potholes === 1 ? "" : "s"} detected</p>` : ""}
        <div class="chips">${ride.tags.map((tag) => `<span class="chip">${escapeHtml(String(tag).replaceAll("_", " "))}</span>`).join("")}</div>
      </div>
      <div class="bs-card">
        <div class="section-heading">RATE THIS RIDE</div>
        <div class="rating-row">${starsMarkup(ride.rating, true, ride.id)}</div>
      </div>
      <div class="bs-card">
        <div class="ride-top">
          <div class="section-heading">PHOTOS</div>
          <strong>${ride.photos.length}</strong>
        </div>
        <div class="photo-grid">
          ${(ride.photos.length ? ride.photos : ["empty", "empty", "empty"]).map(photoCell).join("")}
        </div>
      </div>
    </div>
  `;

  showDetail("screen-recap");
  window.setTimeout(() => renderRecapMap(ride), 50);
}

function photoCell(photo) {
  const isObject = typeof photo === "object" && photo !== null;
  const isMachine = photo === "machine" || (isObject && photo.kind === "machine");
  const url = isObject && photo.url ? photo.url : "";
  return `
    <span class="photo-cell">
      ${url
        ? `<img src="${escapeAttribute(url)}" alt="" loading="lazy" onerror="this.remove();">`
        : icon("photo")}
      ${isMachine ? `<span class="machine-dot">${icon("camera")}</span>` : ""}
    </span>
  `;
}

function renderRecapMap(ride) {
  const node = $("#recapRouteMap");
  if (!node || !window.L) return;
  if (recapMap) {
    recapMap.remove();
    recapMap = null;
  }

  const coords = routeCoordinatesForRide(ride);
  recapMap = L.map(node, {
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    touchZoom: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
  }).addTo(recapMap);

  L.polyline(coords, { color: "#ee5634", weight: 5, opacity: 0.95 }).addTo(recapMap);
  (ride.events || []).forEach((event, index) => {
    const coord = coords[Math.min(index + 1, coords.length - 1)] || coords[0];
    L.marker(coord, {
      icon: L.divIcon({
        className: "",
        html: `<span class="event-marker">${icon(event.icon || "flag")}</span>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      })
    }).addTo(recapMap);
  });
  recapMap.fitBounds(coords, { padding: [28, 28], maxZoom: 15 });
}

function routeCoordinatesForRide(ride) {
  const base = seededCoordinate(ride.id);
  return [
    [base.lat - 0.006, base.lng - 0.007],
    [base.lat - 0.002, base.lng - 0.004],
    [base.lat + 0.001, base.lng - 0.001],
    [base.lat + 0.003, base.lng + 0.004],
    [base.lat + 0.006, base.lng + 0.007]
  ];
}

function startRide() {
  currentRide = {
    id: `r${Date.now()}`,
    date: "Today",
    events: [],
    photos: ["manual"]
  };
  startedAt = Date.now();
  elapsedSeconds = 0;
  flaggedDuringRide = 0;
  $("#recordIdle").classList.add("hidden");
  $("#recordingPanel").classList.remove("hidden");
  addBleLine(`tx ride_started ${currentRide.id.slice(0, 8)}`);
  updateActiveRideStatus();
  updateTelemetry();
  recordTimer = window.setInterval(updateTelemetry, 1000);
  toast("Ride started");
}

function stopRide() {
  if (!currentRide) return;
  window.clearInterval(recordTimer);
  const miles = Math.max(0.18, elapsedSeconds * 0.0034);
  const ride = {
    id: currentRide.id,
    date: "Today",
    distance: miles.toFixed(2),
    duration: formatDuration(elapsedSeconds),
    avg: (miles / Math.max(elapsedSeconds / 3600, 0.04)).toFixed(1),
    safety: Math.max(58, 91 - flaggedDuringRide * 7),
    rating: 0,
    favorite: false,
    hazards: flaggedDuringRide,
    potholes: currentRide.events.filter((event) => event === "pothole").length,
    summary: flaggedDuringRide
      ? "The Pi captured ride photos and flagged hazards for review. The recap is ready for rating."
      : "Clean short ride with no hazards flagged during the demo session.",
    ratingWord: flaggedDuringRide ? "Fair" : "Good",
    score: Math.max(58, 91 - flaggedDuringRide * 7),
    tags: flaggedDuringRide ? ["manual_flags", "pi_photos", "review_needed"] : ["smooth_surface", "no_flags"],
    events: flaggedDuringRide
      ? [{ icon: "flag", x: 42, y: 52 }, { icon: "warning", x: 65, y: 39 }].slice(0, Math.max(1, Math.min(2, flaggedDuringRide)))
      : [{ icon: "flag", x: 50, y: 49 }],
    photos: currentRide.photos
  };
  rides.unshift(ride);
  currentRide = null;
  $("#recordIdle").classList.remove("hidden");
  $("#recordingPanel").classList.add("hidden");
  updateActiveRideStatus();
  renderRides();
  openRecap(ride.id);
  toast("Ride saved");
}

function updateTelemetry() {
  elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
  const speed = 12 + Math.sin(elapsedSeconds / 3) * 2.4;
  const distance = elapsedSeconds * 0.0034;
  const peak = 1 + flaggedDuringRide * 0.7 + Math.max(0, Math.sin(elapsedSeconds / 4)) * 0.4;
  $("#speedStat").textContent = speed.toFixed(1);
  $("#timeStat").textContent = formatDuration(elapsedSeconds);
  $("#distanceStat").textContent = distance.toFixed(2);
  $("#peakGStat").textContent = peak.toFixed(1);
}

function flagHazard(type) {
  if (!currentRide) return;
  flaggedDuringRide += 1;
  currentRide.events.push(type);
  currentRide.photos.push("manual");
  const note = $("#flagNote");
  note.textContent = `${getHazardType(type).label} saved`;
  note.classList.add("show");
  window.clearTimeout(note._timer);
  note._timer = window.setTimeout(() => note.classList.remove("show"), 1500);
  toast("Photo attached to ride");
}

function simulateCrash() {
  sosCount = 8;
  $("#sosOverlay").classList.remove("hidden");
  $("#sosTitle").textContent = "CRASH DETECTED";
  $("#sosCopy").textContent = "Sending SOS in";
  $("#sosCountdown").textContent = sosCount;
  $("#sosCountdown").style.display = "block";
  $("#sosContact").textContent = "Will alert: Alex - (555) 910-2211";
  $("#cancelSosButton").textContent = "I'M OK - CANCEL";
  window.clearInterval(sosTimer);
  sosTimer = window.setInterval(() => {
    sosCount -= 1;
    $("#sosCountdown").textContent = sosCount;
    if (sosCount <= 0) {
      window.clearInterval(sosTimer);
      $("#sosTitle").textContent = "SOS SENT";
      $("#sosCopy").textContent = "Emergency contact was notified.";
      $("#sosCountdown").style.display = "none";
      $("#sosContact").textContent = "(Mock demo - no message was sent.)";
      $("#cancelSosButton").textContent = "DISMISS";
      addBleLine("crash_sos countdown completed");
    }
  }, 1000);
}

function dismissSos() {
  window.clearInterval(sosTimer);
  $("#sosOverlay").classList.add("hidden");
  addBleLine("crash_sos dismissed");
}

function addBleLine(line) {
  bleLog.unshift(line);
  bleLog = bleLog.slice(0, 7);
  renderBleLog();
}

function renderBleLog() {
  const container = $("#bleLog");
  if (!container) return;
  container.innerHTML = bleLog.map((line) => `<span>${escapeHtml(line)}</span>`).join("");
}

function openPairing() {
  updateActiveRideStatus();
  renderBleLog();
  showDetail("screen-pairing");
}

function updateActiveRideStatus() {
  const status = $("#activeRideStatus");
  if (status) status.textContent = currentRide ? currentRide.id.slice(0, 8) : "-";
}

function handlePairingToggle(event) {
  const on = event.target.checked;
  const status = $("#advertisingStatus");
  if (status) {
    status.textContent = on ? "Yes" : "No";
    status.classList.toggle("ok", on);
  }
  $("#pairingSummary").textContent = on ? "Advertising" : "Off";
  addBleLine(on ? "advertising started" : "advertising stopped");
}

function simulatePiCommand() {
  const command = currentRide ? "ride_stop" : "ride_start";
  const lastCommand = $("#lastCommandStatus");
  const lastResponse = $("#lastResponseStatus");
  if (lastCommand) lastCommand.textContent = command;
  if (lastResponse) lastResponse.textContent = currentRide ? "finish requested" : "ride id issued";
  addBleLine(`rx ${command} -> ok`);
  toast("Pi command received");
}

function getStoredSupabaseConfig() {
  const runtime = window.BLINDSPOT_SUPABASE_CONFIG;
  if ((runtime?.url || DEFAULT_SUPABASE_URL) && runtime?.publishableKey) {
    return {
      url: String(runtime.url || DEFAULT_SUPABASE_URL).trim(),
      publishableKey: runtime.publishableKey.trim()
    };
  }

  try {
    const stored = JSON.parse(localStorage.getItem(SUPABASE_CONFIG_STORAGE_KEY) || "null");
    if (stored?.url && stored?.publishableKey) {
      return {
        url: stored.url.trim(),
        publishableKey: stored.publishableKey.trim()
      };
    }
  } catch {
    localStorage.removeItem(SUPABASE_CONFIG_STORAGE_KEY);
  }
  return null;
}

function loadOptionalScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.onload = () => resolve(true);
    script.onerror = () => {
      script.remove();
      resolve(false);
    };
    document.head.appendChild(script);
  });
}

async function loadRuntimeConfig() {
  await loadOptionalScript("./config.js");
  await loadOptionalScript("./config.local.js");
}

function setSyncStatus(mode, message) {
  const syncText = $("#syncStatusText");
  const dot = $("#syncDot");
  if (syncText) syncText.textContent = message;
  if (dot) {
    dot.classList.toggle("live", mode === "live");
    dot.classList.toggle("error", mode === "error");
  }
}

async function initSupabase() {
  supabaseConfig = getStoredSupabaseConfig();
  if (!supabaseConfig) {
    setSyncStatus("mock", "Waiting for Supabase key");
    return;
  }
  if (!window.supabase?.createClient) {
    setSyncStatus("error", "Supabase library unavailable");
    return;
  }
  supabaseClient = window.supabase.createClient(supabaseConfig.url, supabaseConfig.publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  setSyncStatus("loading", "Syncing from Supabase");
  await syncFromSupabase();
  subscribeSupabaseRealtime();
}

async function selectTable(table, applyQuery, options = {}) {
  if (!supabaseClient) return [];
  let query = supabaseClient.from(table).select("*");
  if (applyQuery) query = applyQuery(query);
  const { data, error } = await query;
  if (error) {
    if (options.required) throw new Error(`${table}: ${error.message}`);
    console.warn(`Supabase ${table} skipped:`, error.message);
    return [];
  }
  return data || [];
}

async function syncFromSupabase() {
  if (!supabaseClient || syncBusy) return;
  syncBusy = true;
  setSyncStatus("loading", "Syncing from Supabase");
  try {
    await Promise.all([loadSupabaseRides(), loadSupabaseHazards()]);
    setSyncStatus("live", `Live: ${rides.length} rides, ${hazards.length} hazards`);
    if (openRecapRideId && $("#screen-recap").classList.contains("is-active")) openRecap(openRecapRideId);
  } catch (error) {
    console.warn("Supabase sync failed:", error);
    setSyncStatus("error", error.message || "Supabase sync failed");
  } finally {
    syncBusy = false;
  }
}

function scheduleSupabaseSync() {
  window.clearTimeout(syncDebounce);
  syncDebounce = window.setTimeout(syncFromSupabase, 500);
}

function subscribeSupabaseRealtime() {
  if (!supabaseClient) return;
  if (supabaseChannel) supabaseClient.removeChannel(supabaseChannel);
  supabaseChannel = supabaseClient.channel("blindspot-phone-demo");
  ["rides", "photos", "automated_photos", "ai_summary", "hazards", "ride_events"].forEach((table) => {
    supabaseChannel.on("postgres_changes", { event: "*", schema: "public", table }, scheduleSupabaseSync);
  });
  supabaseChannel.subscribe((status) => {
    if (status === "SUBSCRIBED") setSyncStatus("live", `Live: ${rides.length} rides, ${hazards.length} hazards`);
  });
}

async function loadSupabaseHazards() {
  const hazardRows = await selectTable("hazards", (query) =>
    query.order("first_reported_at", { ascending: false }).limit(500)
  );
  if (hazardRows.length) {
    hazards = hazardRows.map(hazardFromSupabaseRow);
    renderHazards();
    return;
  }

  const manualPhotos = await selectTable("photos", (query) =>
    query.order("captured_at", { ascending: false }).limit(100)
  );
  hazards = manualPhotos
    .filter((row) => Number.isFinite(Number(row.lat)) && Number.isFinite(Number(row.lng)))
    .map((row) => photoHazardFromSupabaseRow(row));
  renderHazards();
}

async function loadSupabaseRides() {
  const rideRows = await selectTable(
    "rides",
    (query) => query.order("started_at", { ascending: false }).limit(50),
    { required: true }
  );
  const [summaryRows, manualPhotoRows, machinePhotoRows, eventRows] = await Promise.all([
    selectTable("ai_summary", (query) => query.order("created_at", { ascending: false }).limit(100)),
    selectTable("photos", (query) => query.order("captured_at", { ascending: false }).limit(300)),
    selectTable("automated_photos", (query) => query.order("captured_at", { ascending: false }).limit(300)),
    selectTable("ride_events", (query) => query.order("occurred_at", { ascending: true }).limit(500))
  ]);

  const summariesByRide = latestByRide(summaryRows);
  const photosByRide = groupByRide([
    ...manualPhotoRows.map((row) => ({ ...row, isMachine: false })),
    ...machinePhotoRows.map((row) => ({ ...row, isMachine: true }))
  ]);
  const eventsByRide = groupByRide(eventRows);

  rides = rideRows.map((row) => rideFromSupabaseRow(
    row,
    summariesByRide.get(String(row.id)),
    photosByRide.get(String(row.id)) || [],
    eventsByRide.get(String(row.id)) || []
  ));
  renderRides();
}

function groupByRide(rows) {
  const grouped = new Map();
  rows.forEach((row) => {
    const rideId = String(row.ride_id || "");
    if (!rideId) return;
    if (!grouped.has(rideId)) grouped.set(rideId, []);
    grouped.get(rideId).push(row);
  });
  return grouped;
}

function latestByRide(rows) {
  const grouped = new Map();
  rows.forEach((row) => {
    const rideId = String(row.ride_id || "");
    if (!rideId || row.summary_type && row.summary_type !== "ride") return;
    if (!grouped.has(rideId)) grouped.set(rideId, row);
  });
  return grouped;
}

function hazardFromSupabaseRow(row) {
  const fallback = seededCoordinate(row.id);
  return {
    id: String(row.id),
    type: normalizeHazardType(row.type),
    lat: Number.isFinite(Number(row.lat)) ? Number(row.lat) : fallback.lat,
    lng: Number.isFinite(Number(row.lng)) ? Number(row.lng) : fallback.lng,
    status: titleCase(row.status || "reported"),
    confirmations: Number(row.confirm_count || 1),
    age: relativeAge(row.last_confirmed_at || row.first_reported_at)
  };
}

function photoHazardFromSupabaseRow(row) {
  return {
    id: String(row.id),
    type: "capturedPhoto",
    lat: Number(row.lat),
    lng: Number(row.lng),
    status: "Captured",
    confirmations: 1,
    age: relativeAge(row.captured_at || row.created_at)
  };
}

function rideFromSupabaseRow(row, summary, photoRows, eventRows) {
  const distanceMeters = numberFrom(summary?.distance_m, summary?.metrics?.distance_m, row.distance_meters, row.distance_m);
  const durationSeconds = numberFrom(summary?.duration_s, summary?.metrics?.duration_s, row.duration_seconds, row.duration_s);
  const avgSpeed = numberFrom(summary?.metrics?.avg_speed_mps, row.avg_speed, durationSeconds > 0 ? distanceMeters / durationSeconds : 0);
  const score = Math.round(numberFrom(summary?.accessibility_score, row.safety_score, row.accessibility_score, 0));
  const ratingWord = titleCase(row.accessibility_rating || summary?.accessibility_rating || (score >= 80 ? "good" : score >= 50 ? "fair" : "poor"));
  const tags = unique([
    ...arrayFrom(row.accessibility_labels),
    ...arrayFrom(row.accessibility_map_tags),
    ...arrayFrom(row.road_hazards),
    ...arrayFrom(summary?.labels),
    ...arrayFrom(summary?.road_hazards),
    ...arrayFrom(summary?.recommended_map_tags)
  ]).slice(0, 8);
  const photos = photoRows
    .filter((photo) => photo.storage_url)
    .map((photo) => ({
      kind: photo.isMachine ? "machine" : "manual",
      url: photo.storage_url
    }));
  const events = eventRows.length
    ? eventRows.map((event, index) => eventFromSupabaseRow(event, index))
    : photos.slice(0, 3).map((photo, index) => ({
      icon: photo.kind === "machine" ? "camera" : "flag",
      ...seededPosition(`${row.id}-${index}`)
    }));

  return {
    id: String(row.id),
    date: formatRideDate(row.started_at || row.created_at),
    distance: formatMilesFromMeters(distanceMeters),
    duration: formatDuration(Math.round(durationSeconds)),
    avg: formatMphFromMps(avgSpeed),
    safety: score || 0,
    rating: Number(row.rating || 0),
    favorite: Boolean(row.favorite),
    hazards: eventRows.length || Number(row.photo_count || photos.length || 0),
    potholes: Number(row.pothole_count ?? summary?.pothole_count ?? 0),
    summary: summary?.summary || row.accessibility_summary || row.qwen_summary?.summary || "Synced ride from Supabase.",
    ratingWord,
    score,
    tags: tags.length ? tags : ["synced"],
    events,
    photos
  };
}

function eventFromSupabaseRow(row, index) {
  return {
    icon: row.type === "crash" || row.type === "impact" ? "warning" : "flag",
    ...seededPosition(`${row.id || row.ride_id}-${index}`)
  };
}

function relativeAge(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "synced";
  const seconds = Math.max(1, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

async function saveHazardToSupabase(hazard) {
  if (!supabaseClient) return;
  const row = {
    lat: hazard.lat,
    lng: hazard.lng,
    type: toSnakeHazardType(hazard.type),
    severity: "moderate",
    status: "reported",
    confirm_count: 1,
    first_reported_at: new Date().toISOString()
  };
  const { error } = await supabaseClient.from("hazards").insert(row);
  if (error) {
    console.warn("Hazard insert skipped:", error.message);
    toast("Saved locally");
    return;
  }
  await syncFromSupabase();
}

function attachEvents() {
  $("#addHazardButton").addEventListener("click", (event) => {
    event.stopPropagation();
    addHazardAtCoordinate(SAN_JOSE[0], SAN_JOSE[1]);
  });

  $("#startRideButton").addEventListener("click", startRide);
  $("#stopRideButton").addEventListener("click", stopRide);
  $("#flagButton").addEventListener("click", () => {
    openActions("Flag a hazard", Object.entries(hazardTypes)
      .filter(([key]) => key !== "capturedPhoto" && key !== "noBikeLane" && key !== "roughSurface")
      .map(([key, type]) => ({
        label: type.label,
        onClick: () => flagHazard(key)
      })));
  });
  $("#simulateCrashButton").addEventListener("click", simulateCrash);
  $("#cancelSosButton").addEventListener("click", dismissSos);
  $("#pairingCard").addEventListener("click", openPairing);
  $("#chooseContactButton").addEventListener("click", () => toast("Contact selected"));
  $("#actionBackdrop").addEventListener("click", closeActions);

  document.addEventListener("click", (event) => {
    const tabLink = event.target.closest(".tab-link");
    if (tabLink) {
      event.preventDefault();
      showMainTab(tabLink.dataset.tabTarget);
      return;
    }

    const back = event.target.closest("[data-back]");
    if (back) {
      event.preventDefault();
      showMainTab(currentTab);
      return;
    }

    const actionButton = event.target.closest("[data-action-index]");
    if (actionButton) {
      const actions = $("#actionSheet")._actions || [];
      const action = actions[Number(actionButton.dataset.actionIndex)];
      closeActions();
      if (action?.onClick) action.onClick();
      return;
    }

    if (event.target.closest("[data-action-cancel]")) {
      closeActions();
      return;
    }

    const rideButton = event.target.closest("[data-open-ride]");
    if (rideButton) {
      openRecap(rideButton.dataset.openRide);
      return;
    }

    const rate = event.target.closest("[data-rate]");
    if (rate) {
      const [rideId, value] = rate.dataset.rate.split(":");
      const ride = rides.find((item) => item.id === rideId);
      if (ride) ride.rating = Number(value);
      renderRides();
      openRecap(rideId);
      toast("Rating saved");
      return;
    }

    if (event.target.closest("#simulatePiCommand")) simulatePiCommand();
  });

  document.addEventListener("change", (event) => {
    if (event.target.id === "pairingToggle") handlePairingToggle(event);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeActions();
  });
}

function applyInitialRoute() {
  const route = String(location.hash || "").replace("#", "").toLowerCase();
  if (!route) return;

  if (route === "record") {
    showMainTab("screen-record");
    return;
  }
  if (route === "recording") {
    showMainTab("screen-record");
    if (!currentRide) startRide();
    return;
  }
  if (route === "rides") {
    showMainTab("screen-rides");
    return;
  }
  if (route === "profile") {
    showMainTab("screen-profile");
    return;
  }
  if (route === "pairing") {
    showMainTab("screen-profile");
    openPairing();
    return;
  }
  if (route === "recap" && rides.length) {
    const ride = rides.find((item) => item.summary && item.summary !== "Synced ride from Supabase.") || rides[0];
    openRecap(ride.id);
  }
}

async function bootstrap() {
  mountStaticIcons();
  initMap();
  renderHazards();
  renderRides();
  renderBleLog();
  attachEvents();
  await loadRuntimeConfig();
  await initSupabase();
  applyInitialRoute();
  window.setTimeout(() => map.invalidateSize(), 150);
}

document.addEventListener("DOMContentLoaded", bootstrap);
