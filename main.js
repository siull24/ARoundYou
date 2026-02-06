import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Supabase setup
const supabase = createClient(
  "https://ikoztmugtdfgsoplodvw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlrb3p0bXVndGRmZ3NvcGxvZHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTMyMzEsImV4cCI6MjA4NTY4OTIzMX0.H-RgSdwBrAA0mDUWGTKa-I9tc6_sVWqm6882Yys3Nu8"
);

const logDebug = (msg) => {
  const el = document.getElementById("debug-overlay");
  if (el) {
    el.textContent += `\n[${new Date().toLocaleTimeString()}] ${msg}`;
    el.scrollTop = el.scrollHeight;
  } else {
    console.log(msg);
  }
};

// Coloca estes logs dentro do DOMContentLoaded
window.addEventListener("DOMContentLoaded", () => {
  const startButton = document.getElementById("start-button");
  const toggleViewButton = document.getElementById("toggle-view");
  const centerMapButton = document.getElementById("center-map");
  const mapView = document.getElementById("map-view");
  const scene = document.querySelector("a-scene");

  console.log("Start:", startButton);
  console.log("Toggle View:", toggleViewButton);
  console.log("Center Map:", centerMapButton);
  console.log("Scene:", scene);

  logDebug("DOM carregado. A iniciar...");

  if (startButton) {
    startButton.addEventListener("click", () => {
      logDebug("Botão Start clicado!");

      startButton.style.display = "none";
      if (toggleViewButton) toggleViewButton.style.display = "block";
      if (centerMapButton) centerMapButton.style.display = "block";

      fetchPOIs();

      if (scene) scene.setAttribute("visible", "true");
    });
  }

  if (scene) {
    scene.setAttribute("visible", "false");
  }
});
