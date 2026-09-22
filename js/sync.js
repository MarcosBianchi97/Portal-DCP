document.addEventListener("DOMContentLoaded", function () {
  sincronizarNoticias();
  sincronizarAlerta();
});

function sincronizarNoticias() {
  const guardadas = localStorage.getItem("dc_noticias");
  if (!guardadas) return;

  const noticias = JSON.parse(guardadas).filter(function (noticia) {
    return !noticia.estado || noticia.estado === "aprobada";
  });
  const carouselInner = document.querySelector("#newsCarousel .carousel-inner");
  const indicadores = document.querySelector("#newsCarousel .carousel-indicators");
  if (!carouselInner || !indicadores) return;

  carouselInner.innerHTML = "";
  indicadores.innerHTML = "";

  if (noticias.length === 0) {
    carouselInner.innerHTML = '<div class="carousel-item active"><p class="text-muted text-center p-5 mb-0">No hay noticias publicadas.</p></div>';
    return;
  }

  noticias.forEach(function (noticia, index) {
    const item = document.createElement("div");
    item.className = "carousel-item" + (index === 0 ? " active" : "");
    item.innerHTML =
      '<div class="row align-items-center g-4 px-3">' +
      '<div class="col-md-6"><img src="' + (noticia.imagen.startsWith("data:") ? noticia.imagen : "img/" + noticia.imagen) + '" alt="' + noticia.titulo + '" class="slide-image"></div>' +
      '<div class="col-md-6">' +
      '<span class="badge badge-tag mb-2">' + noticia.tag + '</span>' +
      '<h3 class="h4">' + noticia.titulo + '</h3>' +
      '<p class="text-muted mb-0">' + noticia.descripcion + '</p>' +
      '</div></div>';
    carouselInner.appendChild(item);

    const boton = document.createElement("button");
    boton.type = "button";
    boton.setAttribute("data-bs-target", "#newsCarousel");
    boton.setAttribute("data-bs-slide-to", String(index));
    if (index === 0) boton.className = "active";
    indicadores.appendChild(boton);
  });
}

function sincronizarAlerta() {
  const guardada = localStorage.getItem("dc_alerta");
  if (!guardada) return;

  const alerta = JSON.parse(guardada);
  const contenedor = document.getElementById("alertas-container");
  if (!contenedor) return;

  contenedor.querySelectorAll(".alert-level").forEach(function (nivel) {
    const vigente = nivel.classList.contains(alerta.nivel);
    nivel.classList.toggle("nivel-vigente", vigente);

    let etiqueta = nivel.querySelector(".etiqueta-vigente");
    if (vigente) {
      if (!etiqueta) {
        etiqueta = document.createElement("span");
        etiqueta.className = "badge bg-dark etiqueta-vigente ms-2";
        etiqueta.textContent = "Vigente";
        nivel.querySelector(".level-code").appendChild(etiqueta);
      }
      if (alerta.mensaje) {
        const parrafo = nivel.querySelector("p");
        if (parrafo) parrafo.textContent = alerta.mensaje;
      }
    } else if (etiqueta) {
      etiqueta.remove();
    }
  });
}
