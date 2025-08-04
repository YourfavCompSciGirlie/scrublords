const socket = io();
const tbody = document.getElementById("queueTbody");
const logoutBtn = document.getElementById("logoutBtn");
const forecastAlert   = document.getElementById("forecastAlert");
const forecastSuggest = document.getElementById("forecastSuggest");
const avgTime = 10;

// — Forecast
fetch("/api/forecast")
.then(r=>r.json())
.then(f=>{
  forecastAlert.textContent   = f.alert;
  forecastSuggest.textContent = `Try ${f.suggest}`;
});

// — Render queue
function render(q){
  tbody.innerHTML = "";
  q.forEach((p,i)=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i+1}</td>
      <td>${p.code}</td>
      <td>${p.time}</td>
      <td>${p.priority? "★":"–"}</td>
      <td><span class="status-${p.status.replace(" ","-")}">${p.status}</span></td>
      <td>
        <button ${p.status!=="waiting"?"disabled":""}
                onclick="arrive('${p.code}')">
          Start
        </button>
      </td>`;
    tbody.appendChild(tr);
  });
}

// — Socket updates
socket.on("queue_update", render);

// — Actions
window.arrive = code => {
  fetch("/api/staff/arrive", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({code})
  });
};

window.complete = code => {
  fetch("/api/staff/complete", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({code})
  });
};

logoutBtn.onclick = ()=> window.location="/";
