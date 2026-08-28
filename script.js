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
const contentRef = db.ref("donateManager/content");

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
  ttsVoiceMode: "funny",
  volume: 70
};

/* СЮДА ДОБАВЛЯЙ НИКИ */
const DEFAULT_NAMES = [
  "DarkWolf228","TankistUA","NightRider","LuckyFox","CyberCat","SteelBear",
  "RedDragon","GhostPlayer","PixelKing","TurboHamster","VikingPro","SilentStorm",
  "NeonTiger","OldSchool","MegaDon","KotikLive","ShadowFox","FireBird",
  "ChillMan","RockyPlay","DemonTank","FrostByte","CrazyPanda","MrGoodGame"
];

/* СЮДА ДОБАВЛЯЙ СООБЩЕНИЯ */
const DEFAULT_MESSAGES = [
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

let activeNames = [...DEFAULT_NAMES];
let activeMessages = [...DEFAULT_MESSAGES];

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
let lastVoiceName = "";
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

function voiceLang(voice) {
  return String(voice && voice.lang || "").toLowerCase().replace("_", "-");
}

function getRussianVoices() {
  const voices = loadVoices();
  const russian = voices.filter(voice => {
    const lang = voiceLang(voice);
    const label = `${voice.name || ""} ${voice.lang || ""}`;
    return lang === "ru-ru" || lang.startsWith("ru") || /russian|рус/i.test(label);
  });
  return russian.length ? russian : voices;
}

function getCisVoices() {
  const voices = loadVoices();
  // Русский + языки СНГ/ближнего региона. Набор реально доступных
  // голосов зависит от Windows/Chromium на компьютере со стримом.
  const prefixes = [
    "ru", "uk", "be", "kk", "uz", "az", "hy", "ka", "ky", "tg", "tk", "ro"
  ];
  const pool = voices.filter(voice => {
    const lang = voiceLang(voice);
    return prefixes.some(prefix => lang === prefix || lang.startsWith(prefix + "-"));
  });
  return pool.length ? pool : getRussianVoices();
}

function getFunnyVoices() {
  const voices = loadVoices();
  if (!voices.length) return [];

  // Сначала стараемся брать СНГ/соседние языки. Если их мало,
  // добавляем европейские/английские голоса — русский текст у них
  // часто звучит забавно за счёт произношения.
  const preferredPrefixes = [
    "ru", "uk", "be", "kk", "uz", "az", "hy", "ka", "ky", "tg", "tk", "ro",
    "pl", "tr", "en", "de", "fr", "it", "es", "cs", "sk", "bg", "sr"
  ];
  const preferred = voices.filter(voice => {
    const lang = voiceLang(voice);
    return preferredPrefixes.some(prefix => lang === prefix || lang.startsWith(prefix + "-"));
  });
  return preferred.length >= 2 ? preferred : voices;
}

function getVoicePool(mode) {
  if (mode === "random_all") return loadVoices();
  if (mode === "random_ru" || mode === "first") return getRussianVoices();
  if (mode === "random_cis") return getCisVoices();
  return getFunnyVoices();
}

function selectTtsVoice() {
  const mode = settings.ttsVoiceMode || "funny";
  const voices = getVoicePool(mode);
  if (!voices.length) return null;

  if (mode === "first") {
    const voice = voices[0];
    lastVoiceName = voice.name || "";
    return voice;
  }

  // Не повторяем предыдущий голос, если доступно хотя бы два.
  const candidates = voices.length > 1
    ? voices.filter(voice => (voice.name || "") !== lastVoiceName)
    : voices;

  const voice = candidates[Math.floor(Math.random() * candidates.length)] || voices[0];
  lastVoiceName = voice.name || "";
  return voice;
}

function funnyDelivery() {
  if (settings.ttsVoiceMode !== "funny") {
    return { rate: 0.96, pitch: 1.0 };
  }

  // Небольшая вариативность, чтобы речь была живее, но оставалась понятной.
  const rates = [0.84, 0.90, 0.96, 1.02, 1.08, 1.14];
  const pitches = [0.82, 0.90, 1.00, 1.08, 1.16, 1.24];
  return {
    rate: randomItem(rates),
    pitch: randomItem(pitches)
  };
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
    const selectedVoice = selectTtsVoice();

    const delivery = funnyDelivery();
    utterance.lang = selectedVoice && selectedVoice.lang ? selectedVoice.lang : "ru-RU";
    utterance.rate = delivery.rate;
    utterance.pitch = delivery.pitch;
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
      name: randomItem(activeNames),
      amount: randomInt(settings.minAmount, settings.maxAmount),
      currency: settings.currency,
      message: randomItem(activeMessages),
      createdAt: Date.now()
    });

    scheduleNextDonate();
  }, delaySeconds * 1000);
}


function normalizeContentList(value, fallback, maxLength) {
  const list = Array.isArray(value)
    ? value
    : (value && typeof value === "object" ? Object.values(value) : []);

  const seen = new Set();
  const clean = [];

  for (const item of list) {
    const text = String(item ?? "").trim().slice(0, maxLength);
    const key = text.toLocaleLowerCase("ru");
    if (text && !seen.has(key)) {
      seen.add(key);
      clean.push(text);
    }
  }

  return clean.length ? clean : [...fallback];
}

contentRef.on("value", snapshot => {
  const content = snapshot.val() || {};
  activeNames = normalizeContentList(content.names, DEFAULT_NAMES, 32);
  activeMessages = normalizeContentList(content.messages, DEFAULT_MESSAGES, 180);
  console.log(`Загружено ${activeNames.length} ников и ${activeMessages.length} сообщений.`);
}, error => {
  console.warn("Не удалось загрузить пользовательские списки:", error);
  activeNames = [...DEFAULT_NAMES];
  activeMessages = [...DEFAULT_MESSAGES];
});

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
