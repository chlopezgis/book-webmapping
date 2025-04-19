// URL del servicio WMS de GeoServer para obtener las capas disponibles
const geoserverUrl = "http://localhost:8080/geoserver/Comas/wms?service=WMS&version=1.3.0&request=GetCapabilities";

// Objeto para almacenar las capas activas en el mapa
const activeLayers = {};

// Realizar una solicitud HTTP para obtener el documento XML con las capas disponibles en el WMS
fetch(geoserverUrl)
    .then(response => response.text()) // Convertir la respuesta a texto (XML en formato string)
    .then(data => {
        // Crear un objeto DOMParser para interpretar la respuesta XML
        const parser = new DOMParser();
        const xml = parser.parseFromString(data, "application/xml");

        // Extraer los nombres de las capas del XML
        const layers = Array.from(xml.querySelectorAll("Layer > Name")).map(layer => layer.textContent);

        // Para cada capa encontrada, crear un interruptor de activación en la interfaz
        layers.forEach(layerName => createLayerToggle(layerName));
    })
    .catch(error => console.error("Error obteniendo capas:", error));

/**
 * Crea un interruptor de activación para una capa WMS y lo agrega al panel de capas.
 * @param {string} layerName - Nombre de la capa en el WMS.
 */
function createLayerToggle(layerName) {
    // Crear un contenedor para la capa en la interfaz
    const listItem = document.createElement("div");
    listItem.classList.add("layer-item");

    // Etiqueta con el nombre de la capa
    const label = document.createElement("span");
    label.textContent = layerName;

    // Crear un checkbox para activar/desactivar la capa
    const toggleSwitch = document.createElement("input");
    toggleSwitch.type = "checkbox";

    // Evento: cuando se cambia el estado del checkbox, se agrega o quita la capa del mapa
    toggleSwitch.onchange = () => toggleLayer(layerName, toggleSwitch.checked);

    // Agregar el checkbox y la etiqueta al contenedor
    listItem.appendChild(toggleSwitch);
    listItem.appendChild(label);

    // Agregar el contenedor al panel de capas en el sidebar
    layersPanel.appendChild(listItem);
}

/**
 * Activa o desactiva una capa WMS en el mapa según el estado del checkbox.
 * @param {string} layerName - Nombre de la capa en el WMS.
 * @param {boolean} isActive - Indica si la capa debe activarse o desactivarse.
 */
function toggleLayer(layerName, isActive) {
    if (isActive) {
        // Agregar la capa al mapa
        activeLayers[layerName] = L.tileLayer.wms("http://localhost:8080/geoserver/Comas/wms", {
            layers: layerName,    // Nombre de la capa WMS a mostrar
            maxZoom: 19,          // Nivel máximo de zoom permitido
            format: "image/png",  // Formato de imagen de la capa
            transparent: true,    // Permitir transparencia para superposición
            tiled: true,          // Solicitar imágenes en mosaico (mejora rendimiento)
            zIndex: 2             // Orden de apilamiento (capas base tienen zIndex: 1)
        }).addTo(map);
    } else {
        // Si la capa está activa, eliminarla del mapa
        map.removeLayer(activeLayers[layerName]);
        delete activeLayers[layerName]; // Eliminar la referencia de la capa en el objeto
    }
    adjustSidebarSize(); // Ajustar el tamaño del sidebar según las capas activas
}

/**
 * Ajusta dinámicamente el ancho del sidebar dependiendo de la cantidad de capas activas.
 */
function adjustSidebarSize() {
    const activeItemsCount = Object.keys(activeLayers).length;
    sidebar.style.width = activeItemsCount > 0 ? `${200 + activeItemsCount * 30}px` : "200px";
}