/* =========================================================
   BLOCK PUZZLE — versión refactorizada y limpia
   ========================================================= */

const API = "https://jesusweb.ddns.net/juntaygana";

const COLORES_PIEZAS = [
    "#ff595e", "#ffca3a", "#8ac926",
    "#1982c4", "#a06cd5", "#ff924c"
];

const PIEZAS = [
    [[1]],
    [[1,1]],            [[1],[1]],
    [[1,1,1]],          [[1],[1],[1]],
    [[1,1,1,1]],        [[1],[1],[1],[1]],
    [[1,1],[1,1]],
    [[1,0],[1,0],[1,1]],[[0,1],[0,1],[1,1]],
    [[1,1,0],[0,1,1]],  [[0,1,1],[1,1,0]],
    [[1,1,1],[0,1,0]],
    [[1,1],[1,0]],      [[1,1],[0,1]],
    [[1,1,1],[1,1,1]]
];

const TAM = 8;
const token = localStorage.getItem("token");

/* ---------- Estado global ---------- */
const estado = {
    nivel: parseInt(localStorage.getItem("nivelSeleccionado")),
    expActual: 0,
    expRequerida: 0,
    niveles: [],
    idActual: null,
    arrastreActivo: null,        // { pieza, offsetX, offsetY, formaId }
    celdasResaltadas: [],
    bloqueado: false             // se bloquea durante limpieza para evitar inputs
};

/* ---------- Refs DOM ---------- */
const tablero = document.getElementById("tablero");
const contenedorPiezas = document.getElementById("piezas");
const barraRelleno = document.getElementById("relleno-exp");
const textoExp = document.getElementById("exp-text");
const textoNivel = document.getElementById("nivel-text");

const celdas = [];

/* =========================================================
   SESIÓN
   ========================================================= */
