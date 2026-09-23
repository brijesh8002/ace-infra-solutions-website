/* ============ ACE Infra Solutions — shared front-end behaviour ============ */

/* ---- mobile nav ---- */
function initNav(){
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if(!toggle || !links) return;
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('open');
    links.classList.toggle('open');
  });
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    toggle.classList.remove('open'); links.classList.remove('open');
  }));
}

/* ---- scroll reveal (single orchestrated pass, respects reduced motion) ---- */
function initReveal(){
  const items = document.querySelectorAll('.reveal');
  if(!items.length) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    items.forEach(el => el.classList.add('in')); return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if(entry.isIntersecting){
        setTimeout(() => entry.target.classList.add('in'), i * 60);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: .15 });
  items.forEach(el => io.observe(el));
}

/* ---- toasts ---- */
function toast(message, type = 'info'){
  let wrap = document.querySelector('.toast-wrap');
  if(!wrap){ wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  wrap.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 3600);
}
window.aceToast = toast;

/* ---- generic modal open/close ---- */
function openModal(id){
  const el = document.getElementById(id);
  if(!el) return;
  el.classList.add('open');
  document.body.style.overflow = 'hidden';
  const first = el.querySelector('input,textarea,select,button');
  if(first) setTimeout(() => first.focus(), 50);
}
function closeModal(el){
  const overlay = el.closest ? el.closest('.modal-overlay') : el;
  if(!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}
window.aceOpenModal = openModal;
window.aceCloseModal = closeModal;

function initModals(){
  document.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.getAttribute('data-open-modal')));
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => { if(e.target === overlay) closeModal(overlay); });
    overlay.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', () => closeModal(overlay)));
  });
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape'){ document.querySelectorAll('.modal-overlay.open').forEach(closeModal); }
  });
}

/* ---- exit-intent quote popup (fires once per session) ---- */
function initExitIntent(){
  const modal = document.getElementById('modal-quote');
  if(!modal) return;
  if(sessionStorage.getItem('ace_exit_shown')) return;
  document.addEventListener('mouseout', function handler(e){
    if(e.clientY > 0) return;
    if(sessionStorage.getItem('ace_exit_shown')) return;
    sessionStorage.setItem('ace_exit_shown', '1');
    openModal('modal-quote');
    document.removeEventListener('mouseout', handler);
  });
}

/* ---- quote request form (stored to localStorage, read by dashboard) ---- */
function seedKey(){ return 'ace_quote_requests'; }
function initQuoteForms(){
  document.querySelectorAll('form[data-quote-form]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const list = JSON.parse(localStorage.getItem(seedKey()) || '[]');
      list.unshift({
        id: 'QR-' + Math.floor(1000 + Math.random()*9000),
        name: data.name || 'Guest', company: data.company || '—',
        service: data.service || 'General enquiry', city: data.city || '—',
        message: data.message || '', status: 'New', date: new Date().toISOString()
      });
      localStorage.setItem(seedKey(), JSON.stringify(list));
      form.reset();
      const overlay = form.closest('.modal-overlay');
      if(overlay) closeModal(overlay);
      toast('Request received — our team will call you within 24 hours.', 'success');
    });
  });
}

/* ---- contact form (site-wide, no dashboard needed) ---- */
function initContactForm(){
  const form = document.getElementById('contact-form');
  if(!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    toast('Message sent. We\u2019ll get back to you shortly.', 'success');
    form.reset();
  });
}

/* ---- newsletter / footer ---- */
function initNewsletter(){
  const form = document.getElementById('newsletter-form');
  if(!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    toast('Subscribed! Updates will land in your inbox.', 'success');
    form.reset();
  });
}

/* ---- footer year + auth-aware nav link ---- */
function initFooterYear(){
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
}

function initAuthAwareLinks(){
  const isLoggedIn = !!localStorage.getItem('ace_current_user');
  document.querySelectorAll('[data-auth-link]').forEach(el => {
    if(isLoggedIn){
      el.textContent = 'Dashboard';
      el.setAttribute('href', 'dashboard.html');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initReveal();
  initModals();
  initExitIntent();
  initQuoteForms();
  initContactForm();
  initNewsletter();
  initFooterYear();
  initAuthAwareLinks();
});
