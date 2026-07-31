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
const connectedRef = db.ref(".info/connected");

const LOCAL_SETTINGS_KEY = "strimkoDonateManagerSettingsV2";

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

const NAMES = [
  "DarkWolf228","TankistUA","NightRider","LuckyFox","CyberCat","SteelBear",
  "RedDragon","GhostPlayer","PixelKing","TurboHamster","VikingPro","NeonTiger",
  "MegaDon","KotikLive","ShadowFox","FireBird","ChillMan","RockyPlay"
];

const MESSAGES = [
  "Хорошего стрима!","Давай тащи катку!","Красавчик, продолжай!",
  "На удачу в следующем бою.","Спасибо за стрим.","Лови поддержку!",
  "Стрим огонь!","За красивый бой!","Пусть рандом будет добрым."
];

const $ = id => document.getElementById(id);

let current = {...DEFAULTS};
let countdownTimer = null;
let isApplyingRemoteSettings = false;
let saveInProgress = false;
let firebaseConnected = false;

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min, max) {
  min = Number(min);
  max = Number(max);

  if (max < min) {
    [min, max] = [max, min];
  }

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function normalizeSettings(raw = {}) {
  const settings = {
    enabled: Boolean(raw.enabled),
    minDelay: Math.max(5, Number(raw.minDelay) || DEFAULTS.minDelay),
    maxDelay: Math.max(5, Number(raw.maxDelay) || DEFAULTS.maxDelay),
    minAmount: Math.max(1, Number(raw.minAmount) || DEFAULTS.minAmount),
    maxAmount: Math.max(1, Number(raw.maxAmount) || DEFAULTS.maxAmount),
    currency: ["₴", "₽", "$", "€", "USDT"].includes(raw.currency)
      ? raw.currency
      : DEFAULTS.currency,
    duration: Math.min(
      30,
      Math.max(3, Number(raw.duration) || DEFAULTS.duration)
    ),
    soundEnabled: Boolean(raw.soundEnabled),
    gifEnabled: Boolean(raw.gifEnabled),
    ttsEnabled: Boolean(raw.ttsEnabled),
    volume: Math.min(
      100,
      Math.max(0, Number(raw.volume) || 0)
    )
  };

  if (settings.maxDelay < settings.minDelay) {
    settings.maxDelay = settings.minDelay;
  }

  if (settings.maxAmount < settings.minAmount) {
    settings.maxAmount = settings.minAmount;
  }

  return settings;
}

function setStatus(enabled) {
  $("statusText").textContent = enabled ? "АКТИВЕН" : "ОСТАНОВЛЕН";
  $("modeText").textContent = enabled ? "АВТО" : "РУЧНОЙ";
  $("statusDot").style.background = enabled ? "#18e079" : "#777";
  $("statusDot").style.boxShadow = enabled
    ? "0 0 14px rgba(24,224,121,.7)"
    : "none";
}

function showMessage(text, isError = false) {
  const box = $("messageBox");
  box.textContent = text;
  box.style.color = isError ? "#ff8d9a" : "#7dffa4";

  clearTimeout(showMessage.timer);
  showMessage.timer = setTimeout(() => {
    box.textContent = "";
  }, 5000);
}

function setSaveButtonState(isSaving) {
  const button = $("saveSettings");
  button.disabled = isSaving;
  button.textContent = isSaving
    ? "Сохраняю..."
    : "Сохранить настройки";
}

function saveLocal(settings) {
  try {
    localStorage.setItem(
      LOCAL_SETTINGS_KEY,
      JSON.stringify(settings)
    );
  } catch (error) {
    console.warn("Не удалось сохранить резервную копию локально:", error);
  }
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_SETTINGS_KEY);
    return raw ? normalizeSettings(JSON.parse(raw)) : null;
  } catch (error) {
    console.warn("Не удалось прочитать локальные настройки:", error);
    return null;
  }
}

function applySettings(settings) {
  isApplyingRemoteSettings = true;
  current = normalizeSettings({...DEFAULTS, ...settings});

  Object.keys(DEFAULTS).forEach(key => {
    const element = $(key);
    if (!element) return;

    if (element.type === "checkbox") {
      element.checked = Boolean(current[key]);
    } else {
      element.value = current[key];
    }
  });

  $("volumeValue").textContent = `${current.volume}%`;
  setStatus(current.enabled);
  startCountdown();

  requestAnimationFrame(() => {
    isApplyingRemoteSettings = false;
  });
}

function readForm() {
  return normalizeSettings({
    enabled: $("enabled").checked,
    minDelay: $("minDelay").value,
    maxDelay: $("maxDelay").value,
    minAmount: $("minAmount").value,
    maxAmount: $("maxAmount").value,
    currency: $("currency").value,
    duration: $("duration").value,
    soundEnabled: $("soundEnabled").checked,
    gifEnabled: $("gifEnabled").checked,
    ttsEnabled: $("ttsEnabled").checked,
    volume: $("volume").value
  });
}

function startCountdown() {
  clearInterval(countdownTimer);

  if (!current.enabled) {
    $("nextAlert").textContent = "—";
    return;
  }

  let seconds = randomInt(current.minDelay, current.maxDelay);
  $("nextAlert").textContent = `${seconds} сек.`;

  countdownTimer = setInterval(() => {
    seconds -= 1;

    if (seconds <= 0) {
      seconds = randomInt(current.minDelay, current.maxDelay);
    }

    $("nextAlert").textContent = `${seconds} сек.`;
  }, 1000);
}

