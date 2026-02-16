import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://fzdqeiwbhtdliqcxxlxr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6ZHFlaXdiaHRkbGlxY3h4bHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MTM1MjAsImV4cCI6MjA4NjE4OTUyMH0.LTQxMdooIn2trUbbyBE9jxN940utk8Yr_SptsZWBBt8"
);
window.supabase = supabase;

window.addEventListener("DOMContentLoaded", () => {
  const logDebug = (msg) => {
    const el = document.getElementById("debug-overlay");
    if (el) {
      el.textContent += `\n[${new Date().toLocaleTimeString()}] ${msg}`;
      el.scrollTop = el.scrollHeight;
    } else {
      console.log(msg);
    }
  };

  logDebug("DOM carregado. A iniciar...");

  const startButton = document.getElementById("start-button");
  const toggleViewButton = document.getElementById("toggle-view");
  const centerMapButton = document.getElementById("center-map");
  const viewPOIsButton = document.getElementById("view-pois");
  const switchModeButton = document.getElementById("switch-mode");
  const cameraButton = document.getElementById("camera-button");

  const cameraPreview = document.getElementById("camera-preview");
  const mapView = document.getElementById("map-view");

  if (cameraPreview && mapView) {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false
        });
        cameraPreview.srcObject = stream;
        cameraPreview.style.display = "block";
        mapView.style.display = "none";
        logDebug("Câmara iniciada automaticamente ao carregar a página.");
      } catch (err) {
        logDebug("Permissão para a câmara negada ou erro: " + err.message);
        alert("O site precisa de permissão para aceder à câmara.");
        cameraPreview.style.display = "none";
        mapView.style.display = "block";
      }
    })();
  } else {
    logDebug("Elementos de câmara ou mapa não encontrados.");
  }


  // Inicializa o mapa
  if (mapView) {
    mapView.style.display = "block";
    window._leafletMap = L.map("map-view").setView([65.0121, 25.4682], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(window._leafletMap);
    logDebug("Mapa inicializado automaticamente.");
  }

  if (startButton) {
    startButton.addEventListener("click", () => {
      logDebug("Botão Start clicado!");
      startButton.style.display = "none";
      if (toggleViewButton) toggleViewButton.style.display = "block";
      if (centerMapButton) centerMapButton.style.display = "block";
      if (viewPOIsButton) viewPOIsButton.style.display = "block";
      if (switchModeButton) {
        switchModeButton.style.display = "block";
        switchModeButton.textContent = "Modo: Mapa";
      }
      if (cameraButton) cameraButton.style.display = "block";
      fetchPOIs();
    });
  }

  if (cameraButton && cameraPreview) {
    cameraButton.addEventListener("click", async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false
        });
        cameraPreview.srcObject = stream;
        cameraPreview.style.display = "block";
        mapView.style.display = "none";
        logDebug("Câmara iniciada com sucesso.");
      } catch (err) {
        logDebug("Erro ao aceder à câmara: " + err.message);
        alert("Não foi possível aceder à câmara. Verifica as permissões.");
      }
    });
  }

  if (switchModeButton && cameraPreview && mapView) {
    switchModeButton.addEventListener("click", async () => {
      const isCameraVisible = cameraPreview.style.display === "block";

      if (!isCameraVisible) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
            audio: false
          });
          cameraPreview.srcObject = stream;
          logDebug("Câmara iniciada automaticamente ao mudar de modo.");
        } catch (err) {
          logDebug("Erro ao aceder à câmara: " + err.message);
          alert("Não foi possível aceder à câmara. Verifica as permissões.");
          return;
        }
      }

      cameraPreview.style.display = isCameraVisible ? "none" : "block";
      mapView.style.display = isCameraVisible ? "block" : "none";
      switchModeButton.textContent = isCameraVisible ? "Modo: Câmara" : "Modo: Mapa";
      logDebug(`Alternado para ${isCameraVisible ? "mapa" : "câmara"}.`);
    });
  }



  if (centerMapButton) {
    centerMapButton.addEventListener("click", () => {
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
      if (!window._poisData?.length) {
        logDebug("POIs não disponíveis.");
        return;
      }
      const bounds = L.latLngBounds(window._poisData.map(poi => [poi.latitude, poi.longitude]));
      window._leafletMap.fitBounds(bounds, { padding: [50, 50] });
      logDebug("Mapa ajustado para mostrar todos os POIs.");
    });
  }

  async function fetchPOIs() {
    const { data, error } = await supabase.from("pois").select("*");
    logDebug("A buscar POIs da base de dados...");
    if (error) return logDebug(`Erro ao buscar POIs: ${error.message}`);
    if (!data?.length) return logDebug("Nenhum POI encontrado.");
    logDebug(`POIs carregados: ${data.length}`);
    window._poisData = data;

    data.forEach((poi) => {
      if (!poi.latitude || !poi.longitude) {
        logDebug(`POI inválido: ${JSON.stringify(poi)}`);
        return;
      }

      const circle = L.circleMarker([poi.latitude, poi.longitude], {
        radius: 6,
        color: "red",
        fillColor: "red",
        fillOpacity: 0.9
      }).addTo(window._leafletMap);

      const popupContent = `<strong>${poi.name || "POI"}</strong><br>${poi.description || ""}`;
      circle.bindPopup(popupContent);
      logDebug(`Marcador adicionado: ${poi.name || "POI"} (${poi.latitude}, ${poi.longitude})`);
    });

    const poiList = document.getElementById("poi-list");
    const poiItems = document.getElementById("poi-items");

    if (poiList && poiItems) {
      poiItems.innerHTML = "";
      poiList.style.display = "block";

      data.forEach((poi) => {
        const li = document.createElement("li");
        li.textContent = poi.name || "POI sem nome";
        li.addEventListener("click", () => {
          if (window._leafletMap) {
            window._leafletMap.setView([poi.latitude, poi.longitude], 17);
            logDebug(`POI selecionado: ${poi.name}`);
          }
        });
        poiItems.appendChild(li);
      });
    }
  }
});
