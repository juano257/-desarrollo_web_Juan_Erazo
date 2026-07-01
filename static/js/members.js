document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".tabla-clicable tbody tr[data-href]").forEach((fila) => {
    fila.addEventListener("click", () => {
      window.location.href = fila.dataset.href;
    });
  });
});
