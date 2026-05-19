// ----------------------
// COMPROBAR SI ES ADMIN
// ----------------------
const usuarioActual = JSON.parse(localStorage.getItem("usuario")) || {};
if (usuarioActual.rol !== "administrador") {
    alert("No tienes permisos para acceder a esta página.");
    window.location.href = "/index.html";
}

// ----------------------
// AÑADIR OPCIÓN DE ADMIN EN EL FOOTER
// ----------------------
function añadirOpcionAdmin() {
    if (usuarioActual.rol !== "administrador") return;

    const footer = document.querySelector(".footer-juego");
    if (document.getElementById("opcion-admin")) return;

    const opcionAdmin = document.createElement("a");
    opcionAdmin.href = "./admin.html";
    opcionAdmin.className = "item-footer activo";
    opcionAdmin.id = "opcion-admin";

    opcionAdmin.innerHTML = `
        <i class="fa-solid fa-shield-halved"></i>
        <span>Admin</span>
    `;

    footer.appendChild(opcionAdmin);
}

// ----------------------
// OBTENER TODOS LOS USUARIOS
// ----------------------
async function cargarUsuarios() {
    try {
        const token = localStorage.getItem("token");

        const res = await fetch("https://jesusweb.ddns.net/juntaygana/usuarios", {
            headers: { "Authorization": "Bearer " + token }
        });

        if (!res.ok) throw new Error("Error al obtener usuarios");

        const usuarios = await res.json();
        mostrarUsuarios(usuarios);

    } catch (err) {
        console.error(err);
        mostrarMensaje("Error al cargar usuarios", "error");
    }
}

// ----------------------
// MOSTRAR USUARIOS EN LA TABLA
// ----------------------
function mostrarUsuarios(usuarios) {

    const tbody = document.querySelector("#tablaUsuarios tbody");
    tbody.innerHTML = "";

    usuarios.forEach(usuario => {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${usuario.id}</td>
            <td><input type="text" value="${usuario.nombre}" data-campo="nombre"></td>
            <td><input type="email" value="${usuario.email}" data-campo="email"></td>
            <td><input type="text" value="${usuario.tag}" data-campo="tag"></td>
            <td><input type="number" value="${usuario.nivel}" data-campo="nivel"></td>
            <td><input type="number" value="${usuario.experiencia}" data-campo="experiencia"></td>
            <td><input type="number" value="${usuario.vidas}" data-campo="vidas"></td>
            <td>
                <select data-campo="rol">
                    <option value="jugador" ${usuario.rol === "jugador" ? "selected" : ""}>Jugador</option>
                    <option value="administrador" ${usuario.rol === "administrador" ? "selected" : ""}>Administrador</option>
                </select>
            </td>
            <td>
                <div class="acciones">
                    <button class="guardar" onclick='guardarUsuario(${JSON.stringify(usuario)})'>Guardar</button>
                    <button class="eliminar" onclick='eliminarUsuario(${usuario.id})'>Eliminar</button>
                    <button class="push" onclick='abrirModalPush(${usuario.id})'>
                        <i class="fa-solid fa-paper-plane"></i>
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// ----------------------
// MODAL PUSH
// ----------------------

function abrirModalPush(usuarioId) {
    const modal = document.getElementById("modalPush");
    if (!modal) return;

    document.getElementById("usuarioIdPush").value = usuarioId;
    modal.style.display = "flex";
}

function cerrarModalPush() {
    const modal = document.getElementById("modalPush");
    if (!modal) return;

    modal.style.display = "none";
}

async function enviarPush() {

    const usuarioId = document.getElementById("usuarioIdPush").value;
    const titulo = document.getElementById("tituloPush").value;
    const texto = document.getElementById("textoPush").value;

    if (!texto) {
        mostrarMensaje("El mensaje no puede estar vacío", "error");
        return;
    }

    try {
        const token = localStorage.getItem("token");

        const res = await fetch("https://jesusweb.ddns.net/juntaygana/enviar-push", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                usuarioId,
                titulo,
                texto
            })
        });

        if (!res.ok) throw new Error();

        mostrarMensaje("Notificación enviada 🚀", "exito");
        cerrarModalPush();

    } catch (err) {
        console.error(err);
        mostrarMensaje("Error enviando notificación", "error");
    }
}

// ----------------------
// GUARDAR USUARIO
// ----------------------
async function guardarUsuario(usuarioOriginal) {

    const fila = Array.from(document.querySelectorAll("#tablaUsuarios tbody tr"))
        .find(tr => Number(tr.children[0].innerText) === usuarioOriginal.id);

    const inputs = fila.querySelectorAll("input, select");
    const datosActualizados = { id: usuarioOriginal.id };

    inputs.forEach(input => {
        datosActualizados[input.dataset.campo] = input.value;
    });

    try {
        const token = localStorage.getItem("token");

        const res = await fetch(`https://jesusweb.ddns.net/juntaygana/usuarios/${usuarioOriginal.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(datosActualizados)
        });

        if (!res.ok) throw new Error();

        mostrarMensaje("Usuario actualizado con éxito", "exito");
        cargarUsuarios();

    } catch (err) {
        console.error(err);
        mostrarMensaje("Error al guardar usuario", "error");
    }
}

// ----------------------
// ELIMINAR USUARIO
// ----------------------
async function eliminarUsuario(id) {

    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;

    try {
        const token = localStorage.getItem("token");

        const res = await fetch(`https://jesusweb.ddns.net/juntaygana/usuarios/${id}`, {
            method: "DELETE",
            headers: { "Authorization": "Bearer " + token }
        });

        if (!res.ok) throw new Error();

        mostrarMensaje("Usuario eliminado con éxito", "exito");
        cargarUsuarios();

    } catch (err) {
        console.error(err);
        mostrarMensaje("Error al eliminar usuario", "error");
    }
}

// ----------------------
// TOAST
// ----------------------
function mostrarMensaje(texto, tipo) {

    const mensaje = document.createElement("div");
    mensaje.classList.add("toast-mensaje", tipo);
    mensaje.textContent = texto;

    document.body.appendChild(mensaje);

    setTimeout(() => mensaje.classList.add("visible"), 10);
    setTimeout(() => {
        mensaje.classList.remove("visible");
        setTimeout(() => mensaje.remove(), 500);
    }, 3000);
}

// ----------------------
// MODAL AJUSTES Y MODO OSCURO
// ----------------------
document.addEventListener("DOMContentLoaded", () => {

    if (localStorage.getItem("tema") === "oscuro") {
        document.body.classList.add("dark-mode");
    }
});

// ----------------------
// INICIAR
// ----------------------
añadirOpcionAdmin();
cargarUsuarios();