// Parametros para inicializar el mapa
const divMapHtml = 'map'
const lat = -11.9285;
const lon = -77.0509;
const zoom = 13

// Inicializando el mapa
var map = L.map(divMapHtml).setView([lat, lon], zoom);

// Agregar controlador de escala
L.control.scale().addTo(map);