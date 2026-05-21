const caminoNiveles = document.getElementById("camino-niveles");
const contadorVidas = document.getElementById("nvidas");

const tiempoSiguienteVida = document.getElementById("tiempo-siguiente-vida"); // Span para mostrar el tiempo
contadorVidas.parentNode.appendChild(tiempoSiguienteVida);


// ----------------------
// CONTROL DE VERSIONES
// ----------------------

// if ("serviceWorker" in navigator) {
//   navigator.serviceWorker.register("/sw.js").then((registration) => {
//     console.log("Service Worker registrado:", registration);

//     // Detectar actualización
//     registration.onupdatefound = () => {
//       const installingWorker = registration.installing;
//       installingWorker.onstatechange = () => {
//         if (installingWorker.state === "installed") {
//           if (navigator.serviceWorker.controller) {
//             alert("¡Nueva versión disponible! Recarga la app para actualizar.");
//           }
//         }
//       };
//     };
//   }).catch((error) => {
//     console.log("Error registrando el Service Worker:", error);
//   });
// }


// ---------------------- 
// COMPROBAR TOKEN
// ----------------------

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

        // Guardar en localStorage
        localStorage.setItem("usuario", JSON.stringify(usuario));

        // Añadir opción admin si corresponde
        añadirOpcionAdmin();

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
// Función para actualizar UI de vidas
// ----------------------

window.addEventListener("popstate", async () => {
    // Esto se dispara cuando el usuario vuelve con la flecha atrás
    await obtenerDatosServidor(); // Trae vidas actualizadas del backend
    actualizarUI();               // Actualiza contador

});



const MAX_VIDAS = 5;           // Máximo de vidas
const REGEN_SEGUNDOS = 15 * 60; // 2 minuto

let usuarioServidor = { vidas: 0, ultima_recarga: new Date() };

function actualizarUI() {
    const ahora = new Date();
    const ultimaRecarga = new Date(usuarioServidor.ultima_recarga);
    const segundosPasados = Math.floor((ahora - ultimaRecarga) / 1000);

    let vidas = usuarioServidor.vidas;

    // Regenerar vidas según tiempo pasado
    if (vidas < MAX_VIDAS) {
        const vidasRecuperadas = Math.floor(segundosPasados / REGEN_SEGUNDOS);
        vidas = Math.min(vidas + vidasRecuperadas, MAX_VIDAS);
    }

    // Calcular tiempo restante para la próxima vida
    let segundosRestantes = 0;
    if (vidas < MAX_VIDAS) {
        segundosRestantes = REGEN_SEGUNDOS - (segundosPasados % REGEN_SEGUNDOS);
    }

    // Actualizar la UI
    contadorVidas.innerText = vidas;
    tiempoSiguienteVida.innerText = vidas >= MAX_VIDAS
        ? "Max"
        : `${Math.floor(segundosRestantes / 60)}:${(segundosRestantes % 60).toString().padStart(2, "0")}`;
}


// ----------------------
// Actualización continua
// ----------------------

async function actualizarVidasEnTiempoReal() {
    await obtenerDatosServidor();
    actualizarUI();
    setInterval(actualizarUI, 1000); // actualizar el contador cada segundof
}

actualizarVidasEnTiempoReal();

// ----------------------
// CAMINO DE NIVELES
// ----------------------
let usuario = JSON.parse(localStorage.getItem("usuario")) || { nivel: 1, experiencia: 0 };
const ESPACIO_VERTICAL = 120;
const DESPLAZO_H = 130;

// Contenedor
caminoNiveles.innerHTML = "";
caminoNiveles.style.position = "relative";

