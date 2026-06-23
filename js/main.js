document.getElementById('year').textContent = new Date().getFullYear();

const toggle = document.getElementById('nav-toggle');
const nav = document.getElementById('main-nav');

toggle.addEventListener('click', () => {
  nav.classList.toggle('open');
});

nav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => nav.classList.remove('open'));
});
