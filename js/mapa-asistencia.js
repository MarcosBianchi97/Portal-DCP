const datosAsistencia = [
	{ departamento: "Capital", x: 31.2, y: 17.5, familiasAsistidas: 320 },
	{ departamento: "Pellegrini", x: 65.5, y: 13.2 },
	{ departamento: "Copo", x: 60.1, y: 22.6, familiasAsistidas: 118 },
	{ departamento: "General Taboada", x: 25.6, y: 31.1 },
	{ departamento: "Choya", x: 14.6, y: 42.1 },
	{ departamento: "Jiménez", x: 29.9, y: 40.4 },
	{ departamento: "Mitre", x: 36.6, y: 48.4 },
	{ departamento: "Loreto", x: 25.1, y: 49.0 },
	{ departamento: "Figueroa", x: 39.1, y: 54.3, familiasAsistidas: 74 },
	{ departamento: "Avellaneda", x: 12.0, y: 52.2 },
	{ departamento: "San Martín", x: 27.4, y: 61.8 },
	{ departamento: "Banda", x: 38.6, y: 64.4 },
	{ departamento: "Ojo de Agua", x: 72.9, y: 61.4, familiasAsistidas: 63 },
	{ departamento: "Rivadavia", x: 73.4, y: 52.0 },
	{ departamento: "Guasayán", x: 17.4, y: 63.8 },
	{ departamento: "Quebrachos", x: 34.8, y: 74.4 },
	{ departamento: "Río Hondo", x: 73.4, y: 52.0, familiasAsistidas: 210 },
	{ departamento: "Alberdi", x: 74.9, y: 39.6 },
	{ departamento: "Robles", x: 51.4, y: 60.6 },
	{ departamento: "Salavina", x: 51.2, y: 78.3 },
	{ departamento: "Juan Felipe Ibarra", x: 78.5, y: 88.2 },
	{ departamento: "Moreno", x: 65.2, y: 82.3 },
	{ departamento: "Atamisqui", x: 50.9, y: 72.8 },
	{ departamento: "Belgrano", x: 82.6, y: 72.6 },
	{ departamento: "Sarmiento", x: 44, y: 78 },
	{ departamento: "Aguirre", x: 61, y: 88 },
	{ departamento: "Silípica", x: 42, y: 70 }
];

const posicionesCompartidas = typeof window.POSICIONES_PINES === "object" ? window.POSICIONES_PINES : {};

try {
	const posicionesGuardadas = JSON.parse(localStorage.getItem("dc_posiciones_pines") || "null");
	const posicionesFinales = { ...posicionesCompartidas, ...(posicionesGuardadas || {}) };
	if (posicionesFinales) {
		datosAsistencia.forEach(function (departamento) {
			const posicion = posicionesFinales[departamento.departamento];
			if (posicion && typeof posicion.x === "number" && typeof posicion.y === "number") {
				departamento.x = posicion.x;
				departamento.y = posicion.y;
			}
		});
	}
} catch (error) {
	console.warn("No se pudieron cargar las posiciones guardadas de los pines. Se usan las posiciones compartidas por defecto.", error);
	const posicionesFinales = posicionesCompartidas;
	if (posicionesFinales) {
		datosAsistencia.forEach(function (departamento) {
			const posicion = posicionesFinales[departamento.departamento];
			if (posicion && typeof posicion.x === "number" && typeof posicion.y === "number") {
				departamento.x = posicion.x;
				departamento.y = posicion.y;
			}
		});
	}
}

function renderizarMarcadoresAsistencia() {
	const capa = document.getElementById("marcadores-asistencia");
	if (!capa) return;

	capa.innerHTML = datosAsistencia.map(function (departamento) {
		const posicion = { x: departamento.x, y: departamento.y };
		const tieneFamilias = typeof departamento.familiasAsistidas === "number";
		const descripcion = tieneFamilias ? departamento.departamento + ": " + departamento.familiasAsistidas + " familias asistidas" : departamento.departamento;
		const familias = tieneFamilias ? departamento.familiasAsistidas : "";
		return '<button type="button" class="marcador-asistencia" style="left: ' + posicion.x + '%; top: ' + posicion.y + '%" aria-label="' + escaparTextoMapa(descripcion) + '" data-departamento="' + escaparTextoMapa(departamento.departamento) + '" data-familias="' + familias + '"></button>';
	}).join("");

	const ficha = document.createElement("div");
	ficha.className = "ficha-asistencia";
	ficha.setAttribute("role", "tooltip");
	ficha.setAttribute("aria-hidden", "true");
	ficha.innerHTML = '<strong class="ficha-asistencia-titulo"></strong><span class="ficha-asistencia-dato"></span>';
	capa.appendChild(ficha);

	capa.querySelectorAll(".marcador-asistencia").forEach(function (marcador) {
		marcador.addEventListener("mouseenter", mostrarFicha);
		marcador.addEventListener("focus", mostrarFicha);
		marcador.addEventListener("mouseleave", ocultarFicha);
		marcador.addEventListener("blur", ocultarFicha);
	});

	function mostrarFicha(evento) {
		const marcador = evento.currentTarget;
		ficha.querySelector(".ficha-asistencia-titulo").textContent = marcador.dataset.departamento;
		ficha.querySelector(".ficha-asistencia-dato").textContent = marcador.dataset.familias ? marcador.dataset.familias + " familias asistidas" : "";
		ficha.style.left = marcador.style.left;
		ficha.style.top = marcador.style.top;
		ficha.classList.toggle("ficha-abajo", parseFloat(marcador.style.top) < 24);
		ficha.setAttribute("aria-hidden", "false");
	}

	function ocultarFicha() {
		ficha.setAttribute("aria-hidden", "true");
	}
}

function escaparTextoMapa(texto) {
	return texto.replace(/[&<>"']/g, function (caracter) {
		return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[caracter];
	});
}

document.addEventListener("DOMContentLoaded", renderizarMarcadoresAsistencia);
