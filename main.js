
let map;
let userMarker;
let userLat = null;
let userLng = null;

let pois = [
  { name: "Café Central", lat: 38.716, lng: -9.139 },
  { name: "Biblioteca", lat: 38.717, lng: -9.140 }
];

const overlay = document.getElementById("arOverlay");

// ================= MAP =================
function initMap() {
  map = L.map('map').setView([38.716, -9.139], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  pois.forEach(poi => {
    L.marker([poi.lat, poi.lng]).addTo(map)
      .bindPopup(poi.name);
  });
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
    const distance = getDistance(userLat, userLng, poi.lat, poi.lng);

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
