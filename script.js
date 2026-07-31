(() => {
"use strict";

const firebaseConfig = {
  apiKey: "AIzaSyBXxee2n1nIekTGo4onZxlTpx_CwCytrp4",
  authDomain: "strimko-676be.firebaseapp.com",
  databaseURL: "https://strimko-676be-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "strimko-676be",
  storageBucket: "strimko-676be.firebasestorage.app",
  messagingSenderId: "276012999347",
  appId: "1:276012999347:web:9f2448cf1eb53f54d5c6c6"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.database();
const settingsRef = db.ref("donateManager/settings");
const eventsRef = db.ref("donateManager/events");

const DEFAULTS = {
  enabled: true,
  minDelay: 45,
  maxDelay: 120,
  minAmount: 20,
  maxAmount: 1500,
  currency: "₴",
  duration: 8,
  soundEnabled: true,
  gifEnabled: true,
  ttsEnabled: true,
  volume: 70
};

/* СЮДА ДОБАВЛЯЙ НИКИ */
const NAMES = [
  "DarkWolf228","TankistUA","NightRider","LuckyFox","CyberCat","SteelBear",
  "RedDragon","GhostPlayer","PixelKing","TurboHamster","VikingPro","SilentStorm",
  "NeonTiger","OldSchool","MegaDon","KotikLive","ShadowFox","FireBird",
  "ChillMan","RockyPlay","DemonTank","FrostByte","CrazyPanda","MrGoodGame"
];

/* СЮДА ДОБАВЛЯЙ СООБЩЕНИЯ */
const MESSAGES = [
  "Хорошего стрима!",
  "Давай тащи катку!",
  "Красавчик, продолжай!",
  "На удачу в следующем бою.",
  "Спасибо за стрим.",
  "Лови поддержку!",
  "Стрим огонь!",
  "За красивый бой!",
  "Пусть рандом будет добрым.",
  "Покажи мастер-класс.",
  "Желаю серии побед.",
  "Вперёд к победе!"
];

/* СЮДА ДОБАВЛЯЙ ЗВУКИ */
const SOUNDS = [
  // "sounds/bruh.mp3"
];

/* СЮДА ДОБАВЛЯЙ GIF */
const GIFS = [
  // "gifs/cat.gif"
];

const alertBox = document.getElementById("donateAlert");
const nameEl = document.getElementById("donateName");
const amountEl = document.getElementById("donateAmount");
const messageEl = document.getElementById("donateMessage");
const mediaBox = document.getElementById("mediaBox");
const gifEl = document.getElementById("donateGif");
const audioEl = document.getElementById("donateAudio");

let settings = {...DEFAULTS};
let queue = [];
let busy = false;
let autoTimer = null;
let availableVoices = [];
const startedAt = Date.now();

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min, max) {
  min = Math.ceil(Number(min));
  max = Math.floor(Number(max));

  if (max < min) {
    [min, max] = [max, min];
  }

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function receiveDonate(data) {
  if (!data || data.type !== "donate") return;
  queue.push(data);
  processQueue();
}

async function processQueue() {
  if (busy || queue.length === 0) return;

  busy = true;
  await showDonate(queue.shift());
  busy = false;
  processQueue();
}

async function showDonate(donate) {
  const name = String(donate.name || "Anonymous");
  const amount = Number(donate.amount || 0);
  const currency = donate.currency || settings.currency;
  const message = String(donate.message || "Спасибо за стрим!");

  nameEl.textContent = name;
  amountEl.textContent = `${amount} ${currency}`;
  messageEl.textContent = message;

  const gifPath =
    settings.gifEnabled && GIFS.length > 0
      ? randomItem(GIFS)
      : "";

  if (gifPath) {
    gifEl.src = gifPath;
    mediaBox.hidden = false;
  } else {
    gifEl.removeAttribute("src");
    mediaBox.hidden = true;
  }

  alertBox.hidden = false;
  alertBox.classList.remove("hide");
  void alertBox.offsetWidth;
  alertBox.classList.add("show");

  if (settings.soundEnabled) {
    playNotificationSound();
  }

  /*
    Небольшая задержка нужна, чтобы OBS успел показать алерт
    и загрузить системные голоса перед началом чтения.
  */
  if (settings.ttsEnabled) {
    setTimeout(() => speakDonate({name, amount, currency, message}), 350);
  }

  await wait(Math.max(3, Number(settings.duration) || 8) * 1000);

  alertBox.classList.remove("show");
  alertBox.classList.add("hide");
  await wait(500);

  alertBox.hidden = true;
  alertBox.classList.remove("hide");
}

function playNotificationSound() {
  if (SOUNDS.length > 0) {
    audioEl.src = randomItem(SOUNDS);
    audioEl.volume = Math.min(
      1,
      Math.max(0, Number(settings.volume) / 100)
    );
    audioEl.currentTime = 0;
    audioEl.play().catch(() => {});
    return;
  }

  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    const context = new AudioContextClass();
    const gain = context.createGain();
    const now = context.currentTime;

    gain.connect(context.destination);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.01, Number(settings.volume) / 350),
      now + 0.02
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

    [659.25, 783.99, 987.77].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start(now + index * 0.12);
      oscillator.stop(now + 0.75 + index * 0.12);
    });

    setTimeout(() => context.close().catch(() => {}), 1600);
  } catch (error) {
    console.warn("Не удалось воспроизвести стандартный звук:", error);
  }
}

