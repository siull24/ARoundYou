import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://ikoztmugtdfgsoplodvw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlrb3p0bXVndGRmZ3NvcGxvZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTMyMzEsImV4cCI6MjA4NTY4OTIzMX0.H-RgSdwBrAA0mDUWGTKa-I9tc6_sVWqm6882Yys3Nu8"
);

const logDebug = (msg) => {
  const el = document.getElementById("debug-overlay");
  el.textContent += `\n[${new Date().toLocaleTimeString()}] ${msg}`;
  el.scrollTop = el.scrollHeight;
};

const toggleBtn = document.getElementById("toggle-view");
const centerBtn = document.getElementById("center-map");
const mapView = document.getElementById("map-view");
const scene = document.getElementById("ar-scene");
let inAR = true;
let leafletMap = null;
let userMarker = null;
let cameraOn = true;

function toggleCamera() {
  const arSystem = scene.systems["arjs"];
  if (!arSystem || !arSystem._arSession?.arSource?.video) return;

  const stream = arSystem._arSession.arSource.video.srcObject;
  if (!stream) return;

  if (cameraOn) {
    stream.getTracks().forEach(track => track.stop());
    logDebug("📴 Camera turned OFF");
  } else {
    arSystem._arSession.arSource.start().then(() => {
      logDebug("📹 Camera turned ON");
    });
  }

  cameraOn = !cameraOn;
}

// 👇 Isto deve vir depois da definição da função
window.toggleCamera = toggleCamera;



toggleBtn.addEventListener("click", () => {
  inAR = !inAR;
  centerBtn.style.display = inAR ? "none" : "block";

  if (inAR) {
    mapView.style.display = "none";
    scene.setAttribute("visible", "true");
    toggleBtn.textContent = "Mapa";
    logDebug("🔄 Switched to AR view");
  } else {
    scene.setAttribute("visible", "false");
    mapView.style.display = "block";
    toggleBtn.textContent = "AR";
    logDebug("🗺️ Switched to Map view");
  }
});

centerBtn.addEventListener("click", () => {
  if (userMarker && leafletMap) {
    leafletMap.setView(userMarker.getLatLng(), 15);
    logDebug("🎯 Centered map on user location");
  } else {
    logDebug("⚠️ Cannot center map: user location not available yet");
  }
});

document.getElementById("start-button").addEventListener("click", async () => {
  document.getElementById("start-button").style.display = "none";
  logDebug("▶️ Start button clicked");

  if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
    try {
      const response = await DeviceMotionEvent.requestPermission();
      if (response === "granted") {
        logDebug("📱 Motion permission granted");
      }
    } catch (e) {
      logDebug("❌ Motion permission error: " + e.message);
    }
  }

  try {
    await navigator.mediaDevices.getUserMedia({ video: true });
    logDebug("📹 Camera stream acquired");
  } catch (err) {
    logDebug("❌ Camera error: " + err.message);
  }

  scene.setAttribute("visible", "true");
  logDebug("🟢 AR scene made visible");

  const arSystem = scene.systems["arjs"];
  if (arSystem && arSystem._arSession?.arSource) {
    arSystem._arSession.arSource.onResizeElement();
    arSystem._arSession.arSource.copyElementSizeTo(scene.canvas);
    logDebug("🔧 AR.js video source resized");
  }

  toggleBtn.style.display = "block";

  setTimeout(() => {
  mapView.style.display = "block";

  leafletMap = L.map("leaflet-map").setView([65.0121, 25.4682], 15);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(leafletMap);
  userMarker = L.marker([65.0121, 25.4682]).addTo(leafletMap);

  setTimeout(() => {
    if (leafletMap) {
      leafletMap.invalidateSize();
    }
    mapView.style.display = "none";
    logDebug("🗺️ Leaflet map initialized");
  }, 200);

}, 1000);

    const { data: pois, error } = await supabase.from("pois").select("*");
    if (error) {
        logDebug("❌ Supabase error: " + error.message);
        return;
    }
    logDebug(`✅ Fetched ${pois.length} POIs from Supabase`);
    pois.forEach((poi) => {
        addPOIToScene(poi, scene);
    });
    logDebug("📍 POIs added to AR scene");
});

function addPOIToScene(poi, scene) {
  const entity = document.createElement("a-entity");
  entity.setAttribute("gps-new-entity-place", {
    latitude: poi.latitude,
    longitude: poi.longitude,
  });
  entity.setAttribute("look-at", "[gps-new-camera]");
  entity.setAttribute("text", {
    value: `${poi.name}\nCalculando...`,
    align: "center",
    color: "red",
    width: 6,
  });
  entity.setAttribute("scale", "20 20 20");
  entity.addEventListener("gps-entity-place-update-position", (e) => {
    const distance = e.detail.distance;
    const label = `${poi.name}\n${Math.round(distance)}m`;
    entity.setAttribute("text", "value", label);
  });
  scene.appendChild(entity);
}

AFRAME.registerComponent("camera-debug", {
  init: function () {
    logDebug("📷 Camera component initialized");
    this.el.addEventListener("loaded", () => {
      logDebug("📷 Camera loaded");
    });
  },
});

const cam = document.querySelector("a-camera");
if (cam) {
  cam.setAttribute("camera-debug", "");
} else {
  logDebug("❌ <a-camera> not found");
}

const gps = document.querySelector("[gps-new-camera]");
if (gps) {
  gps.addEventListener("gps-camera-update-position", (e) => {
    const { position } = e.detail;
    logDebug(`📍 GPS position: lat=${position.latitude}, lon=${position.longitude}`);

    const label = document.getElementById("user-location-label");
    if (label) {
      label.setAttribute("text", "value", `📍 You\n${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}`);
    }

    if (leafletMap && userMarker) {
      userMarker.setLatLng([position.latitude, position.longitude]);
      leafletMap.panTo([position.latitude, position.longitude]);
    }
  });
} else {
  logDebug("⚠️ gps-new-camera not found");
  window.toggleCamera = toggleCamera;
}
