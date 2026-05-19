importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyAXwN_I3vVSfPfA_HKxJqJqiZXvLOWFZ5s",
    authDomain: "junta-y-gana-70b7a.firebaseapp.com",
    projectId: "junta-y-gana-70b7a",
    messagingSenderId: "2403292378",
    appId: "1:2403292378:web:65d2e57e71bd32f50381e3"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
    self.registration.showNotification(payload.notification.title, {
        body: payload.notification.body,
        icon: "https://jesusweb.ddns.net/uploads/fondo.png"
    });
});