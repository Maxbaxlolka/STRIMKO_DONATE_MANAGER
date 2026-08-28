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
const shownCountRef = db.ref("donateManager/stats/shownCount");
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
  showName: true,
  showAmount: true,
  showMessage: true,
  ttsEnabled: true,
  ttsReadName: true,
  ttsReadAmount: true,
  ttsReadMessage: true,
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

/* Пары: видео отдельно, его звук отдельно */
const DONATE_EFFECTS = [
  { video: "effects/effect_1.webm", sound: "sounds/effect_1.mp3" },
  { video: "effects/effect_2.webm", sound: "sounds/effect_2.mp3" }
];

let lastEffectIndex = -1;

function randomEffectNoRepeat() {
  if (DONATE_EFFECTS.length === 0) return null;
  if (DONATE_EFFECTS.length === 1) {
    lastEffectIndex = 0;
    return DONATE_EFFECTS[0];
  }

  let index;
  do {
    index = Math.floor(Math.random() * DONATE_EFFECTS.length);
  } while (index === lastEffectIndex);

  lastEffectIndex = index;
  return DONATE_EFFECTS[index];
}

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
  const alertStartedAt = Date.now();

  nameEl.textContent = name;
  amountEl.textContent = `${amount} ${currency}`;
  messageEl.textContent = message;

  nameEl.hidden = settings.showName === false;
  amountEl.hidden = settings.showAmount === false;
  messageEl.hidden = settings.showMessage === false;

  const selectedEffect =
    settings.gifEnabled
      ? randomEffectNoRepeat()
      : null;

  alertBox.hidden = false;
  alertBox.classList.remove("hide");
  void alertBox.offsetWidth;
  alertBox.classList.add("show");

  /*
    ФАЗА 1: сначала полностью видеоэффект + его собственный звук.
    TTS здесь ещё не запускается, поэтому звук не накладывается.
  */
  if (selectedEffect?.video) {
    gifEl.src = selectedEffect.video;
    gifEl.currentTime = 0;
    mediaBox.hidden = false;

    const videoPromise = playEffectVideoAndWait();
    const soundPromise =
      settings.soundEnabled && selectedEffect.sound
        ? playNotificationSoundAndWait(selectedEffect.sound)
        : Promise.resolve();

    await Promise.all([videoPromise, soundPromise]);

    gifEl.pause();
    gifEl.currentTime = 0;
    mediaBox.hidden = true;
    audioEl.pause();
    audioEl.currentTime = 0;
  } else {
    gifEl.pause();
    gifEl.removeAttribute("src");
    mediaBox.hidden = true;
  }

  /*
    ФАЗА 2: только после окончания видео и его звука
    читаем ник -> сумму -> сообщение.
  */
  if (
    settings.ttsEnabled !== false &&
    (settings.ttsReadName !== false || settings.ttsReadAmount !== false || settings.ttsReadMessage !== false)
  ) {
    await speakDonateAndWait({name, amount, currency, message});
  }

  /*
    duration остаётся минимальным временем показа алерта.
    Эффект и TTS никогда не обрываются из-за этой настройки.
  */
  const minDisplayMs = Math.max(3, Number(settings.duration) || 8) * 1000;
  const elapsedMs = Date.now() - alertStartedAt;
  if (elapsedMs < minDisplayMs) {
    await wait(minDisplayMs - elapsedMs);
  }

  alertBox.classList.remove("show");
  alertBox.classList.add("hide");
  await wait(500);

  alertBox.hidden = true;
  alertBox.classList.remove("hide");
  gifEl.pause();
  gifEl.currentTime = 0;
  mediaBox.hidden = true;
  audioEl.pause();
  audioEl.currentTime = 0;
}

