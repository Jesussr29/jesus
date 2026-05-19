// Registramos el Service Worker si el navegador lo soporta
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/service-worker.js")
      .then(function (registro) {
        console.log("Service Worker registrado correctamente");
      })
      .catch(function (error) {
        console.log("Error al registrar el Service Worker:", error);
      });
  });
}
