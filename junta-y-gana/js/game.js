const coloresPiezas = [
    "#ff595e",
    "#ffca3a",
    "#8ac926",
    "#1982c4",
    "#6a00ff",
    "#ff924c"
];

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "/junta-y-gana/auth/login.html";
}

// ------------------- NIVELES Y EXPERIENCIA -------------------

const nivelActual = parseInt(localStorage.getItem("nivelSeleccionado"));

if (!nivelActual) {
    window.location.href = "index.html";
}

const barraRelleno = document.getElementById("relleno-exp");
const textoExp = document.getElementById("exp-text");
const textoNivel = document.getElementById("nivel-text");

let niveles = [];
let expActual = 0;
let expRequerida = 0;

// Actualiza la barra de experiencia visual
function actualizarBarraExp() {
    const barra = document.querySelector("#relleno-exp");
    const porcentaje = Math.min((expActual / expRequerida) * 100, 100);

    // Animación de la barra (progresiva)
    barra.style.width = porcentaje + "%";

    // Brillo momentáneo al subir
    barra.classList.add("resplandor");
    setTimeout(() => barra.classList.remove("resplandor"), 400);

    // Actualizar texto
    textoExp.textContent = `${expActual} / ${expRequerida} EXP`;
    textoNivel.textContent = `Nivel ${nivelActual}`;
}

function sumarExperiencia(cantidad) {
    const objetivo = expActual + cantidad;
    const duracion = 800; // 0.8s
    const inicio = expActual;
    const inicioTiempo = performance.now();

    function animar(now) {
        const tiempoTranscurrido = now - inicioTiempo;
        const progreso = Math.min(tiempoTranscurrido / duracion, 1);

        expActual = Math.floor(inicio + (objetivo - inicio) * progreso);
        actualizarBarraExp();

        if (progreso < 1) {
            requestAnimationFrame(animar);
        } else if (expActual >= expRequerida) {
            pasarNivel();
        }
    }

    requestAnimationFrame(animar);
}



function sumarExperiencia(cantidad) {
    const objetivo = expActual + cantidad;
    const duracion = 800; // duración de la animación en ms
    const inicio = expActual;
    const inicioTiempo = performance.now();

    function animar(now) {
        const tiempoTranscurrido = now - inicioTiempo;
        const progreso = Math.min(tiempoTranscurrido / duracion, 1);

        // Experiencia actual interpolada
        expActual = Math.floor(inicio + (objetivo - inicio) * progreso);
        actualizarBarraExp();

        if (progreso < 1) {
            requestAnimationFrame(animar);
        } else {
            // Si supera el requerido, pasar de nivel
            if (expActual >= expRequerida) {
                pasarNivel();
            }
        }
    }

    requestAnimationFrame(animar);
    animarTextoExp();

}

function animarTextoExp() {
    textoExp.classList.add("text-animado");
    textoNivel.classList.add("text-animado");

    setTimeout(() => {
        textoExp.classList.remove("text-animado");
        textoNivel.classList.remove("text-animado");
    }, 300);
}



async function cargarNiveles() {
    const respuesta = await fetch("https://jesusweb.ddns.net/juntaygana/niveles");
    niveles = await respuesta.json();
    configurarNivel();
}

function configurarNivel() {
    const nivel = niveles.find(n => n.id === nivelActual);

    if (!nivel) {
        alert("Nivel no encontrado");
        return;
    }

    expRequerida = nivel.exp_requerida;
    expActual = 0;

    actualizarBarraExp();
    console.log(`Nivel ${nivelActual} → ${expRequerida} EXP`);
}

