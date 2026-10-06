importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyCGlgBpf4O_HQlv1FacijljNTqAG0M46UM",
    authDomain: "cap-stone-2cb81.firebaseapp.com",
    projectId: "cap-stone-2cb81",
    storageBucket: "cap-stone-2cb81.firebasestorage.app",
    messagingSenderId: "522618187111",
    appId: "1:522618187111:web:300f067b30c8c9937fd3c2",
    measurementId: "G-LNG05S85PE"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
    console.log('백그라운드 메시지 수신: ', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/vite.svg'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});