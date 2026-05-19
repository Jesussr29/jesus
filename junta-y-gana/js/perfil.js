// ----------------------
// Variables globales
// ----------------------
let usuarioServidor = {};
let usuario = {};

// ----------------------
// Función para obtener datos reales del servidor
// ----------------------
async function obtenerDatosServidor() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const res = await fetch("https://jesusweb.ddns.net/juntaygana/usuario", {
            headers: { "Authorization": "Bearer " + token }
        });
        if (!res.ok) throw new Error("Error al obtener usuario");

        const data = await res.json();

        // Actualizar usuario global
        usuarioServidor.vidas = data.vidas;
        usuarioServidor.ultima_recarga = new Date(data.ultima_recarga);

        usuario.id = data.id;
        usuario.nivel = data.nivel;
        usuario.experiencia = data.experiencia;
        usuario.rol = data.rol;
        usuario.nombre = data.nombre;      // añadir nombre
        usuario.correo = data.email;      // añadir correo
        usuario.foto = data.foto;          // añadir ruta de foto si la hay

        // Guardar en localStorage
        localStorage.setItem("usuario", JSON.stringify(usuario));

        console.log("Datos del servidor obtenidos:", usuario);

        // Añadir opción admin si corresponde
        añadirOpcionAdmin();

        // Actualizar UI de perfil
        cargarPerfilUI();

    } catch (err) {
        console.error(err);
    }
}

// ----------------------
// Funcion para comprobar rol
// ----------------------

function añadirOpcionAdmin() {
    if (usuario.rol !== "administrador") return;

    const footer = document.querySelector(".footer-juego");

    // Evitar duplicados
    if (document.getElementById("opcion-admin")) return;

    const opcionAdmin = document.createElement("a");
    opcionAdmin.href = "./admin.html";
    opcionAdmin.className = "item-footer";
    opcionAdmin.id = "opcion-admin";

    opcionAdmin.innerHTML = `
        <i class="fa-solid fa-shield-halved"></i>
        <span>Admin</span>
    `;

    footer.appendChild(opcionAdmin);
}

// ----------------------
// Función para cargar datos en el perfil
// ----------------------
function cargarPerfilUI() {
    const inputNombre = document.getElementById("inputNombre");
    const inputCorreo = document.getElementById("inputCorreo");
    const previewFoto = document.getElementById("previewFoto");

    if (usuario.nombre) inputNombre.value = usuario.nombre;
    if (usuario.correo) inputCorreo.value = usuario.correo;

    console.log("Ruta de la foto:", usuario.foto);
    if (usuario.foto == "./img/ico.jpg") {
        previewFoto.src = "./img/ico.jpg";
    }else{
        previewFoto.src = `https://jesusweb.ddns.net${usuario.foto}`;
    }


    // foto predeterminada

}

// ----------------------
// Evento para cambiar la foto en tiempo real
// ----------------------
document.getElementById("inputFoto").addEventListener("change", function (e) {
    const reader = new FileReader();
    reader.onload = function () {
        document.getElementById("previewFoto").src = reader.result;
        usuario.foto = reader.result; // actualizar foto en objeto usuario
    }
    reader.readAsDataURL(e.target.files[0]);
});

// ----------------------
// Inicializar perfil al cargar página
// ----------------------
document.addEventListener("DOMContentLoaded", () => {
    obtenerDatosServidor();
});

// ----------------------
// GUARDAR DATOS DEL PERFIL
// ----------------------
async function guardarPerfil() {
    const token = localStorage.getItem("token");
    if (!token) return mostrarMensaje("No hay token válido", "error");

    const nombre = document.getElementById("inputNombre").value.trim();
    const correo = document.getElementById("inputCorreo").value.trim();
    const archivo = document.getElementById("inputFoto").files[0];

    // Crear FormData para enviar archivo + texto
    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("email", correo);

    if (archivo) formData.append("foto", archivo);

    try {
        const res = await fetch("https://jesusweb.ddns.net/juntaygana/perfil", {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + token
                // NO pongas Content-Type, el fetch lo pone automáticamente con FormData
            },
            body: formData
        });

        if (!res.ok) throw new Error("Error al actualizar perfil");

        // Actualizar localStorage
        usuario.nombre = nombre;
        usuario.correo = correo;
        if (archivo) usuario.foto = document.getElementById("previewFoto").src;
        localStorage.setItem("usuario", JSON.stringify(usuario));

        mostrarMensaje("Perfil actualizado con éxito", "exito");

    } catch (err) {
        console.error(err);
        mostrarMensaje("Error al guardar perfil", "error");
    }
}



// Función para mostrar mensaje flotante
function mostrarMensaje(texto, tipo) {
    const mensaje = document.createElement("div");
    mensaje.classList.add("toast-mensaje", tipo);
    mensaje.textContent = texto;

    document.body.appendChild(mensaje);

    // Animación: aparecer y desaparecer
    setTimeout(() => {
        mensaje.classList.add("visible");
    }, 10);

    setTimeout(() => {
        mensaje.classList.remove("visible");
        setTimeout(() => mensaje.remove(), 500);
    }, 3000);
}

// ----------------------
// Evento para el formulario
// ----------------------
document.getElementById("form-perfil").addEventListener("submit", (e) => {
    e.preventDefault(); // evitar recarga
    guardarPerfil();
});

