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
const contentRef = db.ref("donateManager/content");

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

const DEFAULT_NAMES = ["ПРЕЗИДЕНТ США",
  "ПРЕЗИДЕНТ УКРАИНЫ",
  "ПРЕЗИДЕНТ ФРАНЦИИ",
  "ПРЕЗИДЕНТ ГЕРМАНИИ",
  "ПРЕЗИДЕНТ ПОЛЬШИ",
  "ПРЕЗИДЕНТ ИТАЛИИ",
  "ПРЕЗИДЕНТ ИСПАНИИ",
  "ПРЕЗИДЕНТ ПОРТУГАЛИИ",
  "ПРЕЗИДЕНТ ИРЛАНДИИ",
  "ПРЕЗИДЕНТ ФИНЛЯНДИИ",
  "ПРЕЗИДЕНТ ЭСТОНИИ",
  "ПРЕЗИДЕНТ ЛАТВИИ",
  "ПРЕЗИДЕНТ ЛИТВЫ",
  "ПРЕЗИДЕНТ МОЛДОВЫ",
  "ПРЕЗИДЕНТ РУМЫНИИ",
  "ПРЕЗИДЕНТ БОЛГАРИИ",
  "ПРЕЗИДЕНТ СЕРБИИ",
  "ПРЕЗИДЕНТ ХОРВАТИИ",
  "ПРЕЗИДЕНТ СЛОВЕНИИ",
  "ПРЕЗИДЕНТ СЛОВАКИИ",
  "ПРЕЗИДЕНТ ЧЕХИИ",
  "ПРЕЗИДЕНТ ВЕНГРИИ",
  "ПРЕЗИДЕНТ ГРЕЦИИ",
  "ПРЕЗИДЕНТ КИПРА",
  "ПРЕЗИДЕНТ МАЛЬТЫ",
  "ПРЕЗИДЕНТ ИСЛАНДИИ",
  "ПРЕЗИДЕНТ АЛБАНИИ",
  "ПРЕЗИДЕНТ ЧЕРНОГОРИИ",
  "ПРЕЗИДЕНТ СЕВЕРНОЙ МАКЕДОНИИ",
  "ПРЕЗИДЕНТ БОСНИИ И ГЕРЦЕГОВИНЫ",
  "ПРЕЗИДЕНТ ГРУЗИИ",
  "ПРЕЗИДЕНТ АРМЕНИИ",
  "ПРЕЗИДЕНТ АЗЕРБАЙДЖАНА",
  "ПРЕЗИДЕНТ КАЗАХСТАНА",
  "ПРЕЗИДЕНТ УЗБЕКИСТАНА",
  "ПРЕЗИДЕНТ КЫРГЫЗСТАНА",
  "ПРЕЗИДЕНТ ТАДЖИКИСТАНА",
  "ПРЕЗИДЕНТ ТУРКМЕНИСТАНА",
  "ПРЕЗИДЕНТ ТУРЦИИ",
  "ПРЕЗИДЕНТ ИЗРАИЛЯ",
  "ПРЕЗИДЕНТ ЛИВАНА",
  "ПРЕЗИДЕНТ ИРАКА",
  "ПРЕЗИДЕНТ ИРАНА",
  "ПРЕЗИДЕНТ ЕГИПТА",
  "ПРЕЗИДЕНТ АЛЖИРА",
  "ПРЕЗИДЕНТ ТУНИСА",
  "ПРЕЗИДЕНТ ЛИВИИ",
  "ПРЕЗИДЕНТ КЕНИИ",
  "ПРЕЗИДЕНТ УГАНДЫ",
  "ПРЕЗИДЕНТ ТАНЗАНИИ",
  "ПРЕЗИДЕНТ РУАНДЫ",
  "ПРЕЗИДЕНТ АНГОЛЫ",
  "ПРЕЗИДЕНТ ЗАМБИИ",
  "ПРЕЗИДЕНТ ЗИМБАБВЕ",
  "ПРЕЗИДЕНТ МОЗАМБИКА",
  "ПРЕЗИДЕНТ БОТСВАНЫ",
  "ПРЕЗИДЕНТ НАМИБИИ",
  "ПРЕЗИДЕНТ ЮАР",
  "ПРЕЗИДЕНТ МАДАГАСКАРА",
  "ПРЕЗИДЕНТ ГАНЫ",
  "ПРЕЗИДЕНТ НИГЕРИИ",
  "ПРЕЗИДЕНТ СЕНЕГАЛА",
  "ПРЕЗИДЕНТ КАМЕРУНА",
  "ПРЕЗИДЕНТ ИНДИИ",
  "ПРЕЗИДЕНТ ПАКИСТАНА",
  "ПРЕЗИДЕНТ БАНГЛАДЕШ",
  "ПРЕЗИДЕНТ НЕПАЛА",
  "ПРЕЗИДЕНТ ШРИ-ЛАНКИ",
  "ПРЕЗИДЕНТ МАЛЬДИВ",
  "ПРЕЗИДЕНТ МОНГОЛИИ",
  "ПРЕЗИДЕНТ ФИЛИППИН",
  "ПРЕЗИДЕНТ ИНДОНЕЗИИ",
  "ПРЕЗИДЕНТ СИНГАПУРА",
  "ПРЕЗИДЕНТ ВЬЕТНАМА",
  "ПРЕЗИДЕНТ КАМБОДЖИ",
  "ПРЕЗИДЕНТ ФИДЖИ",
  "ПРЕЗИДЕНТ КИРИБАТИ",
  "ПРЕЗИДЕНТ НАУРУ",
  "ПРЕЗИДЕНТ ВАНУАТУ",
  "ПРЕЗИДЕНТ КАНАДЫ",
  "ПРЕЗИДЕНТ МЕКСИКИ",
  "ПРЕЗИДЕНТ ГВАТЕМАЛЫ",
  "ПРЕЗИДЕНТ ГОНДУРАСА",
  "ПРЕЗИДЕНТ САЛЬВАДОРА",
  "ПРЕЗИДЕНТ НИКАРАГУА",
  "ПРЕЗИДЕНТ КОСТА-РИКИ",
  "ПРЕЗИДЕНТ ПАНАМЫ",
  "ПРЕЗИДЕНТ КУБЫ",
  "ПРЕЗИДЕНТ ГАИТИ",
  "ПРЕЗИДЕНТ КОЛУМБИИ",
  "ПРЕЗИДЕНТ ВЕНЕСУЭЛЫ",
  "ПРЕЗИДЕНТ ЭКВАДОРА",
  "ПРЕЗИДЕНТ ПЕРУ",
  "ПРЕЗИДЕНТ БОЛИВИИ",
  "ПРЕЗИДЕНТ ЧИЛИ",
  "ПРЕЗИДЕНТ АРГЕНТИНЫ",
  "ПРЕЗИДЕНТ ПАРАГВАЯ",
  "ПРЕЗИДЕНТ УРУГВАЯ",
  "ПРЕЗИДЕНТ БРАЗИЛИИ"]

