import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://fzdqeiwbhtdliqcxxlxr.supabase.co",
  "TUA_ANON_KEY_AQUI"
);

window.addEventListener("DOMContentLoaded", () => {

  const logDebug = (msg) => {
    const el = document.getElementById("debug-overlay");
    if (el) {
      el.textContent += `\n[${new Date().toLocaleTimeString()}] ${msg}`;
      el.scrollTop = el.scrollHeight;
    }
    console.log(msg);
  };

  const startButton = document.getElementById("start-button");
  const switchModeButton = document.getElementById("switch-mode");
  const cameraButton = document.getElementById("camera-button");

  const cameraPreview = document.getElementById("camera-preview");
  const mapView = document.getElementById("map-view");
  const arScene = document.getElementById("ar-scene");

  let map;
  let poisData = [];

  // =========================
  // MAPA
  // =========================

  function initMap() {
    mapView.style.display = "block";

    map = L.map("map-view").setView([65.0121, 25.4682], 13);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution: "&copy; OpenStreetMap &copy; CARTO"
      }
    ).addTo(map);
  }

  // =========================
  // BUSCAR POIs
  // =========================

  async function fetchPOIs() {
    logDebug("A carregar POIs...");

    const { data, error } = await supabase
      .from("pois")
      .select("*");

    if (error) {
      logDebug("Erro Supabase: " + error.message);
      return;
    }

    if (!data.length) {
      logDebug("Nenhum POI encontrado.");
      return;
    }

    poisData = data;

    data.forEach(poi => {
      if (!poi.latitude || !poi.longitude) return;

      L.circleMarker([poi.latitude, poi.longitude], {
        radius: 6,
        color: "red",
        fillColor: "red",
        fillOpacity: 0.9
      })
      .addTo(map)
      .bindPopup(`<strong>${poi.name || "POI"}</strong>`);
    });

    logDebug("POIs carregados com sucesso.");
  }

  // =========================
  // AR
  // =========================

  function createARPOIs() {

    arScene.querySelectorAll("a-entity").forEach(el => el.remove());

    poisData.forEach(poi => {
      if (!poi.latitude || !poi.longitude) return;

      const entity = document.createElement("a-entity");

      entity.setAttribute(
        "gps-entity-place",
        `latitude: ${poi.latitude}; longitude: ${poi.longitude};`
      );

      entity.setAttribute("look-at", "[gps-camera]");
      entity.setAttribute("text", {
        value: poi.name || "POI",
        color: "black",
        align: "center"
      });

      entity.setAttribute("scale", "20 20 20");

      arScene.appendChild(entity);
    });

    logDebug("POIs adicionados ao modo AR.");
  }

  // =========================
  // BOTÕES
  // =========================

  startButton.addEventListener("click", async () => {
    startButton.style.display = "none";
    switchModeButton.style.display = "inline-block";
    cameraButton.style.display = "inline-block";

    initMap();
    await fetchPOIs();
  });

  switchModeButton.addEventListener("click", async () => {

    const isCameraVisible = cameraPreview.style.display === "block";

    if (!isCameraVisible) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        cameraPreview.srcObject = stream;
      } catch (err) {
        logDebug("Erro ao aceder à câmara: " + err.message);
        return;
      }
    }

    cameraPreview.style.display = isCameraVisible ? "none" : "block";
    mapView.style.display = isCameraVisible ? "block" : "none";
    switchModeButton.textContent = isCameraVisible ? "Modo: Câmara" : "Modo: Mapa";
  });

  cameraButton.addEventListener("click", () => {
    arScene.style.display = "block";
    mapView.style.display = "none";
    cameraPreview.style.display = "none";

    createARPOIs();
  });

});
