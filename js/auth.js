/* ============ Lightweight client-side auth (demo) ============
   This is a static site: there is no server. Accounts are stored in
   localStorage on the visitor's own browser purely to demonstrate the
   dashboard experience end-to-end. Swap this file for real API calls
   when wiring up a backend. */

const ACE_USERS_KEY = 'ace_users';
const ACE_SESSION_KEY = 'ace_current_user';

function aceGetUsers(){ return JSON.parse(localStorage.getItem(ACE_USERS_KEY) || '[]'); }
function aceSaveUsers(list){ localStorage.setItem(ACE_USERS_KEY, JSON.stringify(list)); }

function aceSeedDemoAccount(){
  const users = aceGetUsers();
  if(!users.find(u => u.email === 'demo@aceinfrasolutions.com')){
    users.push({ name: 'Vivek Sharma', email: 'demo@aceinfrasolutions.com', company: 'Zepto Retail Ops', password: 'demo1234' });
    aceSaveUsers(users);
  }
}

function aceRegister(form){
  const data = Object.fromEntries(new FormData(form).entries());
  const users = aceGetUsers();
  if(users.find(u => u.email.toLowerCase() === data.email.toLowerCase())){
    return { ok:false, message: 'An account with this email already exists.' };
  }
  users.push({ name: data.name, email: data.email, company: data.company || '', password: data.password });
  aceSaveUsers(users);
  localStorage.setItem(ACE_SESSION_KEY, data.email);
  return { ok:true };
}

function aceLogin(form){
  const data = Object.fromEntries(new FormData(form).entries());
  const users = aceGetUsers();
  const match = users.find(u => u.email.toLowerCase() === data.email.toLowerCase() && u.password === data.password);
  if(!match) return { ok:false, message: 'Incorrect email or password.' };
  localStorage.setItem(ACE_SESSION_KEY, match.email);
  return { ok:true };
}

function aceLogout(){
  localStorage.removeItem(ACE_SESSION_KEY);
  window.location.href = 'login.html';
}
window.aceLogout = aceLogout;

function aceCurrentUser(){
  const email = localStorage.getItem(ACE_SESSION_KEY);
  if(!email) return null;
  return aceGetUsers().find(u => u.email === email) || null;
}
window.aceCurrentUser = aceCurrentUser;

function aceGuardDashboard(){
  if(!document.body.hasAttribute('data-require-auth')) return;
  if(!aceCurrentUser()){ window.location.href = 'login.html'; }
}

document.addEventListener('DOMContentLoaded', () => {
  aceSeedDemoAccount();
  aceGuardDashboard();

  const loginForm = document.getElementById('login-form');
  if(loginForm){
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const res = aceLogin(loginForm);
      const err = document.getElementById('auth-error');
      if(res.ok){ window.location.href = 'dashboard.html'; }
      else if(err){ err.textContent = res.message; err.style.display = 'block'; }
    });
  }

  const registerForm = document.getElementById('register-form');
  if(registerForm){
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const pw = registerForm.password.value, pw2 = registerForm.confirm_password.value;
      const err = document.getElementById('auth-error');
      if(pw !== pw2){ if(err){ err.textContent = 'Passwords do not match.'; err.style.display = 'block'; } return; }
      const res = aceRegister(registerForm);
      if(res.ok){ window.location.href = 'dashboard.html'; }
      else if(err){ err.textContent = res.message; err.style.display = 'block'; }
    });
  }

  document.querySelectorAll('[data-fill-demo]').forEach(btn => {
    btn.addEventListener('click', () => {
      const form = document.getElementById('login-form');
      if(!form) return;
      form.email.value = 'demo@aceinfrasolutions.com';
      form.password.value = 'demo1234';
    });
  });
});
