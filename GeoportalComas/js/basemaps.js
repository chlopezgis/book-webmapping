/* Agregar Mapas bases */

// Openstreetmaps
const OSM = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    zIndex: 1
}).addTo(map);

// CartoDB Positron
const positron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '©OpenStreetMap, ©CartoDB',
    zIndex: 1
});

// Controlador de capas
const mapBase = { 'OSM': OSM, 'Carto Positron': positron };

// Agregar basemaps al mapa
L.control.layers(mapBase).addTo(map);
