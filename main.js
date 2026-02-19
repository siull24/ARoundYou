
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

  // Se o mapa já estiver inicializado, remove-o corretamente
  if (map) {
    map.remove();
    map = null;
    mapContainer.innerHTML = ""; // limpa o conteúdo do div
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
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(position => {
      userLat = position.coords.latitude;
      userLng = position.coords.longitude;

      if (!userMarker) {
        userMarker = L.marker([userLat, userLng]).addTo(map)
          .bindPopup("Você está aqui");
      } else {
        userMarker.setLatLng([userLat, userLng]);
      }

      map.setView([userLat, userLng], 16);
      updateAR();
    });
  }
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
    alert("Erro ao aceder à câmara: " + err);
  }
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

    if (distance <= 100) { // 👈 só aparece até 100m

      const dot = document.createElement("div");
      dot.className = "ar-dot";

      // posição simples centrada (pode evoluir depois com bússola)
      dot.style.left = "50%";
      dot.style.top = "40%";

      dot.onclick = () => {
        alert(poi.name + "\nDistância: " + Math.round(distance) + " metros");
      };

      overlay.appendChild(dot);
    }
  });
}

document.getElementById("locateBtn").addEventListener("click", locateUser);

initMap();
startCamera();
