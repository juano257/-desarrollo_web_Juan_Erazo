let usuarios = [];
let usuarioSeleccionado = "";

// Configura los botones de pestañas y alterna el contenido visible.
function inicializarPestanas() {
    const botonesTab = document.querySelectorAll(".tab-button");
    botonesTab.forEach(boton => {
        boton.addEventListener("click", function() {
            const tabId = this.getAttribute("data-tab");
            const pestanas = document.querySelectorAll(".tab-content");

            pestanas.forEach(pestana => {
                pestana.classList.remove("activo");
            });

            botonesTab.forEach(btn => {
                btn.classList.remove("activo");
            });

            document.getElementById(tabId).classList.add("activo");
            this.classList.add("activo");

            if (tabId === "tab-graficos" && typeof actualizarGrafico === "function") {
                setTimeout(actualizarGrafico, 100);
            }
        });
    });
}

// Verifica que el RUT no esté vacío.
function validarRut(rut) {
    return rut.trim() !== "";
}

// Verifica que el nombre no esté vacío.
function validarNombre(nombre) {
    return nombre.trim() !== "";
}

// Verifica que el teléfono no esté vacío.
function validarTelefono(telefono) {
    return telefono.trim() !== "";
}

// Verifica que el grado académico no esté vacío.
function validarGradoAcademico(grado) {
    return grado.trim() !== "";
}

// Busca y retorna un usuario por su RUT.
function obtenerUsuarioPorRut(rut) {
    return usuarios.find(usuario => usuario.rut === rut) || null;
}

// Rellena el selector de usuarios disponibles para registrar actividades.
function actualizarSelectUsuarios() {
    const usuarioSelect = document.getElementById("usuario-actividad");
    if (!usuarioSelect) {
        return;
    }

    usuarioSelect.innerHTML = "<option value=\"\">-- Seleccione usuario --</option>";
    usuarios.forEach(usuario => {
        const opcion = document.createElement("option");
        opcion.value = usuario.rut;
        opcion.textContent = `${usuario.nombre} (${usuario.grado_academico})`;
        usuarioSelect.appendChild(opcion);
    });

    usuarioSelect.disabled = usuarios.length === 0;
    if (usuarioSeleccionado && obtenerUsuarioPorRut(usuarioSeleccionado)) {
        usuarioSelect.value = usuarioSeleccionado;
    }
}

// Renderiza la tabla de usuarios aplicando el filtro de búsqueda.
function actualizarTablaUsuarios() {
    const cuerpoTabla = document.getElementById("cuerpo-tabla-usuarios");
    const campoBusqueda = document.getElementById("buscar-usuario");
    const filtro = campoBusqueda ? campoBusqueda.value.trim().toLowerCase() : "";

    if (!cuerpoTabla) {
        return;
    }

    cuerpoTabla.innerHTML = "";
    usuarios
        .filter(usuario => {
            if (filtro === "") {
                return true;
            }
            const textoUsuario = [
                usuario.rut,
                usuario.nombre,
                usuario.numero_telefonico,
                usuario.email || "",
                usuario.grado_academico
            ].join(" ").toLowerCase();
            return textoUsuario.includes(filtro);
        })
        .forEach(usuario => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td style="border: 1px solid #ccc; padding: 8px;">${usuario.rut}</td>
                <td style="border: 1px solid #ccc; padding: 8px;">${usuario.nombre}</td>
                <td style="border: 1px solid #ccc; padding: 8px;">${usuario.numero_telefonico}</td>
                <td style="border: 1px solid #ccc; padding: 8px;">${usuario.email || "N/A"}</td>
                <td style="border: 1px solid #ccc; padding: 8px;">${usuario.grado_academico}</td>
            `;
            cuerpoTabla.appendChild(fila);
        });
}

// Valida y registra un nuevo usuario desde el formulario.
function crearUsuario(event) {
    event.preventDefault();

    const rut = document.getElementById("rut").value.trim();
    const nombre = document.getElementById("nombre-usuario").value.trim();
    const telefono = document.getElementById("numero-telefonico").value.trim();
    const email = document.getElementById("email").value.trim();
    const grado = document.getElementById("grado-academico").value.trim();

    const errorRut = document.getElementById("error-rut");
    const errorNombre = document.getElementById("error-nombre-usuario");
    const errorTelefono = document.getElementById("error-telefono");
    const errorGrado = document.getElementById("error-grado");

    errorRut.classList.remove("visible");
    errorNombre.classList.remove("visible");
    errorTelefono.classList.remove("visible");
    errorGrado.classList.remove("visible");

    let valido = true;

    if (!validarRut(rut)) {
        errorRut.classList.add("visible");
        valido = false;
    }
    if (!validarNombre(nombre)) {
        errorNombre.classList.add("visible");
        valido = false;
    }
    if (!validarTelefono(telefono)) {
        errorTelefono.classList.add("visible");
        valido = false;
    }
    if (!validarGradoAcademico(grado)) {
        errorGrado.classList.add("visible");
        valido = false;
    }

    if (!valido) {
        alert("Por favor, complete todos los campos obligatorios.");
        return;
    }

    if (obtenerUsuarioPorRut(rut)) {
        alert("Ya existe un usuario con ese RUT. Use otro RUT o edite el existente.");
        return;
    }

    const usuario = {
        rut,
        nombre,
        numero_telefonico: telefono,
        email: email === "" ? null : email,
        grado_academico: grado,
        actividades: []
    };

    usuarios.push(usuario);
    usuarioSeleccionado = rut;
    actualizarSelectUsuarios();
    actualizarTablaUsuarios();
    if (typeof actualizarListaActividades === "function") {
        actualizarListaActividades();
    }
    if (typeof actualizarGrafico === "function") {
        actualizarGrafico();
    }
    document.getElementById("form-usuario").reset();
    alert("Usuario creado exitosamente.");
}

// Inicializa eventos del módulo de usuarios y sincroniza los listados.
function inicializarUsuario() {
    const formUsuario = document.getElementById("form-usuario");
    if (!formUsuario) {
        return;
    }

    formUsuario.addEventListener("submit", crearUsuario);

    const usuarioSelect = document.getElementById("usuario-actividad");
    const buscarUsuario = document.getElementById("buscar-usuario");

    if (usuarioSelect) {
        usuarioSelect.addEventListener("change", function() {
            usuarioSeleccionado = this.value;
        });
    }

    if (buscarUsuario) {
        buscarUsuario.addEventListener("input", actualizarTablaUsuarios);
    }

    actualizarSelectUsuarios();
    actualizarTablaUsuarios();
}

document.addEventListener("DOMContentLoaded", function() {
    inicializarPestanas();
    inicializarUsuario();
});