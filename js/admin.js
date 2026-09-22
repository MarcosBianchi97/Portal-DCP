// IMPORTANTE: estos son valores de EJEMPLO. Cambiarlos antes de usar el panel en producción
// (ver sección "Panel admin" de CLAUDE.md). Este login es solo client-side (localStorage/
// sessionStorage) sin backend, así que no ofrece seguridad real ante quien lea el código fuente.
const CREDENCIALES = {
  admin: { usuario: "admin", password: "CAMBIAR_ESTA_PASSWORD_ADMIN" },
  superadmin: { usuario: "superadmin", password: "CAMBIAR_ESTA_PASSWORD_SUPERADMIN" }
};

const credencialesGuardadas = localStorage.getItem("dc_credenciales");
if (credencialesGuardadas) {
  try {
    const credenciales = JSON.parse(credencialesGuardadas);
    Object.keys(CREDENCIALES).forEach(function (rol) {
      if (credenciales[rol] && typeof credenciales[rol].password === "string") {
        CREDENCIALES[rol].password = credenciales[rol].password;
      }
    });
  } catch (error) {
    localStorage.removeItem("dc_credenciales");
  }
}

const noticiasPorDefecto = [
  {
    id: 1,
    tag: "Operativo",
    titulo: "Comité de Emergencia por temporal",
    imagen: "temporal.jpg",
    descripcion: "Ante lluvias torrenciales, el municipio activó el Comité de Emergencia y habilitó la línea 421-7999 para que los vecinos afectados soliciten asistencia o informen situaciones de riesgo.",
    fecha: "2026-01-15",
    estado: "aprobada",
    autor: "admin"
  },
  {
    id: 2,
    tag: "Capacitación",
    titulo: "Capacitación en uso de matafuegos",
    imagen: "Capacitacion-matafuegos.jpg",
    descripcion: "Docentes y personal de jardines de infantes recibieron una capacitación práctica sobre manejo de extintores portátiles, como parte del plan permanente de refuerzo en prevención de incendios.",
    fecha: "2026-02-10",
    estado: "aprobada",
    autor: "admin"
  },
  {
    id: 3,
    tag: "Alerta",
    titulo: "Precaución por crecida del Río Dulce",
    imagen: "imagenRioDulce.jpg",
    descripcion: "Ante el aumento del caudal del río, se reforzó la vigilancia en la zona de los balnearios y se recomendó a los vecinos no ingresar al cauce y seguir las indicaciones de los equipos apostados en el lugar.",
    fecha: "2026-03-05",
    estado: "aprobada",
    autor: "admin"
  }
];

let rolActual = sessionStorage.getItem("dc_rol") || "admin";

function normalizarNoticia(noticia, indice) {
  return {
    ...noticia,
    id: Number(noticia.id) || indice + 1,
    fecha: noticia.fecha || "2026-01-01",
    estado: noticia.estado || "aprobada",
    autor: noticia.autor || "admin"
  };
}

function cargarNoticias() {
  const guardadas = localStorage.getItem("dc_noticias");
  const noticias = guardadas ? JSON.parse(guardadas) : noticiasPorDefecto;
  return noticias.map(normalizarNoticia);
}

function guardarNoticias(noticias) {
  localStorage.setItem("dc_noticias", JSON.stringify(noticias));
}

const loginScreen = document.getElementById("login-screen");
const panel = document.getElementById("panel");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const loginSubmit = document.getElementById("login-submit");
const loginPassword = document.getElementById("login-pass");
const togglePassword = document.getElementById("toggle-password");
const cambiarPasswordModal = new bootstrap.Modal(document.getElementById("cambiar-password-modal"));
const cambiarPasswordForm = document.getElementById("cambiar-password-form");
const cambiarPasswordError = document.getElementById("cambiar-password-error");
const modalGestionUsuarios = new bootstrap.Modal(document.getElementById("modalGestionUsuarios"));
const modalEditarUsuario = new bootstrap.Modal(document.getElementById("modalEditarUsuario"));
const modalConfirmarBaja = new bootstrap.Modal(document.getElementById("modalConfirmarBaja"));
const formUsuario = document.getElementById("form-usuario");
const formEditarUsuario = document.getElementById("form-editar-usuario");
const tablaUsuarios = document.getElementById("tabla-usuarios");
const btnConfirmarBaja = document.getElementById("btn-confirmar-baja");
const mensajeConfirmarBaja = document.getElementById("mensajeConfirmarBaja");
let usuarioPendienteDeBaja = null;

