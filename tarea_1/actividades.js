// Obtiene el usuario actualmente seleccionado en el formulario de actividades.
function getUsuarioSeleccionado() {
    const usuarioSelect = document.getElementById("usuario-actividad");
    if (!usuarioSelect || usuarioSelect.value === "") {
        return null;
    }
    return obtenerUsuarioPorRut(usuarioSelect.value);
}

// Agrega una actividad al arreglo de actividades de un usuario.
function agregarActividadAUsuario(usuario, nombre, tipo, fecha, horas, foto) {
    if (!usuario) {
        return;
    }
    usuario.actividades.push({ nombre, tipo, fecha, horas, foto });
}

// Crea el nodo HTML para mostrar una actividad registrada en la lista.
function crearElementoActividad(nombre, tipo, fecha, horas, foto, nombreUsuario) {
    const nuevoElemento = document.createElement("div");
    nuevoElemento.className = "actividad-item";
    nuevoElemento.innerHTML = `
        <span class="tipo">${tipo.toUpperCase()}</span>
        <span class="nombre">${nombre}</span>
        <span> - Fecha: ${fecha}</span>
        <span> - Duracion: ${horas} horas</span>
        <span class="usuario">Asignado a: ${nombreUsuario}</span>
        <br>
        <a href="${foto}" target="_blank" style="color: #0066cc; text-decoration: none; font-size: 0.9em;">Ver foto/informacion</a>
    `;
    return nuevoElemento;
}

// Construye una lista plana con todas las actividades de todos los usuarios.
function obtenerTodasLasActividades() {
    const todas = [];
    usuarios.forEach(usuario => {
        if (usuario.actividades && usuario.actividades.length > 0) {
            usuario.actividades.forEach(actividad => {
                todas.push({ ...actividad, nombreUsuario: usuario.nombre });
            });
        }
    });
    return todas;
}

// Renderiza la lista de actividades aplicando el filtro de busqueda.
function actualizarListaActividades() {
    const listaActividades = document.getElementById("lista-actividades");
    const campoBusqueda = document.getElementById("buscar-actividad");
    const filtro = campoBusqueda ? campoBusqueda.value.trim().toLowerCase() : "";
    const todasLasActividades = obtenerTodasLasActividades();

    if (!listaActividades) {
        return;
    }

    listaActividades.innerHTML = "";

    const actividadesFiltradas = todasLasActividades.filter(actividad => {
        if (filtro === "") {
            return true;
        }
        const textoActividad = [
            actividad.nombre,
            actividad.tipo,
            actividad.fecha,
            actividad.nombreUsuario
        ].join(" ").toLowerCase();
        return textoActividad.includes(filtro);
    });

    actividadesFiltradas.forEach(actividad => {
        listaActividades.appendChild(
            crearElementoActividad(
                actividad.nombre,
                actividad.tipo,
                actividad.fecha,
                actividad.horas,
                actividad.foto,
                actividad.nombreUsuario
            )
        );
    });

    const totalActividades = document.getElementById("total-actividades");
    if (totalActividades) {
        totalActividades.textContent = actividadesFiltradas.length;
    }
}

// Actualiza en conjunto la lista de actividades y el grafico.
function actualizarContador() {
    actualizarListaActividades();
    if (typeof actualizarGrafico === "function") {
        actualizarGrafico();
    }
}

// Inicializa el formulario de actividades, validaciones y guardado.
function inicializarFormulario() {
    const form = document.getElementById("form-actividad");
    if (!form) {
        return;
    }

    form.addEventListener("submit", function(event) {
        event.preventDefault();

        const usuarioSeleccionadoActual = getUsuarioSeleccionado();
        const nombre = document.getElementById("nombre-actividad").value.trim();
        const tipo = document.getElementById("tipo-actividad").value;
        const fecha = document.getElementById("fecha-actividad").value;
        const horas = document.getElementById("horas-actividad").value;
        const foto = document.getElementById("foto-actividad").value.trim();

        const errorUsuario = document.getElementById("error-usuario");
        const errorNombre = document.getElementById("error-nombre");
        const errorTipo = document.getElementById("error-tipo");
        const errorFecha = document.getElementById("error-fecha");
        const errorHoras = document.getElementById("error-horas");
        const errorFoto = document.getElementById("error-foto");

        errorUsuario.classList.remove("visible");
        errorNombre.classList.remove("visible");
        errorTipo.classList.remove("visible");
        errorFecha.classList.remove("visible");
        errorHoras.classList.remove("visible");
        errorFoto.classList.remove("visible");

        let valido = true;

        if (!usuarioSeleccionadoActual) {
            errorUsuario.classList.add("visible");
            valido = false;
        }
        if (nombre === "" || nombre.length < 3) {
            errorNombre.classList.add("visible");
            valido = false;
        }
        if (tipo === "") {
            errorTipo.classList.add("visible");
            valido = false;
        }
        if (fecha === "") {
            errorFecha.classList.add("visible");
            valido = false;
        }
        if (horas === "" || horas < 1 || horas > 24) {
            errorHoras.classList.add("visible");
            valido = false;
        }
        if (foto === "" || !foto.startsWith("http")) {
            errorFoto.classList.add("visible");
            valido = false;
        }

        if (!valido) {
            return;
        }

        agregarActividadAUsuario(usuarioSeleccionadoActual, nombre, tipo, fecha, horas, foto);
        actualizarContador();
        form.reset();
    });
}

// Inicializa eventos y render del modulo de actividades.
function inicializarActividades() {
    const buscarActividad = document.getElementById("buscar-actividad");
    if (buscarActividad) {
        buscarActividad.addEventListener("input", actualizarListaActividades);
    }
    inicializarFormulario();
    actualizarListaActividades();
}

document.addEventListener("DOMContentLoaded", inicializarActividades);
