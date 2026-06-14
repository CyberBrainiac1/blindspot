const hazardTypes = {
  pothole: { label: "Pothole", color: "#ee5634", icon: "icon-record" },
  debris: { label: "Debris", color: "#e6bc00", icon: "icon-flag" },
  glass: { label: "Glass", color: "#2bb3c0", icon: "icon-warning" },
  water: { label: "Water", color: "#3b82f6", icon: "icon-warning" },
  blockedLane: { label: "Blocked Lane", color: "#e5484d", icon: "icon-warning" },
  construction: { label: "Construction", color: "#ff8a00", icon: "icon-warning" }
};

const titles = {
  map: "Hazard Map",
  record: "Record",
  rides: "Rides",
  profile: "Profile",
  recap: "Recap",
  pairing: "Pi Pairing"
};

let hazards = [
  { id: "h1", type: "pothole", x: 36, y: 26, status: "Confirmed", confirmations: 12, age: "2h ago" },
  { id: "h2", type: "glass", x: 58, y: 40, status: "Confirmed", confirmations: 5, age: "6h ago" },
  { id: "h3", type: "construction", x: 72, y: 21, status: "Reported", confirmations: 1, age: "8h ago" },
  { id: "h4", type: "blockedLane", x: 30, y: 66, status: "Confirmed", confirmations: 9, age: "3h ago" },
  { id: "h5", type: "water", x: 68, y: 68, status: "Reported", confirmations: 1, age: "3h ago" }
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
    events: [
      { icon: "icon-flag", x: 36, y: 56 },
      { icon: "icon-warning", x: 67, y: 38 }
    ],
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
    events: [
      { icon: "icon-flag", x: 29, y: 63 },
      { icon: "icon-warning", x: 58, y: 45 },
      { icon: "icon-warning", x: 71, y: 34 }
    ],
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
    events: [
      { icon: "icon-flag", x: 48, y: 48 }
    ],
    photos: []
  }
];

let activeTab = "map";
let detailParent = null;
let currentRide = null;
let recordTimer = null;
let startedAt = 0;
let elapsedSeconds = 0;
let flaggedDuringRide = 0;
let sosTimer = null;
let sosCount = 8;
let bleLog = [
  "advertising started",
  "connected: BlindSpot-Pi",
  "rx ride_start -> ready"
];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function icon(id) {
  return `<svg aria-hidden="true"><use href="#${id}"></use></svg>`;
}

function setTitle(screen) {
  $("#screenTitle").textContent = titles[screen] || "Blind Spot";
  $("#backButton").classList.toggle("is-hidden", !detailParent);
  $("#headerAction").classList.toggle("is-hidden", screen !== "map");
}

function showScreen(screen, options = {}) {
  $$(".screen-view").forEach((view) => {
    view.classList.toggle("active", view.dataset.screen === screen);
  });

  if (!options.keepTab) {
    activeTab = screen;
  }

  $$(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === activeTab);
  });

  setTitle(screen);
}

function showTab(tab) {
  detailParent = null;
  activeTab = tab;
  showScreen(tab);
}

function showDetail(screen, parentTab) {
  detailParent = parentTab;
  showScreen(screen, { keepTab: true });
}

function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.add("show");
  window.clearTimeout(node._timer);
  node._timer = window.setTimeout(() => node.classList.remove("show"), 1700);
}

function openSheet(title, actions) {
  $("#sheetTitle").textContent = title;
  const container = $("#sheetActions");
  container.innerHTML = "";
  actions.forEach((action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `sheet-action${action.danger ? " danger" : ""}`;
    button.textContent = action.label;
    button.addEventListener("click", () => {
      closeSheet();
      action.onClick();
    });
    container.appendChild(button);
  });
  $("#actionSheet").classList.remove("hidden");
}

function closeSheet() {
  $("#actionSheet").classList.add("hidden");
}

function renderHazards() {
  const pins = $("#hazardPins");
  pins.innerHTML = hazards.map((hazard) => {
    const type = hazardTypes[hazard.type];
    return `
      <button class="map-pin" type="button" data-hazard="${hazard.id}" style="left:${hazard.x}%;top:${hazard.y}%;--pin-color:${type.color}" aria-label="${type.label}">
        ${icon(type.icon)}
      </button>
    `;
  }).join("");

  $("#hazardList").innerHTML = hazards.map((hazard) => {
    const type = hazardTypes[hazard.type];
    return `
      <button class="hazard-row" type="button" data-hazard="${hazard.id}">
        <span class="hazard-dot" style="--pin-color:${type.color}">${icon(type.icon)}</span>
        <span>
          <strong>${type.label}</strong>
          <small>${hazard.status} - ${hazard.confirmations} confirms - ${hazard.age}</small>
        </span>
        <span class="pill">${hazard.status}</span>
      </button>
    `;
  }).join("");

  $("#hazardCount").textContent = hazards.length;
}

