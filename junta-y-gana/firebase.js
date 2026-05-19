import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging.js";

const app = initializeApp({
    apiKey: "AIzaSyAXwN_I3vVSfPfA_HKxJqJqiZXvLOWFZ5s",
    authDomain: "junta-y-gana-70b7a.firebaseapp.com",
    projectId: "junta-y-gana-70b7a",
    messagingSenderId: "2403292378",
    appId: "1:2403292378:web:65d2e57e71bd32f50381e3"
});

const messaging = getMessaging(app);

// ==============================
// Función para activar notificaciones
// ==============================
const activarNotificaciones = async () => {
    if (!("serviceWorker" in navigator) || !("Notification" in window)) {
        console.warn("Notificaciones push no soportadas en este navegador");
        return null;
    }

    // Pedir permiso
    const permiso = await Notification.requestPermission();
    if (permiso !== "granted") {
        console.log("Permiso de notificaciones denegado");
        return null;
    }

    // Obtener token
    let token_push = null;
    try {
        token_push = await getToken(messaging, {
            vapidKey: "BKhf6nY6S9Qwm60OGai_Ywo78RKwqG1HENp0T-nwQ6SBJPvoaxVHI7ogrg4vRHwFpusLAkSgFr3U7WxUmVVfs6M"
        });
        console.log("Token push obtenido:", token_push);
    } catch (err) {
        console.warn("No se pudo obtener token del dispositivo:", err);
    }

    // Enviar token al servidor si existe
    if (token_push) {
        const jwtUsuario = localStorage.getItem("token");
        if (jwtUsuario) {
            try {
                await fetch("https://jesusweb.ddns.net/juntaygana/guardar-token", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + jwtUsuario
                    },
                    body: JSON.stringify({ token_push })
                });
                console.log("Token enviado al servidor");
            } catch (err) {
                console.error("Error enviando token al servidor:", err);
            }
        }
    }

    return token_push;
};

// ==============================
// Registrar Service Worker
// ==============================
const registrarSW = async () => {
    if (!("serviceWorker" in navigator)) return null;
    try {
        const registro = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        console.log("Service Worker registrado:", registro);
        return registro;
    } catch (err) {
        console.error("Error registrando Service Worker:", err);
        return null;
    }
};

// ==============================
// Foreground: mostrar notificaciones con app abierta
// ==============================
onMessage(messaging, (payload) => {
    console.log("Mensaje recibido foreground:", payload);
    if (Notification.permission === "granted") {
        new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: "https://jesusweb.ddns.net/uploads/fondo.png"
        });
    }
});

// ==============================
// Lógica principal al cargar el DOM
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
    const modal = document.getElementById("modalNotificaciones");
    const btnSi = document.getElementById("btn-noti-si");
    const btnNo = document.getElementById("btn-noti-no");

    const jwtUsuario = localStorage.getItem("token");
    if (!jwtUsuario) return;

    // 1️⃣ Registrar SW
    await registrarSW();

    // 2️⃣ Obtener token actual del dispositivo (fallback seguro)
    let tokenDispositivo = null;
    try {
        tokenDispositivo = await getToken(messaging, {
            vapidKey: "BKhf6nY6S9Qwm60OGai_Ywo78RKwqG1HENp0T-nwQ6SBJPvoaxVHI7ogrg4vRHwFpusLAkSgFr3U7WxUmVVfs6M"
        });
        console.log("Token dispositivo:", tokenDispositivo);
    } catch (err) {
        console.warn("No se pudo obtener token del dispositivo:", err);
    }

    // 3️⃣ Traer token_push del usuario desde el endpoint
    let tokenBD = null;
    try {
        const res = await fetch("https://jesusweb.ddns.net/juntaygana/usuario", {
            headers: { "Authorization": "Bearer " + jwtUsuario }
        });
        if (res.ok) {
            const usuario = await res.json();
            tokenBD = usuario.token_push;
            console.log("Token BD:", tokenBD);
        }
    } catch (err) {
        console.warn("Error obteniendo token del usuario:", err);
    }

    // 4️⃣ Mostrar modal solo si el token es distinto o no existe
    if (!tokenBD || tokenBD !== tokenDispositivo) {
        modal.style.display = "flex";
    }

    // 5️⃣ Botones del modal
    btnSi.addEventListener("click", async () => {
        modal.style.display = "none";
        await activarNotificaciones();
    });

    btnNo.addEventListener("click", () => {
        modal.style.display = "none";
        console.log("Usuario no activó notificaciones");
    });
});