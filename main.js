
let map;
let userMarker;
let userLat = null;
let userLng = null;

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://fzdqeiwbhtdliqcxxlxr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6ZHFlaXdiaHRkbGlxY3h4bHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MTM1MjAsImV4cCI6MjA4NjE4OTUyMH0.LTQxMdooIn2trUbbyBE9jxN940utk8Yr_SptsZWBBt8"
);



let pois = [];

async function fetchPOIs() {
  const { data, error } = await supabase.from("pois").select("*");
  if (error) {
    console.error("Erro ao buscar POIs:", error.message);
    return;
  }
  pois = data;
  renderPOIsOnMap();
  updateAR();
}

function renderPOIsOnMap() {
  pois.forEach(poi => {
    if (!poi.latitude || !poi.longitude) return;

    L.marker([poi.latitude, poi.longitude]).addTo(map)
      .bindPopup(`<strong>${poi.name}</strong><br>${poi.description || ""}`);
  });
}



const overlay = document.getElementById("arOverlay");

// ================= MAP =================
function initMap() {
  const mapContainer = document.getElementById("map");


  if (map) {
    map.remove();
    map = null;
    mapContainer.innerHTML = "";
  }

  map = L.map(mapContainer, {
    center: [38.716, -9.139],
    zoom: 15,
    minZoom: 10,
    maxZoom: 18
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  fetchPOIs();
}


// ================= GEOLOCATION =================
function locateUser() {
  if (!navigator.geolocation) {
    alert("Geolocalização não suportada pelo navegador.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      map.setView([latitude, longitude], 16);
      L.marker([latitude, longitude]).addTo(map).bindPopup("Você está aqui").openPopup();
    },
    (error) => {
      alert("Erro ao obter localização: " + error.message);
    }
  );
}


// ================= CAMERA =================
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });
    document.getElementById("camera").srcObject = stream;
  } catch (err) {
    console.warn("Câmara indisponível:", err.message);
    // Still allow AR view to be shown
  }
  document.getElementById("cameraError").classList.remove("hidden");
}


// ================= DISTANCE =================
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a =
    Math.sin(Δφ/2) * Math.sin(Δφ/2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

// ================= AR OVERLAY =================
function updateAR() {

  if (!userLat || !userLng) return;

  overlay.innerHTML = "";

  pois.forEach(poi => {
    const distance = getDistance(userLat, userLng, poi.latitude, poi.longitude);

    if (distance <= 100) {
      const dot = document.createElement("div");
      dot.className = "ar-dot";


      dot.style.left = "50%";
      dot.style.top = "40%";

      dot.onclick = () => {
        alert(poi.name + "\nDistância: " + Math.round(distance) + " metros");
      };

      overlay.appendChild(dot);
    }
  });
}

// ================= INITIALIZATION =================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("locateBtn").addEventListener("click", locateUser);



  document.getElementById("startBtn").addEventListener("click", () => {
  alert("🚀 Aplicação iniciada!");
  locateUser();
  startCamera();
});

document.getElementById("locateBtn").addEventListener("click", () => {
  locateUser();
});



  initMap();
  startCamera();

  document.getElementById("toggleViewBtn").addEventListener("click", () => {
  const mapEl = document.getElementById("map");
  const camEl = document.getElementById("cameraContainer");
  const modeIndicator = document.getElementById("modeIndicator");

  const mapVisible = !mapEl.classList.contains("hidden");

  if (mapVisible) {
    mapEl.classList.add("hidden");
    camEl.classList.remove("hidden");
    if (modeIndicator) modeIndicator.textContent = "📷 Modo: AR";
  } else {
    camEl.classList.add("hidden");
    mapEl.classList.remove("hidden");
    if (modeIndicator) modeIndicator.textContent = "🗺️ Modo: Mapa";
  }
});


if (!map) {
  console.error("Map is not initialized yet.");
  return;
}


});
