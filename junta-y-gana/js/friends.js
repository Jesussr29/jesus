const btnSolicitudes = document.getElementById("btnSolicitudes");
const modal = document.getElementById("modalSolicitudes");
const cerrarModal = document.getElementById("cerrarModal");
const contenedorSolicitudes = modal.querySelector(".modal-contenido");
const listaAmigos = document.getElementById("listaAmigos");
const token = localStorage.getItem("token");


async function validarSesion() {
    if (!token) {
        cerrarSesion();
        return;
    }

    try {
        const res = await fetch("https://jesusweb.ddns.net/juntaygana/usuario", {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!res.ok) {
            // Token inválido o expirado
            cerrarSesion();
            return;
        } 

        // Token válido → puedes continuar
        const usuario = await res.json();
        localStorage.setItem("usuario", JSON.stringify(usuario));

    } catch (err) {
        console.error("Error validando sesión:", err);
        cerrarSesion();
    }
}

function cerrarSesion() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.href = "/junta-y-gana/auth/login.html";
}

validarSesion();


btnSolicitudes.addEventListener("click", () => {
    modal.style.display = "block";
    cargarSolicitudes();
});

cerrarModal.addEventListener("click", () => {
    modal.style.display = "none";
});

window.addEventListener("click", (e) => {
    if (e.target == modal) modal.style.display = "none";
});


function obtenerJugador() {
    return fetch("https://jesusweb.ddns.net/juntaygana/usuario", {
        headers: {
            "Authorization": "Bearer " + token
        }

    }).then(res => res.json());

}

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



function cargarAmigos() {
    Promise.all([
        obtenerJugador(),
        fetch("https://jesusweb.ddns.net/juntaygana/amistad/mis-amigos", {
            headers: { "Authorization": "Bearer " + token }
        }).then(res => res.json())
    ])
        .then(([jugador, amigos]) => {

            // Actualizar usuario global
            usuario = jugador;

            // 👉 Llamar a añadirOpcionAdmin aquí
            añadirOpcionAdmin();

            listaAmigos.innerHTML = "";

            // 👉 Unimos jugador + amigos
            const ranking = [
                { ...jugador, esPropio: true },
                ...amigos.map(amigo => ({ ...amigo, esPropio: false }))
            ];

            // 👉 Ordenar por nivel (mayor primero)
            ranking.sort((a, b) => b.nivel - a.nivel);
            actualizarStatTotalAmigos(amigos.length);
            actualizarStatTopNivel(ranking);
            // 👉 Pintar ranking
            console.log(ranking);

            ranking.forEach(persona => {
                const div = document.createElement("div");
                div.classList.add("amigo-item");

                if (persona.esPropio) {
                    div.classList.add("jugador-propio");
                }

                let rutaFoto;
                if (persona.foto == "./img/ico.jpg") {
                    rutaFoto = "./img/ico.jpg";
                } else {
                    rutaFoto = `https://jesusweb.ddns.net${persona.foto}`;
                }

                div.innerHTML = `
                <div class="info-amigo">
                    <div class="perfil-usuario">
                        <img src="${rutaFoto}" alt="Foto de ${persona.nombre}" class="foto-usuario">
                        <div class="nivel-circulo">${persona.nivel}</div>
                    </div>

                    <div class="detalles">
                        <span class="nombre">
                              ${persona.nombre}${persona.esPropio ? " (Tú)" : ""}<br>
                              <span class="tag">#${persona.tag}</span>
                        </span>
                        <span class="exp">Experiencia: ${persona.experiencia}</span>
                    </div>
                </div>
                ${persona.esPropio ? "" : `<button class="eliminar"><i class="fa-solid fa-trash"></i></button>`}
            `;

                // 👉 Botón eliminar solo para amigos
                if (!persona.esPropio) {
                    div.querySelector(".eliminar").addEventListener("click", () => {
                        mostrarConfirmacionEliminar(
                            `¿Estás seguro de eliminar a @${persona.nombre}#${persona.tag}?`,
                            () => eliminarAmigo(persona.id, div)
                        );
                    });
                }

                listaAmigos.appendChild(div);
            });
        })
        .catch(err => console.error("Error cargando amigos:", err));
}



