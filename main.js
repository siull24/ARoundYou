window.addEventListener("DOMContentLoaded", () => {
  logDebug("DOM carregado. A iniciar...");

  const startButton = document.getElementById("start-button");
  const toggleViewButton = document.getElementById("toggle-view");
  const centerMapButton = document.getElementById("center-map");
  const mapView = document.getElementById("map-view");
  const viewPOIsButton = document.getElementById("view-pois");
  const switchModeButton = document.getElementById("switch-mode");
  const video = document.getElementById("camera");

  if (startButton) {
    startButton.addEventListener("click", () => {
      logDebug("Botão Start clicado!");
      startButton.style.display = "none";
      toggleViewButton.style.display = "block";
      centerMapButton.style.display = "block";
      viewPOIsButton.style.display = "block";
      switchModeButton.style.display = "block";
      fetchPOIs();
    });
  }

  if (switchModeButton) {
    switchModeButton.addEventListener("click", () => {
      const isCameraVisible = video.style.display !== "block";
      video.style.display = isCameraVisible ? "block" : "none";
      mapView.style.display = isCameraVisible ? "none" : "block";
      switchModeButton.textContent = isCameraVisible ? "Modo: Câmara" : "Modo: Mapa";
      if (isCameraVisible) iniciarCamera();
    });
  }

  async function iniciarCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      logDebug("Câmara iniciada com sucesso.");
    } catch (err) {
      logDebug("Erro ao aceder à câmara: " + err.message);
      alert("Não foi possível aceder à câmara. Verifica as permissões.");
    }
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

  async function fetchPOIs() {
    const { data, error } = await supabase.from("pois").select("*");
    logDebug("A buscar POIs da base de dados...");
    if (error) return logDebug(`Erro ao buscar POIs: ${error.message}`);
    if (!data?.length) return logDebug("Nenhum POI encontrado.");
    logDebug(`POIs carregados: ${data.length}`);
    window._poisData = data;

    if (window._leafletMap) {
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

      const bounds = L.latLngBounds(data.map(poi => [poi.latitude, poi.longitude]));
      window._leafletMap.fitBounds(bounds, { padding: [50, 50] });
    }
  }
  const poiList = document.getElementById("poi-list");
const poiItems = document.getElementById("poi-items");

if (poiList && poiItems) {
  poiItems.innerHTML = ""; // limpa a lista
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

});