function pasarNivel() {
    const usuarioId = localStorage.getItem("usuarioId"); // recuperar id del usuario

    if (!usuarioId) {
        alert("No se ha encontrado el usuario.");
        return;
    }

    alert(`¡Nivel ${nivelActual} superado! usuario: ${usuarioId}`);

    sumarVida();

    // Subir nivel del usuario
    fetch("https://jesusweb.ddns.net/juntaygana/niveles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            nivel: nivelActual,
            usuarioId: usuarioId // enviamos el id del usuario
        })
    })
        .then(res => res.json())
        .then(data => {
            console.log(data.mensaje || data);
            localStorage.removeItem("nivelSeleccionado");
            localStorage.removeItem("usuarioId"); // limpiar si quieres
            window.location.href = "index.html";
        })
        .catch(err => {
            console.error("Error al subir nivel:", err);
            alert("Hubo un error al subir el nivel. Intenta de nuevo.");
        });
}


// ------------------- LOGICA DEL JUEGO -------------------

let offsetX = 0;
let offsetY = 0;
let idActual = null;

// Crear tablero
const tablero = document.getElementById("tablero");
const tamaño = 8;
let celdas = [];

for (let i = 0; i < tamaño * tamaño; i++) {
    const celda = document.createElement("div");
    celda.classList.add("celda");
    celda.dataset.index = i;
    tablero.appendChild(celda);
    celdas.push(celda);
}

// Piezas disponibles
const piezasData = [
    [[1]],

    [[1, 1]],
    [[1], [1]],

    [[1, 1, 1]],
    [[1], [1], [1]],

    [[1, 1, 1, 1]],
    [[1], [1], [1], [1]],

    [[1, 1], [1, 1]],

    [[1, 0], [1, 0], [1, 1]],
    [[0, 1], [0, 1], [1, 1]],

    [[1, 1, 0], [0, 1, 1]],
    [[0, 1, 1], [1, 1, 0]],

    [[1, 1, 1], [0, 1, 0]],

    [[1, 1], [1, 0]],
    [[1, 1], [0, 1]],

    [[1, 1, 1], [1, 1, 1]]
];

// Contenedor de piezas
const contenedorPiezas = document.getElementById("piezas");

function generarPiezas() {
    contenedorPiezas.innerHTML = "";

    let usadas = [];

    while (usadas.length < 3) {
        const indice = Math.floor(Math.random() * piezasData.length);
        if (!usadas.includes(indice)) {
            usadas.push(indice);
            crearPieza(indice);
        }
    }
}