// Función eliminar amigo
function eliminarAmigo(amigoId, elementoDiv) {
    fetch("https://jesusweb.ddns.net/juntaygana/amistad/eliminar", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ amigoId })
    })
        .then(res => res.json())
        .then(data => {
            alert(data.mensaje || data.error);
            if (!data.error) elementoDiv.remove();
        });

}


// ========================
// STATS DEL HEADER
// ========================
function actualizarStatTotalAmigos(cantidad) {
    const el = document.getElementById("statTotalAmigos");
    if (el) el.textContent = cantidad;
}

function actualizarStatSolicitudes(cantidad) {
    const el = document.getElementById("statSolicitudes");
    if (el) el.textContent = cantidad;
}

function actualizarStatTopNivel(ranking) {
    const el = document.getElementById("statTopNivel");
    if (!el) return;

    if (!ranking || ranking.length === 0) {
        el.textContent = "—";
        return;
    }

    // El ranking ya viene ordenado de mayor a menor nivel
    const top = ranking[0];
    el.textContent = `Nv. ${top.nivel}`;
    el.title = `${top.nombre}#${top.tag}`;
}



// Cargar amigos al iniciar
cargarAmigos();
cargarSolicitudes();



// Función para cargar solicitudes
function cargarSolicitudes() {
    fetch("https://jesusweb.ddns.net/juntaygana/amistad/solicitudes", {
        headers: { "Authorization": "Bearer " + token }
    })
        .then(res => res.json())
        .then(data => {
            // 👉 Stat del header
            actualizarStatSolicitudes(data.length);
            // Eliminar lista anterior
            const cont = contenedorSolicitudes.querySelector(".solicitudes-lista");
            if (cont) cont.remove();

            const lista = document.createElement("div");
            lista.classList.add("solicitudes-lista");

            if (data.length === 0) {
                lista.innerHTML = "<p>No hay solicitudes</p>";
                quitarBadgeSolicitudes();
            } else {
                data.forEach(solicitud => {
                    const div = document.createElement("div");
                    div.classList.add("solicitud-item");

                    div.innerHTML = `
                    <span class="nombre">${solicitud.nombre}#${solicitud.tag}</span>
                    <div class="acciones-solicitud">
                        <button class="aceptar">Aceptar</button>
                        <button class="rechazar">Rechazar</button>
                    </div>
                `;

                    div.querySelector(".aceptar").addEventListener("click", () =>
                        responderSolicitud(solicitud.solicitudId, "aceptar", div)
                    );
                    div.querySelector(".rechazar").addEventListener("click", () =>
                        responderSolicitud(solicitud.solicitudId, "rechazar", div)
                    );

                    lista.appendChild(div);
                });

                // Añadir badge al botón
                agregarBadgeSolicitudes(data.length);
            }

            contenedorSolicitudes.appendChild(lista);
        })
        .catch(err => console.error("Error cargando solicitudes:", err));
}

// Función para poner badge
function agregarBadgeSolicitudes(cantidad) {
    const btn = document.getElementById("btnSolicitudes");
    btn.classList.add("con-badge");
    btn.setAttribute("data-badge", cantidad);
}

// Función para quitar badge
function quitarBadgeSolicitudes() {
    const btn = document.getElementById("btnSolicitudes");
    btn.classList.remove("con-badge");
    btn.removeAttribute("data-badge");
}


// Función responder solicitud
function responderSolicitud(id, accion, elementoDiv) {
    fetch("https://jesusweb.ddns.net/juntaygana/amistad/responder", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ solicitudId: id, accion })
    })
        .then(res => res.json())
        .then(data => {
            if (data.mensaje) mostrarMensaje(data.mensaje, "exito"); // verde
            if (data.error) mostrarMensaje(data.error, "error"); // rojo

            cargarSolicitudes();

            // Si no hay error, quitar la solicitud del modal
            if (!data.error) elementoDiv.remove();

            // Si aceptó, recargar lista de amigos
            if (accion === "aceptar" && !data.error) {
                cargarAmigos();
            }
        });

}



