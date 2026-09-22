// BALANCE / ESTADISTICAS
const METRICAS = {
  relevamientos: 'Relevamientos',
  familias_asistidas: 'Familias asistidas',
  reportes: 'Provisiones entregadas'
};

const estadoBalance = document.getElementById('balance-status');

function actualizarEstadoBalance(mensaje) {
  if (estadoBalance) estadoBalance.textContent = mensaje;
}

// 1. Datos genéricos para que no quede vacío si el JSON tarda
const datosGenericos = [
  { "mes": "Enero", "relevamientos": 12, "familias_asistidas": 25, "reportes": 8 },
  { "mes": "Febrero", "relevamientos": 18, "familias_asistidas": 40, "reportes": 15 },
  { "mes": "Marzo", "relevamientos": 22, "familias_asistidas": 50, "reportes": 18 },
  { "mes": "Abril", "relevamientos": 15, "familias_asistidas": 30, "reportes": 10 }
];

let datosAnuales = datosGenericos;
let datosPorAnio = {};
let chart = null;
let animacionCompletada = false; // Control para ejecutar la animación solo una vez

function sumar(campo) {
  return datosAnuales.reduce((acc, mes) => acc + (mes[campo] || 0), 0);
}

// 2. Función que crea el efecto de conteo (0 hasta el valor final)
function animarNumero(elementoId, valorFinal) {
  const elemento = document.getElementById(elementoId);
  let valorActual = 0;
  const duracion = 2000; // 2 segundos de duración
  const pasos = 60; // Cantidad de "cuadros" o actualizaciones
  const incremento = valorFinal / pasos;
  const intervalo = duracion / pasos;

  // Si el valor inicial es un guión "—", lo ponemos en 0 temporalmente
  if (elemento.textContent === '—') elemento.textContent = '0';

  const timer = setInterval(() => {
    valorActual += incremento;
    if (valorActual >= valorFinal) {
      elemento.textContent = valorFinal; // Aseguramos el número exacto al final
      clearInterval(timer);
    } else {
      elemento.textContent = Math.floor(valorActual); // Quitamos los decimales
    }
  }, intervalo);
}

// 3. Modificamos pintarTotales para decidir si se anima o se inyecta el número directo
function pintarTotales() {
  const totalRel = sumar('relevamientos');
  const totalFam = sumar('familias_asistidas');
  const totalRep = sumar('reportes');

  // Si la animación ya pasó (ej: los datos del JSON cargaron tarde), actualizamos de golpe.
  // Si no ha pasado, no hacemos nada y dejamos que el Observador (abajo) arranque la animación.
  if (animacionCompletada) {
    document.getElementById('total-relevamientos').textContent = totalRel;
    document.getElementById('total-familias').textContent = totalFam;
    document.getElementById('total-reportes').textContent = totalRep;
  }
}

function cargarAnio(anio) {
  if (!datosPorAnio[anio]) {
    actualizarEstadoBalance('No hay datos disponibles para el año seleccionado.');
    return;
  }

  datosAnuales = datosPorAnio[anio];
  pintarTotales();
  pintarGrafico(selectMetrica.value);
  actualizarEstadoBalance('Balance actualizado. El gráfico muestra los datos disponibles de enero a septiembre.');
}

// 4. Configuración del "Vigilante" (Intersection Observer)
const seccionBalance = document.getElementById('balance');
const observador = new IntersectionObserver((entradas) => {
  // Cuando la sección entra en pantalla y la animación no se hizo todavía
  if (entradas[0].isIntersecting && !animacionCompletada) {
    
    // Disparamos las tres animaciones hacia los span con los id correspondientes
    animarNumero('total-relevamientos', sumar('relevamientos'));
    animarNumero('total-familias', sumar('familias_asistidas'));
    animarNumero('total-reportes', sumar('reportes'));
    
    animacionCompletada = true; 
    observador.disconnect(); // Desconectamos el observador para que no vuelva a ocurrir
  }
}, { threshold: 0.3 }); // 0.3 significa que arrancará cuando el 30% de la sección sea visible

// Activamos el observador para que vigile la sección
if (seccionBalance) {
  observador.observe(seccionBalance);
}

// 5. Lógica del gráfico (se mantiene igual)
function pintarGrafico(campo) { 
  // --- INICIO: PINTAR TARJETA ACTIVA ---
  // 1. Despinta todas las tarjetas
  document.querySelectorAll('.stat-card').forEach(card => {
    card.classList.remove('activa');
  });
  
  // 2. Pinta solo la tarjeta seleccionada
  const tarjetaElegida = document.getElementById('card-' + campo);
  if (tarjetaElegida) {
    tarjetaElegida.classList.add('activa');
  }
  // --- FIN: PINTAR TARJETA ACTIVA ---
  const ctx = document.getElementById('balance-chart');
  if (!ctx) return;
  
  const datosVisibles = datosAnuales.slice(0, 9);
  const labels = datosVisibles.map(m => m.mes);
  const valores = datosVisibles.map(m => m[campo]);

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = valores;
    chart.data.datasets[0].label = METRICAS[campo];
    chart.update();
    return;
  }

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: METRICAS[campo],
        data: valores,
        backgroundColor: '#1c2c56',
        borderRadius: 4,
        maxBarThickness: 42
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
}

// 6. Carga inicial
pintarGrafico('relevamientos');

// 7. Intentamos cargar los datos reales del JSON
fetch('data/datos.json')
  .then(res => {
    if (!res.ok) throw new Error('No se pudo cargar el balance');
    return res.json();
  })
  .then(data => {
    datosPorAnio = Object.fromEntries(
      Object.entries(data).filter(([anio, meses]) => anio !== '_instrucciones' && Array.isArray(meses))
    );

    const aniosDisponibles = Object.keys(datosPorAnio).sort().reverse();
    selectAnio.innerHTML = aniosDisponibles.map(anio => '<option value="' + anio + '">' + anio + '</option>').join('');
    selectAnio.value = aniosDisponibles[0];
    cargarAnio(selectAnio.value);
  })
  .catch(err => {
    actualizarEstadoBalance('No se pudieron cargar los datos reales. Se muestran datos de referencia.');
    console.warn('Usando datos genéricos. No se pudo cargar data/datos.json:', err);
  });

// 8. Evento del select
// Buscamos ambos selectores en el HTML
const selectMetrica = document.getElementById('stat-metric');
const selectAnio = document.getElementById('stat-year');

// Creamos una función maestra que lee ambos filtros
function actualizarDashboard() {
  const metricaElegida = selectMetrica.value; // ej: "reportes"
  const anioElegido = selectAnio.value;       // ej: "2026"

  if (datosPorAnio[anioElegido]) {
    datosAnuales = datosPorAnio[anioElegido];
    pintarTotales();
    pintarGrafico(metricaElegida);
  }
}

// Le decimos a la página que ejecute la función cuando cualquiera de los dos cambie
if (selectMetrica) {
  selectMetrica.addEventListener('change', actualizarDashboard);
}
if (selectAnio) {
  selectAnio.addEventListener('change', actualizarDashboard);
}