async function saveSettings(successText = "Настройки сохранены.") {
  if (saveInProgress) return;

  const next = readForm();

  // Сначала сохраняем локальную резервную копию.
  saveLocal(next);
  current = next;
  setStatus(next.enabled);
  startCountdown();

  saveInProgress = true;
  setSaveButtonState(true);

  try {
    /*
      update вместо set:
      запись выполняется по отдельным полям и не удаляет
      возможные служебные данные в разделе settings.
    */
    await settingsRef.update({
      ...next,
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    });

    /*
      Проверяем не только enabled, а все настройки.
      Благодаря этому кнопка не сообщает об успехе,
      если Firebase фактически не сохранила значения.
    */
    const snapshot = await settingsRef.once("value");
    const saved = normalizeSettings(snapshot.val() || {});

    const fields = Object.keys(DEFAULTS);
    const mismatch = fields.some(
      key => String(saved[key]) !== String(next[key])
    );

    if (mismatch) {
      throw new Error("Firebase вернула другие значения настроек");
    }

    applySettings(saved);
    saveLocal(saved);
    showMessage(successText);
  } catch (error) {
    console.error("Ошибка сохранения настроек:", error);

    const code = error && error.code ? ` (${error.code})` : "";

    showMessage(
      `Не удалось записать настройки в Firebase${code}. ` +
      `Проверь правила Realtime Database для donateManager.`,
      true
    );
  } finally {
    saveInProgress = false;
    setSaveButtonState(false);
  }
}

async function emitDonate(data) {
  try {
    await eventsRef.push({
      type: "donate",
      source: "manual",
      name: String(data.name || "Anonymous").slice(0, 32),
      amount: Math.max(1, Number(data.amount) || 1),
      currency: data.currency || current.currency,
      message: String(
        data.message || "Спасибо за стрим!"
      ).slice(0, 180),
      createdAt: firebase.database.ServerValue.TIMESTAMP
    });

    showMessage("Алерт отправлен.");
  } catch (error) {
    console.error("Ошибка отправки алерта:", error);
    showMessage(
      "Firebase запретила отправку алерта. Проверь правила donateManager/events.",
      true
    );
  }
}

$("overlayUrl").textContent =
  new URL("index.html", location.href).href;

$("volume").addEventListener("input", () => {
  $("volumeValue").textContent = `${$("volume").value}%`;
});

$("saveSettings").addEventListener("click", () => {
  saveSettings();
});

$("resetSettings").addEventListener("click", async () => {
  applySettings(DEFAULTS);
  await saveSettings("Настройки сброшены и сохранены.");
});

$("openOverlay").addEventListener("click", () => {
  window.open(
    new URL("index.html", location.href).href,
    "_blank",
    "noopener"
  );
});

/*
  Переключатели сохраняются сразу.
  Числа, валюта и громкость сохраняются по кнопке.
*/
["enabled", "soundEnabled", "gifEnabled", "ttsEnabled"].forEach(id => {
  $(id).addEventListener("change", () => {
    if (isApplyingRemoteSettings) return;

    const next = readForm();
    current = next;
    saveLocal(next);
    setStatus(next.enabled);
    startCountdown();

    saveSettings(
      id === "enabled"
        ? (
          next.enabled
            ? "Автоматические донаты включены."
            : "Автоматические донаты выключены."
        )
        : "Настройка сохранена."
    );
  });
});

$("sendManual").addEventListener("click", () => {
  emitDonate({
    name: $("manualName").value,
    amount: $("manualAmount").value,
    currency: current.currency,
    message: $("manualMessage").value
  });
});

$("sendRandom").addEventListener("click", () => {
  emitDonate({
    name: randomItem(NAMES),
    amount: randomInt(current.minAmount, current.maxAmount),
    currency: current.currency,
    message: randomItem(MESSAGES)
  });
});

$("sendTest").addEventListener("click", () => {
  emitDonate({
    name: "STRIMKO TEST",
    amount: 100,
    currency: current.currency,
    message: "Проверка работы системы."
  });
});

/*
  Сначала показываем локальную копию, чтобы панель не была пустой.
  Затем загружаем актуальные настройки из Firebase.
*/
const localSettings = loadLocal();
applySettings(localSettings || DEFAULTS);

connectedRef.on("value", snapshot => {
  firebaseConnected = snapshot.val() === true;

  if (!firebaseConnected) {
    showMessage(
      "Нет соединения с Firebase. Локальная копия сохранена, но OBS её не получит.",
      true
    );
  }
});

settingsRef.on(
  "value",
  snapshot => {
    if (!snapshot.exists()) {
      // Если настроек ещё нет, создаём их один раз.
      saveSettings("Начальные настройки созданы.");
      return;
    }

    const remote = normalizeSettings(snapshot.val());
    applySettings(remote);
    saveLocal(remote);
  },
  error => {
    console.error("Ошибка чтения настроек:", error);
    showMessage(
      "Firebase запретила чтение настроек. Проверь правила donateManager.",
      true
    );
  }
);

eventsRef.limitToLast(200).on(
  "value",
  snapshot => {
    $("shownCount").textContent = String(snapshot.numChildren());
  },
  error => {
    console.warn("Не удалось получить счётчик алертов:", error);
  }
);
})();