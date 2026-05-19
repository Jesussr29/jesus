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
  const nombre = document.getElementById("nombre").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

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
      document.getElementById("error").innerText = data.error;
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("usuario", JSON.stringify({
      nombre: data.nombre,
      tag: data.tag,
      nivel: data.nivel
    }));

    window.location.href = "../index.html";
  });
}
