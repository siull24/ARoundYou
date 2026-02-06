import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Supabase setup
const supabase = createClient(
  "https://ikoztmugtdfgsoplodvw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlrb3p0bXVndGRmZ3NvcGxvZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTMyMzEsImV4cCI6MjA4NTY4OTIzMX0.H-RgSdwBrAA0mDUWGTKa-I9tc6_sVWqm6882Yys3Nu8"
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

  const startButton = document.getElementById("start-button");
  const toggleViewButton = document.getElementById("toggle-view");
  const centerMapButton = document.getElementById("center-map");
  const mapView = document.getElementById("map-view");
  const viewPOIsButton = document.getElementById("view-pois");
  const scene = document.querySelector("a-scene");

    if (viewPOIsButton) {
    viewPOIsButton.addEventListener("click", () => {
        if (!window._leafletMap || !window._poisData || window._poisData.length === 0) {
        logDebug("POIs não disponíveis ou mapa não inicializado.");
        return;
        }

        const bounds = L.latLngBounds(window._poisData.map(poi => [poi.latitude, poi.longitude]));
        window._leafletMap.fitBounds(bounds, { padding: [50, 50] });
        logDebug("Mapa ajustado para mostrar todos os POIs.");
    });
    }


  console.log("Start:", startButton);
  console.log("Toggle View:", toggleViewButton);
  console.log("Center Map:", centerMapButton);
  console.log("Scene:", scene);

  if (scene) {
    scene.setAttribute("visible", "false");
  }

  if (startButton) {
    startButton.addEventListener("click", () => {
      logDebug("Botão Start clicado!");

      startButton.style.display = "none";
      if (toggleViewButton) toggleViewButton.style.display = "block";
      if (centerMapButton) centerMapButton.style.display = "block";
      if (viewPOIsButton) viewPOIsButton.style.display = "block";


      fetchPOIs();

      if (scene) scene.setAttribute("visible", "true");
    });
  }

  if (toggleViewButton) {
    toggleViewButton.addEventListener("click", () => {
      const isMapVisible = mapView.style.display === "block";

      if (isMapVisible) {
        mapView.style.display = "none";
        if (scene) scene.setAttribute("visible", "true");
        toggleViewButton.textContent = "Mapa";
        logDebug("Vista AR ativada.");
      } else {
        mapView.style.display = "block";
        if (scene) scene.setAttribute("visible", "false");
        toggleViewButton.textContent = "AR";


        if (!window._leafletMap) {
          window._leafletMap = L.map("map-view").setView([65.0121, 25.4682], 13);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors"
          }).addTo(window._leafletMap);
          logDebug("Mapa inicializado.");

          fetchPOIs();

        } else {
          window._leafletMap.invalidateSize();
          logDebug("Mapa mostrado.");
        }
      }
    });
  }

  if (centerMapButton) {
    centerMapButton.addEventListener("click", () => {
      if (!window._leafletMap) {
        logDebug("Mapa ainda não foi inicializado.");
        return;
      }

      if (!navigator.geolocation) {
        logDebug("Geolocalização não suportada pelo navegador.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          window._leafletMap.setView([latitude, longitude], 15);
          logDebug(`Mapa centrado em (${latitude.toFixed(5)}, ${longitude.toFixed(5)}).`);

          if (window._userLocationMarker) {
            window._leafletMap.removeLayer(window._userLocationMarker);
          }

          window._userLocationMarker = L.circle([latitude, longitude], {
            radius: 10,
            color: "#007aff",
            fillColor: "#007aff",
            fillOpacity: 0.8
          }).addTo(window._leafletMap);
        },
        (err) => {
          logDebug(`Erro ao obter localização: ${err.message}`);
        },
        { enableHighAccuracy: true }
      );
    });
  }

  // Função para buscar e renderizar POIs
  async function fetchPOIs() {
    const { data, error } = await supabase.from("pois").select("*");
    logDebug("A buscar POIs da base de dados...");
    console.log("Dados recebidos:", data);



    if (error) {
      logDebug(`Erro ao buscar POIs: ${error.message}`);
      return;
    }

    if (!data || data.length === 0) {
      logDebug("Nenhum POI encontrado na base de dados.");
      return;
    }

    logDebug(`POIs carregados: ${data.length}`);
    window._poisData = data;


    if (!scene) {
      logDebug("Erro: <a-scene> não encontrado.");
      return;
    }

    data.forEach((poi) => {
      if (!poi.latitude || !poi.longitude) {
        logDebug(`POI inválido: ${JSON.stringify(poi)}`);
        return;
      }
        logDebug(`Renderizando POI: ${poi.name} (${poi.latitude}, ${poi.longitude})`);
        logDebug(`Marcador renderizado para: ${poi.name}`);

      // === AR ===
      const entity = document.createElement("a-entity");
      entity.setAttribute("gps-entity-place", `latitude: ${poi.latitude}; longitude: ${poi.longitude}`);
      entity.setAttribute("geometry", "primitive: box; height: 1; width: 1; depth: 1");
      entity.setAttribute("material", "color: red");
      entity.setAttribute("look-at", "[gps-new-camera]");
      entity.classList.add("clickable");
      scene.appendChild(entity);

      // === MAPA ===
      if (window._leafletMap) {
        const circle = L.circleMarker([poi.latitude, poi.longitude], {
            radius: 6,
            color: "red",
            fillColor: "red",
            fillOpacity: 0.9
            }).addTo(window._leafletMap);

        const popupContent = `
            <strong>${poi.name || "POI"}</strong><br>
            ${poi.description || ""}
            `;
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
