const socket = io();
const bookForm    = document.getElementById("bookForm");
const timeslots   = document.getElementById("timeslots");
const aiSuggest   = document.getElementById("aiSuggest");
const suggestion  = document.getElementById("suggestion");
const afterBook   = document.getElementById("afterBook");
const qrImg       = document.getElementById("qrImg");
const tokenCode   = document.getElementById("tokenCode");
const posP        = document.getElementById("position");
const etaP        = document.getElementById("eta");
const userNameH   = document.getElementById("userName");
const logoutBtn   = document.getElementById("logoutBtn");

let myCode, avgTime=10;

// — Auth & Init
if(!localStorage.token) window.location="/";
userNameH.textContent = JSON.parse(atob(localStorage.token+"=="))?.name||"Patient";

fetch("/api/slots")
.then(r=>r.json())
.then(slots=>{
  slots.forEach(s=>{
    const btn= document.createElement("button");
    btn.textContent = s.time;
    btn.disabled = s.load>0.9;
    btn.style.background = s.load<0.5? "var(--ok)"
                    : s.load<0.9? "var(--warn)" : "var(--bad)";
    btn.addEventListener("click", ()=> {
      timeslots.querySelectorAll("button").forEach(b=>b.classList.remove("selected"));
      btn.classList.add("selected");
    });
    timeslots.appendChild(btn);
  });
});

aiSuggest.onclick = async () => {
  const f = await fetch("/api/forecast").then(r=>r.json());
  suggestion.textContent = `Try ${f.suggest} (${f.alert})`;
};

// Booking
bookForm.onsubmit = async e => {
  e.preventDefault();
  const time  = timeslots.querySelector(".selected").textContent;
  const reason= document.getElementById("reason").value;
  const res   = await fetch("/api/book", {
    method:"POST",
    headers: {
      "Content-Type":"application/json",
      "Authorization": localStorage.token
    },
    body: JSON.stringify({time,reason,priority:false})
  });
  const j = await res.json();
  myCode = j.code;
  tokenCode.textContent = myCode;
  qrImg.src = `/api/token_qr/${myCode}`;
  afterBook.classList.remove("hidden");
};

// — Queue updates
socket.on("queue_update", qs => {
  const waiting = qs.filter(p=>p.status==="waiting");
  const idx = waiting.findIndex(p=>p.code===myCode);
  if(idx>=0){
    posP.textContent = `Position: ${idx+1}`;
    etaP.textContent = `ETA: ${(idx+1)*avgTime} min`;
  }
});
logoutBtn.onclick = ()=> {
  localStorage.clear();
  window.location="/";
};