function crearPieza(id) {
    const forma = piezasData[id];

    const color = coloresPiezas[Math.floor(Math.random() * coloresPiezas.length)];

    const contenedor = document.createElement("div");
    contenedor.classList.add("contenedor-pieza");

    const pieza = document.createElement("div");
    pieza.classList.add("pieza");
    pieza.draggable = true;

    const idUnico = `${id}-${Date.now()}-${Math.random()}`;
    pieza.dataset.id = idUnico;

    pieza.dataset.colores = JSON.stringify(
        forma.flat().filter(v => v === 1).map(() => color)
    );

    // Cambiamos px por 1fr para que se adapte
    pieza.style.display = "grid";
    pieza.style.gridTemplateColumns = `repeat(${forma[0].length}, 1fr)`;
    pieza.style.gridAutoRows = "1fr"; // filas proporcionales

    forma.forEach(fila => {
        fila.forEach(valor => {
            const bloque = document.createElement("div");
            if (valor === 1) {
                bloque.classList.add("bloque");
                bloque.style.backgroundColor = color;
            }
            pieza.appendChild(bloque);
        });
    });

    contenedor.appendChild(pieza);
    contenedorPiezas.appendChild(contenedor);

    // Solo activar drag táctil si es móvil (pantalla menor a 768px, por ejemplo)
    if (window.matchMedia("(max-width: 768px)").matches) {
        pieza.addEventListener("touchstart", e => {
            e.preventDefault();
            idActual = pieza.dataset.id;

            const rect = pieza.getBoundingClientRect();

            // Hacemos que la pieza se dibuje un poco por encima del dedo (ej: 50px)
            let offsetXTouch = e.touches[0].clientX - rect.left;
            let offsetYTouch = e.touches[0].clientY - rect.top + 100; // <- este +50 hace que la pieza quede arriba del dedo

            // Posición absoluta y z-index alto para que quede encima de todo
            pieza.style.position = "absolute";
            pieza.style.zIndex = 1000;

            // Colocamos inicialmente la pieza donde estaba
            pieza.style.left = rect.left + "px";
            pieza.style.top = rect.top + "px";

            // Movemos la pieza con el dedo
            const mover = e2 => {
                e2.preventDefault();
                pieza.style.left = e2.touches[0].clientX - offsetXTouch + "px";
                pieza.style.top = e2.touches[0].clientY - offsetYTouch + "px";
            };

            // Al soltar la pieza
            const soltar = e2 => {
                e2.preventDefault();

                const tableroRect = tablero.getBoundingClientRect();
                const rectPieza = pieza.getBoundingClientRect();

                // Calculamos la posición relativa de la pieza al tablero
                const x = rectPieza.left - tableroRect.left;
                const y = rectPieza.top - tableroRect.top;

                const tamañoCelda = celdas[0].offsetWidth;

                // Verificamos si la pieza está dentro del tablero
                if (x >= 0 && y >= 0 && x < tableroRect.width && y < tableroRect.height) {
                    const col = Math.floor(x / tamañoCelda);
                    const fila = Math.floor(y / tamañoCelda);

                    const colFinal = Math.min(Math.max(col, 0), tamaño - 1);
                    const filaFinal = Math.min(Math.max(fila, 0), tamaño - 1);

                    const index = filaFinal * tamaño + colFinal;

                    const id = parseInt(idActual.split("-")[0]);
                    colocarPieza(index, piezasData[id]);
                }

                // Limpiamos estilos
                pieza.style.position = "";
                pieza.style.zIndex = "";
                pieza.style.left = "";
                pieza.style.top = "";

                document.removeEventListener("touchmove", mover);
                document.removeEventListener("touchend", soltar);
            };


            document.addEventListener("touchmove", mover, { passive: false });
            document.addEventListener("touchend", soltar);
        });




    } else {
        pieza.addEventListener("dragstart", e => {
            e.dataTransfer.setData("pieza", idUnico);
            idActual = idUnico;

            const rect = pieza.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
        });
    }

}


// ------------------- DRAG & DROP PARA MÓVIL -------------------

function habilitarDragTouch() {
    let piezaActualTouch = null;
    let offsetXTouch = 0;
    let offsetYTouch = 0;
    let celdaPreview = null; // Celda que vamos a marcar

    celdas.forEach(celda => {
        const pieza = celda.querySelector(".pieza");
        if (pieza) {
            pieza.addEventListener("touchstart", e => {
                e.preventDefault();
                piezaActualTouch = pieza;

                const rect = pieza.getBoundingClientRect();
                offsetXTouch = e.touches[0].clientX - rect.left;
                offsetYTouch = e.touches[0].clientY - rect.top - 30;

                pieza.style.position = "absolute";
                pieza.style.zIndex = 1000;

                moverPiezaTouch(e);
                document.addEventListener("touchmove", moverPiezaTouch, { passive: false });
                document.addEventListener("touchend", soltarPiezaTouch);
            });
        }
    });

    function moverPiezaTouch(e) {
        e.preventDefault();
        if (!piezaActualTouch) return;

        const clientX = e.touches[0].clientX;
        const clientY = e.touches[0].clientY;

        piezaActualTouch.style.left = clientX - offsetXTouch + "px";
        piezaActualTouch.style.top = clientY - offsetYTouch + "px";

        // **Mostrar celda donde se colocaría**
        const tableroRect = tablero.getBoundingClientRect();
        const x = clientX - tableroRect.left;
        const y = clientY - tableroRect.top;

        const tamañoCelda = celdas[0].offsetWidth + 2;
        const col = Math.floor(x / tamañoCelda);
        const fila = Math.floor(y / tamañoCelda);
        const index = fila * tamaño + col;

        // Limpiar celda anterior
        if (celdaPreview) celdaPreview.classList.remove("preview");

        // Marcar celda actual
        if (celdas[index]) {
            celdaPreview = celdas[index];
            celdaPreview.classList.add("preview");
        }
    }

    function soltarPiezaTouch(e) {
        if (!piezaActualTouch) return;

        const tableroRect = tablero.getBoundingClientRect();
        const clientX = e.changedTouches[0].clientX;
        const clientY = e.changedTouches[0].clientY;

        const x = clientX - tableroRect.left;
        const y = clientY - tableroRect.top;

        const tamañoCelda = celdas[0].offsetWidth + 2;
        const col = Math.floor(x / tamañoCelda);
        const fila = Math.floor(y / tamañoCelda);
        const index = fila * tamaño + col;

        const id = parseInt(piezaActualTouch.dataset.id.split("-")[0]);
        idActual = piezaActualTouch.dataset.id;

        // **Solo colocar si la celda existe**
        if (celdas[index]) {
            colocarPieza(index, piezasData[id]);
        }

        // Limpiar estilos
        piezaActualTouch.style.position = "";
        piezaActualTouch.style.zIndex = "";
        piezaActualTouch = null;

        if (celdaPreview) {
            celdaPreview.classList.remove("preview");
            celdaPreview = null;
        }

        document.removeEventListener("touchmove", moverPiezaTouch);
        document.removeEventListener("touchend", soltarPiezaTouch);
    }



}


