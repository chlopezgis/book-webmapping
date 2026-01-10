// CONFIGURACIÓN SUPABASE
const SUPABASE_URL = 'https://lhlpjcrndlnjtfhjdubq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_7HVSX3_sQ11Ll1fkQP9YCg_BuKdMewh'; 
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function consultarCRM() {
    const idInput = document.getElementById('clientId').value.trim();
    if(!idInput) return;

    const { data, error } = await client
        .schema('churn')
        .rpc('obtener_ficha_crm', { id_busqueda: idInput });

    if (error) return;

    if (data && data.length > 0) {
        const c = data[0];
        const prob = Math.round(parseFloat(c.prob_churn) * 100);
        const factor = c.factor_riesgo || "general";

        // 1. Mostrar Dashboard y Banner
        document.getElementById('dashboard').style.display = 'grid';
        const banner = document.getElementById('risk-banner');
        banner.style.display = 'block';
        banner.className = 'alert-banner'; 

        // Clasificación de Banner
        if (prob >= 90) {
            banner.innerText = "🚨 MUY ALTO RIESGO: Requiere contacto inmediato.";
            banner.classList.add('v-high');
        } else if (prob >= 80) {
            banner.innerText = "⚠️ RIESGO ALTO: El cliente presenta probabilidad de fuga elevada.";
            banner.classList.add('high');
        } else {
            banner.innerText = "ℹ️ RIESGO MODERADO: Seguimiento preventivo estándar.";
            banner.classList.add('moderate');
        }

        // 2. Llenado de Datos Básicos
        document.getElementById('res-prob').innerText = prob + '%';
        document.getElementById('res-prob').style.color = prob >= 80 ? 'var(--red)' : 'var(--cyan)';
        document.getElementById('res-id-display').innerText = 'ID: ' + c.customer_id;
        document.getElementById('res-clv').innerText = '+$' + parseFloat(c.valor_clv).toFixed(2);
        document.getElementById('res-status').innerText = c.salud_tecnica;
        document.getElementById('res-sent').innerText = c.sentimiento;
        document.getElementById('res-factor').innerText = factor;
        document.getElementById('res-accion').innerText = c.accion_recomendada;
        
        // Simulación de atributo interacciones (puedes mapearlo a tu columna real si existe)
        document.getElementById('res-calls').innerText = Math.floor(Math.random() * 10) + 1;

        // 3. Animación de Barra
        const bar = document.getElementById('res-bar-fill');
        bar.style.width = prob + '%';
        bar.style.backgroundColor = prob >= 80 ? 'var(--red)' : 'var(--cyan)';

        // 4. LÓGICA DE CHECKLIST DINÁMICO
        actualizarChecklist(factor);

    } else {
        alert("Cliente no encontrado.");
    }
}

function actualizarChecklist(factor) {
    const container = document.getElementById('checklist-content');
    let items = [];

    // Lógica basada en el factor crítico
    if (factor.toLowerCase().includes('contract') || factor.toLowerCase().includes('tenure')) {
        items = [
            { text: "Mejorar Plan Actual", checked: true },
            { text: "Renovación Anual 15% Desc.", checked: true },
            { text: "Contacto Directo Gerencial", checked: false }
        ];
    } else if (factor.toLowerCase().includes('charges') || factor.toLowerCase().includes('price')) {
        items = [
            { text: "Descuento en Factura", checked: true },
            { text: "Fibra Gratis x 3 meses", checked: true },
            { text: "Revisión de Tasas", checked: false }
        ];
    } else {
        // Fallback para clientes antiguos o casos generales
        items = [
            { text: "Bono de Fidelidad", checked: true },
            { text: "Gb Extras Ilimitados", checked: true },
            { text: "Llamada de Agradecimiento", checked: false }
        ];
    }

    // Renderizar checklist
    container.innerHTML = items.map(i => `
        <div class="check-item">
            <input type="checkbox" ${i.checked ? 'checked' : ''}>
            <span>${i.text}</span>
        </div>
    `).join('');
}

document.getElementById('btnSearch').onclick = consultarCRM;