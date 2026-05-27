import {
  bearingBetween,
  compassPoint,
  formatDistance,
  headingFromOrientation,
  nearestStores,
  normalizeDegrees
} from "./geo.js";

const STORE_DATA_URL = "./data/systembolaget-stores.json";
const APP_VERSION = "gps-v2";

const elements = {
  statusText: document.querySelector("#statusText"),
  needle: document.querySelector("#needle"),
  distanceValue: document.querySelector("#distanceValue"),
  directionValue: document.querySelector("#directionValue"),
  storeName: document.querySelector("#storeName"),
  storeMeta: document.querySelector("#storeMeta"),
  bearingValue: document.querySelector("#bearingValue"),
  headingValue: document.querySelector("#headingValue"),
  accuracyValue: document.querySelector("#accuracyValue"),
  locateButton: document.querySelector("#locateButton"),
  compassButton: document.querySelector("#compassButton"),
  mapsButton: document.querySelector("#mapsButton"),
  nearbyList: document.querySelector("#nearbyList"),
  gpsPanel: document.querySelector("#gpsPanel"),
  sourceText: document.querySelector("#sourceText")
};

const state = {
  stores: [],
  source: null,
  position: null,
  accuracy: null,
  heading: null,
  nearest: [],
  watchId: null
};

function setStatus(message, tone = "") {
  elements.statusText.textContent = message;
  elements.statusText.className = `status-pill ${tone}`.trim();
}

function setGpsPanel(message, tone = "") {
  elements.gpsPanel.textContent = message;
  elements.gpsPanel.className = `gps-panel ${tone}`.trim();
}

function formatDegrees(value) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return `${Math.round(normalizeDegrees(value))} deg`;
}

function storeAddress(store) {
  return [store.address, store.city].filter(Boolean).join(", ");
}

function createNearbyItem(store, index) {
  const item = document.createElement("li");
  const title = document.createElement("strong");
  const meta = document.createElement("span");

  item.className = "nearby-item";
  title.textContent = `${index + 1}. ${store.name}`;
  meta.textContent = `${formatDistance(store.distance)} - ${compassPoint(store.bearing)} - ${storeAddress(store)}`;
  item.append(title, meta);

  return item;
}

function renderNearby() {
  elements.nearbyList.replaceChildren();

  if (!state.nearest.length) {
    return;
  }

  elements.nearbyList.append(...state.nearest.map(createNearbyItem));
}

function renderCurrentStore() {
  const nearest = state.nearest[0];

  if (!nearest || !state.position) {
    elements.distanceValue.textContent = "--";
    elements.directionValue.textContent = "Waiting for location";
    elements.storeName.textContent = "Location needed";
    elements.storeMeta.textContent = "GPS chooses from local store data.";
    elements.bearingValue.textContent = "--";
    elements.headingValue.textContent = state.heading == null ? "--" : formatDegrees(state.heading);
    elements.accuracyValue.textContent = "--";
    elements.mapsButton.disabled = true;
    return;
  }

  const absoluteBearing = bearingBetween(state.position, { lat: nearest.lat, lng: nearest.lng });
  const needleAngle = state.heading == null
    ? absoluteBearing
    : normalizeDegrees(absoluteBearing - state.heading);

  document.documentElement.style.setProperty("--needle-angle", `${needleAngle}deg`);
  elements.distanceValue.textContent = formatDistance(nearest.distance);
  elements.directionValue.textContent = `${compassPoint(absoluteBearing)} toward ${nearest.name}`;
  elements.storeName.textContent = nearest.name;
  elements.storeMeta.textContent = storeAddress(nearest);
  elements.bearingValue.textContent = formatDegrees(absoluteBearing);
  elements.headingValue.textContent = state.heading == null ? "--" : formatDegrees(state.heading);
  elements.accuracyValue.textContent = state.accuracy == null ? "--" : `${Math.round(state.accuracy)} m`;
  elements.mapsButton.disabled = false;
}

function render() {
  renderCurrentStore();
  renderNearby();
}

function updatePosition(coords) {
  state.position = {
    lat: coords.latitude,
    lng: coords.longitude
  };
  state.accuracy = coords.accuracy;
  state.nearest = nearestStores(state.position, state.stores, 3);
  setStatus("GPS locked");
  setGpsPanel(
    `GPS fixed at ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)} with ${Math.round(coords.accuracy ?? 0)} m accuracy.`,
    "good"
  );
  render();
}