// ----------------------
// Función para cargar niveles desde la base de datos
// ----------------------
async function cargarNiveles() {
    try {
        const res = await fetch("https://jesusweb.ddns.net/juntaygana/niveles");
        if (!res.ok) throw new Error("Error al cargar niveles");

        const niveles = await res.json();

        // Ajustamos la altura del contenedor según la cantidad de niveles
        caminoNiveles.style.height = `${niveles.length * ESPACIO_VERTICAL + 100}px`;

        const nodos = [];

        niveles.forEach(nivel => {
            const nodo = document.createElement("div");
            nodo.classList.add("nivel");

            if (nivel.id < usuario.nivel) {
                nodo.classList.add("completado");
            } else if (nivel.id === usuario.nivel) {
                nodo.classList.add("completado");
            } else if (nivel.id === usuario.nivel + 1) {
                nodo.classList.add("actual");
            } else {
                nodo.classList.add("bloqueado");
            }

            nodo.innerText = nivel.id;
            console.log(usuario.id);

            nodo.onclick = async () => {
                const token = localStorage.getItem("token");
                if (!token) {
                    alert("No estás autenticado");
                    return;
                }

                try {
                    // 🔹 Primero obtenemos las vidas actualizadas
                    const resUsuario = await fetch("https://jesusweb.ddns.net/juntaygana/usuario", {
                        headers: { "Authorization": "Bearer " + token }
                    });
                    if (!resUsuario.ok) throw new Error("Error al obtener usuario");

                    const datosUsuario = await resUsuario.json();
                    let vidas = datosUsuario.vidas;

                    // 🔹 Comprobamos si tiene vidas
                    if (vidas <= 0) {
                        mostrarModalBloqueado();

                        return;
                    }

                    // 🔹 Solo se puede jugar el nivel siguiente al actual
                    if (nivel.id <= usuario.nivel + 1) {

                        // 🔹 Guardamos nivel seleccionado y redirigimos
                        localStorage.setItem("nivelSeleccionado", nivel.id);
                        localStorage.setItem("usuarioId", usuario.id);
                        localStorage.setItem("usuarioNivel", usuario.nivel);
                        localStorage.setItem("usuarioVidas", vidas);

                        window.location.href = "redirect.html";

                    } else {
                        mostrarModalBloqueado();
                    }


                } catch (err) {
                    console.error(err);
                    alert("Error al comprobar o restar tus vidas. Intenta de nuevo.");
                }
            };

            // Posicionamiento
            const offsetX = nivel.id % 2 === 0 ? DESPLAZO_H : -DESPLAZO_H;
            nodo.style.position = "absolute";
            nodo.style.top = `${(niveles.length - nivel.id) * ESPACIO_VERTICAL}px`;
            nodo.style.left = `calc(50% + ${offsetX}px)`;
            nodo.style.transform = "translateX(-50%)";
            nodo.dataset.offsetX = offsetX; // 👈 importante
            caminoNiveles.appendChild(nodo);
            nodos.push(nodo);
        });

        // para que las líneas se redibujen al rotar el móvil o cambiar tamaño
        let nodosGlobal = [];
        window.addEventListener("resize", () => {
            if (nodosGlobal.length > 0) dibujarLineas(nodosGlobal);
        });


        nodosGlobal = nodos;
        dibujarLineas(nodos);

        dibujarLineas(nodos);

        // Al final de cargarNiveles(), después de dibujarLineas(nodos);
        const nivelActual = document.querySelector('.nivel.actual');
        if (nivelActual) {
            setTimeout(() => {
                nivelActual.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 100);   // 100–300 ms suele ser suficiente
        }

    } catch (err) {
        console.error(err);
    }
}

// ----------------------
// Función para dibujar líneas entre nodos
// ----------------------
function dibujarLineas(nodos) {
    // Eliminar líneas previas (importante para resize)
    caminoNiveles.querySelectorAll(".linea").forEach(l => l.remove());

    const contRect = caminoNiveles.getBoundingClientRect();
    const centroX = contRect.width / 2;
    const NODO_SIZE = nodos[0]?.offsetWidth || 72;

    for (let i = 0; i < nodos.length - 1; i++) {
        const nodoA = nodos[i];
        const nodoB = nodos[i + 1];

        // Centro de cada nodo (top + mitad altura, left ya está centrado por translateX(-50%))
        const xA = centroX + parseFloat(nodoA.dataset.offsetX);
        const yA = parseFloat(nodoA.style.top) + NODO_SIZE / 2;

        const xB = centroX + parseFloat(nodoB.dataset.offsetX);
        const yB = parseFloat(nodoB.style.top) + NODO_SIZE / 2;

        const dx = xB - xA;
        const dy = yB - yA;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        const angulo = Math.atan2(dy, dx) * 180 / Math.PI;

        const linea = document.createElement("div");
        linea.classList.add("linea");
        linea.style.width = `${distancia}px`;
        linea.style.position = "absolute";
        linea.style.top = `${yA}px`;
        linea.style.left = `${xA}px`;
        linea.style.transform = `rotate(${angulo}deg)`;
        linea.style.transformOrigin = "0 50%";
        linea.style.zIndex = "-1";

        caminoNiveles.appendChild(linea);
    }
}


// ----------------------
// Al cargar la página
// ----------------------
window.onload = () => {
    cargarNiveles();      // ✅ Cargar niveles desde DB
};

// ----------------------
// MODAL AMIGOS
// ----------------------


// ----------------------
// MODAL AJUSTES Y MODO OSCURO
// ----------------------
document.addEventListener("DOMContentLoaded", () => {
    const btnAjustes = document.getElementById("btn-ajustes");
    const modalAjustes = document.getElementById("modal-ajustes");
    const cerrarAjustes = modalAjustes.querySelector(".cerrar-ajustes");
    const modoOscuro = document.getElementById("modo-oscuro");
    const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");


    modalAjustes.style.display = "none";

    btnAjustes.onclick = () => {
        modalAjustes.style.display = "flex";
        modoOscuro.checked = localStorage.getItem("tema") === "oscuro";
    };

    btnCerrarSesion.onclick = () => {
        // Borrar token y usuario de localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        // Redirigir al login
        window.location.href = "./auth/login.html";
    };

    cerrarAjustes.onclick = () => modalAjustes.style.display = "none";

    modoOscuro.onchange = () => {
        if (modoOscuro.checked) {
            document.body.classList.add("dark-mode");
            localStorage.setItem("tema", "oscuro");
        } else {
            document.body.classList.remove("dark-mode");
            localStorage.setItem("tema", "claro");
        }
    };

    if (localStorage.getItem("tema") === "oscuro") {
        document.body.classList.add("dark-mode");
    }
});

// Función para mostrar el modal de nivel bloqueado
const mostrarModalBloqueado = () => {
    const modal = document.getElementById("modal-bloqueado");
    modal.style.display = "flex";

    // Cerrar modal con botón de "X" o "Aceptar"
    document.getElementById("cerrar-modal-bloqueado").onclick = () => modal.style.display = "none";
    document.getElementById("cerrar-boton-bloqueado").onclick = () => modal.style.display = "none";

    // Cerrar modal si se hace clic fuera del contenido
    window.onclick = (event) => {
        if (event.target === modal) modal.style.display = "none";
    };
};

// Esperar a que el DOM cargue
document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("modal-bloqueado");
    const botonCerrarX = document.getElementById("cerrar-modal-bloqueado");
    const botonAceptar = document.getElementById("cerrar-boton-bloqueado");

    // Función para mostrar el modal
    const mostrarModalBloqueado = () => {
        modal.style.display = "flex"; // Usamos flex para centrarlo
    };

    // Cerrar modal con botón X
    botonCerrarX.onclick = () => {
        modal.style.display = "none";
    };

    // Cerrar modal con botón Aceptar
    botonAceptar.onclick = () => {
        modal.style.display = "none";
    };

    // Cerrar modal al hacer clic fuera del contenido
    window.onclick = (event) => {
        if (event.target === modal) modal.style.display = "none";
    };

    // EJEMPLO: mostrar el modal
    // mostrarModalBloqueado();
});




