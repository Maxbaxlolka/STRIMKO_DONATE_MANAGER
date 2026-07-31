(() => {
  "use strict";

  const SETTINGS_KEY = "strimkoDonateSettings";
  const EVENT_KEY = "strimkoDonateEvent";
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

  // ============================================================
  // СЮДА ДОБАВЛЯЙ НИКИ
  // Каждый ник указывается в кавычках и через запятую.
  // ============================================================
  const NAMES = [
    "DarkWolf228","TankistUA","NightRider","LuckyFox","CyberCat","SteelBear",
    "RedDragon","GhostPlayer","PixelKing","TurboHamster","VikingPro","SilentStorm",
    "NeonTiger","OldSchool","MegaDon","KotikLive","ShadowFox","FireBird",
    "ChillMan","RockyPlay","DemonTank","FrostByte","CrazyPanda","MrGoodGame",
    "BlackRaven","SkyWalkerX","GreenTea","SuperNova","GoldFish","IronMouse",
    "MoonLight","StormHunter","JustViewer","AnonymousFox","RetroGamer","FriendlyBot",
    "StreamBuddy","BigBossX","HappyDuck","TopTankist","NoNamePlayer","OrangeFox",
    "IceDragon","WarMachine","LuckyStrike","BluePhoenix","MadRabbit","RoyalWolf",
    "QuietSniper","FastDriver","ToxicFree","GoodVibes","NightOwl","CrazyBear",
    "CyberWolf","FireStorm","SteelFox","PixelGhost","MegaViewer","TankMaster",
    "BattleCat","RandomHero","SilentFox","ChillViewer","TurboWolf","RedPanda",
    "SmartDuck","MoonFox","DarkTiger","LuckyBear","OldGamer","BestViewer",
    "DonatelloX","StreamLegend","HappyViewer","NoSleep","HardPlayer","SoftCat",
    "BlackPantherX","WhiteWolf","FastFox","ProViewer","JustChill","EasyWin",
    "MegaTank","GoldWolf","SilverFox","IronBear","WildTiger","FunnyCat",
    "CrazyDuck","PixelPanda","ShadowTank","StormCat","NightBear","FireWolf",
    "CyberTiger","RetroWolf","VikingCat","BattleFox","RoyalBear","TurboPanda",
    "SilentTiger","GhostWolf","SteelPanda","NeonFox","MoonTiger","DarkPanda",
    "RedWolf","BlueBear","GreenFox","OrangeTiger","PurpleWolf","WhiteTiger",
    "BlackFox","GoldenBear","SilverTiger","IronFox","WildWolf","FunnyPanda",
    "CrazyTiger","PixelBear","ShadowFoxX","StormWolf","NightPanda","FireTiger"
  ];

  // ============================================================
  // СЮДА ДОБАВЛЯЙ СООБЩЕНИЯ
  // ============================================================
  const MESSAGES = [
    "Хорошего стрима!","Давай тащи катку!","Красавчик, продолжай!",
    "На удачу в следующем бою.","Спасибо за стрим.","Лови поддержку!",
    "Стрим огонь!","За красивый бой!","Пусть рандом будет добрым.",
    "Покажи мастер-класс.","Желаю серии побед.","Вперёд к победе!",
    "На чай и хорошее настроение.","Привет из чата!","Не сдавайся!",
    "Сегодня твой день.","Ждём эпичную победу.","От души за контент.",
    "Просто решил поддержать.","Пусть всё залетает.","Сделай красиво!",
    "Больше побед и меньше поражений.","Стрим смотрю с кайфом.",
    "Удачи в следующей катке!","Топовый эфир.","Чат, поддерживаем!",
    "Давай без нервов сегодня.","Пусть соперники ошибаются.",
    "На хорошее настроение.","Спасибо за вечер.","Смотрим дальше!",
    "Это было мощно.","Красиво играешь.","Ещё одну победу!",
    "Держи поддержку.","Победа уже близко.","Сегодня только вперёд.",
    "Крутой момент!","Респект за стрим.","Так держать!",
    "Надеюсь, сегодня будет серия побед.","Пусть техника не подводит.",
    "Побольше хороших союзников.","Смотрю с самого начала.",
    "Удачи и терпения.","Спасибо за атмосферу.","Без поражений сегодня!",
    "Давай следующий бой ещё мощнее.","Случайная поддержка от зрителя.",
    "Продолжай в том же духе."
  ];

  // ============================================================
  // СЮДА ДОБАВЛЯЙ ЗВУКИ
  // 1. Положи файлы в папку sounds
  // 2. Впиши названия ниже, например "sounds/bruh.mp3"
  // Поддерживаются mp3, wav и ogg.
  // ============================================================
  const SOUNDS = [
    // "sounds/bruh.mp3",
    // "sounds/vine-boom.mp3",
    // "sounds/wow.mp3"
  ];

  // ============================================================
  // СЮДА ДОБАВЛЯЙ GIF
  // 1. Положи GIF-файлы в папку gifs
  // 2. Впиши их названия ниже.
  // ============================================================
  const GIFS = [
    // "gifs/cat.gif",
    // "gifs/dance.gif",
    // "gifs/meme.gif"
  ];

  const alertBox = document.getElementById("donateAlert");
  const nameEl = document.getElementById("donateName");
  const amountEl = document.getElementById("donateAmount");
  const messageEl = document.getElementById("donateMessage");
  const avatarEl = document.getElementById("donateAvatar");
  const gifEl = document.getElementById("donateGif");
  const audioEl = document.getElementById("donateAudio");

  let channel = null;
  let queue = [];
  let busy = false;
  let timer = null;

  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = event => receiveDonate(event.data);
  } catch {}

  window.addEventListener("storage", event => {
    if (event.key === EVENT_KEY && event.newValue) {
      try { receiveDonate(JSON.parse(event.newValue)); } catch {}
    }

    if (event.key === SETTINGS_KEY) {
      scheduleNext();
    }
  });

  function getSettings() {
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
    } catch {
      return { ...DEFAULTS };
    }
  }

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function randomInt(min, max) {
    min = Math.ceil(Number(min));
    max = Math.floor(Number(max));
    if (max < min) [min, max] = [max, min];
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function createRandomDonate() {
    const settings = getSettings();
    return {
      type: "donate",
      id: `${Date.now()}-${Math.random()}`,
      name: randomItem(NAMES),
      amount: randomInt(settings.minAmount, settings.maxAmount),
      currency: settings.currency,
      message: randomItem(MESSAGES),
      createdAt: Date.now()
    };
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

  function initials(name) {
    return String(name || "S").trim().slice(0, 2).toUpperCase();
  }

  function gradientFromName(name) {
    let hash = 0;
    for (const char of String(name)) hash = ((hash << 5) - hash) + char.charCodeAt(0);
    const first = Math.abs(hash) % 360;
    return `linear-gradient(145deg,hsl(${first} 85% 55%),hsl(${(first + 85) % 360} 85% 48%))`;
  }

  async function showDonate(donate) {
    const settings = getSettings();

    nameEl.textContent = donate.name || "Anonymous";
    amountEl.textContent = `${donate.amount || 0} ${donate.currency || settings.currency}`;
    messageEl.textContent = donate.message || "Спасибо за стрим!";
    avatarEl.textContent = initials(donate.name);
    avatarEl.style.background = gradientFromName(donate.name);

    const gifPath = settings.gifEnabled && GIFS.length ? randomItem(GIFS) : "";
    if (gifPath) {
      gifEl.src = gifPath;
      gifEl.hidden = false;
      avatarEl.hidden = true;
    } else {
      gifEl.hidden = true;
      avatarEl.hidden = false;
    }

    alertBox.hidden = false;
    alertBox.classList.remove("hide");
    void alertBox.offsetWidth;
    alertBox.classList.add("show");

    if (settings.soundEnabled) playSound(settings);
    if (settings.ttsEnabled) speakDonate(donate);

    await wait(Math.max(3, Number(settings.duration) || 8) * 1000);

    alertBox.classList.remove("show");
    alertBox.classList.add("hide");
    await wait(500);
    alertBox.hidden = true;
    alertBox.classList.remove("hide");
  }

  function playSound(settings) {
    if (SOUNDS.length > 0) {
      audioEl.src = randomItem(SOUNDS);
      audioEl.volume = Math.min(1, Math.max(0, Number(settings.volume) / 100));
      audioEl.currentTime = 0;
      audioEl.play().catch(() => {});
      return;
    }

    // Встроенный короткий звук, пока пользователь не добавил свои файлы.
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(
        Math.max(0.01, Number(settings.volume) / 350),
        now + 0.02
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

      [659.25, 783.99, 987.77].forEach((frequency, index) => {
        const oscillator = ctx.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        oscillator.connect(gain);
        oscillator.start(now + index * 0.12);
        oscillator.stop(now + 0.75 + index * 0.12);
      });

      setTimeout(() => ctx.close().catch(() => {}), 1600);
    } catch {}
  }

  function speakDonate(donate) {
    if (!("speechSynthesis" in window)) return;

    try {
      speechSynthesis.cancel();
      const voice = new SpeechSynthesisUtterance(
        `${donate.name}. ${donate.amount} ${donate.currency}. ${donate.message}`
      );
      voice.lang = "ru-RU";
      voice.rate = 1;
      speechSynthesis.speak(voice);
    } catch {}
  }

  function scheduleNext() {
    clearTimeout(timer);
    const settings = getSettings();
    if (!settings.enabled) return;

    const delay = randomInt(settings.minDelay, settings.maxDelay);
    timer = setTimeout(() => {
      receiveDonate(createRandomDonate());
      scheduleNext();
    }, Math.max(5, delay) * 1000);
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  setTimeout(() => {
    receiveDonate({
      type: "donate",
      id: `test-${Date.now()}`,
      name: "STRIMKO TEST",
      amount: 100,
      currency: getSettings().currency,
      message: "Оверлей успешно подключён.",
      createdAt: Date.now()
    });
  }, 1800);

  scheduleNext();
})();