const DEFAULT_MESSAGES = ["Предлагаю обсудить строительство нового международного логистического центра.",
  "Есть предложение по совместному развитию энергетической инфраструктуры.",
  "Готовы обсудить крупный контракт на поставку сельскохозяйственной техники.",
  "Предлагаю открыть совместное производство электроники.",
  "Есть интерес к инвестициям в добывающую промышленность.",
  "Предлагаю обсудить строительство нового морского порта.",
  "Есть предложение по модернизации железнодорожной инфраструктуры.",
  "Готовы инвестировать в строительство дата-центров.",
  "Предлагаю совместный проект в сфере атомной энергетики.",
  "Есть предложение по развитию солнечных и ветровых электростанций.",
  "Предлагаю создать совместный инвестиционный фонд.",
  "Есть возможность заключить крупный контракт в сфере авиации.",
  "Предлагаю обсудить совместное производство автомобилей.",
  "Есть интерес к строительству новых нефтеперерабатывающих мощностей.",
  "Предлагаю совместный проект по добыче редкоземельных металлов.",
  "Готовы обсудить поставки промышленного оборудования.",
  "Предлагаю создать международный технологический кластер.",
  "Есть предложение по строительству сети скоростных автомагистралей.",
  "Готовы профинансировать развитие телекоммуникационной инфраструктуры.",
  "Предлагаю сотрудничество в сфере искусственного интеллекта.",
  "Есть предложение по совместному производству спутников.",
  "Предлагаю обсудить развитие космической программы.",
  "Готовы инвестировать в фармацевтическое производство.",
  "Есть предложение по строительству новых больниц.",
  "Предлагаю создать совместную сеть логистических терминалов.",
  "Готовы обсудить крупные поставки продовольствия.",
  "Есть предложение по развитию туристической инфраструктуры.",
  "Предлагаю совместный проект по строительству аэропорта.",
  "Есть интерес к модернизации морского флота.",
  "Предлагаю сотрудничество в области кибербезопасности.",
  "Есть предложение по созданию международного банка развития.",
  "Предлагаю обсудить соглашение о свободной торговле.",
  "Готовы снизить торговые барьеры в обмен на новые инвестиционные проекты.",
  "Предлагаю увеличить взаимные инвестиции и открыть новые предприятия.",
  "Есть предложение по совместной разработке новых энергетических технологий.",
  "Предлагаю создать специальную экономическую зону.",
  "Готовы предоставить площадку для крупного промышленного комплекса.",
  "Есть интерес к совместной разработке месторождений.",
  "Предлагаю обсудить долгосрочный энергетический контракт.",
  "Есть предложение, которое лучше обсудить без лишних свидетелей.",
  "Документы подготовим позже, сначала предлагаю договориться о цифрах.",
  "Есть один очень прибыльный проект, но официально его пока не существует.",
  "Предлагаю провести встречу без протокола.",
  "Есть схема сотрудничества, которую бухгалтерии лучше пока не показывать.",
  "Контракт выглядит странно, зато цифры очень убедительные.",
  "Есть предложение через одну очень надёжную компанию с очень короткой историей.",
  "Предлагаю оформить это как консультационные услуги и больше вопросов не задавать.",
  "Есть небольшой чемодан аргументов для ускорения переговоров.",
  "Предлагаю создать компанию, офис которой существует исключительно на бумаге.",
  "Есть инвестиционный проект категории «главное не спрашивать откуда деньги».",
  "Предлагаю обсудить вопрос после того, как камеры выключатся.",
  "Есть секретный пункт договора, который почему-то занимает половину договора.",
  "Предлагаю сначала открыть офшор, а потом уже придумать зачем.",
  "Есть очень выгодная сделка. Настолько выгодная, что юрист перестал отвечать на звонки.",
  "Предлагаю перевести бюджет в категорию «прочие расходы» и продолжить переговоры.",
  "Есть знакомый подрядчик. Совершенно случайно он выигрывает каждый тендер.",
  "Предлагаю построить объект в три раза дороже, зато торжественно его откроем.",
  "Есть предложение по закупке оборудования по цене, которую лучше не сравнивать с интернетом.",
  "Предлагаю создать фонд развития фонда развития.",
  "Есть контракт на миллиард. Что именно поставляем, определимся после подписания.",
  "Предлагаю выделить бюджет на исследование вопроса о необходимости выделения бюджета.",
  "Есть перспективный посредник между нами и другим посредником.",
  "Предлагаю провести тендер. Победитель уже очень переживает, хотя тендер ещё не объявлен.",
  "Есть бизнес-план из двух пунктов: получить финансирование и разобраться потом.",
  "Предлагаю открыть секретный резервный фонд на случай появления ещё одного секретного фонда.",
  "Есть предложение купить то, что нам не нужно, зато со скидкой.",
  "Предлагаю срочно подписать меморандум, пока никто не успел его прочитать.",
  "Есть инвестиция с гарантированной доходностью. Гарантировать будет человек, которого никто не видел.",
  "Предлагаю создать комиссию для расследования деятельности предыдущей комиссии.",
  "Есть предложение построить мост. Куда именно он будет вести, решим позже.",
   "Предлагаю обсудить создание международного фонда стратегических инвестиций.",
  "Есть предложение по строительству нового грузового терминала.",
  "Готовы войти в совместный проект по производству микроэлектроники.",
  "Предлагаю организовать крупный агропромышленный комплекс.",
  "Есть интерес к долгосрочным поставкам энергетического оборудования.",
  "Предлагаю совместно развивать производство беспилотных систем.",
  "Готовы инвестировать в строительство сети современных дата-центров.",
  "Есть предложение по созданию нового международного транспортного коридора.",
  "Предлагаю обсудить строительство высокоскоростной железной дороги.",
  "Есть возможность запустить совместное производство аккумуляторов.",
  "Предлагаю крупный проект в сфере переработки сырья.",
  "Готовы обсудить строительство нескольких гидроэлектростанций.",
  "Есть предложение по созданию международной платёжной системы.",
  "Предлагаю совместно развивать производство медицинского оборудования.",
  "Есть интерес к инвестициям в робототехнику и автоматизацию производства.",
  "Предлагаю построить новый контейнерный порт.",
  "Готовы открыть совместный исследовательский центр.",
  "Есть предложение по развитию сети спутниковой связи.",
  "Предлагаю совместное производство авиационных компонентов.",
  "Готовы инвестировать в модернизацию энергетических сетей.",
  "Есть предложение по созданию крупного зернового терминала.",
  "Предлагаю запустить программу строительства доступного жилья.",
  "Готовы обсудить совместное производство железнодорожной техники.",
  "Есть интерес к созданию сети зарядных станций для электромобилей.",
  "Предлагаю открыть международный центр разработки программного обеспечения.",
  "Есть предложение по строительству нового нефтехимического комплекса.",
  "Готовы инвестировать в глубокую переработку сельскохозяйственной продукции.",
  "Предлагаю обсудить совместную разработку месторождений лития.",
  "Есть предложение по созданию национальной облачной инфраструктуры.",
  "Предлагаю совместно построить несколько промышленных парков.",
  "Готовы обсудить поставки нескольких тысяч единиц специальной техники.",
  "Есть интерес к строительству нового международного аэропорта.",
  "Предлагаю совместный проект в области биотехнологий.",
  "Есть предложение по развитию сети оптоволоконной связи.",
  "Готовы профинансировать модернизацию нескольких крупных предприятий.",
  "Предлагаю открыть совместное предприятие по выпуску строительной техники.",
  "Есть предложение создать международную товарную биржу.",
  "Готовы обсудить крупный инфраструктурный кредит.",
  "Предлагаю программу совместных инвестиций сроком на двадцать лет.",
  "Есть предложение по развитию портовой и складской инфраструктуры.",
  "Предлагаю поговорить о проекте, которого пока нет ни в одном официальном документе.",
  "Есть интересное предложение. Для начала желательно выключить запись разговора.",
  "Предлагаю подписать предварительное соглашение, а содержание согласовать потом.",
  "Есть один небольшой финансовый вопрос, который лучше не выносить на заседание.",
  "Предлагаю создать посредника между посредником и ещё одним посредником.",
  "Есть компания без сотрудников, зато с очень серьёзными контрактами.",
  "Предлагаю провести переговоры в максимально неофициальной обстановке.",
  "Есть несколько миллиардов на проект, осталось только придумать сам проект.",
  "Предлагаю открыть специальный фонд для финансирования другого специального фонда.",
  "Есть подрядчик с удивительным талантом выигрывать конкурсы ещё до их начала.",
  "Предлагаю объявить международный тендер. Победителю мы уже сообщили.",
  "Есть предложение приобрести оборудование через компанию, зарегистрированную позавчера.",
  "Предлагаю увеличить стоимость проекта в два раза для повышения его стратегической важности.",
  "Есть очень надёжный посредник. Чем именно он занимается, никто точно не знает.",
  "Предлагаю заложить в бюджет небольшую статью под названием «непредвиденные переговоры».",
  "Есть контракт, который желательно подписать до появления юридического отдела.",
  "Предлагаю создать наблюдательный совет, который ничего не будет наблюдать.",
  "Есть инвестиционный фонд с офисом, состоящим из одного почтового ящика.",
  "Предлагаю оформить расходы как международный обмен опытом.",
  "Есть возможность провести закупку без лишнего соревнования между поставщиками.",
  "Предлагаю приобрести десять объектов по цене двадцати и назвать это оптимизацией.",
  "Есть несколько счетов, которые предпочитают тёплый островной климат.",
  "Предлагаю создать компанию с названием настолько серьёзным, чтобы никто не задавал вопросов.",
  "Есть один документ. После подписания желательно забыть, что мы его видели.",
  "Предлагаю организовать закрытую встречу представителей очень открытой экономики.",
  "Есть предложение разделить один большой контракт на сорок девять совершенно случайных маленьких.",
  "Предлагаю создать государственную программу поддержки государственной программы поддержки.",
  "Есть бюджет на модернизацию. Что модернизируем, определимся по ходу.",
  "Предлагаю построить бизнес-центр там, где пока нет ни бизнеса, ни центра.",
  "Есть предложение закупить тысячу единиц оборудования. Зачем столько — хороший вопрос.",
  "Предлагаю заказать исследование, которое подтвердит необходимость второго исследования.",
  "Есть возможность привлечь консультантов для консультации других консультантов.",
  "Предлагаю создать рабочую группу по вопросу создания рабочей группы.",
  "Есть один перспективный проект с доходностью, которую калькулятор отказывается считать.",
  "Предлагаю оформить всё максимально прозрачно. Поэтому документы будут засекречены.",
  "Есть предложение построить дорогу стоимостью как небольшой город.",
  "Предлагаю приобрести программное обеспечение по цене космической программы.",
  "Есть знакомая компания, которая совершенно случайно соответствует всем условиям тендера.",
  "Предлагаю провести аукцион между одним участником и самим собой.",
  "Есть предложение арендовать здание на девяносто девять лет по очень дружеской цене.",
  "Предлагаю создать резерв на случай внезапного появления ещё одного резерва.",
  "Есть финансовая конструкция настолько сложная, что даже её автор перестал её понимать.",
  "Предлагаю открыть представительство компании по адресу, где находится только пальма.",
  "Есть предложение провести реформу управления средствами путём увеличения количества управляющих.",
  "Предлагаю выделить средства на повышение эффективности выделения средств.",
  "Есть контракт на поставку чего-то очень стратегического. Название придумаем позже.",
  "Предлагаю провести аудит. Аудитора желательно выбрать из наших хороших знакомых.",
  "Есть предложение построить завод. Производство определим после торжественного открытия.",
  "Предлагаю купить участок, который совершенно случайно завтра станет в десять раз дороже.",
  "Есть возможность получить государственный заказ через абсолютно невероятное совпадение.",
  "Предлагаю создать благотворительный фонд с очень дорогим служебным автопарком.",
  "Есть один маленький офшорный вопрос на несколько сотен миллионов.",
  "Предлагаю провести приватную презентацию проекта без презентации и без проекта.",
  "Есть предложение оформить посредническую комиссию размером с половину контракта.",
  "Предлагаю создать комитет по сокращению количества комитетов.",
  "Есть возможность сэкономить бюджет. Правда, бюджет почему-то станет больше.",
  "Предлагаю построить три объекта, а в отчёте для надёжности указать четыре.",
  "Есть инвестиционный план категории «сначала деньги, потом вопросы».",
  "Предлагаю срочно согласовать документы, пока кто-нибудь не начал их внимательно читать.",
  "Есть предложение провести очень прозрачную сделку в максимально тёмной комнате.",
  "Предлагаю обсудить детали после фразы «эта встреча никогда не происходила»."                        
];