togglePassword.addEventListener("click", function () {
  const isVisible = loginPassword.type === "text";
  loginPassword.type = isVisible ? "password" : "text";
  togglePassword.classList.toggle("is-visible", !isVisible);
  togglePassword.setAttribute("aria-pressed", String(!isVisible));
  togglePassword.setAttribute("aria-label", isVisible ? "Mostrar contraseña" : "Ocultar contraseña");
});

document.querySelectorAll(".password-toggle[data-password-target]").forEach(function (boton) {
  boton.addEventListener("click", function () {
    const input = document.getElementById(boton.dataset.passwordTarget);
    const isVisible = input.type === "text";
    input.type = isVisible ? "password" : "text";
    boton.classList.toggle("is-visible", !isVisible);
    boton.setAttribute("aria-pressed", String(!isVisible));
    boton.setAttribute("aria-label", isVisible ? "Mostrar contraseña" : "Ocultar contraseña");
  });
});

function mostrarPanel() {
  loginScreen.classList.add("d-none");
  panel.classList.remove("d-none");
  actualizarIdentidadRol();
  document.getElementById("menu-gestion-usuarios").classList.toggle("d-none", rolActual !== "superadmin");
  document.getElementById("editor-column").classList.toggle("d-none", rolActual === "superadmin");
  renderNoticias();
}

function actualizarIdentidadRol() {
  const rolGuardado = sessionStorage.getItem("dc_rol");
  const rol = rolGuardado === "superadmin" ? "superadmin" : "admin";
  const rolActualElement = document.getElementById("rol-actual");
  const rolIcono = document.getElementById("rol-icono");

  rolActual = rol;
  rolActualElement.textContent = rol === "superadmin" ? "Superadmin" : "Administrador";
  rolIcono.classList.remove("role-icon-admin", "role-icon-superadmin");
  rolIcono.classList.add(rol === "superadmin" ? "role-icon-superadmin" : "role-icon-admin");
}

function mostrarLogin() {
  panel.classList.add("d-none");
  loginScreen.classList.remove("d-none");
  loginForm.reset();
  loginForm.querySelectorAll("input, button").forEach(function (control) {
    control.disabled = false;
  });
  loginSubmit.classList.remove("is-loading");
  loginSubmit.removeAttribute("aria-label");
  loginPassword.type = "password";
  togglePassword.classList.remove("is-visible");
  togglePassword.setAttribute("aria-pressed", "false");
  togglePassword.setAttribute("aria-label", "Mostrar contraseña");
  loginError.classList.add("d-none");
}

function iniciarSesion() {
  const usuario = document.getElementById("login-user").value.trim();
  const pass = document.getElementById("login-pass").value;

  const usuarioGuardado = cargarUsuariosApp().find(function (datos) {
    return datos.usuario === usuario && datos.password === pass && datos.activo !== false;
  });
  const credencialFija = Object.entries(CREDENCIALES).find(function ([, datos]) {
    return datos.usuario === usuario && datos.password === pass;
  });
  const credencial = usuarioGuardado || (credencialFija ? {
    usuario: credencialFija[1].usuario,
    rol: credencialFija[0]
  } : null);

  if (credencial) {
    if (loginSubmit.disabled) return;

    rolActual = credencial.rol;
    sessionStorage.setItem("dc_usuario", credencial.usuario);
    sessionStorage.setItem("dc_logueado", "si");
    sessionStorage.setItem("dc_rol", rolActual);
    loginError.classList.add("d-none");
    loginSubmit.classList.add("is-loading");
    loginSubmit.disabled = true;
    loginSubmit.setAttribute("aria-label", "Ingresando al panel");
    loginForm.querySelectorAll("input, button").forEach(function (control) {
      control.disabled = true;
    });

    setTimeout(function () {
      mostrarPanel();
    }, 700);
  } else {
    loginError.textContent = "Usuario o contraseña incorrectos.";
    loginError.classList.remove("d-none");
  }
}

loginForm.addEventListener("submit", function (e) {
  e.preventDefault();
  iniciarSesion();
});

loginPassword.addEventListener("input", function () {
  const usuario = document.getElementById("login-user").value.trim();
  const pass = loginPassword.value;
  const credencialValida = cargarUsuariosApp().some(function (datos) {
    return datos.usuario === usuario && datos.password === pass && datos.activo !== false;
  }) || Object.values(CREDENCIALES).some(function (datos) {
    return datos.usuario === usuario && datos.password === pass;
  });

  if (credencialValida) {
    iniciarSesion();
  }
});

