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

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

const db = firebase.database();
const settingsRef = db.ref("donateManager/settings");
const eventsRef = db.ref("donateManager/events");

const DEFAULTS = {
  enabled: true, minDelay: 45, maxDelay: 120,
  minAmount: 20, maxAmount: 1500, currency: "₴",
  duration: 8, soundEnabled: true, gifEnabled: true,
  ttsEnabled: true, volume: 70
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
let localChangeUntil = 0;

function randomItem(a){ return a[Math.floor(Math.random()*a.length)]; }
function randomInt(min,max){
  min=Number(min); max=Number(max);
  if(max<min)[min,max]=[max,min];
  return Math.floor(Math.random()*(max-min+1))+min;
}

function status(enabled){
  $("statusText").textContent = enabled ? "АКТИВЕН" : "ОСТАНОВЛЕН";
  $("modeText").textContent = enabled ? "АВТО" : "РУЧНОЙ";
  $("statusDot").style.background = enabled ? "#18e079" : "#777";
  $("statusDot").style.boxShadow = enabled ? "0 0 14px rgba(24,224,121,.7)" : "none";
}

function message(text,error=false){
  $("messageBox").textContent=text;
  $("messageBox").style.color=error?"#ff8d9a":"#7dffa4";
  clearTimeout(message.t);
  message.t=setTimeout(()=>$("messageBox").textContent="",3000);
}

function fill(s){
  current={...DEFAULTS,...s};
  Object.keys(DEFAULTS).forEach(k=>{
    const el=$(k);
    if(!el)return;
    if(el.type==="checkbox")el.checked=!!current[k];
    else el.value=current[k];
  });
  $("volumeValue").textContent=`${current.volume}%`;
  status(current.enabled);
  startCountdown();
}

function form(){
  const s={
    enabled:$("enabled").checked,
    minDelay:Math.max(5,Number($("minDelay").value)||45),
    maxDelay:Math.max(5,Number($("maxDelay").value)||120),
    minAmount:Math.max(1,Number($("minAmount").value)||20),
    maxAmount:Math.max(1,Number($("maxAmount").value)||1500),
    currency:$("currency").value,
    duration:Math.min(30,Math.max(3,Number($("duration").value)||8)),
    soundEnabled:$("soundEnabled").checked,
    gifEnabled:$("gifEnabled").checked,
    ttsEnabled:$("ttsEnabled").checked,
    volume:Math.min(100,Math.max(0,Number($("volume").value)||0))
  };
  if(s.maxDelay<s.minDelay)s.maxDelay=s.minDelay;
  if(s.maxAmount<s.minAmount)s.maxAmount=s.minAmount;
  return s;
}

async function save(text="Настройки сохранены."){
  try{
    const next = form();
    await settingsRef.set(next);

    const saved = (await settingsRef.once("value")).val();
    if(Boolean(saved?.enabled) !== Boolean(next.enabled)){
      throw new Error("Состояние не сохранилось в Firebase");
    }

    message(text);
  }catch(e){
    console.error(e);
    message("Firebase не разрешила сохранить настройки.",true);
  }
}

async function emit(d){
  try{
    await eventsRef.push({
      type:"donate",
      source:"manual",
      name:String(d.name||"Anonymous").slice(0,32),
      amount:Math.max(1,Number(d.amount)||1),
      currency:d.currency||current.currency,
      message:String(d.message||"Спасибо за стрим!").slice(0,180),
      createdAt:firebase.database.ServerValue.TIMESTAMP
    });
    message("Алерт отправлен.");
  }catch(e){
    console.error(e);
    message("Firebase не разрешила отправить алерт.",true);
  }
}

function startCountdown(){
  clearInterval(countdownTimer);
  if(!current.enabled){$("nextAlert").textContent="—";return;}
  let n=randomInt(current.minDelay,current.maxDelay);
  $("nextAlert").textContent=`${n} сек.`;
  countdownTimer=setInterval(()=>{
    n--;
    if(n<=0)n=randomInt(current.minDelay,current.maxDelay);
    $("nextAlert").textContent=`${n} сек.`;
  },1000);
}

$("overlayUrl").textContent=new URL("index.html",location.href).href;
$("volume").addEventListener("input",()=>$("volumeValue").textContent=`${$("volume").value}%`);

["enabled","soundEnabled","gifEnabled","ttsEnabled"].forEach(id=>{
  const input = $(id);

  input.addEventListener("change", async () => {
    localChangeUntil = Date.now() + 2500;

    // Меняем интерфейс сразу, ещё до ответа Firebase.
    current = { ...current, ...form() };
    status($("enabled").checked);
    startCountdown();

    await save(id === "enabled"
      ? ($("enabled").checked
          ? "Автоматические донаты включены."
          : "Автоматические донаты выключены.")
      : "Настройка сохранена.");
  });
});

$("saveSettings").addEventListener("click",()=>save());
$("resetSettings").addEventListener("click",()=>settingsRef.set(DEFAULTS));
$("openOverlay").addEventListener("click",()=>window.open(new URL("index.html",location.href),"_blank"));

$("sendManual").addEventListener("click",()=>emit({
  name:$("manualName").value,
  amount:$("manualAmount").value,
  currency:current.currency,
  message:$("manualMessage").value
}));

$("sendRandom").addEventListener("click",()=>emit({
  name:randomItem(NAMES),
  amount:randomInt(current.minAmount,current.maxAmount),
  currency:current.currency,
  message:randomItem(MESSAGES)
}));

$("sendTest").addEventListener("click",()=>emit({
  name:"STRIMKO TEST",amount:100,currency:current.currency,
  message:"Проверка работы системы."
}));

settingsRef.on("value",snap=>{
  if(!snap.exists()){
    settingsRef.set(DEFAULTS);
    if(Date.now() > localChangeUntil) fill(DEFAULTS);
    return;
  }

  // Не откатываем ползунок старым ответом Firebase сразу после клика.
  if(Date.now() > localChangeUntil) fill(snap.val());
  else current = { ...DEFAULTS, ...snap.val() };
},err=>message("Нет доступа к Firebase.",true));

eventsRef.limitToLast(200).on("value",snap=>{
  $("shownCount").textContent=String(snap.numChildren());
});
})();