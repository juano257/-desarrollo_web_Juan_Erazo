function toggleError(element, show, message) {
  if (!element) {
    return;
  }

  if (show) {
    if (message) {
      element.textContent = message;
    }
    element.classList.add("visible");
  } else {
    element.classList.remove("visible");
  }
}

function validarMiembroCliente() {
  const rut = document.getElementById("rut").value.trim();
  const nombre = document.getElementById("nombre").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const email = document.getElementById("email").value.trim();
  const grado = document.getElementById("grado_academico").value.trim();
  const comuna = document.getElementById("comuna").value.trim();

  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  let valido = true;

  toggleError(document.getElementById("error-rut"), false);
  toggleError(document.getElementById("error-nombre"), false);
  toggleError(document.getElementById("error-telefono"), false);
  toggleError(document.getElementById("error-email"), false);
  toggleError(document.getElementById("error-grado"), false);
  toggleError(document.getElementById("error-comuna"), false);

  if (!rut) {
    toggleError(document.getElementById("error-rut"), true);
    valido = false;
  }
  if (!nombre) {
    toggleError(document.getElementById("error-nombre"), true);
    valido = false;
  }
  if (!telefono) {
    toggleError(document.getElementById("error-telefono"), true);
    valido = false;
  }
  if (email && !emailRegex.test(email)) {
    toggleError(document.getElementById("error-email"), true);
    valido = false;
  }
  if (!grado) {
    toggleError(document.getElementById("error-grado"), true);
    valido = false;
  }
  if (!comuna) {
    toggleError(document.getElementById("error-comuna"), true);
    valido = false;
  }

  return valido;
}

function validarActividadBloque(actividadBloque) {
  const nombre = actividadBloque.querySelector('input[name="actividad_nombre[]"]').value.trim();
  const descripcion = actividadBloque.querySelector('textarea[name="actividad_descripcion[]"]').value.trim();
  const tipo = actividadBloque.querySelector('select[name="actividad_tipo[]"]').value;
  const fecha = actividadBloque.querySelector('input[name="actividad_fecha[]"]').value;
  const horas = actividadBloque.querySelector('input[name="actividad_horas[]"]').value;
  const fotos = actividadBloque.querySelector('input[type="file"]').files;

  const errorContainer = actividadBloque.querySelector(".errores-actividad");
  errorContainer.innerHTML = "";

  const mensajes = [];

  if (nombre.length < 3) {
    mensajes.push("El nombre de la actividad debe tener al menos 3 caracteres.");
  }
  if (descripcion.length < 5) {
    mensajes.push("La descripcion de la actividad debe tener al menos 5 caracteres.");
  }
  if (!tipo) {
    mensajes.push("Debe seleccionar un tipo de actividad.");
  }
  if (!fecha) {
    mensajes.push("Debe seleccionar una fecha.");
  }
  if (!horas || Number(horas) < 1 || Number(horas) > 24) {
    mensajes.push("La duracion debe estar entre 1 y 24 horas.");
  }
  if (!fotos || fotos.length === 0) {
    mensajes.push("Debe adjuntar al menos una foto.");
  }

  mensajes.forEach((mensaje) => {
    const span = document.createElement("span");
    span.className = "error visible";
    span.textContent = mensaje;
    errorContainer.appendChild(span);
  });

  return mensajes.length === 0;
}

function sincronizarIndices() {
  const bloques = document.querySelectorAll(".actividad-bloque");

  bloques.forEach((bloque, idx) => {
    bloque.dataset.index = String(idx);
    const titulo = bloque.querySelector("h3");
    titulo.textContent = `Actividad ${idx + 1}`;

    const inputFotos = bloque.querySelector('input[type="file"]');
    inputFotos.name = `actividad_fotos_${idx}`;
  });
}

function agregarActividad() {
  const template = document.getElementById("actividad-template").innerHTML;
  const contenedor = document.getElementById("actividades-contenedor");
  const nuevoIndice = contenedor.querySelectorAll(".actividad-bloque").length;

  const html = template
    .replaceAll("__INDEX__", String(nuevoIndice))
    .replaceAll("__NUM__", String(nuevoIndice + 1));

  contenedor.insertAdjacentHTML("beforeend", html);
  sincronizarIndices();
}

document.addEventListener("click", (event) => {
  if (event.target.matches(".remover-actividad")) {
    const bloques = document.querySelectorAll(".actividad-bloque");
    if (bloques.length <= 1) {
      return;
    }
    event.target.closest(".actividad-bloque").remove();
    sincronizarIndices();
  }

  if (event.target.id === "agregar-actividad") {
    agregarActividad();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  sincronizarIndices();

  const form = document.getElementById("registro-form");
  form.addEventListener("submit", (event) => {
    const miembroValido = validarMiembroCliente();

    const bloques = document.querySelectorAll(".actividad-bloque");
    let actividadesValidas = true;
    bloques.forEach((bloque) => {
      if (!validarActividadBloque(bloque)) {
        actividadesValidas = false;
      }
    });

    if (!miembroValido || !actividadesValidas) {
      event.preventDefault();
    }
  });
});