let activeNames = [...DEFAULT_NAMES];
let activeMessages = [...DEFAULT_MESSAGES];

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
    showName: raw.showName !== false,
    showAmount: raw.showAmount !== false,
    showMessage: raw.showMessage !== false,
    ttsEnabled: raw.ttsEnabled !== false,
    ttsReadName: raw.ttsReadName !== false,
    ttsReadAmount: raw.ttsReadAmount !== false,
    ttsReadMessage: raw.ttsReadMessage !== false,
    ttsVoiceMode: ["funny", "random_cis", "random_ru", "random_all", "first"].includes(raw.ttsVoiceMode)
      ? raw.ttsVoiceMode
      : (raw.ttsVoiceMode === "random" ? "random_cis" : DEFAULTS.ttsVoiceMode),
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
    showName: $("showName").checked,
    showAmount: $("showAmount").checked,
    showMessage: $("showMessage").checked,
    ttsEnabled: $("ttsReadName").checked || $("ttsReadAmount").checked || $("ttsReadMessage").checked,
    ttsReadName: $("ttsReadName").checked,
    ttsReadAmount: $("ttsReadAmount").checked,
    ttsReadMessage: $("ttsReadMessage").checked,
    ttsVoiceMode: $("ttsVoiceMode").value,
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


function uniqueClean(items, maxLength) {
  const seen = new Set();
  const result = [];

  for (const raw of items) {
    let value = String(raw ?? "").trim();
    value = value.replace(/^\s*\d+[.)]\s*/, "");
    value = value.replace(/^\s*[-•]+\s*/, "");
    value = value.replace(/^['"`]\s*|\s*['"`],?\s*$/g, "");
    value = value.trim();

    if (!value || value === "];" || value.startsWith("const ")) continue;
    value = value.slice(0, maxLength);

    const key = value.toLocaleLowerCase("ru");
    if (!seen.has(key)) {
      seen.add(key);
      result.push(value);
    }
  }

  return result;
}

function parseListText(text, maxLength) {
  const source = String(text || "").replace(/^\uFEFF/, "").trim();
  if (!source) return [];

  // Поддержка файлов вида const MESSAGES = ["...", "..."]
  if (/\b(?:const|let|var)\s+\w+\s*=\s*\[/i.test(source) || source.startsWith("[")) {
    const quoted = [];
    const regexp = /"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'/g;
    let match;

    while ((match = regexp.exec(source))) {
      const value = (match[1] ?? match[2] ?? "")
        .replace(/\\n/g, " ")
        .replace(/\\r/g, " ")
        .replace(/\\t/g, " ")
        .replace(/\\([\\"'])/g, "$1");
      quoted.push(value);
    }

    if (quoted.length) return uniqueClean(quoted, maxLength);
  }

  return uniqueClean(source.split(/\r?\n/), maxLength);
}

function updateContentCounters() {
  const names = parseListText($("namesEditor").value, 32);
  const messages = parseListText($("messagesEditor").value, 180);
  $("namesCount").textContent = String(names.length);
  $("messagesCount").textContent = String(messages.length);
}

function fillContentEditors(names, messages) {
  activeNames = uniqueClean(names?.length ? names : DEFAULT_NAMES, 32);
  activeMessages = uniqueClean(messages?.length ? messages : DEFAULT_MESSAGES, 180);
  $("namesEditor").value = activeNames.join("\n");
  $("messagesEditor").value = activeMessages.join("\n");
  updateContentCounters();
}

function showContentMessage(text, isError = false) {
  const box = $("contentMessage");
  box.textContent = text;
  box.style.color = isError ? "#ff8d9a" : "#7dffa4";
  clearTimeout(showContentMessage.timer);
  showContentMessage.timer = setTimeout(() => { box.textContent = ""; }, 6000);
}

async function saveContentLists() {
  const names = parseListText($("namesEditor").value, 32);
  const messages = parseListText($("messagesEditor").value, 180);

  if (!names.length) {
    showContentMessage("Добавь хотя бы один никнейм.", true);
    return;
  }
  if (!messages.length) {
    showContentMessage("Добавь хотя бы одно сообщение.", true);
    return;
  }

  const button = $("saveContent");
  button.disabled = true;
  button.textContent = "Сохраняю...";

  try {
    await contentRef.set({
      names,
      messages,
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    });
    fillContentEditors(names, messages);
    showContentMessage(`Сохранено: ${names.length} ников и ${messages.length} сообщений. OBS получит их автоматически.`);
  } catch (error) {
    console.error("Ошибка сохранения списков:", error);
    showContentMessage("Firebase запретила сохранение списков. Проверь права donateManager/content.", true);
  } finally {
    button.disabled = false;
    button.textContent = "Сохранить ники и сообщения";
  }
}

async function loadFileIntoEditor(fileInput, editorId, maxLength) {
  const file = fileInput.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const items = parseListText(text, maxLength);
    if (!items.length) throw new Error("В файле не найдено значений");
    $(editorId).value = items.join("\n");
    updateContentCounters();
    showContentMessage(`Файл загружен в поле: ${items.length} строк. Нажми «Сохранить ники и сообщения».`);
  } catch (error) {
    console.error(error);
    showContentMessage("Не удалось прочитать файл. Используй TXT, JS или JSON в кодировке UTF-8.", true);
  } finally {
    fileInput.value = "";
  }
}

$("namesEditor").addEventListener("input", updateContentCounters);
$("messagesEditor").addEventListener("input", updateContentCounters);
$("namesFile").addEventListener("change", event => loadFileIntoEditor(event.target, "namesEditor", 32));
$("messagesFile").addEventListener("change", event => loadFileIntoEditor(event.target, "messagesEditor", 180));
$("saveContent").addEventListener("click", saveContentLists);

$("restoreContent").addEventListener("click", () => {
  fillContentEditors(DEFAULT_NAMES, DEFAULT_MESSAGES);
  showContentMessage("Встроенные списки загружены в поля. Для применения нажми кнопку сохранения.");
});

$("clearEvents").addEventListener("click", async () => {
  if (!confirm("Удалить все старые события донатов из Firebase?")) return;
  try {
    await eventsRef.remove();
    showContentMessage("Старые события донатов полностью удалены.");
  } catch (error) {
    console.error("Ошибка очистки событий:", error);
    showContentMessage("Firebase запретила очистку событий.", true);
  }
});

contentRef.on("value", snapshot => {
  const data = snapshot.val() || {};
  fillContentEditors(data.names, data.messages);
}, error => {
  console.error("Ошибка чтения списков:", error);
  fillContentEditors(DEFAULT_NAMES, DEFAULT_MESSAGES);
  showContentMessage("Не удалось прочитать списки из Firebase.", true);
});

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
["enabled", "soundEnabled", "gifEnabled", "showName", "showAmount", "showMessage", "ttsReadName", "ttsReadAmount", "ttsReadMessage"].forEach(id => {
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

$("ttsVoiceMode").addEventListener("change", () => {
  if (isApplyingRemoteSettings) return;

  const next = readForm();
  current = next;
  saveLocal(next);
  const labels = {
    funny: "Включён угарный микс TTS.",
    random_cis: "Включён случайный СНГ-микс TTS.",
    random_ru: "Включён случайный русский голос TTS.",
    random_all: "Включён случайный голос из всех доступных.",
    first: "Включён обычный русский голос TTS."
  };
  saveSettings(labels[next.ttsVoiceMode] || "Настройка голоса TTS сохранена.");
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
    name: randomItem(activeNames),
    amount: randomInt(current.minAmount, current.maxAmount),
    currency: current.currency,
    message: randomItem(activeMessages)
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