/* Загружаем системные голоса Windows/Chromium */
function loadVoices() {
  if (!("speechSynthesis" in window)) return [];
  availableVoices = window.speechSynthesis.getVoices() || [];
  return availableVoices;
}

function selectRussianVoice() {
  const voices = loadVoices();

  return (
    voices.find(voice =>
      String(voice.lang).toLowerCase() === "ru-ru"
    ) ||
    voices.find(voice =>
      String(voice.lang).toLowerCase().startsWith("ru")
    ) ||
    voices.find(voice =>
      /russian|рус/i.test(`${voice.name} ${voice.lang}`)
    ) ||
    voices[0] ||
    null
  );
}

function currencyForSpeech(currency, amount) {
  const value = String(currency || "").trim().toLowerCase();

  if (value === "₴" || value === "uah" || value.includes("грн")) {
    return "гривен";
  }

  if (value === "₽" || value === "rub" || value.includes("руб")) {
    return "рублей";
  }

  if (value === "$" || value === "usd") {
    return "долларов";
  }

  if (value === "€" || value === "eur") {
    return "евро";
  }

  return currency || "";
}

/*
  Читает: ник, сумму и сообщение.
  Используется стандартный системный голос браузера/Windows.
*/
function speakDonate(donate) {
  if (!("speechSynthesis" in window)) {
    console.warn("В этом браузере синтез речи недоступен.");
    return;
  }

  try {
    const synth = window.speechSynthesis;
    const spokenCurrency = currencyForSpeech(
      donate.currency,
      donate.amount
    );

    const speechText =
      `${donate.name}. ` +
      `${donate.amount} ${spokenCurrency}. ` +
      `${donate.message}`;

    synth.cancel();
    synth.resume();

    const utterance = new SpeechSynthesisUtterance(speechText);
    const selectedVoice = selectRussianVoice();

    utterance.lang = "ru-RU";
    utterance.rate = 0.96;
    utterance.pitch = 1;
    utterance.volume = Math.min(
      1,
      Math.max(0.1, Number(settings.volume) / 100)
    );

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onerror = event => {
      console.warn("Ошибка озвучивания:", event.error);
    };

    /*
      В OBS/Chromium объект необходимо сохранить до конца чтения,
      иначе сборщик мусора иногда обрывает озвучку.
    */
    window.__strimkoCurrentSpeech = utterance;

    utterance.onend = () => {
      window.__strimkoCurrentSpeech = null;
    };

    synth.speak(utterance);

    /*
      Дополнительный resume исправляет ситуацию,
      когда Chromium ставит синтез речи на паузу.
    */
    setTimeout(() => {
      if (synth.paused) synth.resume();
    }, 900);
  } catch (error) {
    console.warn("Не удалось запустить озвучивание:", error);
  }
}

if ("speechSynthesis" in window) {
  loadVoices();
  window.speechSynthesis.addEventListener(
    "voiceschanged",
    loadVoices
  );
}

function stopAutomaticDonations() {
  if (autoTimer) {
    clearTimeout(autoTimer);
    autoTimer = null;
  }
}

function scheduleNextDonate() {
  stopAutomaticDonations();

  if (!settings.enabled) return;

  const delaySeconds = Math.max(
    5,
    randomInt(settings.minDelay, settings.maxDelay)
  );

  autoTimer = setTimeout(() => {
    if (!settings.enabled) {
      stopAutomaticDonations();
      return;
    }

    receiveDonate({
      type: "donate",
      source: "auto",
      name: randomItem(NAMES),
      amount: randomInt(settings.minAmount, settings.maxAmount),
      currency: settings.currency,
      message: randomItem(MESSAGES),
      createdAt: Date.now()
    });

    scheduleNextDonate();
  }, delaySeconds * 1000);
}

settingsRef.on("value", snapshot => {
  const previousEnabled = settings.enabled;
  settings = {
    ...DEFAULTS,
    ...(snapshot.val() || {})
  };

  if (!settings.enabled) {
    stopAutomaticDonations();

    queue = queue.filter(
      item => item && item.source === "manual"
    );

    return;
  }

  if (!previousEnabled || !autoTimer) {
    scheduleNextDonate();
  }
});

eventsRef.limitToLast(1).on("child_added", snapshot => {
  const donate = snapshot.val();

  if (donate && !donate.source) {
    donate.source = "manual";
  }

  const createdAt = Number(donate?.createdAt || 0);

  if (createdAt && createdAt < startedAt - 5000) {
    return;
  }

  receiveDonate(donate);
});
})();