function cerrarSesion() {
  sessionStorage.removeItem("dc_logueado");
  sessionStorage.removeItem("dc_rol");
  mostrarLogin();
}

document.addEventListener("click", function (e) {
  if (e.target.closest("#btn-gestionar-usuarios")) {
    e.preventDefault();
    renderUsuarios();
    modalGestionUsuarios.show();
  }

  if (e.target.closest("#btn-cambiar-password")) {
    e.preventDefault();
    cambiarPasswordForm.reset();
    cambiarPasswordError.classList.add("d-none");
    cambiarPasswordModal.show();
  }

  if (e.target.closest("#btn-logout")) {
    e.preventDefault();
    cerrarSesion();
  }
});

function cargarUsuariosApp() {
  try {
    const usuarios = JSON.parse(localStorage.getItem("usuarios_app") || "[]");
    return Array.isArray(usuarios) ? usuarios : [];
  } catch (error) {
    return [];
  }
}

function guardarUsuariosApp(usuarios) {
  localStorage.setItem("usuarios_app", JSON.stringify(usuarios));
}

function asegurarAdminInicial() {
  const usuarios = cargarUsuariosApp();
  const adminInicial = usuarios.find(usuario => usuario.usuario === CREDENCIALES.admin.usuario);
  let huboCambios = false;

  usuarios.forEach(function (usuario) {
    if (usuario.rol === "admin" && typeof usuario.activo !== "boolean") {
      usuario.activo = true;
      huboCambios = true;
    }
  });

  if (adminInicial) {
    if (huboCambios) guardarUsuariosApp(usuarios);
    return usuarios;
  }

  usuarios.push({
    id: "admin-inicial",
    nombre: "Administrador",
    usuario: CREDENCIALES.admin.usuario,
    password: CREDENCIALES.admin.password,
    rol: "admin",
    activo: true
  });
  guardarUsuariosApp(usuarios);
  return usuarios;
}

function renderUsuarios() {
  const administradores = asegurarAdminInicial().filter(usuario => usuario.rol === "admin");
  tablaUsuarios.innerHTML = administradores.length
    ? administradores.map(function (usuario) {
      return '<tr>' +
        '<td>' + escaparHTML(usuario.nombre) + '</td>' +
        '<td>' + escaparHTML(usuario.usuario) + '</td>' +
        '<td><span class="badge ' + (usuario.activo === false ? "bg-secondary" : "bg-success") + '">' + (usuario.activo === false ? "De baja" : "Activo") + '</span></td>' +
        '<td class="text-end text-nowrap">' +
        '<button type="button" class="btn btn-sm btn-outline-primary me-1 btn-editar-usuario" data-id="' + escaparHTML(usuario.id) + '">Editar</button>' +
        '<button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-usuario" data-id="' + escaparHTML(usuario.id) + '">Dar de baja</button>' +
        '</td></tr>';
    }).join("")
    : '<tr><td colspan="4" class="text-center text-muted py-4">No hay administradores registrados.</td></tr>';
}

formUsuario.addEventListener("submit", function (e) {
  e.preventDefault();

  const usuarios = cargarUsuariosApp();
  const nombre = document.getElementById("usuario-nombre").value.trim();
  const usuario = document.getElementById("usuario-usuario").value.trim();
  const password = document.getElementById("usuario-password").value;

  if (usuarios.some(item => item.usuario === usuario)) {
    mostrarToast("Ese nombre de usuario ya existe.", "warning");
    return;
  }

  usuarios.push({ id: Date.now(), nombre: nombre, usuario: usuario, password: password, rol: "admin", activo: true });
  guardarUsuariosApp(usuarios);
  formUsuario.reset();
  renderUsuarios();
  mostrarToast("Administrador agregado correctamente.", "success");
});

tablaUsuarios.addEventListener("click", function (e) {
  const boton = e.target.closest("button");
  if (!boton) return;

  const usuarios = cargarUsuariosApp();
  const indice = usuarios.findIndex(usuario => String(usuario.id) === boton.dataset.id);
  if (indice === -1) return;

  if (boton.classList.contains("btn-eliminar-usuario")) {
    const nombre = usuarios[indice].nombre || usuarios[indice].usuario;
    usuarioPendienteDeBaja = usuarios[indice].id;
    mensajeConfirmarBaja.textContent = "¿Está seguro de que desea dar de baja a " + nombre + "?";
    modalConfirmarBaja.show();
    return;
  }

  if (boton.classList.contains("btn-editar-usuario")) {
    document.getElementById("editar-usuario-id").value = usuarios[indice].id;
    document.getElementById("editar-usuario-nombre").value = usuarios[indice].nombre;
    document.getElementById("editar-usuario-usuario").value = usuarios[indice].usuario;
    document.getElementById("editar-usuario-password").value = "";
    modalEditarUsuario.show();
  }
});