function addHazardAt(x, y) {
  openSheet("Add a hazard here", Object.keys(hazardTypes).map((key) => ({
    label: hazardTypes[key].label,
    onClick: () => {
      hazards.unshift({
        id: `h${Date.now()}`,
        type: key,
        x,
        y,
        status: "Reported",
        confirmations: 1,
        age: "now"
      });
      renderHazards();
      toast(`${hazardTypes[key].label} added`);
    }
  })));
}

function openHazardActions(id) {
  const hazard = hazards.find((item) => item.id === id);
  if (!hazard) return;
  const type = hazardTypes[hazard.type];
  openSheet(type.label, [
    {
      label: "Report",
      onClick: () => toast("Report draft opened")
    },
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
    <article class="ride-row">
      <div class="ride-row-header">
        <button class="ride-row-title" data-open-ride="${ride.id}" type="button">
          ${ride.favorite ? '<span class="favorite-star" aria-hidden="true">&#9733;</span>' : ""}
          <strong>${ride.date}</strong>
        </button>
        ${safetyBadge(ride.safety)}
      </div>
      <button class="row-stats" data-open-ride="${ride.id}" type="button">
        <span class="row-stat"><strong>${ride.distance}</strong><span>DISTANCE</span></span>
        <span class="row-stat"><strong>${ride.duration}</strong><span>DURATION</span></span>
        <span class="row-stat"><strong>${ride.avg}</strong><span>AVG</span></span>
      </button>
      <div class="ride-row-actions">
        <button class="icon-button" type="button" data-favorite="${ride.id}" aria-label="Favorite ride">${icon("icon-star")}</button>
        <button class="icon-button" type="button" data-delete-ride="${ride.id}" aria-label="Delete ride">${icon("icon-trash")}</button>
        <span class="stars" aria-label="${ride.rating || 0} star rating">${renderStars(ride.rating, ride.id, false)}</span>
      </div>
    </article>
  `).join("");
}

function safetyBadge(score) {
  const color = score >= 80 ? "#30a46c" : score >= 60 ? "#ff8a00" : "#e5484d";
  return `
    <span class="safety-badge" style="--badge-color:${color}">
      ${icon("icon-shield")}
      ${score}
    </span>
  `;
}

function renderStars(rating, rideId, large) {
  let html = "";
  for (let i = 1; i <= 5; i += 1) {
    html += `
      <button class="star-button ${i <= rating ? "filled" : ""}" type="button" data-rate="${rideId}:${i}" aria-label="${i} stars">
        ${icon("icon-star")}
      </button>
    `;
  }
  return html;
}

function openRecap(id) {
  const ride = rides.find((item) => item.id === id);
  if (!ride) return;
  const scoreColor = ride.score >= 80 ? "#30a46c" : ride.score >= 50 ? "#ff8a00" : "#e5484d";
  $("#recapContent").innerHTML = `
    <div class="card route-card">
      <div class="road road-a"></div>
      <div class="road road-b"></div>
      <div class="route-line"></div>
      ${ride.events.map((event) => `<span class="event-marker" style="left:${event.x}%;top:${event.y}%">${icon(event.icon)}</span>`).join("")}
    </div>

    <div class="card">
      <div class="stat-grid">
        <div class="stat-tile"><strong>${ride.distance}</strong><span>mi</span><small>DISTANCE</small></div>
        <div class="stat-tile"><strong>${ride.duration}</strong><small>DURATION</small></div>
        <div class="stat-tile"><strong>${ride.avg}</strong><span>mph</span><small>AVG SPEED</small></div>
        <div class="stat-tile"><strong>${ride.hazards}</strong><small>HAZARDS</small></div>
      </div>
    </div>

    <div class="card">
      <div class="section-heading">
        <span>AI RIDE SUMMARY</span>
        <span class="ai-badge" style="--badge-color:${scoreColor}">${ride.ratingWord} ${ride.score}</span>
      </div>
      <p class="summary-text">${ride.summary}</p>
      ${ride.potholes ? `<p class="muted">${ride.potholes} pothole${ride.potholes === 1 ? "" : "s"} detected</p>` : ""}
      <div class="chips">${ride.tags.map((tag) => `<span class="chip">${tag.replaceAll("_", " ")}</span>`).join("")}</div>
    </div>

    <div class="card">
      <div class="section-heading"><span>RATE THIS RIDE</span></div>
      <div class="stars">${renderStars(ride.rating, ride.id, true)}</div>
    </div>

    <div class="card">
      <div class="section-heading">
        <span>PHOTOS</span>
        <strong>${ride.photos.length}</strong>
      </div>
      <div class="photo-grid">
        ${(ride.photos.length ? ride.photos : ["empty", "empty", "empty"]).map((photo) => `
          <span class="photo-cell">
            ${icon("icon-camera")}
            ${photo === "machine" ? `<span class="machine-dot">${icon("icon-camera")}</span>` : ""}
          </span>
        `).join("")}
      </div>
    </div>
  `;
  showDetail("recap", "rides");
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
  $("#activeRideStatus").textContent = currentRide.id.slice(0, 8);
  addBleLine(`tx ride_started ${currentRide.id.slice(0, 8)}`);
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
      ? [{ icon: "icon-flag", x: 42, y: 52 }, { icon: "icon-warning", x: 65, y: 39 }].slice(0, Math.max(1, Math.min(2, flaggedDuringRide)))
      : [{ icon: "icon-bike", x: 50, y: 49 }],
    photos: currentRide.photos
  };
  rides.unshift(ride);
  currentRide = null;
  $("#recordIdle").classList.remove("hidden");
  $("#recordingPanel").classList.add("hidden");
  $("#activeRideStatus").textContent = "-";
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
  note.textContent = `${hazardTypes[type].label} saved`;
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

function formatDuration(seconds) {
  const min = Math.floor(seconds / 60).toString().padStart(2, "0");
  const sec = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}

function addBleLine(line) {
  bleLog.unshift(line);
  bleLog = bleLog.slice(0, 6);
  renderBleLog();
}

function renderBleLog() {
  $("#bleLog").innerHTML = bleLog.map((line) => `<span>${line}</span>`).join("");
}

function attachEvents() {
  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => showTab(tab.dataset.tab));
  });

  $("#backButton").addEventListener("click", () => {
    const target = detailParent || activeTab;
    detailParent = null;
    showTab(target);
  });

  $("#headerAction").addEventListener("click", () => addHazardAt(52, 48));
  $("#addHazardButton").addEventListener("click", (event) => {
    event.stopPropagation();
    addHazardAt(52, 48);
  });

  $("#hazardMap").addEventListener("click", (event) => {
    if (event.target.closest("button")) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.min(92, Math.max(8, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(82, Math.max(12, ((event.clientY - rect.top) / rect.height) * 100));
    addHazardAt(Math.round(x), Math.round(y));
  });

  document.addEventListener("click", (event) => {
    const hazardButton = event.target.closest("[data-hazard]");
    if (hazardButton) openHazardActions(hazardButton.dataset.hazard);

    const rideButton = event.target.closest("[data-open-ride]");
    if (rideButton) openRecap(rideButton.dataset.openRide);

    const favorite = event.target.closest("[data-favorite]");
    if (favorite) {
      const ride = rides.find((item) => item.id === favorite.dataset.favorite);
      if (ride) ride.favorite = !ride.favorite;
      renderRides();
    }

    const deleteRide = event.target.closest("[data-delete-ride]");
    if (deleteRide) {
      rides = rides.filter((item) => item.id !== deleteRide.dataset.deleteRide);
      renderRides();
      toast("Ride deleted");
    }

    const rate = event.target.closest("[data-rate]");
    if (rate) {
      const [rideId, value] = rate.dataset.rate.split(":");
      const ride = rides.find((item) => item.id === rideId);
      if (ride) ride.rating = Number(value);
      renderRides();
      if (detailParent) openRecap(rideId);
      toast("Rating saved");
    }
  });

  $("#startRideButton").addEventListener("click", startRide);
  $("#stopRideButton").addEventListener("click", stopRide);
  $("#flagButton").addEventListener("click", () => {
    openSheet("Flag a hazard", Object.keys(hazardTypes).map((key) => ({
      label: hazardTypes[key].label,
      onClick: () => flagHazard(key)
    })));
  });
  $("#simulateCrashButton").addEventListener("click", simulateCrash);
  $("#cancelSosButton").addEventListener("click", dismissSos);

  $("#pairingCard").addEventListener("click", () => showDetail("pairing", "profile"));
  $("#pairingToggle").addEventListener("change", (event) => {
    const on = event.target.checked;
    $("#advertisingStatus").textContent = on ? "Yes" : "No";
    $("#advertisingStatus").classList.toggle("ok", on);
    $("#pairingSummary").textContent = on ? "Advertising" : "Off";
    addBleLine(on ? "advertising started" : "advertising stopped");
  });
  $("#simulatePiCommand").addEventListener("click", () => {
    const command = currentRide ? "ride_stop" : "ride_start";
    $("#lastCommandStatus").textContent = command;
    $("#lastResponseStatus").textContent = currentRide ? "finish requested" : "ride id issued";
    addBleLine(`rx ${command} -> ok`);
    toast("Pi command received");
  });
  $("#chooseContactButton").addEventListener("click", () => toast("Contact selected"));
  $("#sheetCancel").addEventListener("click", closeSheet);
  $("#actionSheet").addEventListener("click", (event) => {
    if (event.target.id === "actionSheet") closeSheet();
  });
}

renderHazards();
renderRides();
renderBleLog();
attachEvents();
setTitle("map");