// Llamamos a la función después de generar piezas


// Drag & Drop tablero
tablero.addEventListener("dragover", e => e.preventDefault());

let celdasResaltadas = [];

tablero.addEventListener("dragover", e => {
    e.preventDefault();
    if (!idActual) return;

    const pieza = document.querySelector(`.pieza[data-id="${idActual}"]`);
    const id = parseInt(idActual.split("-")[0]);
    const forma = piezasData[id];

    const rect = tablero.getBoundingClientRect();
    const tamañoCelda = celdas[0].offsetWidth + 2;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const anchoPieza = forma[0].length;
    const altoPieza = forma.length;

    let col = Math.floor((x - (anchoPieza * tamañoCelda) / 2) / tamañoCelda);
    let fila = Math.floor((y - (altoPieza * tamañoCelda) / 2) / tamañoCelda);

    // Limitar dentro del tablero
    col = Math.max(0, Math.min(tamaño - anchoPieza, col));
    fila = Math.max(0, Math.min(tamaño - altoPieza, fila));

    // Quitar resaltado anterior
    celdasResaltadas.forEach(c => c.classList.remove("celda-resaltada", "celda-invalida"));
    celdasResaltadas = [];

    let puede = true;
    // Ver qué celdas ocuparía la pieza
    for (let f = 0; f < altoPieza; f++) {
        for (let c = 0; c < anchoPieza; c++) {
            if (forma[f][c] === 1) {
                const pos = (fila + f) * tamaño + (col + c);
                if (celdas[pos].classList.contains("ocupada")) {
                    puede = false;
                }
                celdasResaltadas.push(celdas[pos]);
            }
        }
    }

    // Resaltar
    celdasResaltadas.forEach(celda => {
        celda.classList.add(puede ? "celda-resaltada" : "celda-invalida");
    });
});

