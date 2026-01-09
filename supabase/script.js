// Configuración Supabase
const SUPABASE_URL = "https://lhlpjcrndlnjtfhjdubq.supabase.co/rest/v1/";
const SUPABASE_KEY = "sb_publishable_7HVSX3_sQ11Ll1fkQP9YCg_BuKdMewh";
const headers = { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY };

// Inicialización de Mapas Base
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
const light = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png');
const dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png');
const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}');

const map = L.map('map').setView([-4.0, -79.2], 14);
osm.addTo(map);

L.control.layers({ "Standard": osm, "Claro": light, "Oscuro": dark, "Satelital": sat }, null, { position: 'topright' }).addTo(map);

// Variables Globales
const capasDef = [
  { tabla: "barrios", nombre: "Barrios", icon: "fa-draw-polygon", color: "#1a7a6b" },
  { tabla: "incidencias", nombre: "Reportes", icon: "fa-triangle-exclamation", color: "#f56565" },
  { tabla: "agua_potable", nombre: "Agua Potable", icon: "fa-droplet", color: "#3182ce" },
  { tabla: "alcantarillado", nombre: "Alcantarillado", icon: "fa-faucet-drip", color: "#805ad5" },
  { tabla: "bomberos_wgs84", nombre: "Bomberos", icon: "fa-fire", color: "#e53e3e" },
  { tabla: "policias_wgs84", nombre: "Policía", icon: "fa-shield", color: "#2b6cb0" },
  { tabla: "salud_wgs84", nombre: "Salud", icon: "fa-kit-medical", color: "#38a169" }
];

let barriosCache = [];
let modoSeleccion = false;
let marcadorTemp = null;
let capaHighlight = null;

// Cargar Capas al Iniciar
async function cargarGeoportal() {
  const container = document.getElementById("layersContainer");
  for (const c of capasDef) {
    const div = document.createElement("div");
    div.className = "layer-item";
    div.innerHTML = `<span><i class="fa-solid ${c.icon}" style="color:${c.color}"></i> ${c.nombre}</span>
      <label class="switch"><input type="checkbox" id="chk-${c.tabla}" onchange="toggleCapa('${c.tabla}')"><span class="slider"></span></label>`;
    container.appendChild(div);

    try {
      const res = await fetch(`${SUPABASE_URL}${c.tabla}?select=geom,*`, { headers });
      const data = await res.json();
      const layer = L.geoJSON(data.map(d => ({
        type: "Feature", geometry: typeof d.geom === 'string' ? JSON.parse(d.geom) : d.geom, properties: d
      })), {
        style: { color: c.color, weight: 3, fillOpacity: 0.2 },
        pointToLayer: (f, ll) => L.circleMarker(ll, { radius: 6, fillColor: c.color, color: "#fff", weight: 1, fillOpacity: 0.8 }),
        onEachFeature: (f, l) => {
          let pop = `<div style="font-size:12px"><b>Detalle de ${c.nombre}</b><hr>`;
          for (let k in f.properties) if (k !== 'geom' && f.properties[k]) pop += `<b>${k}:</b> ${f.properties[k]}<br>`;
          l.bindPopup(pop + `</div>`);

          if (c.tabla === "barrios") {
            l.on('click', (e) => { if(!modoSeleccion) { L.DomEvent.stopPropagation(e); seleccionarBarrio(f.properties); } });
          }
        }
      });
      window[`layer_${c.tabla}`] = layer;
      if (c.tabla === "barrios") { barriosCache = data; layer.addTo(map); document.getElementById("chk-barrios").checked = true; }
    } catch (e) { console.error("Error en " + c.tabla, e); }
  }
}

function toggleCapa(t) {
  const l = window[`layer_${t}`];
  if (document.getElementById(`chk-${t}`).checked) l.addTo(map);
  else if (l) map.removeLayer(l);
}