formEditarUsuario.addEventListener("submit", function (e) {
  e.preventDefault();
  const usuarios = cargarUsuariosApp();
  const id = document.getElementById("editar-usuario-id").value;
  const indice = usuarios.findIndex(usuario => String(usuario.id) === id);
  const nombre = document.getElementById("editar-usuario-nombre").value.trim();
  const usuario = document.getElementById("editar-usuario-usuario").value.trim();
  const password = document.getElementById("editar-usuario-password").value;

  if (indice === -1) return;
  if (usuarios.some((item, posicion) => posicion !== indice && item.usuario === usuario)) {
    mostrarToast("Ese nombre de usuario ya existe.", "warning");
    return;
  }
  if (password && password.length < 6) {
    mostrarToast("La contraseña debe tener al menos 6 caracteres.", "warning");
    return;
  }

  usuarios[indice].nombre = nombre;
  usuarios[indice].usuario = usuario;
  if (password) usuarios[indice].password = password;
  guardarUsuariosApp(usuarios);
  renderUsuarios();
  modalEditarUsuario.hide();
  mostrarToast("Administrador actualizado correctamente.", "success");
});

btnConfirmarBaja.addEventListener("click", function () {
  if (usuarioPendienteDeBaja === null) return;
  const usuarios = cargarUsuariosApp().filter(usuario => String(usuario.id) !== String(usuarioPendienteDeBaja));
  guardarUsuariosApp(usuarios);
  usuarioPendienteDeBaja = null;
  modalConfirmarBaja.hide();
  renderUsuarios();
  mostrarToast("Administrador dado de baja.", "warning");
});

cambiarPasswordForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const passwordActual = document.getElementById("password-actual").value;
  const passwordNueva = document.getElementById("password-nueva").value;
  const passwordConfirmacion = document.getElementById("password-confirmacion").value;

  if (passwordActual !== CREDENCIALES[rolActual].password) {
    cambiarPasswordError.textContent = "La contraseña actual es incorrecta.";
    cambiarPasswordError.classList.remove("d-none");
    return;
  }

  if (passwordNueva.length < 6) {
    cambiarPasswordError.textContent = "La nueva contraseña debe tener al menos 6 caracteres.";
    cambiarPasswordError.classList.remove("d-none");
    return;
  }

  if (passwordNueva !== passwordConfirmacion) {
    cambiarPasswordError.textContent = "Las nuevas contraseñas no coinciden.";
    cambiarPasswordError.classList.remove("d-none");
    return;
  }

  CREDENCIALES[rolActual].password = passwordNueva;
  localStorage.setItem("dc_credenciales", JSON.stringify(CREDENCIALES));
  cambiarPasswordModal.hide();
  mostrarToast("Contraseña actualizada correctamente.", "success");
});

document.querySelectorAll("#panel-tabs .nav-link").forEach(function (boton) {
  boton.addEventListener("click", function () {
    document.querySelectorAll("#panel-tabs .nav-link").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.add("d-none"));
    boton.classList.add("active");
    document.getElementById(boton.dataset.tab).classList.remove("d-none");
  });
});

const listaNoticias = document.getElementById("lista-noticias");
const noticiaForm = document.getElementById("noticia-form");
const noticiaFormTitle = document.getElementById("noticia-form-title-text");
const btnCancelarNoticia = document.getElementById("btn-cancelar-noticia");
const noticiaFecha = document.getElementById("noticia-fecha");
const noticiaImagenInput = document.getElementById("noticia-imagen");
const noticiaImagenData = document.getElementById("noticia-imagen-data");
const noticiaImagenPreview = document.getElementById("noticia-imagen-preview");
const filtroEstado = document.getElementById("filtro-estado");
const filtroAnio = document.getElementById("filtro-anio");
const filtroOrden = document.getElementById("filtro-orden");
const vistaPreviaModal = new bootstrap.Modal(document.getElementById("vista-previa-modal"));
const confirmarOcultarModal = new bootstrap.Modal(document.getElementById("confirmar-ocultar-modal"));
const confirmarPublicacionModal = new bootstrap.Modal(document.getElementById("confirmar-publicacion-modal"));
const btnConfirmarOcultar = document.getElementById("btn-confirmar-ocultar");
const btnConfirmarPublicacion = document.getElementById("btn-confirmar-publicacion");
const confirmarOcultarTitulo = document.getElementById("confirmar-ocultar-titulo");
const confirmarOcultarMensaje = document.getElementById("confirmar-ocultar-mensaje");
const motivoRechazoInput = document.getElementById("motivo-rechazo");
const toastContainer = document.getElementById("toast-container");
let noticiaPendienteDeOcultar = null;

