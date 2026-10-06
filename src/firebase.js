import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyCGlgBpf4O_HQlv1FacijljNTqAG0M46UM",
    authDomain: "cap-stone-2cb81.firebaseapp.com",
    projectId: "cap-stone-2cb81",
    storageBucket: "cap-stone-2cb81.firebasestorage.app",
    messagingSenderId: "522618187111",
    appId: "1:522618187111:web:300f067b30c8c9937fd3c2",
    measurementId: "G-LNG05S85PE"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export const requestForToken = async () => {
    try {
        const currentToken = await getToken(messaging, {
            vapidKey: "BChTvLWcPHNme5SIz8e0DzNtC5LCVVhph0-ijXa97jKRgghlT-LijZQBG__t_-c0AusFC0AjTdfhN17zRo1mcZ8"
        });

        if (currentToken) {
            console.log("🎉 FCM 디바이스 토큰 발급 성공:", currentToken);
            return currentToken;
        } else {
            console.log("알림 권한을 허용하지 않았습니다.");
            return null;
        }
    } catch (err) {
        console.error("토큰 가져오기 실패:", err);
        return null;
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });