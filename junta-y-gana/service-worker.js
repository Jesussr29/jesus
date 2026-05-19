// Evento de instalación
self.addEventListener("install", function (event) {
  console.log("Service Worker instalado");
});

// Evento de activación
self.addEventListener("activate", function (event) {
  console.log("Service Worker activado");
});

// Intercepta peticiones (mínimo obligatorio)
self.addEventListener("fetch", function (event) {
});
