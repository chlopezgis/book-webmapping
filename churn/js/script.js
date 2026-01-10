// CONFIGURACIÓN
const SUPABASE_URL = 'https://lhlpjcrndlnjtfhjdubq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_7HVSX3_sQ11Ll1fkQP9YCg_BuKdMewh'; 
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function consultarCRM() {
    const idInput = document.getElementById('clientId').value.trim();
    if(!idInput) return;

    // Llamada a la base de datos
    const { data, error } = await client
        .schema('churn')
        .rpc('obtener_ficha_crm', { id_busqueda: idInput });

    if (error) {
        console.error("Error en consulta:", error.message);
        return;
    }

    if (data && data.length > 0) {
        const c = data[0];
        const prob = Math.round(parseFloat(c.prob_churn) * 100);
        const factor = c.factor_riesgo || "general";

        // 1. Mostrar Dashboard y Banner
        document.getElementById('dashboard').style.display = 'grid';
        const banner = document.getElementById('risk-banner');
        banner.style.display = 'block';
        banner.className = 'alert-banner'; 

        // Lógica de Mensajes por %
        if (prob >= 90) {
            banner.innerText = "🚨 MUY ALTO RIESGO: Cliente con alta probabilidad de fuga. Intervención inmediata.";
            banner.classList.add('v-high');
        } else if (prob >= 80) {
            banner.innerText = "⚠️ RIESGO ALTO: Se recomienda aplicar oferta de retención ahora.";
            banner.classList.add('high');
        } else {
            banner.innerText = "ℹ️ RIESGO MODERADO: Mantener monitoreo preventivo.";
            banner.classList.add('moderate');
        }

        // 2. Inyectar Datos en Pantalla
        document.getElementById('res-prob').innerText = prob + '%';
        document.getElementById('res-prob').style.color = prob >= 80 ? 'var(--red)' : 'var(--cyan)';
        
        document.getElementById('res-id-display').innerText = 'ID: ' + c.customer_id;
        document.getElementById('res-clv').innerText = '+$' + parseFloat(c.valor_clv).toFixed(2);
        document.getElementById('res-status').innerText = c.salud_tecnica;
        document.getElementById('res-sent').innerText = c.sentimiento;
        
        document.getElementById('res-factor').innerText = factor;
        document.getElementById('res-accion').innerText = c.accion_recomendada;
        
        // Simulación de Llamadas (basado en salud técnica)
        document.getElementById('res-calls').innerText = c.salud_tecnica.includes('Falla') ? "8" : "2";

        // 3. Animación de Barra SHAP
        const bar = document.getElementById('res-bar-fill');
        bar.style.width = prob + '%';
        bar.style.backgroundColor = prob >= 80 ? 'var(--red)' : 'var(--cyan)';

        // 4. LÓGICA DE CHECKLIST DINÁMICO POR FACTOR
        actualizarChecklist(factor);

    } else {
        alert("ID de cliente no encontrado en la base de datos.");
    }
}

function actualizarChecklist(factor) {
    const container = document.getElementById('checklist-content');
    const f = factor.toLowerCase();
    let items = [];

    // Lógica de negocio para las ofertas
    if (f.includes('contract') || f.includes('tenure')) {
        items = [
            { t: "Upgrade de Plan (Fidelización)", c: true },
            { t: "Descuento por Renovación Anual", c: true },
            { t: "Contacto Directo Gerencial", c: false }
        ];
    } else if (f.includes('charge') || f.includes('monthly')) {
        items = [
            { t: "Bonificación de Fibra Gratis", c: true },
            { t: "Descuento Directo en Factura", c: true },
            { t: "Revisión de Cargos", c: false }
        ];
    } else {
        items = [
            { t: "Bono de Datos Ilimitados", c: true },
            { t: "Llamada de Cortesía", c: true },
            { t: "Sorteo Premium", c: false }
        ];
    }

    container.innerHTML = items.map(i => `
        <div class="check-item">
            <input type="checkbox" ${i.c ? 'checked' : ''}>
            <span>${i.t}</span>
        </div>
    `).join('');
}

// Event Listeners
document.getElementById('btnSearch').onclick = consultarCRM;

// Permitir buscar con la tecla Enter
document.getElementById('clientId').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') consultarCRM();
});