function handleGeoSuccess(position) {
  updatePosition(position.coords);
}

function handleGeoError(error) {
  const messages = {
    1: "GPS denied",
    2: "GPS unavailable",
    3: "GPS timeout"
  };
  const details = {
    1: "Location permission was denied. In iPhone Settings, allow Safari or this Home Screen app to use location.",
    2: "iPhone could not return a position. Check Location Services and try outside/near a window.",
    3: "iPhone did not return a position in time. Try again with a clearer signal."
  };

  setStatus(messages[error.code] ?? "GPS error", "bad");
  setGpsPanel(error.message || details[error.code] || "iPhone did not return GPS coordinates.", "bad");
}

function geoOptions() {
  return {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 20000
  };
}

function startLocationWatchAfterFix() {
  if (state.watchId != null) {
    navigator.geolocation.clearWatch(state.watchId);
  }

  state.watchId = navigator.geolocation.watchPosition(handleGeoSuccess, handleGeoError, {
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 30000
  });
}

function startLocationWatch() {
  if (!("geolocation" in navigator)) {
    setStatus("No GPS support", "bad");
    setGpsPanel("This browser does not expose geolocation.", "bad");
    return;
  }

  if (!window.isSecureContext) {
    setStatus("HTTPS needed", "warn");
    setGpsPanel("GPS only works from HTTPS or localhost. Use the GitHub Pages URL on iPhone.", "warn");
    return;
  }

  setStatus("Requesting GPS...", "warn");
  setGpsPanel("Waiting for iPhone location permission and first GPS fix...", "warn");
  elements.locateButton.disabled = true;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      elements.locateButton.disabled = false;
      handleGeoSuccess(position);
      startLocationWatchAfterFix();
    },
    (error) => {
      elements.locateButton.disabled = false;
      handleGeoError(error);
    },
    geoOptions()
  );
}

function applyHeading(event) {
  const heading = headingFromOrientation(event);

  if (heading == null) {
    return;
  }

  state.heading = heading;
  setStatus(state.position ? "Compass live" : "Compass ready");
  render();
}

async function requestCompass() {
  if (!window.isSecureContext) {
    setStatus("HTTPS needed", "warn");
    return;
  }

  if (!window.DeviceOrientationEvent) {
    setStatus("No compass", "bad");
    return;
  }

  try {
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      const permission = await DeviceOrientationEvent.requestPermission();

      if (permission !== "granted") {
        setStatus("Compass denied", "bad");
        return;
      }
    }

    window.addEventListener("deviceorientation", applyHeading, true);
    window.addEventListener("deviceorientationabsolute", applyHeading, true);
    setStatus("Compass ready");
  } catch {
    setStatus("Compass error", "bad");
  }
}

function openMaps() {
  const nearest = state.nearest[0];

  if (!nearest) {
    return;
  }

  const label = encodeURIComponent(`Systembolaget ${nearest.name}`);
  const destination = `${nearest.lat},${nearest.lng}`;
  window.open(`https://maps.apple.com/?daddr=${destination}&q=${label}`, "_blank", "noopener,noreferrer");
}

function hydrateFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    updatePosition({ latitude: lat, longitude: lng, accuracy: 0 });
  }
}

async function loadStores() {
  const response = await fetch(STORE_DATA_URL, { cache: "no-cache" });

  if (!response.ok) {
    throw new Error(`Could not load stores: ${response.status}`);
  }

  const data = await response.json();
  state.stores = data.stores;
  state.source = data.source;
  elements.sourceText.textContent = `${data.stores.length} stores - source ${data.source.sourceUpdatedAt.slice(0, 10)}`;

  if (state.position) {
    state.nearest = nearestStores(state.position, state.stores, 3);
  }
}

function bindControls() {
  elements.locateButton.addEventListener("click", startLocationWatch);
  elements.compassButton.addEventListener("click", requestCompass);
  elements.mapsButton.addEventListener("click", openMaps);
}

async function registerServiceWorker() {
  if ("serviceWorker" in navigator && window.isSecureContext) {
    const registration = await navigator.serviceWorker.register(`./service-worker.js?v=${APP_VERSION}`);
    await registration.update();
  }
}

async function init() {
  bindControls();

  try {
    await loadStores();
    hydrateFromQuery();
    render();
    await registerServiceWorker();
  } catch (error) {
    console.error(error);
    setStatus("Store data error", "bad");
    elements.sourceText.textContent = "Store data failed to load";
  }
}

init();