const nombresEstado = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  eliminada: "Eliminada/Ocultada"
};

function escaparHTML(texto) {
  return String(texto || "").replace(/[&<>'"]/g, function (caracter) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[caracter];
  });
}

function rutaImagen(imagen) {
  return imagen && imagen.startsWith("data:") ? imagen : "img/" + (imagen || "");
}

function mostrarToast(mensaje, tipo) {
  const toastElement = document.createElement("div");
  toastElement.className = "toast align-items-center text-bg-" + (tipo || "primary") + " border-0";
  toastElement.setAttribute("role", "status");
  toastElement.setAttribute("aria-live", "polite");
  toastElement.setAttribute("aria-atomic", "true");
  toastElement.innerHTML =
    '<div class="d-flex"><div class="toast-body">' + escaparHTML(mensaje) + '</div>' +
    '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button></div>';
  toastContainer.appendChild(toastElement);
  const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 3000 });
  toastElement.addEventListener("hidden.bs.toast", function () { toastElement.remove(); });
  toast.show();
}

function actualizarFiltroAnio(noticias) {
  const anioSeleccionado = filtroAnio.value;
  const anios = [...new Set(noticias.map(noticia => noticia.fecha.slice(0, 4)))].sort().reverse();
  filtroAnio.innerHTML = '<option value="todos">Todos los años</option>' + anios.map(anio =>
    '<option value="' + anio + '">' + anio + '</option>'
  ).join("");
  filtroAnio.value = anios.includes(anioSeleccionado) ? anioSeleccionado : "todos";
}

noticiaImagenInput.addEventListener("change", function () {
  const archivo = noticiaImagenInput.files[0];
  if (!archivo) return;

  const lector = new FileReader();
  lector.onload = function () {
    noticiaImagenData.value = lector.result;
    noticiaImagenPreview.src = lector.result;
    noticiaImagenPreview.classList.remove("d-none");
    guardarBorradorNoticia();
  };
  lector.readAsDataURL(archivo);
});

