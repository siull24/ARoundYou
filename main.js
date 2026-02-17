import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://fzdqeiwbhtdliqcxxlxr.supabase.co",
  "TUA_ANON_KEY_AQUI"
);

const debug = (msg) => {
  document.getElementById("debug").innerText += "\n" + msg;
  console.log(msg);
};

window.addEventListener("load", async () => {

  debug("A obter POIs...");

  const { data, error } = await supabase
    .from("pois")
    .select("*");

  if (error) {
    debug("Erro Supabase: " + error.message);
    return;
  }

  if (!data.length) {
    debug("Sem POIs.");
    return;
  }

  debug("POIs carregados: " + data.length);

  const scene = document.querySelector("a-scene");

  data.forEach(poi => {

    if (!poi.latitude || !poi.longitude) return;

    // Criar ponto vermelho
    const marker = document.createElement("a-sphere");

    marker.setAttribute("gps-entity-place",
      `latitude: ${poi.latitude}; longitude: ${poi.longitude};`
    );

    marker.setAttribute("radius", "5");
    marker.setAttribute("color", "red");

    // Texto por cima
    const text = document.createElement("a-text");
    text.setAttribute("value", poi.name || "POI");
    text.setAttribute("align", "center");
    text.setAttribute("color", "black");
    text.setAttribute("scale", "20 20 20");
    text.setAttribute("position", "0 10 0");

    marker.appendChild(text);

    scene.appendChild(marker);
  });

});
