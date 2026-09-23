/* ============ Dashboard app logic (demo data lives in localStorage) ============ */

const PROJECTS_KEY = 'ace_projects';
const INVOICES_KEY = 'ace_invoices';
const NOTIFS_KEY = 'ace_notifications';

function seedIfEmpty(key, seed){
  if(!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(seed));
  return JSON.parse(localStorage.getItem(key));
}

function seedDashboardData(){
  seedIfEmpty(PROJECTS_KEY, [
    { id:'PRJ-2201', name:'Dark Store Fit-out — Zepto, Pune', service:'Interior & Fit-out', city:'Pune, MH', status:'In Progress', progress:68, updated:'2 days ago' },
    { id:'PRJ-2198', name:'ATM Relocation — 12 sites', service:'ATM Setup & R&M', city:'Delhi NCR', status:'In Review', progress:90, updated:'5 days ago' },
    { id:'PRJ-2189', name:'Branch Interior — Federal Bank', service:'Interior Work', city:'Thane, MH', status:'Completed', progress:100, updated:'3 weeks ago' },
    { id:'PRJ-2176', name:'Glow Sign Installation — 40 outlets', service:'Branding & Signage', city:'Bengaluru, KA', status:'Open', progress:12, updated:'Today' }
  ]);
  seedIfEmpty(INVOICES_KEY, [
    { id:'INV-8841', project:'PRJ-2201', amount: 428000, status:'Due', due:'02 Oct 2026' },
    { id:'INV-8790', project:'PRJ-2198', amount: 165500, status:'Paid', due:'14 Sep 2026' },
    { id:'INV-8712', project:'PRJ-2189', amount: 612000, status:'Paid', due:'22 Aug 2026' }
  ]);
  seedIfEmpty(NOTIFS_KEY, [
    { text:'Site survey completed for PRJ-2201 (Zepto, Pune).', when:'2 hours ago', read:false },
    { text:'Invoice INV-8841 is due on 02 Oct 2026.', when:'Yesterday', read:false },
    { text:'PRJ-2189 marked Completed — feedback requested.', when:'3 weeks ago', read:true }
  ]);
}

function money(n){ return '\u20B9' + Number(n).toLocaleString('en-IN'); }

function statusPillClass(status){
  const map = { 'In Progress':'pill-progress', 'In Review':'pill-review', 'Completed':'pill-done', 'Open':'pill-open', 'Paid':'pill-paid', 'Due':'pill-due', 'New':'pill-open' };
  return map[status] || 'pill-open';
}

function renderGreeting(){
  const user = window.aceCurrentUser ? aceCurrentUser() : null;
  const nameEl = document.getElementById('dash-username');
  const avatarEl = document.getElementById('dash-avatar');
  const sideAvatar = document.getElementById('side-avatar');
  const sideName = document.getElementById('side-name');
  const sideCompany = document.getElementById('side-company');
  if(user){
    if(nameEl) nameEl.textContent = user.name.split(' ')[0];
    const initials = user.name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
    if(avatarEl) avatarEl.textContent = initials;
    if(sideAvatar) sideAvatar.textContent = initials;
    if(sideName) sideName.textContent = user.name;
    if(sideCompany) sideCompany.textContent = user.company || 'Client account';
  }
}

function renderKPIs(){
  const projects = JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]');
  const invoices = JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]');
  const quotes = JSON.parse(localStorage.getItem('ace_quote_requests') || '[]');
  const active = projects.filter(p => p.status !== 'Completed').length;
  const dueAmount = invoices.filter(i => i.status === 'Due').reduce((s,i)=>s+i.amount,0);
  const set = (id,val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  set('kpi-active', active);
  set('kpi-completed', projects.filter(p=>p.status==='Completed').length);
  set('kpi-due', money(dueAmount));
  set('kpi-quotes', quotes.length);
}

function renderProjects(filter = 'all'){
  const tbody = document.getElementById('projects-tbody');
  if(!tbody) return;
  let projects = JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]');
  if(filter !== 'all') projects = projects.filter(p => p.status === filter);
  tbody.innerHTML = projects.length ? projects.map(p => `
    <tr>
      <td><strong>${p.id}</strong></td>
      <td>${p.name}<div class="muted" style="font-size:.78rem">${p.service} · ${p.city}</div></td>
      <td><span class="pill ${statusPillClass(p.status)}">${p.status}</span></td>
      <td style="min-width:140px">
        <div class="progress-track"><div class="progress-fill" style="width:${p.progress}%"></div></div>
        <div class="muted" style="font-size:.75rem;margin-top:.3rem">${p.progress}% complete</div>
      </td>
      <td class="muted">${p.updated}</td>
    </tr>`).join('') : `<tr><td colspan="5"><div class="empty-state">No projects in this view yet.</div></td></tr>`;
}

