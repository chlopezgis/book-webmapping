/* Funcionalidad del panel lateral */

// Obtener el contenedor del sidebar
const sidebar = document.getElementById("sidebar");

// Crear el botón para mostrar/ocultar las capas
const layerButton = document.createElement("button");
layerButton.textContent = "C";
layerButton.id = "layerButton"; // Agregar ID para CSS
sidebar.appendChild(layerButton);

// Crear el panel de capas y agregarlo al sidebar
const layersPanel = document.createElement("div");
layersPanel.id = "layersPanel"; // Agregar ID para CSS
layersPanel.style.display = "none";
sidebar.appendChild(layersPanel);

// Lógica para alternar la visibilidad del panel de capas
layerButton.addEventListener("click", () => {
    if (layersPanel.style.display === "none") {
        layersPanel.style.display = "block";
        sidebar.style.width = "300px"; // Expande el sidebar
    } else {
        layersPanel.style.display = "none";
        sidebar.style.width = "50px"; // Reduce el sidebar
    }
});