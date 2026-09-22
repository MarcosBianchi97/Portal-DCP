// El menú móvil, el scrollspy del navbar y el carrusel de noticias
// ahora los maneja Bootstrap (data-bs-toggle, data-bs-spy, data-bs-ride).
// Acá solo queda el botón de volver arriba, que es algo propio del sitio.

const backToTopBtn = document.getElementById('back-to-top');

window.addEventListener('scroll', () => {
  backToTopBtn.classList.toggle('visible', window.scrollY > 400);
});

backToTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
