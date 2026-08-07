import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  runTransaction,
  doc
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
  progressBar.style.width = `${Math.min((count / 12) * 100, 100)}%`;

  startBtn.disabled = count >= 12;
}

function showError(text) {
  errorBox.textContent = text;
  errorBox.hidden = false;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Animación del giro
async function spinNumber(element, finalNumber, giro) {
  message.hidden = false;
  message.textContent = `🎡 ¡Giro ${giro}!`;

  element.textContent = "0";

  const duration = 2600;
  const interval = 80;
  const start = Date.now();

  while (Date.now() - start < duration) {
    const random = Math.floor(Math.random() * 24) + 1;
    element.textContent = random;

    await wait(interval);
  }

  element.textContent = finalNumber;

  // Pequeña pausa para que se vea el resultado
  await wait(900);
}

startBtn.addEventListener("click", async () => {
  errorBox.hidden = true;
  result.hidden = true;

  const name = nameInput.value.trim().replace(/\s+/g, " ");

  if (!name) {
    showError("Escribe tu nombre primero.");
    return;
  }

  if (name.length < 2) {
    showError("Escribe un nombre válido.");
    return;
  }

  startBtn.disabled = true;
  nameInput.disabled = true;

  message.hidden = false;
  message.textContent = "🎡 Preparando el sorteo...";

  try {
    const participantRef = doc(collection(db, "participants"));

    let assignedNumbers = [];

    // Reservar los números de forma segura en Firebase
    await runTransaction(db, async (transaction) => {
      const snapshot = await getDocs(collection(db, "participants"));

      if (snapshot.size >= 12) {
        throw new Error("El sorteo ya está completo.");
      }

      const normalized = name.toLowerCase();

      for (const item of snapshot.docs) {
        const data = item.data();

        if (
          (data.nameNormalized || "").toLowerCase() === normalized
        ) {
          throw new Error("Ese nombre ya está registrado.");
        }
      }

      const used = new Set();

      snapshot.forEach(item => {
        const data = item.data();

        (data.numbers || []).forEach(number => {
          used.add(Number(number));
        });
      });

      const available = [];

      for (let number = 1; number <= 24; number++) {
        if (!used.has(number)) {
          available.push(number);
        }
      }

      if (available.length < 2) {
        throw new Error("No quedan suficientes números disponibles.");
      }

      // Elegir los dos números únicos
      const firstIndex = Math.floor(Math.random() * available.length);
      const firstNumber = available[firstIndex];

      const remaining = available.filter(
        number => number !== firstNumber
      );

      const secondIndex = Math.floor(Math.random() * remaining.length);
      const secondNumber = remaining[secondIndex];

      assignedNumbers = [firstNumber, secondNumber];

      transaction.set(participantRef, {
        name: name,
        nameNormalized: normalized,
        numbers: assignedNumbers,
        createdAt: Date.now()
      });
    });

    // Mostrar el primer giro
    await spinNumber(number1, assignedNumbers[0], 1);

    // Preparar segundo giro
    message.textContent = "✨ ¡Vamos por tu segundo número!";
    await wait(1000);

    // Mostrar segundo giro
    await spinNumber(number2, assignedNumbers[1], 2);

    // Resultado final
    message.textContent = "🎉 ¡Estos son tus números!";

    result.hidden = false;

    await wait(300);

    message.textContent =
      "🔒 Tus números han quedado reservados.";

    await loadCount();

  } catch (error) {
    console.error(error);

    message.hidden = true;
    showError(
      error.message ||
      "Ocurrió un error. Intenta nuevamente."
    );

    nameInput.disabled = false;
    startBtn.disabled = false;

    await loadCount();
  }
});

loadCount().catch(() => {
  showError(
    "No se pudo conectar con Firebase. Revisa la configuración."
  );
});
