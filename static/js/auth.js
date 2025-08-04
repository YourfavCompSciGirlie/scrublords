const loginForm  = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const toggleAuth = document.getElementById("toggleAuth");

toggleAuth.addEventListener("click", e => {
  e.preventDefault();
  loginForm.classList.toggle("hidden");
  signupForm.classList.toggle("hidden");
  toggleAuth.innerHTML = loginForm.classList.contains("hidden")
    ? `Have an account? <a href="#">Login</a>`
    : `Don’t have an account? <a href="#">Sign Up</a>`;
});

loginForm.addEventListener("submit", async e => {
  e.preventDefault();
  const phone = document.getElementById("loginPhone").value;
  const res = await fetch("/api/login", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({phone})
  });
  const j = await res.json();
  if(j.status==="ok"){
    localStorage.token = j.token;
    window.location="/patient";
  } else alert("Login failed");
});

signupForm.addEventListener("submit", async e => {
  e.preventDefault();
  const name  = document.getElementById("signupName").value;
  const phone = document.getElementById("signupPhone").value;
  const res = await fetch("/api/signup", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({name,phone})
  });
  const j = await res.json();
  localStorage.token = j.token;
  window.location="/patient";
});