function playEffectVideoAndWait() {
  return new Promise(resolve => {
    let finished = false;

    const done = () => {
      if (finished) return;
      finished = true;
      gifEl.removeEventListener("ended", done);
      gifEl.removeEventListener("error", done);
      resolve();
    };

    gifEl.addEventListener("ended", done, {once: true});
    gifEl.addEventListener("error", done, {once: true});

    const playPromise = gifEl.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(error => {
        console.warn("Не удалось воспроизвести видеоэффект:", error);
        done();
      });
    }

    const fallbackSeconds =
      Number.isFinite(gifEl.duration) && gifEl.duration > 0
        ? gifEl.duration + 2
        : 30;

    setTimeout(done, fallbackSeconds * 1000);
  });
}

let effectAudioContext = null;
let effectAudioSource = null;
let effectGainNode = null;

function playNotificationSoundAndWait(soundPath) {
  return new Promise(resolve => {
    if (!soundPath) {
      resolve();
      return;
    }

    audioEl.pause();
    audioEl.src = soundPath;
    audioEl.currentTime = 0;

    const effectVolume = Math.min(
      2,
      Math.max(0, Number(settings.effectVolume ?? 100) / 100)
    );

    try {
      if (!effectAudioContext) {
        effectAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        effectAudioSource = effectAudioContext.createMediaElementSource(audioEl);
        effectGainNode = effectAudioContext.createGain();
        effectAudioSource.connect(effectGainNode);
        effectGainNode.connect(effectAudioContext.destination);
      }

      effectGainNode.gain.value = effectVolume;
      audioEl.volume = 1;

      if (effectAudioContext.state === "suspended") {
        effectAudioContext.resume().catch(() => {});
      }
    } catch (error) {
      console.warn("Web Audio volume fallback:", error);
      audioEl.volume = Math.min(1, effectVolume);
    }

    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      audioEl.removeEventListener("ended", done);
      audioEl.removeEventListener("error", done);
      resolve();
    };

    audioEl.addEventListener("ended", done, {once: true});
    audioEl.addEventListener("error", done, {once: true});

    audioEl.play().catch(error => {
      console.warn("Не удалось воспроизвести звук эффекта:", error);
      done();
    });

    const fallbackSeconds =
      Number.isFinite(audioEl.duration) && audioEl.duration > 0
        ? audioEl.duration + 2
        : 30;

    setTimeout(done, fallbackSeconds * 1000);
  });
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

function pluralForm(number, one, few, many) {
  const n = Math.abs(Math.trunc(Number(number) || 0));
  const n100 = n % 100;
  const n10 = n % 10;

  if (n100 >= 11 && n100 <= 14) return many;
  if (n10 === 1) return one;
  if (n10 >= 2 && n10 <= 4) return few;
  return many;
}

function currencyForSpeech(currency, amount) {
  const value = String(currency || "").trim().toLowerCase();
  const numericAmount = Number(String(amount ?? "").replace(/\s+/g, "").replace(",", "."));

  if (value === "₴" || value === "uah" || value.includes("грн")) {
    return pluralForm(numericAmount, "гривна", "гривны", "гривен");
  }

  if (value === "₽" || value === "rub" || value.includes("руб")) {
    return pluralForm(numericAmount, "рубль", "рубля", "рублей");
  }

  if (value === "$" || value === "usd") {
    return pluralForm(numericAmount, "доллар", "доллара", "долларов");
  }

  if (value === "€" || value === "eur") {
    return "евро";
  }

  if (value === "usdt") {
    return "USDT";
  }

  return currency || "";
}

