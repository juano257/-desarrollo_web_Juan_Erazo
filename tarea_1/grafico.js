let graficoActual = null;

// Cuenta actividades por tipo para alimentar el grafico de pastel.
function contarActividadesPorTipo() {
    const todasLasActividades = obtenerTodasLasActividades();
    const conteo = {};
    const colores = {
        deportiva: "#FF6384",
        artistica: "#36A2EB",
        tecnologica: "#FFCE56",
        social: "#4BC0C0",
        recreativa: "#9966FF"
    };

    todasLasActividades.forEach(actividad => {
        const tipo = actividad.tipo;
        conteo[tipo] = (conteo[tipo] || 0) + 1;
    });

    const etiquetas = Object.keys(conteo).map(tipo => tipo.charAt(0).toUpperCase() + tipo.slice(1));
    const datos = Object.values(conteo);
    const colorPaleta = Object.keys(conteo).map(tipo => colores[tipo] || "#888");

    return { etiquetas, datos, colorPaleta };
}

// Dibuja o actualiza el grafico de pastel con los datos actuales.
function actualizarGrafico() {
    const { etiquetas, datos, colorPaleta } = contarActividadesPorTipo();
    const canvas = document.getElementById("grafico-pastel");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    if (graficoActual) {
        graficoActual.destroy();
    }

    graficoActual = new Chart(canvas, {
        type: "pie",
        data: {
            labels: etiquetas,
            datasets: [{
                data: datos,
                backgroundColor: colorPaleta,
                borderColor: "#fff",
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        padding: 15,
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", actualizarGrafico);