function renderInvoices(){
  const tbody = document.getElementById('invoices-tbody');
  if(!tbody) return;
  const invoices = JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]');
  tbody.innerHTML = invoices.map(i => `
    <tr>
      <td><strong>${i.id}</strong></td>
      <td class="muted">${i.project}</td>
      <td>${money(i.amount)}</td>
      <td><span class="pill ${statusPillClass(i.status)}">${i.status}</span></td>
      <td class="muted">${i.due}</td>
      <td>${i.status === 'Due' ? `<button class="btn btn-primary btn-sm" data-pay="${i.id}">Pay now</button>` : `<button class="btn btn-outline btn-sm" data-download="${i.id}">Download</button>`}</td>
    </tr>`).join('');

  tbody.querySelectorAll('[data-pay]').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-pay');
    let list = JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]');
    list = list.map(i => i.id === id ? { ...i, status:'Paid' } : i);
    localStorage.setItem(INVOICES_KEY, JSON.stringify(list));
    renderInvoices(); renderKPIs();
    toast(`${id} marked as paid.`, 'success');
  }));
  tbody.querySelectorAll('[data-download]').forEach(btn => btn.addEventListener('click', () => {
    toast('Invoice PDF ready — check your downloads.', 'info');
  }));
}

function renderQuotes(){
  const tbody = document.getElementById('quotes-tbody');
  if(!tbody) return;
  const quotes = JSON.parse(localStorage.getItem('ace_quote_requests') || '[]');
  tbody.innerHTML = quotes.length ? quotes.map(q => `
    <tr>
      <td><strong>${q.id}</strong></td>
      <td>${q.service}</td>
      <td class="muted">${q.city}</td>
      <td><span class="pill ${statusPillClass(q.status)}">${q.status}</span></td>
      <td class="muted">${new Date(q.date).toLocaleDateString('en-IN')}</td>
    </tr>`).join('') : `<tr><td colspan="5"><div class="empty-state">No quote requests yet — submit one from the form above.</div></td></tr>`;
}

function renderNotifications(){
  const wrap = document.getElementById('notif-list');
  if(!wrap) return;
  const notifs = JSON.parse(localStorage.getItem(NOTIFS_KEY) || '[]');
  wrap.innerHTML = notifs.map(n => `
    <div class="notif-item ${n.read ? 'read':''}">
      <div class="notif-dot"></div>
      <div><p>${n.text}</p><div class="when">${n.when}</div></div>
    </div>`).join('');
  const badge = document.getElementById('notif-count');
  const unread = notifs.filter(n=>!n.read).length;
  if(badge) badge.textContent = unread;
}

function initTabs(){
  document.querySelectorAll('[data-tabs]').forEach(group => {
    const buttons = group.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.addEventListener('click', () => {
      buttons.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.getAttribute('data-tab');
      group.parentElement.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === target));
    }));
  });
}

function initProjectFilter(){
  const select = document.getElementById('project-filter');
  if(!select) return;
  select.addEventListener('change', () => renderProjects(select.value));
}

function initSidebarToggle(){
  const btn = document.getElementById('app-toggle');
  const sidebar = document.querySelector('.app-sidebar');
  const scrim = document.getElementById('sidebar-scrim');
  if(!btn || !sidebar) return;
  const close = () => { sidebar.classList.remove('open'); scrim.classList.remove('open'); };
  btn.addEventListener('click', () => { sidebar.classList.toggle('open'); scrim.classList.toggle('open'); });
  if(scrim) scrim.addEventListener('click', close);
}

function initNewQuoteFromDashboard(){
  const form = document.getElementById('dash-quote-form');
  if(!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const list = JSON.parse(localStorage.getItem('ace_quote_requests') || '[]');
    list.unshift({ id:'QR-'+Math.floor(1000+Math.random()*9000), name: aceCurrentUser()?.name || 'Client', company: aceCurrentUser()?.company || '—', service:data.service, city:data.city, message:data.message||'', status:'New', date:new Date().toISOString() });
    localStorage.setItem('ace_quote_requests', JSON.stringify(list));
    form.reset();
    renderQuotes(); renderKPIs();
    toast('New quote request submitted.', 'success');
  });
}

function initProfileForm(){
  const form = document.getElementById('profile-form');
  if(!form) return;
  const user = aceCurrentUser();
  if(user){ form.name.value = user.name; form.email.value = user.email; form.company.value = user.company || ''; }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem('ace_users') || '[]').map(u => u.email === user.email ? { ...u, name: form.name.value, company: form.company.value } : u);
    localStorage.setItem('ace_users', JSON.stringify(users));
    toast('Profile updated.', 'success');
    renderGreeting();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if(!document.body.hasAttribute('data-require-auth')) return;
  seedDashboardData();
  renderGreeting();
  renderKPIs();
  renderProjects();
  renderInvoices();
  renderQuotes();
  renderNotifications();
  initTabs();
  initProjectFilter();
  initSidebarToggle();
  initNewQuoteFromDashboard();
  initProfileForm();
});
