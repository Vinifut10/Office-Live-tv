// toggleTheme.js
(function(){
  const btn = document.getElementById('toggleTheme');
  const rootBody = document.body;

  // aplicar preferência salva
  const saved = localStorage.getItem('ltv_theme');
  if (saved === 'light') {
    rootBody.classList.add('light');
    btn.textContent = '☀️';
  } else {
    // default = dark
    rootBody.classList.remove('light');
    btn.textContent = '🌙';
  }

  btn.addEventListener('click', () => {
    const nowIsLight = rootBody.classList.toggle('light');
    btn.textContent = nowIsLight ? '☀️' : '🌙';
    localStorage.setItem('ltv_theme', nowIsLight ? 'light' : 'dark');
  });
})();