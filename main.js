import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://fzdqeiwbhtdliqcxxlxr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6ZHFlaXdiaHRkbGlxY3h4bHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MTM1MjAsImV4cCI6MjA4NjE4OTUyMH0.LTQxMdooIn2trUbbyBE9jxN940utk8Yr_SptsZWBBt8"
);

let userLat = 0;
let userLon = 0;
let deviceHeading = 0;
let map;
let poisData = [];

const startButton = document.getElementById("start-button");
const switchModeButton = document.getElementById("switch-mode");
const centerMapButton = document.getElementById("center-map");
const viewPOIsButton = document.getElementById("view-pois");

const cameraPreview = document.getElementById("camera-preview");
const arContainer = document.getElementById("ar-container");
const overlay = document.getElementById("ar-overlay");
const mapView = document.getElementById("map-view");

startButton.addEventListener("click", async () => {

  startButton.style.display = "none";
  switchModeButton.classList.remove("hidden");
  centerMapButton.classList.remove("hidden");
  viewPOIsButton.classList.remove("hidden");

  initMap();
  fetchPOIs();
  startLocationTracking();
  startOrientationTracking();
});

switchModeButton.addEventListener("click", async () => {

  const isMapVisible = !mapView.classList.contains("hidden");

  if (isMapVisible) {
    // Switch to AR
    mapView.classList.add("hidden");
    arContainer.style.display = "block";
    switchModeButton.textContent = "Modo: Mapa";

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });
    cameraPreview.srcObject = stream;

  } else {
    // Switch to Map
    arContainer.style.display = "none";
    mapView.classList.remove("hidden");
    switchModeButton.textContent = "Modo: Câmara";
  }
});

function initMap() {

  mapView.classList.remove("hidden");

  map = L.map("map-view").setView([65.0121, 25.4682], 13);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution: "© OpenStreetMap & CARTO"
  }).addTo(map);
}

async function fetchPOIs() {

  const { data } = await supabase.from("pois").select("*");
  poisData = data || [];

  poisData.forEach(poi => {
    if (!poi.latitude || !poi.longitude) return;

    L.circleMarker([poi.latitude, poi.longitude], {
      radius: 6,
      color: "red"
    }).addTo(map).bindPopup(poi.name || "POI");
  });
}

centerMapButton.addEventListener("click", () => {

  navigator.geolocation.getCurrentPosition(pos => {
    userLat = pos.coords.latitude;
    userLon = pos.coords.longitude;

    map.setView([userLat, userLon], 16);

    L.circle([userLat, userLon], {
      radius: 10,
      color: "blue"
    }).addTo(map);
  });
});

viewPOIsButton.addEventListener("click", () => {
  if (!poisData.length) return;

  const bounds = L.latLngBounds(poisData.map(p => [p.latitude, p.longitude]));
  map.fitBounds(bounds);
});

function startLocationTracking() {
  navigator.geolocation.watchPosition(pos => {
    userLat = pos.coords.latitude;
    userLon = pos.coords.longitude;
    renderAR();
  }, null, { enableHighAccuracy: true });
}

function startOrientationTracking() {
  if (typeof DeviceOrientationEvent.requestPermission === "function") {
    DeviceOrientationEvent.requestPermission();
  }

  window.addEventListener("deviceorientationabsolute", event => {
    if (event.alpha !== null) {
      deviceHeading = event.alpha;
      renderAR();
    }
  });
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat/2) ** 2 +
    Math.cos(lat1*Math.PI/180) *
    Math.cos(lat2*Math.PI/180) *
    Math.sin(dLon/2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

function getBearing(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  lat1 *= Math.PI / 180;
  lat2 *= Math.PI / 180;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function renderAR() {

  if (!poisData.length || arContainer.style.display === "none") return;

  overlay.innerHTML = "";

  poisData.forEach(poi => {

    const distance = getDistance(userLat, userLon, poi.latitude, poi.longitude);
    const bearing = getBearing(userLat, userLon, poi.latitude, poi.longitude);

    let relativeAngle = bearing - deviceHeading;
    if (relativeAngle < -180) relativeAngle += 360;
    if (relativeAngle > 180) relativeAngle -= 360;

    if (Math.abs(relativeAngle) < 30 && distance < 1000) {

      const x = (relativeAngle / 60) * overlay.offsetWidth + overlay.offsetWidth / 2;
      const y = overlay.offsetHeight / 2;

      const marker = document.createElement("div");
      marker.className = "ar-marker";
      marker.style.left = `${x}px`;
      marker.style.top = `${y}px`;
      marker.textContent = `${poi.name} (${Math.round(distance)}m)`;

      overlay.appendChild(marker);
    }
  });
}
