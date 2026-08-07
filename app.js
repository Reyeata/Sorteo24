import { db } from "./firebase.js";
import {
  collection, getDocs, runTransaction, doc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const nameInput = document.getElementById("name");
const startBtn = document.getElementById("startBtn");
const countEl = document.getElementById("count");
const progressBar = document.getElementById("progressBar");
const result = document.getElementById("result");
const number1 = document.getElementById("number1");
const number2 = document.getElementById("number2");
const errorBox = document.getElementById("error");
const message = document.getElementById("message");

async function loadCount() {
  const snap = await getDocs(collection(db, "participants"));
  const count = snap.size;
  countEl.textContent = count;
  progressBar.style.width = `${Math.min(count / 12 * 100, 100)}%`;
  startBtn.disabled = count >= 12;
}

function showError(text) {
  errorBox.textContent = text;
  errorBox.hidden = false;
}

function randomNumber() {
  return Math.floor(Math.random() * 24) + 1;
}

startBtn.addEventListener("click", async () => {
  errorBox.hidden = true;
  result.hidden = true;
  const name = nameInput.value.trim().replace(/\s+/g, " ");

  if (!name) return showError("Escribe tu nombre primero.");
  if (name.length < 2) return showError("Escribe un nombre vÃ¡lido.");

  startBtn.disabled = true;
  message.hidden = false;
  message.textContent = "ðŸŽ¡ Buscando tus nÃºmeros...";

  try {
    const participantRef = doc(collection(db, "participants"));

    await runTransaction(db, async (transaction) => {
      const snapshot = await getDocs(collection(db, "participants"));
      if (snapshot.size >= 12) throw new Error("El sorteo ya estÃ¡ completo.");

      const normalized = name.toLowerCase();
      for (const item of snapshot.docs) {
        const data = item.data();
        if ((data.nameNormalized || "").toLowerCase() === normalized) {
          throw new Error("Ese nombre ya estÃ¡ registrado.");
        }
      }

      const used = new Set();
      snapshot.forEach(item => {
        const data = item.data();
        (data.numbers || []).forEach(n => used.add(Number(n)));
      });

      const available = [];
      for (let n = 1; n <= 24; n++) if (!used.has(n)) available.push(n);
      if (available.length < 2) throw new Error("No quedan dos nÃºmeros disponibles.");

      const a = available[Math.floor(Math.random() * available.length)];
      const rest = available.filter(n => n !== a);
      const b = rest[Math.floor(Math.random() * rest.length)];

      transaction.set(participantRef, {
        name,
        nameNormalized: normalized,
        numbers: [a, b],
        createdAt: Date.now()
      });

      number1.textContent = a;
      number2.textContent = b;
    });

    message.hidden = true;
    result.hidden = false;
    nameInput.disabled = true;
    await loadCount();
  } catch (err) {
    message.hidden = true;
    showError(err.message || "OcurriÃ³ un error. Intenta nuevamente.");
    await loadCount();
    startBtn.disabled = false;
  }
});

loadCount().catch(() => {
  showError("TodavÃ­a no estÃ¡ conectada la configuraciÃ³n de Firebase.");
});