function renderNoticias() {
  const todasLasNoticias = cargarNoticias();
  actualizarFiltroAnio(todasLasNoticias);
  const estado = filtroEstado.value;
  const anio = filtroAnio.value;
  const orden = filtroOrden.value;
  const prioridadEstado = { pendiente: 0, aprobada: 1, eliminada: 2 };
  const noticias = todasLasNoticias
    .filter(noticia => estado === "todas" || noticia.estado === estado)
    .filter(noticia => anio === "todos" || noticia.fecha.startsWith(anio))
    .sort((a, b) => {
      if (rolActual === "superadmin" && estado === "todas") {
        const diferenciaEstado = prioridadEstado[a.estado] - prioridadEstado[b.estado];
        if (diferenciaEstado !== 0) return diferenciaEstado;
      }
      const diferencia = new Date(a.fecha) - new Date(b.fecha);
      return orden === "asc" ? diferencia : -diferencia;
    });
  listaNoticias.innerHTML = "";

  if (noticias.length === 0) {
    listaNoticias.innerHTML =
      '<div class="empty-state text-center" role="status">' +
      '<svg class="empty-state-icon" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h5l2 2h8A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-11Z"/>' +
      '<path d="M8 12h8M8 15h5"/>' +
      '</svg>' +
      '<p class="empty-state-text mb-0">No se encontraron noticias con estos filtros</p>' +
      '</div>';
    return;
  }

  noticias.forEach(function (noticia) {
    const item = document.createElement("div");
    item.className = "noticia-item estado-borde-" + noticia.estado +
      (rolActual === "superadmin" && noticia.estado === "pendiente" && noticia.bajadaPorAdmin === true ? " border-danger" : "");
    const puedeEditar = rolActual === "admin" && noticia.autor === rolActual;
    const puedeOcultar = rolActual === "admin" && noticia.autor === rolActual && noticia.estado !== "eliminada";
    const accionesAdmin = puedeEditar
      ? noticia.estado === "pendiente"
        ? '<button class="btn btn-sm btn-outline-primary btn-editar" data-id="' + noticia.id + '">Editar</button>'
          + '<button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="' + noticia.id + '">Descartar</button>'
        : '<button class="btn btn-sm btn-outline-primary btn-editar" data-id="' + noticia.id + '">Editar</button>'
          + (puedeOcultar ? '<button class="btn btn-sm btn-outline-danger btn-ocultar" data-id="' + noticia.id + '">Ocultar publicación</button>' : '')
      : "";
    const accionesSuperadmin = rolActual === "superadmin"
      ? '<button class="btn btn-sm btn-outline-primary btn-preview" data-id="' + noticia.id + '">Vista previa</button>'
        + (noticia.estado === "pendiente" ? '<button class="btn btn-sm btn-success btn-aprobar" data-id="' + noticia.id + '">Aprobar</button>' : '')
        + (noticia.estado === "pendiente" ? '<button class="btn btn-sm btn-danger btn-rechazar" data-id="' + noticia.id + '">Rechazar</button>' : '')
        + (noticia.estado === "aprobada" ? '<button class="btn btn-sm btn-outline-danger btn-ocultar-superadmin" data-id="' + noticia.id + '">Ocultar publicación</button>' : '')
      : "";
    item.innerHTML =
      '<div class="d-flex justify-content-between align-items-start gap-2">' +
      '<span class="badge badge-tag bg-secondary">' + escaparHTML(noticia.tag) + '</span>' +
      '<span class="badge estado-' + noticia.estado + '">' + nombresEstado[noticia.estado] + '</span></div>' +
      (rolActual === "superadmin" && noticia.estado === "pendiente" && noticia.bajadaPorAdmin === true
        ? '<span class="badge bg-danger mb-2">&#9888; Retirada de la web por admin</span><p class="small text-danger mb-2"><strong>Motivo:</strong> ' + escaparHTML(noticia.motivoBajada || "Sin motivo indicado") + '</p>'
        : '') +
      '<h3 class="h6 mb-1 mt-2">' + escaparHTML(noticia.titulo) + '</h3>' +
      '<p class="small text-muted mb-2">' + escaparHTML(noticia.descripcion) + '</p>' +
      (noticia.estado === "eliminada" && noticia.motivoRechazo
        ? '<p class="small alert alert-warning mb-2"><strong>Motivo del rechazo:</strong> ' + escaparHTML(noticia.motivoRechazo) + '</p>'
        : '') +
      '<p class="small mb-2"><strong>Fecha:</strong> ' + escaparHTML(noticia.fecha) + ' <span class="text-muted">| Autor: ' + escaparHTML(noticia.autor) + '</span></p>' +
      '<div class="d-flex flex-wrap gap-2">' + accionesAdmin + accionesSuperadmin +
      '</div>';
    listaNoticias.appendChild(item);
  });

  listaNoticias.querySelectorAll(".btn-editar").forEach(function (btn) {
    btn.addEventListener("click", function () {
      editarNoticia(Number(btn.dataset.id));
    });
  });

  listaNoticias.querySelectorAll(".btn-ocultar").forEach(function (btn) {
    btn.addEventListener("click", function () {
      solicitarOcultamiento(Number(btn.dataset.id));
    });
  });

  listaNoticias.querySelectorAll(".btn-eliminar").forEach(function (btn) {
    btn.addEventListener("click", function () {
      solicitarOcultamiento(Number(btn.dataset.id));
    });
  });

  listaNoticias.querySelectorAll(".btn-aprobar").forEach(function (btn) {
    btn.addEventListener("click", function () { cambiarEstado(Number(btn.dataset.id), "aprobada"); });
  });

  listaNoticias.querySelectorAll(".btn-rechazar").forEach(function (btn) {
    btn.addEventListener("click", function () { solicitarOcultamiento(Number(btn.dataset.id)); });
  });

  listaNoticias.querySelectorAll(".btn-ocultar-superadmin").forEach(function (btn) {
    btn.addEventListener("click", function () {
      solicitarOcultamientoPublicacion(Number(btn.dataset.id));
    });
  });

  listaNoticias.querySelectorAll(".btn-preview").forEach(function (btn) {
    btn.addEventListener("click", function () { mostrarVistaPrevia(Number(btn.dataset.id)); });
  });
}