// ========================
// BUSCAR AMIGOS
// ========================

const inputBuscar = document.getElementById("buscarUsuario");
const btnBuscar = document.getElementById("btnBuscar");
const resultados = document.getElementById("resultadosBusqueda");

btnBuscar.addEventListener("click", buscarAmigo);

function buscarAmigo() {
    const valor = inputBuscar.value.trim();

    // Validar formato nombre#tag
    if (!valor.includes("#")) {
        resultados.innerHTML = "<p>Usa el formato nombre#tag</p>";
        return;
    }

    console.log("BUSCANDO:", encodeURIComponent(valor));
    //Sale: BUSCANDO: jesus%235312


    fetch(`https://jesusweb.ddns.net/juntaygana/buscar-usuarios?query=${encodeURIComponent(valor)}`, {
        headers: {
            "Authorization": "Bearer " + token
        }
    })
        .then(res => res.json())
        .then(data => {
            resultados.innerHTML = "";

            if (data.length === 0) {
                resultados.innerHTML = "<p>Usuario no encontrado</p>";
                return;
            }

            data.forEach(usuario => {
                const div = document.createElement("div");
                div.classList.add("usuario-buscado"); // nueva clase

                div.innerHTML = `
        <div class="info-usuario">
            <span class="nombre-usuario">${usuario.nombre}#${usuario.tag}</span>
        </div>
        <button class="btn-agregar" data-id="${usuario.id}">Agregar</button>
    `;

                // Botón enviar solicitud
                div.querySelector(".btn-agregar").addEventListener("click", () => {
                    enviarSolicitud(usuario.id, div.querySelector(".btn-agregar"));
                });

                resultados.appendChild(div);
            });

        })
        .catch(() => {
            resultados.innerHTML = "<p>Error al buscar usuario</p>";
        });
}

// ========================
// ENVIAR SOLICITUD
// ========================
function enviarSolicitud(usuarioId) {
    fetch("https://jesusweb.ddns.net/juntaygana/amistad/enviar", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ usuarioRecibe: usuarioId })
    })
        .then(res => res.json())
        .then(data => {
            mostrarMensaje(data.mensaje, "exito"); // verde
            if (data.error) mostrarMensaje(data.error, "error"); // rojo
        });
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


// ========================
// MODAL CONFIRMAR ELIMINAR
// ========================

const modalEliminar = document.getElementById("modal-eliminar");
const textoEliminar = document.getElementById("texto-eliminar");
const btnCancelarEliminar = document.getElementById("btn-cancelar-eliminar");
const btnConfirmarEliminar = document.getElementById("btn-confirmar-eliminar");

let funcionEliminar = null; // Guardará la función de eliminar

function mostrarConfirmacionEliminar(mensaje, callback) {
    textoEliminar.textContent = mensaje;
    modalEliminar.style.display = "flex";
    funcionEliminar = callback;
}

// Cancelar
btnCancelarEliminar.addEventListener("click", () => {
    modalEliminar.style.display = "none";
    funcionEliminar = null;
});

// Confirmar
btnConfirmarEliminar.addEventListener("click", () => {
    if (funcionEliminar) funcionEliminar();
    modalEliminar.style.display = "none";
    funcionEliminar = null;
});


// MODO OSCURO 

document.addEventListener("DOMContentLoaded", () => {
    const modoOscuro = document.getElementById("modo-oscuro");

    // Aplicar tema guardado
    if (localStorage.getItem("tema") === "oscuro") {
        document.body.classList.add("dark-mode");
        if (modoOscuro) modoOscuro.checked = true;
    }

    // Cambiar tema
    if (modoOscuro) {
        modoOscuro.onchange = () => {
            if (modoOscuro.checked) {
                document.body.classList.add("dark-mode");
                localStorage.setItem("tema", "oscuro");
            } else {
                document.body.classList.remove("dark-mode");
                localStorage.setItem("tema", "claro");
            }
        };
    }
});