async function validarSesion() {
    const token = localStorage.getItem("token"); // 🔥 IMPORTANTE

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

        console.log("STATUS:", res.status); // 👈 debug útil

        if (!res.ok) {
            cerrarSesion();
            return;
        }

        const usuario = await res.json();
        localStorage.setItem("usuario", JSON.stringify(usuario));

        if (usuario.id) {
            localStorage.setItem("usuarioId", usuario.id);
        }

        if (usuario.vidas !== undefined) {
            localStorage.setItem("usuarioVidas", usuario.vidas);
        }

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

/* =========================================================
   NIVEL Y EXP
   ========================================================= */
async function cargarNiveles() {
    try {
        const res = await fetch(`${API}/niveles`);
        estado.niveles = await res.json();

        const nivel = estado.niveles.find(n => n.id === estado.nivel);
        if (!nivel) {
            alert("Nivel no encontrado");
            window.location.href = "index.html";
            return;
        }

        // XP requerida = nivel * 100  (nivel 32 -> 3200)
        estado.expRequerida = estado.nivel * 100;

        actualizarBarraExp();
    } catch (err) {
        console.error("Error cargando niveles:", err);
        // Fallback: aunque falle el fetch, calculamos por nivel
        estado.expRequerida = estado.nivel * 100;
        console.log("hola: " + estado.expRequerida);

        actualizarBarraExp();
    }
}


function actualizarBarraExp() {
    const pct = Math.min((estado.expActual / estado.expRequerida) * 100, 100);
    barraRelleno.style.width = pct + "%";
    barraRelleno.classList.add("resplandor");
    setTimeout(() => barraRelleno.classList.remove("resplandor"), 500);
    textoExp.textContent = `${estado.expActual} / ${estado.expRequerida}`;
    textoNivel.textContent = `Nivel ${estado.nivel}`;
}

function animarTextoExp() {
    textoExp.classList.add("text-animado");
    textoNivel.classList.add("text-animado");
    setTimeout(() => {
        textoExp.classList.remove("text-animado");
        textoNivel.classList.remove("text-animado");
    }, 250);
}

function sumarExperiencia(cantidad) {
    const objetivo = estado.expActual + cantidad;
    const inicio = estado.expActual;
    const duracion = 700;
    const t0 = performance.now();
    let yaSubio = false;

    function animar(now) {
        const t = Math.min((now - t0) / duracion, 1);
        estado.expActual = Math.floor(inicio + (objetivo - inicio) * t);
        actualizarBarraExp();
        if (t < 1) {
            requestAnimationFrame(animar);
        } else if (estado.expActual >= estado.expRequerida && !yaSubio) {
            yaSubio = true;
            pasarNivel();
        }
    }
    requestAnimationFrame(animar);
    animarTextoExp();
}

function pasarNivel() {
    const usuarioId = localStorage.getItem("usuarioId");
    if (!usuarioId) {
        console.warn("No hay usuarioId");
        window.location.href = "index.html";
        return;
    }

    sumarVida();

    fetch(`${API}/niveles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nivel: estado.nivel, usuarioId })
    })
        .then(r => r.json())
        .then(() => {
            localStorage.removeItem("nivelSeleccionado");
            window.location.href = "index.html";
        })
        .catch(err => {
            console.error("Error subir nivel:", err);
            window.location.href = "index.html";
        });
}

/* =========================================================
   TABLERO
   ========================================================= */
function crearTablero() {
    for (let i = 0; i < TAM * TAM; i++) {
        const c = document.createElement("div");
        c.classList.add("celda");
        c.dataset.index = i;
        tablero.appendChild(c);
        celdas.push(c);
    }
}

/* =========================================================
   GENERACIÓN DE PIEZAS
   ========================================================= */
function generarPiezas() {
    contenedorPiezas.innerHTML = "";
    const usadas = new Set();
    while (usadas.size < 3) {
        const idx = Math.floor(Math.random() * PIEZAS.length);
        if (!usadas.has(idx)) {
            usadas.add(idx);
            crearPieza(idx);
        }
    }
}

function crearPieza(formaId) {
    const forma = PIEZAS[formaId];
    const color = COLORES_PIEZAS[Math.floor(Math.random() * COLORES_PIEZAS.length)];

    const cont = document.createElement("div");
    cont.classList.add("contenedor-pieza");

    const pieza = document.createElement("div");
    pieza.classList.add("pieza");
    pieza.dataset.id = `${formaId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    pieza.dataset.formaId = formaId;
    pieza.dataset.color = color;

    pieza.style.gridTemplateColumns = `repeat(${forma[0].length}, var(--celda-tam))`;
    pieza.style.gridAutoRows = "var(--celda-tam)";

    forma.forEach(fila => {
        fila.forEach(v => {
            const b = document.createElement("div");
            b.classList.add("bloque");
            if (v === 1) {
                b.style.backgroundColor = color;
            } else {
                b.classList.add("vacio");
            }
            pieza.appendChild(b);
        });
    });

    cont.appendChild(pieza);
    contenedorPiezas.appendChild(cont);

    activarArrastre(pieza);
}

/* =========================================================
   SISTEMA DE ARRASTRE UNIFICADO (mouse + touch)
   ========================================================= */
function activarArrastre(pieza) {
    const onDown = (clientX, clientY, isTouch) => {
        if (estado.bloqueado) return;

        const rect = pieza.getBoundingClientRect();
        // Offset desde el centro de la pieza para que se dibuje "centrada-arriba" del dedo
        const offsetX = clientX - rect.left;
        // En táctil desplazamos un poco la pieza arriba para que el dedo no la tape
        const offsetY = clientY - rect.top + (isTouch ? 60 : 0);

        // Quitamos la escala visual durante el arrastre
        pieza.classList.add("arrastrando");
        pieza.style.position = "fixed";
        pieza.style.left = (rect.left) + "px";
        pieza.style.top  = (rect.top) + "px";
        pieza.style.margin = "0";

        estado.idActual = pieza.dataset.id;
        estado.arrastreActivo = { pieza, offsetX, offsetY };

        // Forzar primer reposicionamiento
        moverPieza(clientX, clientY);
    };

    const moverPieza = (clientX, clientY) => {
        if (!estado.arrastreActivo) return;
        const { pieza, offsetX, offsetY } = estado.arrastreActivo;
        pieza.style.left = (clientX - offsetX) + "px";
        pieza.style.top  = (clientY - offsetY) + "px";
        actualizarPreview(clientX, clientY);
    };

    const soltarPieza = (clientX, clientY) => {
        if (!estado.arrastreActivo) return;
        const { pieza } = estado.arrastreActivo;

        const pos = calcularPosicionTablero(clientX, clientY, pieza);
        const formaId = parseInt(pieza.dataset.formaId);
        const forma = PIEZAS[formaId];

        const colocada = pos !== null && intentarColocar(pos.fila, pos.col, forma);

        limpiarResaltados();

        if (colocada) {
            // La pieza se elimina dentro de colocarPieza
        } else {
            // Volver a su sitio
            pieza.classList.remove("arrastrando");
            pieza.style.position = "";
            pieza.style.left = "";
            pieza.style.top = "";
            pieza.style.margin = "";
        }

        estado.arrastreActivo = null;
        estado.idActual = null;
    };

    /* ---- Mouse ---- */
    pieza.addEventListener("mousedown", e => {
        e.preventDefault();
        onDown(e.clientX, e.clientY, false);
        const onMove = ev => moverPieza(ev.clientX, ev.clientY);
        const onUp = ev => {
            soltarPieza(ev.clientX, ev.clientY);
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    });

    /* ---- Touch ---- */
    pieza.addEventListener("touchstart", e => {
        if (e.touches.length !== 1) return;
        e.preventDefault();
        const t = e.touches[0];
        onDown(t.clientX, t.clientY, true);
    }, { passive: false });

    pieza.addEventListener("touchmove", e => {
        if (!estado.arrastreActivo) return;
        e.preventDefault();
        const t = e.touches[0];
        moverPieza(t.clientX, t.clientY);
    }, { passive: false });

    pieza.addEventListener("touchend", e => {
        if (!estado.arrastreActivo) return;
        e.preventDefault();
        const t = e.changedTouches[0];
        soltarPieza(t.clientX, t.clientY);
    });

    pieza.addEventListener("touchcancel", () => {
        if (estado.arrastreActivo) {
            const { pieza } = estado.arrastreActivo;
            pieza.classList.remove("arrastrando");
            pieza.style.cssText = "";
            limpiarResaltados();
            estado.arrastreActivo = null;
            estado.idActual = null;
        }
    });
}

/* =========================================================
   POSICIÓN, PREVIEW Y COLOCACIÓN
   ========================================================= */
function calcularPosicionTablero(clientX, clientY, pieza) {
    const tableroRect = tablero.getBoundingClientRect();
    const formaId = parseInt(pieza.dataset.formaId);
    const forma = PIEZAS[formaId];
    const ancho = forma[0].length;
    const alto = forma.length;

    // Posición real de la pieza visualmente
    const piezaRect = pieza.getBoundingClientRect();

    // Estimamos a partir de la esquina superior izquierda visual de la pieza
    const relX = piezaRect.left - tableroRect.left;
    const relY = piezaRect.top - tableroRect.top;

    // Tamaño real de una celda según el DOM (incluye gap)
    const celdaRect = celdas[0].getBoundingClientRect();
    const celdaTam = celdaRect.width;
    const gap = (tableroRect.width - 16 /*padding*/ - celdaTam * TAM) / (TAM - 1);
    const paso = celdaTam + gap;

    // padding del tablero (8px CSS)
    const padding = 8;

    let col = Math.round((relX - padding) / paso);
    let fila = Math.round((relY - padding) / paso);

    if (fila < 0 || col < 0) return null;
    if (fila + alto > TAM || col + ancho > TAM) return null;

    return { fila, col };
}

function actualizarPreview(clientX, clientY) {
    limpiarResaltados();
    if (!estado.arrastreActivo) return;

    const { pieza } = estado.arrastreActivo;
    const pos = calcularPosicionTablero(clientX, clientY, pieza);
    if (!pos) return;

    const formaId = parseInt(pieza.dataset.formaId);
    const forma = PIEZAS[formaId];

    let valido = true;
    const objetivo = [];

    for (let f = 0; f < forma.length; f++) {
        for (let c = 0; c < forma[f].length; c++) {
            if (forma[f][c] === 1) {
                const idx = (pos.fila + f) * TAM + (pos.col + c);
                const celda = celdas[idx];
                if (celda.classList.contains("ocupada")) valido = false;
                objetivo.push(celda);
            }
        }
    }

    objetivo.forEach(c => {
        c.classList.add(valido ? "celda-resaltada" : "celda-invalida");
        estado.celdasResaltadas.push(c);
    });
}

function limpiarResaltados() {
    estado.celdasResaltadas.forEach(c =>
        c.classList.remove("celda-resaltada", "celda-invalida"));
    estado.celdasResaltadas = [];
}

function intentarColocar(filaInicio, colInicio, forma) {
    // Validar
    const posiciones = [];
    for (let f = 0; f < forma.length; f++) {
        for (let c = 0; c < forma[f].length; c++) {
            if (forma[f][c] === 1) {
                const fila = filaInicio + f;
                const col  = colInicio + c;
                if (fila < 0 || col < 0 || fila >= TAM || col >= TAM) return false;
                const idx = fila * TAM + col;
                if (celdas[idx].classList.contains("ocupada")) return false;
                posiciones.push(idx);
            }
        }
    }

    const pieza = document.querySelector(`.pieza[data-id="${estado.idActual}"]`);
    if (!pieza) return false;
    const color = pieza.dataset.color;

    posiciones.forEach(idx => {
        const c = celdas[idx];
        c.classList.add("ocupada");
        c.style.backgroundColor = color;
    });

    // Eliminar pieza del panel
    const cont = pieza.parentElement;
    cont?.remove();

    // Regenerar piezas si se acabaron
    if (contenedorPiezas.children.length === 0) {
        generarPiezas();
    }

    // Limpieza y comprobación de derrota
    limpiarLineas(() => comprobarDerrota());
    return true;
}

/* =========================================================
   LIMPIEZA DE LÍNEAS
   ========================================================= */
function limpiarLineas(callback) {
    const aBorrar = new Set();
    let lineas = 0;

    // Filas
    for (let f = 0; f < TAM; f++) {
        const fila = celdas.slice(f * TAM, f * TAM + TAM);
        if (fila.every(c => c.classList.contains("ocupada"))) {
            fila.forEach(c => aBorrar.add(c));
            lineas++;
        }
    }
    // Columnas
    for (let c = 0; c < TAM; c++) {
        let completa = true;
        for (let f = 0; f < TAM; f++) {
            if (!celdas[f * TAM + c].classList.contains("ocupada")) {
                completa = false; break;
            }
        }
        if (completa) {
            for (let f = 0; f < TAM; f++) aBorrar.add(celdas[f * TAM + c]);
            lineas++;
        }
    }

    if (aBorrar.size === 0) {
        callback?.();
        return;
    }

    estado.bloqueado = true;
    aBorrar.forEach(celda => {
        crearParticulas(celda);
        celda.classList.add("celda-limpiandose");
    });

    setTimeout(() => {
        aBorrar.forEach(celda => {
            celda.classList.remove("ocupada", "celda-limpiandose");
            celda.style.backgroundColor = "";
        });

        const puntos = lineas * 100 * (lineas > 1 ? lineas : 1); // bonus combo
        sumarExperiencia(puntos);

        const palabras = ["¡Genial!", "¡Perfecto!", "¡Increíble!", "¡Combo!"];
        const txt = palabras[Math.min(lineas - 1, palabras.length - 1)] + ` +${puntos}`;
        const primera = aBorrar.values().next().value;
        const r = primera.getBoundingClientRect();
        mostrarMensajeLinea(txt, r.left + r.width / 2, r.top);

        estado.bloqueado = false;
        callback?.();
    }, 400);
}

function mostrarMensajeLinea(texto, x, y) {
    const m = document.createElement("div");
    m.classList.add("mensaje-linea");
    m.textContent = texto;
    m.style.left = x + "px";
    m.style.top = y + "px";
    document.body.appendChild(m);
    setTimeout(() => m.remove(), 1100);
}

function crearParticulas(celda, n = 8) {
    const rectCelda = celda.getBoundingClientRect();
    const rectTab = tablero.getBoundingClientRect();
    const color = celda.style.backgroundColor || "#fff";

    for (let i = 0; i < n; i++) {
        const p = document.createElement("div");
        p.classList.add("particula");
        p.style.color = color;
        p.style.setProperty("--x", ((Math.random() - 0.5) * 90) + "px");
        p.style.setProperty("--y", ((Math.random() - 0.5) * 90) + "px");
        p.style.left = (rectCelda.left - rectTab.left + rectCelda.width / 2 - 4) + "px";
        p.style.top  = (rectCelda.top - rectTab.top + rectCelda.height / 2 - 4) + "px";
        tablero.appendChild(p);
        setTimeout(() => p.remove(), 750);
    }
}

/* =========================================================
   DERROTA
   ========================================================= */
function puedeColocarse(forma) {
    const alto = forma.length;
    const ancho = forma[0].length;

    for (let f0 = 0; f0 <= TAM - alto; f0++) {
        for (let c0 = 0; c0 <= TAM - ancho; c0++) {
            let ok = true;
            for (let f = 0; f < alto && ok; f++) {
                for (let c = 0; c < ancho && ok; c++) {
                    if (forma[f][c] === 1 &&
                        celdas[(f0 + f) * TAM + (c0 + c)].classList.contains("ocupada")) {
                        ok = false;
                    }
                }
            }
            if (ok) return true;
        }
    }
    return false;
}

function comprobarDerrota() {
    const piezas = document.querySelectorAll(".pieza");
    if (piezas.length === 0) return;

    for (const p of piezas) {
        const formaId = parseInt(p.dataset.formaId);
        if (puedeColocarse(PIEZAS[formaId])) return;
    }

    const vidas = Number(localStorage.getItem("usuarioVidas"));
    if (vidas === 5) actualizarUltimaRecarga();

    mostrarDerrota();
}

function mostrarDerrota() {
    document.getElementById("modal-derrota").classList.remove("oculto");
    estado.bloqueado = true;
}

/* =========================================================
   API VIDAS
   ========================================================= */
function restarVida() {
    fetch(`${API}/usuario/perder-vida`, {
        method: "POST",
        headers: { Authorization: "Bearer " + token }
    }).then(r => r.json()).then(d => {
        if (d.vidas !== undefined) localStorage.setItem("usuarioVidas", d.vidas);
    }).catch(console.error);
}

function sumarVida() {
    fetch(`${API}/usuario/sumar-vida`, {
        method: "POST",
        headers: { Authorization: "Bearer " + token }
    }).catch(console.error);
}

function comprobarVidas() {
    fetch(`${API}/usuario`, {
        headers: { Authorization: "Bearer " + token }
    }).then(r => r.json()).then(u => {
        if (u.vidas <= 0) mostrarModalSinVidas();
    }).catch(console.error);
}

function actualizarUltimaRecarga() {
    fetch(`${API}/usuario/actualizar-recarga`, {
        method: "POST",
        headers: { Authorization: "Bearer " + token }
    }).catch(console.error);
}

function mostrarModalSinVidas() {
    const overlay = document.getElementById("overlaySinVidas");
    const texto = document.getElementById("vidasContadorTexto");
    const contador = overlay.querySelector(".vidas-contador");

    overlay.classList.remove("oculto");
    let s = 3;
    texto.textContent = s;
    contador.style.setProperty("--progreso", "100%");

    const it = setInterval(() => {
        s--;
        texto.textContent = Math.max(s, 0);
        contador.style.setProperty("--progreso", (s / 3 * 100) + "%");
        if (s <= 0) {
            clearInterval(it);
            window.location.href = "index.html";
        }
    }, 1000);
}

/* =========================================================
   MODAL DE SALIDA (botón atrás)
   ========================================================= */
function configurarSalida() {
    const modal = document.getElementById("modalSalirCustom");
    const ok = document.getElementById("confirmarSalirCustom");
    const cancel = document.getElementById("cancelarSalirCustom");

    history.pushState(null, "", location.href);
    window.addEventListener("popstate", () => {
        modal.classList.remove("oculto");
        history.pushState(null, "", location.href);
    });

    ok.addEventListener("click", () => {
        const vidas = Number(localStorage.getItem("usuarioVidas"));
        if (vidas === 5) actualizarUltimaRecarga();
        window.location.href = "index.html";
    });

    cancel.addEventListener("click", () => modal.classList.add("oculto"));
}

/* =========================================================
   INICIALIZACIÓN
   ========================================================= */
function init() {
    if (!estado.nivel) {
        window.location.href = "index.html";
        return;
    }

    crearTablero();
    generarPiezas();
    actualizarBarraExp();

    document.getElementById("btn-reintentar").addEventListener("click", () => location.reload());
    document.getElementById("btn-menu").addEventListener("click", () => window.location.href = "index.html");

    configurarSalida();

    // Asíncronos sin bloquear
    validarSesion().then(() => {
        cargarNiveles();
        comprobarVidas();
        restarVida();
    });
}

init();
