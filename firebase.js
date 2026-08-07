// CONFIGURACIÓN DE FIREBASE
// Reemplaza los valores de ejemplo por los de tu aplicación web de Firebase.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDwUFIwCnTjmPwsiFmgH5SKLULxXQNKxA0",
  authDomain: "sorteo24-38e1b.firebaseapp.com",
  projectId: "sorteo24-38e1b",
  storageBucket: "sorteo24-38e1b.firebasestorage.app",
  messagingSenderId: "1055855988813",
  appId: "1:1055855988813:web:a224e8b41b552571908c04"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