/*
  Преобразование суммы в русские слова.
  Примеры:
  100000    -> "сто тысяч"
  1000000   -> "один миллион"
  10000000  -> "десять миллионов"
*/
function numberToRussianWords(value) {
  const raw = String(value ?? "").trim().replace(/\s+/g, "").replace(",", ".");
  const number = Number(raw);

  if (!Number.isFinite(number)) {
    return String(value ?? "");
  }

  const integer = Math.trunc(Math.abs(number));

  if (integer === 0) return "ноль";

  // Для сумм донатов этого более чем достаточно: до квадриллионов.
  if (integer > 999999999999999) {
    return String(integer);
  }

  const unitsMale = [
    "", "один", "два", "три", "четыре",
    "пять", "шесть", "семь", "восемь", "девять"
  ];
  const unitsFemale = [
    "", "одна", "две", "три", "четыре",
    "пять", "шесть", "семь", "восемь", "девять"
  ];
  const teens = [
    "десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать",
    "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"
  ];
  const tens = [
    "", "", "двадцать", "тридцать", "сорок",
    "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"
  ];
  const hundreds = [
    "", "сто", "двести", "триста", "четыреста",
    "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"
  ];

  const groups = [
    { one: "", few: "", many: "", female: false },
    { one: "тысяча", few: "тысячи", many: "тысяч", female: true },
    { one: "миллион", few: "миллиона", many: "миллионов", female: false },
    { one: "миллиард", few: "миллиарда", many: "миллиардов", female: false },
    { one: "триллион", few: "триллиона", many: "триллионов", female: false },
    { one: "квадриллион", few: "квадриллиона", many: "квадриллионов", female: false }
  ];

  function tripletToWords(n, female) {
    const result = [];
    const h = Math.floor(n / 100);
    const lastTwo = n % 100;
    const t = Math.floor(lastTwo / 10);
    const u = lastTwo % 10;

    if (h) result.push(hundreds[h]);

    if (lastTwo >= 10 && lastTwo <= 19) {
      result.push(teens[lastTwo - 10]);
    } else {
      if (t) result.push(tens[t]);
      if (u) result.push((female ? unitsFemale : unitsMale)[u]);
    }

    return result;
  }

  const words = [];
  let remaining = integer;
  let groupIndex = 0;

  while (remaining > 0) {
    const triplet = remaining % 1000;

    if (triplet > 0) {
      const group = groups[groupIndex];
      const part = tripletToWords(triplet, group.female);

      if (groupIndex > 0) {
        part.push(pluralForm(triplet, group.one, group.few, group.many));
      }

      words.unshift(...part);
    }

    remaining = Math.floor(remaining / 1000);
    groupIndex += 1;
  }

  if (number < 0) {
    words.unshift("минус");
  }

  return words.join(" ").replace(/\s+/g, " ").trim();
}

/*
  Ник, сумма и сообщение включаются независимо друг от друга.
  Используется стандартный системный голос браузера/Windows.
*/
function speakDonateAndWait(donate) {
  return new Promise(resolve => {
    if (!("speechSynthesis" in window)) {
      console.warn("В этом браузере синтез речи недоступен.");
      resolve();
      return;
    }

    try {
      const synth = window.speechSynthesis;
      const parts = [];

      if (settings.ttsReadName !== false) {
        const name = String(donate.name || "").trim();
        if (name) parts.push(name);
      }

      if (settings.ttsReadAmount !== false) {
        const spokenAmount = numberToRussianWords(donate.amount);
        const spokenCurrency = currencyForSpeech(donate.currency, donate.amount);
        const amountPart = `${spokenAmount} ${spokenCurrency}`.trim();
        if (amountPart) parts.push(amountPart);
      }

      if (settings.ttsReadMessage !== false) {
        const message = String(donate.message || "").trim();
        if (message) parts.push(message);
      }

      const speechText = parts.join(". ").trim();

      if (!speechText) {
        resolve();
        return;
      }

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

      let finished = false;
      const done = () => {
        if (finished) return;
        finished = true;
        window.__strimkoCurrentSpeech = null;
        resolve();
      };

      utterance.onend = done;
      utterance.onerror = event => {
        console.warn("Ошибка озвучивания:", event.error);
        done();
      };

      window.__strimkoCurrentSpeech = utterance;
      synth.speak(utterance);

      setTimeout(() => {
        if (synth.paused) synth.resume();
      }, 900);

      const estimatedSeconds = Math.max(
        8,
        Math.min(120, speechText.length / 8)
      );
      setTimeout(done, estimatedSeconds * 1000);
    } catch (error) {
      console.warn("Не удалось запустить озвучивание:", error);
      resolve();
    }
  });
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