// Buscador
const searchInput = document.getElementById("searchBarrios");
const autoList = document.getElementById("autocomplete");
searchInput.addEventListener("input", () => {
  const val = searchInput.value.toLowerCase();
  autoList.innerHTML = "";
  if (!val) return;
  barriosCache.filter(b => b.barrio.toLowerCase().includes(val)).slice(0,6).forEach(b => {
    const li = document.createElement("li");
    li.textContent = b.barrio;
    li.onclick = () => { searchInput.value = b.barrio; autoList.innerHTML = ""; seleccionarBarrio(b); };
    autoList.appendChild(li);
  });
});

async function seleccionarBarrio(b) {
  if (capaHighlight) map.removeLayer(capaHighlight);
  const g = typeof b.geom === 'string' ? JSON.parse(b.geom) : b.geom;
  capaHighlight = L.geoJSON(g, { style: { color: 'var(--dorado-lugis)', weight: 5, fillOpacity: 0.3 } }).addTo(map);
  map.fitBounds(capaHighlight.getBounds());
  document.getElementById("sectionStats").style.display = "block";
  document.getElementById("statsTitle").textContent = b.barrio;
  const res = await fetch(`${SUPABASE_URL}rpc/obtener_estadisticas_barrio`, {
    method: 'POST', headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ nombre_barrio_buscado: b.barrio })
  });
  const d = await res.json();
  const s = d[0];
  if(s) {
    document.getElementById("statPoli").textContent = s.conteo_policias;
    document.getElementById("statBomb").textContent = s.conteo_bomberos;
    document.getElementById("statSalud").textContent = s.conteo_salud;
    document.getElementById("statIncidencias").textContent = s.conteo_incidencias;
    document.getElementById("statAlcan").textContent = (s.longitud_alcantarillado/1000).toFixed(2)+" km";
  }
}

// Modal y GPS
function abrirModal() { document.getElementById("modalReporte").style.display = "flex"; }
function cerrarModal() { document.getElementById("modalReporte").style.display = "none"; }

function usarGPS() {
  if (!navigator.geolocation) return alert("GPS no soportado");
  navigator.geolocation.getCurrentPosition((pos) => {
    cerrarModal();
    const { latitude, longitude } = pos.coords;
    map.setView([latitude, longitude], 17);
    colocarMarcador(latitude, longitude);
  }, () => alert("Permiso de GPS denegado."));
}

function activarSeleccionMapa() {
  modoSeleccion = true; cerrarModal();
  document.body.classList.add('modo-reporte-activo');
  document.getElementById("map").style.cursor = "crosshair";
  document.getElementById("btnNuevaIncidencia").innerHTML = "CANCELAR MARCADO";
  document.getElementById("btnNuevaIncidencia").onclick = cancelarReporte;
}

function cancelarReporte() {
  modoSeleccion = false; document.body.classList.remove('modo-reporte-activo');
  document.getElementById("map").style.cursor = "";
  document.getElementById("btnNuevaIncidencia").innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> NUEVA INCIDENCIA';
  document.getElementById("btnNuevaIncidencia").onclick = abrirModal;
  if(marcadorTemp) map.removeLayer(marcadorTemp);
}

map.on('click', (e) => { if (modoSeleccion) colocarMarcador(e.latlng.lat, e.latlng.lng); });

function colocarMarcador(lat, lng) {
  if (marcadorTemp) map.removeLayer(marcadorTemp);
  marcadorTemp = L.marker([lat, lng]).addTo(map)
    .bindPopup(`<b>¿Enviar aquí?</b><br><button onclick="guardarFinal(${lat},${lng})" style="background:var(--verde-lugis); color:white; border:none; padding:8px; width:100%; margin-top:5px; border-radius:4px; cursor:pointer;">CONFIRMAR</button>`)
    .openPopup();
}

async function guardarFinal(lat, lng) {
  const payload = {
    categoria: document.getElementById("repTipo").value,
    descripcion: `Reporte de ${document.getElementById("repNombre").value}: ${document.getElementById("repDesc").value}`,
    geom: `POINT(${lng} ${lat})`
  };
  await fetch(`${SUPABASE_URL}incidencias`, { method: 'POST', headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  alert("Reporte exitoso");
  location.reload();
}

// Inicialización
cargarGeoportal();