(() => {
  "use strict";

  const SETTINGS_KEY = "strimkoDonateSettings";
  const EVENT_KEY = "strimkoDonateEvent";
  const COUNT_KEY = "strimkoDonateShownCount";
  const CHANNEL_NAME = "strimko-donate-channel";

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
    ttsEnabled: false,
    volume: 70
  };

  const RANDOM_NAMES = [
    "DarkWolf228","TankistUA","NightRider","LuckyFox","CyberCat","SteelBear",
    "RedDragon","GhostPlayer","PixelKing","TurboHamster","VikingPro","NeonTiger",
    "MegaDon","KotikLive","ShadowFox","FireBird","ChillMan","RockyPlay",
    "CrazyPanda","MrGoodGame","BlackRaven","SkyWalkerX","SuperNova","StormHunter"
  ];

  const RANDOM_MESSAGES = [
    "Хорошего стрима!","Давай тащи катку!","Красавчик, продолжай!",
    "На удачу в следующем бою.","Спасибо за стрим.","Лови поддержку!",
    "Стрим огонь!","За красивый бой!","Пусть рандом будет добрым.",
    "Покажи мастер-класс.","Желаю серии побед.","Вперёд к победе!"
  ];

  const $ = id => document.getElementById(id);
  let channel = null;
  let countdownTimer = null;
  let nextSeconds = null;

  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
  } catch {}

  function readSettings() {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
    } catch {
      return { ...DEFAULTS };
    }
  }

  function writeSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  function getFormSettings() {
    return {
      enabled: $("enabled").checked,
      minDelay: Math.max(5, Number($("minDelay").value) || DEFAULTS.minDelay),
      maxDelay: Math.max(5, Number($("maxDelay").value) || DEFAULTS.maxDelay),
      minAmount: Math.max(1, Number($("minAmount").value) || DEFAULTS.minAmount),
      maxAmount: Math.max(1, Number($("maxAmount").value) || DEFAULTS.maxAmount),
      currency: $("currency").value,
      duration: Math.min(30, Math.max(3, Number($("duration").value) || DEFAULTS.duration)),
      soundEnabled: $("soundEnabled").checked,
      gifEnabled: $("gifEnabled").checked,
      ttsEnabled: $("ttsEnabled").checked,
      volume: Math.min(100, Math.max(0, Number($("volume").value) || 0))
    };
  }

  function loadSettings() {
    const settings = readSettings();

    Object.keys(DEFAULTS).forEach(key => {
      const element = $(key);
      if (!element) return;

      if (element.type === "checkbox") {
        element.checked = Boolean(settings[key]);
      } else {
        element.value = settings[key];
      }
    });

    $("volumeValue").textContent = `${settings.volume}%`;
    updateStatus(settings.enabled);
    $("overlayUrl").textContent = new URL("index.html", location.href).href;
    $("shownCount").textContent = localStorage.getItem(COUNT_KEY) || "0";
    resetCountdown(settings);
  }

  function updateStatus(enabled) {
    $("statusText").textContent = enabled ? "АКТИВЕН" : "ОСТАНОВЛЕН";
    $("modeText").textContent = enabled ? "АВТО" : "РУЧНОЙ";
    $("statusDot").style.background = enabled ? "#18e079" : "#777";
    $("statusDot").style.boxShadow = enabled ? "0 0 14px rgba(24,224,121,.7)" : "none";
  }

  function emitDonate(data) {
    const settings = readSettings();
    const event = {
      type: "donate",
      id: `${Date.now()}-${Math.random()}`,
      name: String(data.name || "Anonymous").slice(0, 32),
      amount: Math.max(1, Number(data.amount) || 1),
      currency: data.currency || settings.currency,
      message: String(data.message || "Спасибо за стрим!").slice(0, 180),
      createdAt: Date.now()
    };

    if (channel) channel.postMessage(event);
    localStorage.setItem(EVENT_KEY, JSON.stringify(event));

    const count = Number(localStorage.getItem(COUNT_KEY) || 0) + 1;
    localStorage.setItem(COUNT_KEY, String(count));
    $("shownCount").textContent = String(count);
    showMessage("Алерт отправлен в оверлей.");
  }

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function randomInt(min, max) {
    min = Number(min);
    max = Number(max);
    if (max < min) [min, max] = [max, min];
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function showMessage(text) {
    $("messageBox").textContent = text;
    clearTimeout(showMessage.timer);
    showMessage.timer = setTimeout(() => {
      $("messageBox").textContent = "";
    }, 3000);
  }

  function resetCountdown(settings = readSettings()) {
    clearInterval(countdownTimer);

    if (!settings.enabled) {
      $("nextAlert").textContent = "—";
      return;
    }

    nextSeconds = randomInt(settings.minDelay, settings.maxDelay);
    $("nextAlert").textContent = `${nextSeconds} сек.`;

    countdownTimer = setInterval(() => {
      nextSeconds -= 1;

      if (nextSeconds <= 0) {
        nextSeconds = randomInt(settings.minDelay, settings.maxDelay);
      }

      $("nextAlert").textContent = `${nextSeconds} сек.`;
    }, 1000);
  }

  $("volume").addEventListener("input", () => {
    $("volumeValue").textContent = `${$("volume").value}%`;
  });

  $("enabled").addEventListener("change", () => {
    updateStatus($("enabled").checked);
  });

  $("sendManual").addEventListener("click", () => {
    emitDonate({
      name: $("manualName").value,
      amount: $("manualAmount").value,
      currency: readSettings().currency,
      message: $("manualMessage").value
    });
  });

  $("sendRandom").addEventListener("click", () => {
    const settings = readSettings();

    emitDonate({
      name: randomItem(RANDOM_NAMES),
      amount: randomInt(settings.minAmount, settings.maxAmount),
      currency: settings.currency,
      message: randomItem(RANDOM_MESSAGES)
    });
  });

  $("sendTest").addEventListener("click", () => {
    const settings = readSettings();

    emitDonate({
      name: "STRIMKO TEST",
      amount: 100,
      currency: settings.currency,
      message: "Проверка работы системы."
    });
  });

  $("saveSettings").addEventListener("click", () => {
    const settings = getFormSettings();

    if (settings.maxDelay < settings.minDelay) {
      settings.maxDelay = settings.minDelay;
    }

    if (settings.maxAmount < settings.minAmount) {
      settings.maxAmount = settings.minAmount;
    }

    writeSettings(settings);
    loadSettings();
    showMessage("Настройки сохранены.");
  });

  $("resetSettings").addEventListener("click", () => {
    writeSettings(DEFAULTS);
    loadSettings();
    showMessage("Настройки сброшены.");
  });

  $("openOverlay").addEventListener("click", () => {
    window.open(new URL("index.html", location.href).href, "_blank", "noopener");
  });

  loadSettings();
})();
