const API_URL = "https://jesusweb.ddns.net/juntaygana";

// -------- LOGIN --------
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  fetch(API_URL + "/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      document.getElementById("error").innerText = data.error;
      return;
    }

    // Guardar token y datos
    localStorage.setItem("token", data.token);
    localStorage.setItem("usuario", JSON.stringify({
      nombre: data.nombre,
      tag: data.tag,
      nivel: data.nivel
    }));

    // Ir al juego
    window.location.href = "../index.html";
  });
}

// -------- REGISTER --------
function register() {
  const nombre = document.getElementById("nombre")?.value;
  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;
  const confirmPassword = document.getElementById("confirm-password")?.value;
  const error = document.getElementById("error");

  if (!error) {
    console.error("No existe el elemento #error");
    return;
  }

  error.innerText = "";

  // 🔥 VALIDACIÓN CONTRASEÑAS
  if (password !== confirmPassword) {
    error.innerText = "❌ Las contraseñas no coinciden";
    return;
  }

  if (password.length < 6) {
    error.innerText = "❌ La contraseña debe tener al menos 6 caracteres";
    return;
  }

  fetch(API_URL + "/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ nombre, email, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      error.innerText = data.error;
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("usuario", JSON.stringify({
      nombre: data.nombre,
      tag: data.tag,
      nivel: data.nivel
    }));

    window.location.href = "../index.html";
  })
  .catch(() => {
    error.innerText = "❌ Error de conexión con el servidor";
  });
}
