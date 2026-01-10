// CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = 'https://lhlpjcrndlnjtfhjdubq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_7HVSX3_sQ11Ll1fkQP9YCg_BuKdMewh';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Referencias a Elementos del DOM
const btnAnalizar = document.getElementById('btnAnalizar');
const inputId = document.getElementById('clientId');
const panelResult = document.getElementById('resultado');

// Función Principal
async function ejecutarConsulta() {
    const idValue = inputId.value.trim();

    if (!idValue) {
        alert("Por favor, ingrese un ID de cliente.");
        return;
    }

    // Llamada RPC apuntando al esquema 'churn'
    const { data, error } = await supabaseClient
        .schema('churn') 
        .rpc('buscar_cliente_por_id', { id_busqueda: idValue });

    if (error) {
        console.error("Error de Supabase:", error);
        alert("Error al conectar con la base de datos. Verifique consola.");
        return;
    }

    if (data && data.length > 0) {
        mostrarDatos(data[0]);
    } else {
        alert("Cliente no encontrado en el esquema 'churn'.");
        panelResult.style.display = 'none';
    }
}

// Función para renderizar los datos en la UI
function mostrarDatos(cliente) {
    const prob = (cliente.prob_churn * 100).toFixed(1);
    
    // Inyectar texto
    document.getElementById('res-id').innerText = cliente.customerid;
    document.getElementById('res-prob').innerText = prob + '%';
    document.getElementById('res-factor').innerText = cliente.factor_riesgo;
    document.getElementById('res-accion').innerText = cliente.accion_recomendada;
    
    // Mostrar panel y animar barra
    panelResult.style.display = 'block';
    
    // Pequeño delay para que la animación CSS se note
    setTimeout(() => {
        document.getElementById('res-bar').style.width = prob + '%';
    }, 150);
}

// Event Listeners
btnAnalizar.addEventListener('click', ejecutarConsulta);

// Permitir búsqueda al presionar "Enter"
inputId.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') ejecutarConsulta();
});