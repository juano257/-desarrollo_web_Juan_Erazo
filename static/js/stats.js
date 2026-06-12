function prepararCanvas(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const anchoCss = canvas.clientWidth || canvas.width;
  const altoCss = canvas.clientHeight || canvas.height;
  canvas.width = anchoCss * ratio;
  canvas.height = altoCss * ratio;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, ancho: anchoCss, alto: altoCss };
}

function limpiar(ctx, ancho, alto) {
  ctx.clearRect(0, 0, ancho, alto);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, ancho, alto);
}

function textoSinDatos(ctx, ancho, alto) {
  ctx.fillStyle = "#5b6674";
  ctx.textAlign = "center";
  ctx.font = "15px Segoe UI, sans-serif";
  ctx.fillText("No hay datos para mostrar", ancho / 2, alto / 2);
}

function dibujarEjes(ctx, margen, ancho, alto) {
  ctx.strokeStyle = "#d8dee9";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(margen, margen);
  ctx.lineTo(margen, alto - margen);
  ctx.lineTo(ancho - margen, alto - margen);
  ctx.stroke();
}

function dibujarLinea(canvas, datos) {
  const { ctx, ancho, alto } = prepararCanvas(canvas);
  const margen = 46;
  limpiar(ctx, ancho, alto);

  if (!datos.length) {
    textoSinDatos(ctx, ancho, alto);
    return;
  }

  dibujarEjes(ctx, margen, ancho, alto);
  const maximo = Math.max(...datos.map((item) => item.total), 1);
  const pasoX = datos.length > 1 ? (ancho - margen * 2) / (datos.length - 1) : 0;

  ctx.strokeStyle = "#005f73";
  ctx.lineWidth = 3;
  ctx.beginPath();
  datos.forEach((item, index) => {
    const x = datos.length > 1 ? margen + pasoX * index : ancho / 2;
    const y = alto - margen - (item.total / maximo) * (alto - margen * 2);
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  ctx.fillStyle = "#1f2a37";
  ctx.textAlign = "center";
  ctx.font = "12px Segoe UI, sans-serif";
  datos.forEach((item, index) => {
    const x = datos.length > 1 ? margen + pasoX * index : ancho / 2;
    const y = alto - margen - (item.total / maximo) * (alto - margen * 2);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(String(item.total), x, y - 10);
    ctx.fillText(item.dia.slice(5), x, alto - 16);
  });
}

function dibujarTorta(canvas, datos) {
  const { ctx, ancho, alto } = prepararCanvas(canvas);
  limpiar(ctx, ancho, alto);

  const total = datos.reduce((acc, item) => acc + item.total, 0);
  if (!total) {
    textoSinDatos(ctx, ancho, alto);
    return;
  }

  const colores = ["#005f73", "#0a9396", "#94d2bd", "#ee9b00", "#ca6702", "#9b2226"];
  const radio = Math.min(ancho, alto) * 0.28;
  const centroX = ancho * 0.35;
  const centroY = alto * 0.5;
  let inicio = -Math.PI / 2;

  datos.forEach((item, index) => {
    const angulo = (item.total / total) * Math.PI * 2;
    ctx.fillStyle = colores[index % colores.length];
    ctx.beginPath();
    ctx.moveTo(centroX, centroY);
    ctx.arc(centroX, centroY, radio, inicio, inicio + angulo);
    ctx.closePath();
    ctx.fill();
    inicio += angulo;
  });

  ctx.font = "13px Segoe UI, sans-serif";
  ctx.textAlign = "left";
  datos.forEach((item, index) => {
    const y = 42 + index * 24;
    ctx.fillStyle = colores[index % colores.length];
    ctx.fillRect(ancho * 0.68, y - 12, 14, 14);
    ctx.fillStyle = "#1f2a37";
    ctx.fillText(`${item.tipo}: ${item.total}`, ancho * 0.68 + 22, y);
  });
}

function dibujarBarras(canvas, datos) {
  const { ctx, ancho, alto } = prepararCanvas(canvas);
  const margen = 52;
  limpiar(ctx, ancho, alto);

  if (!datos.length) {
    textoSinDatos(ctx, ancho, alto);
    return;
  }

  dibujarEjes(ctx, margen, ancho, alto);
  const maximo = Math.max(...datos.map((item) => item.total), 1);
  const espacio = (ancho - margen * 2) / datos.length;
  const barraAncho = Math.min(48, espacio * 0.58);

  ctx.font = "12px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  datos.forEach((item, index) => {
    const x = margen + espacio * index + espacio / 2;
    const barraAlto = (item.total / maximo) * (alto - margen * 2);
    const y = alto - margen - barraAlto;

    ctx.fillStyle = "#0a9396";
    ctx.fillRect(x - barraAncho / 2, y, barraAncho, barraAlto);
    ctx.fillStyle = "#1f2a37";
    ctx.fillText(String(item.total), x, y - 8);
    ctx.save();
    ctx.translate(x, alto - 16);
    ctx.rotate(-Math.PI / 7);
    ctx.fillText(item.comuna, 0, 0);
    ctx.restore();
  });
}

async function cargarEstadisticas() {
  const error = document.getElementById("estadisticas-error");

  try {
    const response = await fetch("/api/estadisticas");
    if (!response.ok) {
      throw new Error("No se pudieron cargar las estadisticas.");
    }

    const data = await response.json();
    dibujarLinea(document.getElementById("grafico-miembros-dia"), data.miembros_por_dia);
    dibujarTorta(document.getElementById("grafico-actividades-tipo"), data.actividades_por_tipo);
    dibujarBarras(document.getElementById("grafico-actividades-comuna"), data.actividades_por_comuna);
  } catch (err) {
    error.textContent = err.message;
    error.classList.add("visible");
  }
}

document.addEventListener("DOMContentLoaded", cargarEstadisticas);