tablero.addEventListener("drop", e => {
    e.preventDefault();
    if (!idActual) return;

    const pieza = document.querySelector(`.pieza[data-id="${idActual}"]`);
    const id = parseInt(idActual.split("-")[0]);
    const forma = piezasData[id];

    const rect = tablero.getBoundingClientRect();
    const tamañoCelda = celdas[0].offsetWidth + 2;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const anchoPieza = forma[0].length;
    const altoPieza = forma.length;

    let col = Math.floor((x - (anchoPieza * tamañoCelda) / 2) / tamañoCelda);
    let fila = Math.floor((y - (altoPieza * tamañoCelda) / 2) / tamañoCelda);

    col = Math.max(0, Math.min(tamaño - anchoPieza, col));
    fila = Math.max(0, Math.min(tamaño - altoPieza, fila));

    // Comprobar si se puede colocar
    let puede = true;
    for (let f = 0; f < altoPieza; f++) {
        for (let c = 0; c < anchoPieza; c++) {
            if (forma[f][c] === 1) {
                const pos = (fila + f) * tamaño + (col + c);
                if (celdas[pos].classList.contains("ocupada")) {
                    puede = false;
                    break;
                }
            }
        }
        if (!puede) break;
    }

    // Limpiar resaltados
    celdasResaltadas.forEach(c => c.classList.remove("celda-resaltada", "celda-invalida"));
    celdasResaltadas = [];

    if (puede) {
        const index = fila * tamaño + col;
        colocarPieza(index, forma);
    }
});




function colocarPieza(index, forma) {
    const filaInicio = Math.floor(index / tamaño);
    const colInicio = index % tamaño;

    let posiciones = [];

    // 1️⃣ VALIDAR TODA LA PIEZA
    for (let f = 0; f < forma.length; f++) {
        for (let c = 0; c < forma[f].length; c++) {
            if (forma[f][c] === 1) {
                const fila = filaInicio + f;
                const col = colInicio + c;

                if (fila >= tamaño || col >= tamaño) return;
                const pos = fila * tamaño + col;

                if (celdas[pos].classList.contains("ocupada")) return;

                posiciones.push(pos);
            }
        }
    }

    // 2️⃣ COLOCAR (ya sabemos que es válida)
    const pieza = document.querySelector(`.pieza[data-id="${idActual}"]`);
    const coloresBloques = JSON.parse(pieza.dataset.colores);

    posiciones.forEach((pos, i) => {
        const celda = celdas[pos];
        celda.classList.add("ocupada", "bloque");
        celda.style.backgroundColor = coloresBloques[i];
    });

    // 3️⃣ ELIMINAR LA PIEZA USADA (SIEMPRE)
    const contenedor = pieza.parentElement;
    if (contenedor) contenedor.remove();
    idActual = null;

    if (contenedorPiezas.children.length === 0) {
        generarPiezas();
    }

    // 4️⃣ LIMPIAR LÍNEAS Y COMPROBAR DERROTA
    limpiarLineas(() => {
        comprobarDerrota();
    });
}






function limpiarLineas(callback) {
    let celdasABorrar = new Set();
    let lineasCompletadas = 0;

    // Filas
    for (let f = 0; f < tamaño; f++) {
        const fila = celdas.slice(f * tamaño, f * tamaño + tamaño);
        if (fila.every(c => c.classList.contains("ocupada"))) {
            fila.forEach(c => celdasABorrar.add(c));
            lineasCompletadas++;
        }
    }

    // Columnas
    for (let c = 0; c < tamaño; c++) {
        let columnaCompleta = true;
        for (let f = 0; f < tamaño; f++) {
            if (!celdas[f * tamaño + c].classList.contains("ocupada")) {
                columnaCompleta = false;
                break;
            }
        }

        if (columnaCompleta) {
            for (let f = 0; f < tamaño; f++) {
                celdasABorrar.add(celdas[f * tamaño + c]);
            }
            lineasCompletadas++;
        }
    }

    if (celdasABorrar.size === 0) {
        if (callback) callback(); // Solo se llama si existe
        return;
    }

    celdasABorrar.forEach(celda => {
        crearParticulas(celda);
        celda.classList.add("celda-limpiandose");
    });

    setTimeout(() => {
        celdasABorrar.forEach(celda => {
            celda.classList.remove("ocupada", "bloque", "celda-limpiandose");
            celda.style.backgroundColor = "";
        });

        if (lineasCompletadas > 0) {
            const puntos = lineasCompletadas * 100;
            sumarExperiencia(puntos);

            const palabras = ["¡Genial!", "¡Perfecto!", "¡Increíble!", "¡Wow!"];
            const mensaje = palabras[Math.floor(Math.random() * palabras.length)] + " +" + puntos;

            const primeraCelda = celdasABorrar.values().next().value;
            const rect = primeraCelda.getBoundingClientRect();
            mostrarMensajeLinea(mensaje, rect.left, rect.top);
        }

        if (callback) callback();
    }, 300);
}