function editarNoticia(id) {
  const noticias = cargarNoticias();
  const noticia = noticias.find(n => n.id === id);
  if (!noticia) return;

  document.getElementById("noticia-id").value = noticia.id;
  document.getElementById("noticia-tag").value = noticia.tag;
  document.getElementById("noticia-titulo").value = noticia.titulo;
  noticiaFecha.value = noticia.fecha;
  document.getElementById("noticia-imagen").value = "";
  noticiaImagenData.value = noticia.imagen;
  noticiaImagenPreview.src = noticia.imagen.startsWith("data:") ? noticia.imagen : "img/" + noticia.imagen;
  noticiaImagenPreview.classList.remove("d-none");
  document.getElementById("noticia-descripcion").value = noticia.descripcion;

  noticiaFormTitle.textContent = "Editar noticia";
  btnCancelarNoticia.classList.remove("d-none");
}

function cambiarEstado(id, estado, motivo) {
  const noticias = cargarNoticias();
  const noticia = noticias.find(n => n.id === id);
  if (!noticia) return;

  const estadoAnterior = noticia.estado;
  noticia.estado = estado;
  if (rolActual === "admin" && estadoAnterior === "aprobada" && estado === "pendiente") {
    noticia.bajadaPorAdmin = true;
    noticia.motivoBajada = motivo || "";
  } else if (estado === "eliminada" && motivo) {
    noticia.motivoRechazo = motivo;
  } else if (estado === "aprobada") {
    delete noticia.motivoRechazo;
    delete noticia.bajadaPorAdmin;
    delete noticia.motivoBajada;
  }
  guardarNoticias(noticias);
  renderNoticias();
  const mensajes = {
    aprobada: "Noticia aprobada y publicada.",
    eliminada: rolActual === "superadmin" ? "Noticia rechazada y ocultada." : "Noticia ocultada."
  };
  mostrarToast(mensajes[estado] || "Estado de la noticia actualizado.", estado === "aprobada" ? "success" : "warning");
}

function solicitarOcultamiento(id) {
  noticiaPendienteDeOcultar = id;
  motivoRechazoInput.value = "";
  motivoRechazoInput.classList.remove("is-invalid");
  const esSuperadmin = rolActual === "superadmin";
  confirmarOcultarTitulo.textContent = esSuperadmin ? "Rechazar noticia" : "Ocultar noticia";
  confirmarOcultarMensaje.textContent = esSuperadmin
    ? "¿Estás seguro de que deseas rechazar esta noticia?"
    : "¿Estás seguro de que deseas ocultar esta noticia de la web pública?";
  btnConfirmarOcultar.textContent = esSuperadmin ? "Sí, rechazar" : "Sí, ocultar";
  confirmarOcultarModal.show();
}

function solicitarOcultamientoPublicacion(id) {
  noticiaPendienteDeOcultar = id;
  confirmarPublicacionModal.show();
}

btnConfirmarOcultar.addEventListener("click", function () {
  if (noticiaPendienteDeOcultar === null) return;

  const motivo = motivoRechazoInput.value.trim();
  if (rolActual === "superadmin" && !motivo) {
    motivoRechazoInput.classList.add("is-invalid");
    motivoRechazoInput.focus();
    return;
  }

  const noticia = cargarNoticias().find(n => n.id === noticiaPendienteDeOcultar);
  const esBajadaDeNoticiaAprobada = rolActual === "admin" && noticia && noticia.estado === "aprobada";
  cambiarEstado(noticiaPendienteDeOcultar, esBajadaDeNoticiaAprobada ? "pendiente" : "eliminada", motivo);
  noticiaPendienteDeOcultar = null;
  confirmarOcultarModal.hide();
});

btnConfirmarPublicacion.addEventListener("click", function () {
  if (noticiaPendienteDeOcultar === null) return;

  cambiarEstado(noticiaPendienteDeOcultar, "eliminada");
  noticiaPendienteDeOcultar = null;
  confirmarPublicacionModal.hide();
});

document.getElementById("confirmar-ocultar-modal").addEventListener("hidden.bs.modal", function () {
  noticiaPendienteDeOcultar = null;
  motivoRechazoInput.value = "";
  motivoRechazoInput.classList.remove("is-invalid");
});

document.getElementById("confirmar-publicacion-modal").addEventListener("hidden.bs.modal", function () {
  noticiaPendienteDeOcultar = null;
});

