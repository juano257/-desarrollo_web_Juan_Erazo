function limpiarErrores(form) {
  form.querySelectorAll(".error").forEach((error) => {
    error.textContent = "";
    error.classList.remove("visible");
  });
}

function mostrarError(form, campo, mensaje) {
  const error = form.querySelector(`[data-error="${campo}"]`);
  if (error) {
    error.textContent = mensaje;
    error.classList.add("visible");
  }
}

function validarComentario(form) {
  limpiarErrores(form);
  const nombre = form.elements.nombre.value.trim();
  const texto = form.elements.texto.value.trim();
  let valido = true;

  if (nombre.length < 3 || nombre.length > 80) {
    mostrarError(form, "nombre", "El nombre debe tener entre 3 y 80 caracteres.");
    valido = false;
  }

  if (texto.length < 5) {
    mostrarError(form, "texto", "El comentario debe tener al menos 5 caracteres.");
    valido = false;
  } else if (texto.length > 300) {
    mostrarError(form, "texto", "El comentario no puede superar los 300 caracteres.");
    valido = false;
  }

  return valido;
}

function renderComentarios(section, comentarios) {
  const lista = section.querySelector(".comentarios-lista");
  lista.innerHTML = "";

  if (!comentarios.length) {
    const vacio = document.createElement("p");
    vacio.className = "hint";
    vacio.textContent = "Esta actividad aun no tiene comentarios.";
    lista.appendChild(vacio);
    return;
  }

  comentarios.forEach((comentario) => {
    const article = document.createElement("article");
    article.className = "comentario-item";

    const meta = document.createElement("p");
    meta.className = "comentario-meta";
    meta.textContent = `${comentario.fecha} - ${comentario.nombre}`;

    const texto = document.createElement("p");
    texto.textContent = comentario.texto;

    article.append(meta, texto);
    lista.appendChild(article);
  });
}

async function cargarComentarios(section) {
  const actividadId = section.dataset.actividadId;
  const lista = section.querySelector(".comentarios-lista");

  try {
    const response = await fetch(`/api/actividades/${actividadId}/comentarios`);
    if (!response.ok) {
      throw new Error("No se pudieron cargar los comentarios.");
    }
    const data = await response.json();
    renderComentarios(section, data.comentarios);
  } catch (err) {
    lista.innerHTML = "";
    const error = document.createElement("p");
    error.className = "error visible";
    error.textContent = err.message;
    lista.appendChild(error);
  }
}

async function enviarComentario(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const section = form.closest(".comentarios");
  const actividadId = section.dataset.actividadId;

  if (!validarComentario(form)) {
    return;
  }

  const payload = {
    nombre: form.elements.nombre.value.trim(),
    texto: form.elements.texto.value.trim(),
  };

  try {
    const response = await fetch(`/api/actividades/${actividadId}/comentarios`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      Object.entries(data.errores || {}).forEach(([campo, mensaje]) => {
        mostrarError(form, campo, mensaje);
      });
      return;
    }

    form.reset();
    await cargarComentarios(section);
  } catch (err) {
    mostrarError(form, "texto", "No se pudo guardar el comentario. Intente nuevamente.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".comentarios").forEach((section) => {
    cargarComentarios(section);
    section.querySelector(".comentario-form").addEventListener("submit", enviarComentario);
  });
});