// -- ---------------------- MENSAJES POR LINEA LIMPIADA ----------------------

function mostrarMensajeLinea(texto, x, y) {
    const mensaje = document.createElement("div");
    mensaje.classList.add("mensaje-linea");
    mensaje.textContent = texto;

    // Colocarlo sobre el tablero
    const contenedorTablero = document.querySelector("#tablero"); // Cambia si tu contenedor tiene otro ID
    contenedorTablero.appendChild(mensaje);

    // Posición
    mensaje.style.left = x + "px";
    mensaje.style.top = y + "px";

    // Animación
    requestAnimationFrame(() => {
        mensaje.style.transform = "translateY(-50px)";
        mensaje.style.opacity = "1";
    });

    // Desaparece después
    setTimeout(() => {
        mensaje.style.opacity = "0";
        mensaje.style.transform = "translateY(-100px)";
        setTimeout(() => mensaje.remove(), 600);
    }, 600);
}



// ------------------- PARTICULAS DE DESTRUCCION -------------------

function crearParticulas(celda, cantidad = 8) {
    const rect = celda.getBoundingClientRect();
    const contenedor = celda.parentElement;

    for (let i = 0; i < cantidad; i++) {
        const particula = document.createElement("div");
        particula.classList.add("particula");

        const x = (Math.random() - 0.5) * 80 + "px";
        const y = (Math.random() - 0.5) * 80 + "px";

        particula.style.setProperty("--x", x);
        particula.style.setProperty("--y", y);

        particula.style.left = celda.offsetLeft + celda.offsetWidth / 2 + "px";
        particula.style.top = celda.offsetTop + celda.offsetHeight / 2 + "px";

        particula.style.color = celda.style.backgroundColor || "#fff";

        contenedor.appendChild(particula);

        // Eliminar la partícula
        setTimeout(() => particula.remove(), 500);
    }
}



function puedeColocarse(forma) {
    const alto = forma.length;
    const ancho = forma[0].length;

    for (let filaInicio = 0; filaInicio <= tamaño - alto; filaInicio++) {
        for (let colInicio = 0; colInicio <= tamaño - ancho; colInicio++) {

            let encaja = true;
            let bloquesColocados = 0;

            for (let f = 0; f < alto; f++) {
                for (let c = 0; c < ancho; c++) {
                    if (forma[f][c] === 1) {
                        const fila = filaInicio + f;
                        const col = colInicio + c;
                        const pos = fila * tamaño + col;

                        if (celdas[pos].classList.contains("ocupada")) {
                            encaja = false;
                            break;
                        }

                        bloquesColocados++;
                    }
                }
                if (!encaja) break;
            }

            // 🔴 CLAVE: al menos un bloque debe colocarse
            if (encaja && bloquesColocados > 0) {
                return true;
            }
        }
    }

    return false;
}



function comprobarDerrota() {
    const piezas = document.querySelectorAll(".pieza");

    if (piezas.length === 0) {
        return;
    }

    for (let pieza of piezas) {
        const id = parseInt(pieza.dataset.id.split("-")[0]);
        const forma = piezasData[id];

        if (puedeColocarse(forma)) {
            return; // Aún hay jugadas posibles
        }
    }

    let vidas = Number(localStorage.getItem("usuarioVidas"));
    console.log("Vidas:", vidas);

    if (vidas === 5) {
        actualizarUltimaRecarga();
    }

    console.log("DERROTA REAL");

    mostrarDerrota();
}

