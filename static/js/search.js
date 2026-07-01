function escaparHtml(texto) {
  return texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function destacarTexto(texto, patron) {
  const contenidoSeguro = escaparHtml(texto || "");
  if (patron.length < 3) {
    return contenidoSeguro;
  }

  const regex = new RegExp(`(${escapeRegex(patron)})`, "gi");
  return contenidoSeguro.replace(regex, "<mark>$1</mark>");
}

function formatearNota(nota) {
  if (nota === "-") {
    return "-";
  }
  return Number(nota).toFixed(2);
}

function crearCardActividad(actividad, patron) {
  const card = document.createElement("article");
  card.className = "resultado-item";
  card.dataset.actividadId = String(actividad.id);

  card.innerHTML = `
    <h3>${destacarTexto(actividad.nombre, patron)}</h3>
    <p><strong>Descripcion:</strong> ${destacarTexto(actividad.descripcion, patron)}</p>
    <p><strong>Miembro:</strong> ${escaparHtml(actividad.miembro_nombre)}</p>
    <p><strong>Dia:</strong> ${escaparHtml(actividad.fecha)}</p>
    <p><strong>Tipo:</strong> ${escaparHtml(actividad.tipo)}</p>
    <p><strong>Comuna:</strong> ${destacarTexto(actividad.comuna, patron)}</p>
    <p><strong>Nota:</strong> <span class="actividad-nota">${formatearNota(actividad.nota)}</span></p>
    <p><strong>Evaluaciones:</strong> <span class="actividad-contador">${actividad.total_notas}</span></p>
    <button type="button" class="button-link evaluar-btn">Evaluar</button>
  `;

  return card;
}

function renderResultados(contenedor, actividades, patron) {
  contenedor.innerHTML = "";

  if (!actividades.length) {
    const mensaje = document.createElement("p");
    mensaje.className = "hint";
    mensaje.textContent = "No se encontraron actividades para la busqueda ingresada.";
    contenedor.appendChild(mensaje);
    return;
  }

  actividades.forEach((actividad) => {
    contenedor.appendChild(crearCardActividad(actividad, patron));
  });
}

async function buscarActividades(query, estado, contenedor) {
  if (query.length < 3) {
    estado.textContent = "Escriba al menos 3 caracteres para comenzar la busqueda.";
    contenedor.innerHTML = "";
    return;
  }

  estado.textContent = "Buscando actividades...";

  try {
    const response = await fetch(`/api/actividades/buscar?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error("No se pudo completar la busqueda.");
    }

    const data = await response.json();
    renderResultados(contenedor, data.actividades || [], query);
    estado.textContent = `${(data.actividades || []).length} resultado(s).`;
  } catch (error) {
    estado.textContent = "Ocurrio un error al buscar actividades.";
    contenedor.innerHTML = '<p class="error visible">Intente nuevamente en unos segundos.</p>';
  }
}

async function evaluarActividad(card) {
  const actividadId = card.dataset.actividadId;
  const entrada = window.prompt("Ingrese una nota entera entre 1 y 7:");

  if (entrada === null) {
    return;
  }

  const nota = Number.parseInt(entrada, 10);
  if (!Number.isInteger(nota) || nota < 1 || nota > 7) {
    window.alert("La nota debe ser un numero entero entre 1 y 7.");
    return;
  }

  try {
    const response = await fetch(`/api/actividades/${actividadId}/notas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nota }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "No se pudo guardar la nota.");
    }

    card.querySelector(".actividad-nota").textContent = formatearNota(data.nota);
    card.querySelector(".actividad-contador").textContent = String(data.total_notas);
  } catch (error) {
    window.alert(error.message || "No se pudo guardar la nota.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("busqueda-actividades");
  const estado = document.getElementById("busqueda-estado");
  const contenedor = document.getElementById("busqueda-resultados");

  let timer = null;

  input.addEventListener("input", () => {
    const query = input.value.trim();
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      buscarActividades(query, estado, contenedor);
    }, 250);
  });

  contenedor.addEventListener("click", (event) => {
    if (event.target.classList.contains("evaluar-btn")) {
      const card = event.target.closest(".resultado-item");
      evaluarActividad(card);
    }
  });
});
