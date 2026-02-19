
let map;
let userMarker = null;  
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

    L.marker([poi.latitude, poi.longitude], { icon: poiIcon })
  .addTo(map)
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
  if (userMarker) {
  userMarker.setLatLng([latitude, longitude]);
} else {
  userMarker = L.marker([latitude, longitude], { icon: userIcon })
    .addTo(map)
    .bindPopup("Você está aqui")
    .openPopup();
}


  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      map.setView([latitude, longitude], 16);

      if (userMarker) {
        userMarker.setLatLng([latitude, longitude]);
      } else {
        userMarker = L.marker([latitude, longitude])
          .addTo(map)
          .bindPopup("Você está aqui")
          .openPopup();
      }

      updateAROverlay(latitude, longitude); // if using AR
    },
    (error) => {
      alert("Erro ao obter localização: " + error.message);
    }
  );
}

const userIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149060.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const poiIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});


function updateAR() {

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      updateAROverlay(latitude, longitude);
      map.setView([latitude, longitude], 16);

      if (userMarker) {
        userMarker.setLatLng([latitude, longitude]);
      } else {
        userMarker = L.marker([latitude, longitude])
          .addTo(map)
          .bindPopup("Você está aqui")
          .openPopup();
      }
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
      video: { facingMode: { ideal: "environment" } },
      audio: false
    });
    const video = document.getElementById("camera");
    video.srcObject = stream;
    video.play();
  } catch (err) {
    console.warn("Câmara indisponível:", err.message);
    alert("Erro ao acessar a câmera. Verifique as permissões e tente novamente.");
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
function updateAROverlay(userLat, userLng) {
  const overlay = document.getElementById("arOverlay");
  overlay.innerHTML = ""; // clear previous dots

  pois.forEach((poi) => {
    const distance = getDistance(userLat, userLng, poi.lat, poi.lng);
    if (distance <= 100) {
      const dot = document.createElement("div");
      dot.className = "ar-dot";


      dot.style.left = "50%";
      dot.style.top = "40%";
      dot.textContent = poi.name;
      overlay.appendChild(dot);
    }
  });
}


// ================= INITIALIZATION =================
document.addEventListener("DOMContentLoaded", () => {
  // Start button: hides home screen and starts app
  document.getElementById("startBtn").addEventListener("click", () => {
    document.getElementById("homeScreen").style.display = "none";
    alert("🚀 Aplicação iniciada!");
    locateUser();
    startCamera();
  });

document.getElementById("locateBtn").addEventListener("click", () => {
  if (userMarker && map) {
    const latlng = userMarker.getLatLng();
    map.setView(latlng, 16);
    userMarker.openPopup();
  } else {
    locateUser(); // fallback if marker doesn't exist yet
  }
});



  // Optional: toggle view, show POIs, etc.
  document.getElementById("toggleViewBtn").addEventListener("click", () => {
    toggleView();
  });

document.getElementById("showPOIsBtn").addEventListener("click", () => {
  if (!map || !pois || pois.length === 0) {
    alert("Nenhum POI disponível.");
    return;
  }

  const bounds = L.latLngBounds(pois.map(poi => [poi.latitude, poi.longitude]));
  map.fitBounds(bounds, { padding: [50, 50] });
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