function mostrarDerrota() {
    const modal = document.getElementById("modal-derrota");

    modal.classList.remove("oculto");

    // Bloquear el tablero
    tablero.style.pointerEvents = "none";
    contenedorPiezas.style.pointerEvents = "none";
}




function restarVida() {
    fetch("https://jesusweb.ddns.net/juntaygana/usuario/perder-vida", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    })
        .then(res => res.json())
        .then(data => {
            console.log("Vidas restantes:", data.vidas);
        });

}

// ----------------------
// Función para sumar una vida desde el servidor
// ----------------------
function sumarVida() {

    fetch("https://jesusweb.ddns.net/juntaygana/usuario/sumar-vida", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    })
        .then(res => res.json())
        .then(console.log)
        .catch(console.error);

}

// ----------------------
// Función para comprobar vidas del usuario
// ----------------------

function comprobarVidas() {
    fetch("https://jesusweb.ddns.net/juntaygana/usuario", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    })
        .then(res => res.json())
        .then(usuario => {
            if (usuario.vidas <= 0) {
                mostrarModalSinVidas();
            }
        })
        .catch(console.error);
}



// ----------------------
// Función para actualizar la última recarga de vida del usuario
// ----------------------
function actualizarUltimaRecarga() {
    fetch("https://jesusweb.ddns.net/juntaygana/usuario/actualizar-recarga", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    })
        .then(res => res.json())
        .then(console.log)
        .catch(console.error);
}

// ------------------- MODAL SIN VIDAS -------------------

function mostrarModalSinVidas() {
    const overlay = document.getElementById("overlaySinVidas");
    const texto = document.getElementById("vidasContadorTexto");
    const contador = document.querySelector(".vidas-contador");

    let segundos = 3;
    const total = 3;

    overlay.classList.remove("oculto-vidas");
    texto.textContent = segundos;
    contador.style.setProperty("--progreso", "100%");

    const intervalo = setInterval(() => {
        segundos--;
        texto.textContent = segundos;

        const porcentaje = (segundos / total) * 100;
        contador.style.setProperty("--progreso", porcentaje + "%");

        if (segundos <= 0) {
            clearInterval(intervalo);
            window.location.href = "index.html";
        }
    }, 1000);
}



// ------------------- INICIALIZACION -------------------

generarPiezas();
cargarNiveles();
actualizarBarraExp();
restarVida();
habilitarDragTouch();
comprobarVidas();


// ------------------- BOTONES MODAL DERROTA -------------------

document.getElementById("btn-reintentar").addEventListener("click", () => {
    location.reload();
});

document.getElementById("btn-menu").addEventListener("click", () => {
    window.location.href = "index.html"; // cambia la ruta si hace falta
});

// ------------------- DETECCIÓN DE SALIDA -------------------

document.addEventListener("DOMContentLoaded", () => {

    const modal = document.getElementById("modalSalir");
    const confirmar = document.getElementById("confirmarSalir");
    const cancelar = document.getElementById("cancelarSalir");

    let vidas = Number(localStorage.getItem("usuarioVidas"));
    console.log("vidas -----" + vidas);

    if (!modal || !confirmar || !cancelar) return;

    // Bloqueamos el botón atrás
    history.pushState(null, "", location.href);

    // 🔹 BOTÓN ATRÁS
    window.addEventListener("popstate", () => {
        modal.style.display = "flex";
        history.pushState(null, "", location.href);
    });

    // 🔹 CONFIRMAR SALIDA
    confirmar.addEventListener("click", () => {

        // 👉 ACCIÓN ANTES DE SALIR
        if (vidas == 5) {
            actualizarUltimaRecarga();
            alert("Se ha actualizado la última recarga de vidas.");
        }

        // Salida real
        window.location.href = "index.html";
    });

    // 🔹 CANCELAR SALIDA
    cancelar.addEventListener("click", () => {
        modal.style.display = "none";
    });

});