function mostrarVistaPrevia(id) {
  const noticia = cargarNoticias().find(n => n.id === id);
  if (!noticia) return;

  document.getElementById("vista-previa-contenido").innerHTML =
    '<img src="' + escaparHTML(rutaImagen(noticia.imagen)) + '" alt="' + escaparHTML(noticia.titulo) + '" class="img-fluid rounded mb-3 preview-news-image">' +
    '<span class="badge badge-tag mb-2">' + escaparHTML(noticia.tag) + '</span>' +
    '<h3 class="h4">' + escaparHTML(noticia.titulo) + '</h3>' +
    '<p class="text-muted mb-0">' + escaparHTML(noticia.descripcion) + '</p>';
  vistaPreviaModal.show();
}

btnCancelarNoticia.addEventListener("click", function () {
  noticiaForm.reset();
  document.getElementById("noticia-id").value = "";
  noticiaFecha.value = new Date().toISOString().slice(0, 10);
  noticiaImagenData.value = "";
  noticiaImagenPreview.classList.add("d-none");
  noticiaFormTitle.textContent = "Nueva noticia";
  btnCancelarNoticia.classList.add("d-none");
});

function guardarBorradorNoticia() {
  if (document.getElementById("noticia-id").value) return;

  localStorage.setItem("noticia_borrador", JSON.stringify({
    tag: document.getElementById("noticia-tag").value,
    titulo: document.getElementById("noticia-titulo").value,
    descripcion: document.getElementById("noticia-descripcion").value,
    fecha: noticiaFecha.value,
    imagen: noticiaImagenData.value
  }));
}

function restaurarBorradorNoticia() {
  if (document.getElementById("noticia-id").value) return;

  const borradorGuardado = localStorage.getItem("noticia_borrador");
  if (!borradorGuardado) return;

  try {
    const borrador = JSON.parse(borradorGuardado);
    document.getElementById("noticia-tag").value = borrador.tag || "";
    document.getElementById("noticia-titulo").value = borrador.titulo || "";
    document.getElementById("noticia-descripcion").value = borrador.descripcion || "";
    noticiaFecha.value = borrador.fecha || noticiaFecha.value;
    noticiaImagenData.value = borrador.imagen || "";
    if (borrador.imagen) {
      noticiaImagenPreview.src = borrador.imagen;
      noticiaImagenPreview.classList.remove("d-none");
    }
  } catch (error) {
    localStorage.removeItem("noticia_borrador");
  }
}

["noticia-tag", "noticia-titulo", "noticia-descripcion", "noticia-fecha"].forEach(function (id) {
  document.getElementById(id).addEventListener("input", guardarBorradorNoticia);
});

document.addEventListener("DOMContentLoaded", restaurarBorradorNoticia);

noticiaForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const id = document.getElementById("noticia-id").value;
  const noticias = cargarNoticias();

  const datos = {
    tag: document.getElementById("noticia-tag").value.trim(),
    titulo: document.getElementById("noticia-titulo").value.trim(),
    imagen: noticiaImagenData.value,
    descripcion: document.getElementById("noticia-descripcion").value.trim(),
    fecha: noticiaFecha.value,
    estado: "pendiente",
    autor: rolActual
  };

  if (id) {
    const index = noticias.findIndex(n => n.id === Number(id));
    if (index === -1 || noticias[index].autor !== rolActual) return;
    const estadoEditado = noticias[index].estado === "aprobada" ? "pendiente" : datos.estado;
    noticias[index] = { ...noticias[index], ...datos, estado: estadoEditado, id: Number(id) };
  } else {
    const nuevoId = noticias.length ? Math.max(...noticias.map(n => n.id)) + 1 : 1;
    noticias.push({ id: nuevoId, ...datos });
  }

  guardarNoticias(noticias);
  localStorage.removeItem("noticia_borrador");
  noticiaForm.reset();
  document.getElementById("noticia-id").value = "";
  noticiaFecha.value = new Date().toISOString().slice(0, 10);
  noticiaImagenData.value = "";
  noticiaImagenPreview.classList.add("d-none");
  noticiaFormTitle.textContent = "Nueva noticia";
  btnCancelarNoticia.classList.add("d-none");
  renderNoticias();
  mostrarToast(id ? "Noticia actualizada y enviada a revisión." : "Noticia guardada y enviada a revisión.", "success");
});

[filtroEstado, filtroAnio, filtroOrden].forEach(function (filtro) {
  filtro.addEventListener("change", renderNoticias);
});

noticiaFecha.value = new Date().toISOString().slice(0, 10);

if (sessionStorage.getItem("dc_logueado") === "si") {
  mostrarPanel();
}

