import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Supabase setup
const supabase = createClient(
  "https://fzdqeiwbhtdliqcxxlxr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6ZHFlaXdiaHRkbGlxY3h4bHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MTM1MjAsImV4cCI6MjA4NjE4OTUyMH0.LTQxMdooIn2trUbbyBE9jxN940utk8Yr_SptsZWBBt8"
);
window.supabase = supabase;

// Debug overlay helper
const logDebug = (msg) => {
  const el = document.getElementById("debug-overlay");
  if (el) {
    el.textContent += `\n[${new Date().toLocaleTimeString()}] ${msg}`;
    el.scrollTop = el.scrollHeight;
  } else {
    console.log(msg);
  }
};

window.addEventListener("DOMContentLoaded", () => {
  logDebug("DOM carregado. A iniciar...");

  scene.addEventListener("camera-init-error", (e) => {
  logDebug("Erro ao iniciar a câmara. Verifica permissões e HTTPS.");
  alert("Erro ao aceder à câmara. Verifica se deste permissão ao navegador.");
});


  const startButton = document.getElementById("start-button");
  const toggleViewButton = document.getElementById("toggle-view");
  const centerMapButton = document.getElementById("center-map");
  const mapView = document.getElementById("map-view");
  const viewPOIsButton = document.getElementById("view-pois");
  const switchModeButton = document.getElementById("switch-mode");
  const scene = document.querySelector("a-scene");
  let isARMode = false;

  if (scene) scene.setAttribute("visible", "false");

  if (startButton) {
    startButton.addEventListener("click", () => {
      logDebug("Botão Start clicado!");
      startButton.style.display = "none";
      if (toggleViewButton) toggleViewButton.style.display = "block";
      if (centerMapButton) centerMapButton.style.display = "block";
      if (viewPOIsButton) viewPOIsButton.style.display = "block";
      if (switchModeButton) switchModeButton.style.display = "block";
      fetchPOIs();
      if (scene) scene.setAttribute("visible", "true");
    });
  }

  if (toggleViewButton) {
    toggleViewButton.addEventListener("click", () => {
      const isMapVisible = mapView.style.display === "block";
      mapView.style.display = isMapVisible ? "none" : "block";
      if (scene) scene.setAttribute("visible", isMapVisible ? "true" : "false");
      toggleViewButton.textContent = isMapVisible ? "Mapa" : "AR";
      if (!window._leafletMap && !isMapVisible) {
        window._leafletMap = L.map("map-view").setView([65.0121, 25.4682], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors"
        }).addTo(window._leafletMap);
        logDebug("Mapa inicializado.");
        fetchPOIs();
      } else if (window._leafletMap) {
        window._leafletMap.invalidateSize();
        logDebug("Mapa mostrado.");
      }
    });
  }

  if (centerMapButton) {
    centerMapButton.addEventListener("click", () => {
      if (!window._leafletMap) return logDebug("Mapa ainda não foi inicializado.");
      if (!navigator.geolocation) return logDebug("Geolocalização não suportada.");
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const { latitude, longitude } = coords;
          window._leafletMap.setView([latitude, longitude], 15);
          logDebug(`Mapa centrado em (${latitude.toFixed(5)}, ${longitude.toFixed(5)}).`);
          if (window._userLocationMarker) window._leafletMap.removeLayer(window._userLocationMarker);
          window._userLocationMarker = L.circle([latitude, longitude], {
            radius: 10,
            color: "#007aff",
            fillColor: "#007aff",
            fillOpacity: 0.8
          }).addTo(window._leafletMap);
        },
        (err) => logDebug(`Erro ao obter localização: ${err.message}`),
        { enableHighAccuracy: true }
      );
    });
  }

  if (viewPOIsButton) {
    viewPOIsButton.addEventListener("click", () => {
      if (!window._leafletMap || !window._poisData?.length) {
        logDebug("POIs não disponíveis ou mapa não inicializado.");
        return;
      }
      const bounds = L.latLngBounds(window._poisData.map(poi => [poi.latitude, poi.longitude]));
      window._leafletMap.fitBounds(bounds, { padding: [50, 50] });
      logDebug("Mapa ajustado para mostrar todos os POIs.");
    });
  }

  if (switchModeButton) {
    switchModeButton.addEventListener("click", () => {
      isARMode = !isARMode;
      switchModeButton.textContent = isARMode ? "Modo: AR" : "Modo: 3D";

      if (isARMode) {
        scene.setAttribute("arjs", "sourceType: webcam; debugUIEnabled: false;");
        scene.querySelector("a-camera").setAttribute("gps-new-camera", "");
        logDebug("Modo AR ativado.");
      } else {
        scene.removeAttribute("arjs");
        scene.querySelector("a-camera").removeAttribute("gps-new-camera");
        logDebug("Modo 3D ativado.");
      }

      scene.querySelectorAll("a-box, a-text, a-entity[gps-entity-place]").forEach(el => el.remove());
      fetchPOIs();
    });
  }

  async function fetchPOIs() {
    const { data, error } = await supabase.from("pois").select("*");
    logDebug("A buscar POIs da base de dados...");
    if (error) return logDebug(`Erro ao buscar POIs: ${error.message}`);
    if (!data?.length) return logDebug("Nenhum POI encontrado.");
    logDebug(`POIs carregados: ${data.length}`);
    window._poisData = data;

    if (!scene) return logDebug("Erro: <a-scene> não encontrado.");

    data.forEach((poi, index) => {
      if (!poi.latitude || !poi.longitude) {
        logDebug(`POI inválido: ${JSON.stringify(poi)}`);
        return;
      }

      logDebug(`Renderizando POI: ${poi.name} (${poi.latitude}, ${poi.longitude})`);

      if (isARMode) {
        const entity = document.createElement("a-entity");
        entity.setAttribute("gps-entity-place", `latitude: ${poi.latitude}; longitude: ${poi.longitude}`);
        entity.setAttribute("geometry", "primitive: box; height: 1; width: 1; depth: 1");
        entity.setAttribute("material", "color: red");
        entity.setAttribute("look-at", "[gps-new-camera]");
        entity.classList.add("clickable");
        scene.appendChild(entity);
      } else {
        const x = index * 3 - 5;
        const z = -5;
        const box = document.createElement("a-box");
        box.setAttribute("position", `${x} 1 ${z}`);
        box.setAttribute("color", "red");
        box.setAttribute("depth", "1");
        box.setAttribute("height", "1");
        box.setAttribute("width", "1");
        scene.appendChild(box);

        const label = document.createElement("a-text");
        label.setAttribute("value", poi.name || "POI");
        label.setAttribute("position", `${x} 2 ${z}`);
        label.setAttribute("align", "center");
        label.setAttribute("color", "white");
        scene.appendChild(label);
      }

      if (window._leafletMap) {
        const circle = L.circleMarker([poi.latitude, poi.longitude], {
          radius: 6,
          color: "red",
          fillColor: "red",
          fillOpacity: 0.9
        }).addTo(window._leafletMap);

        const popupContent = `<strong>${poi.name || "POI"}</strong><br>${poi.description || ""}`;
        circle.bindPopup(popupContent);
        logDebug(`Marcador adicionado: ${poi.name || "POI"} (${poi.latitude}, ${poi.longitude})`);
      }
    });

    if (window._leafletMap && data.length > 0) {
      const bounds = L.latLngBounds(data.map(poi => [poi.latitude, poi.longitude]));
      window._leafletMap.fitBounds(bounds, { padding: [50, 50] });
    }
  }
});
