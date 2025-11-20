/* ===== Live TV — Gestão (localStorage) =====
   Schema (localStorage key 'ltv_activations'):
   [
     { id: 'uuid', date: 'YYYY-MM-DD', plan: '30'|'25'|'21.5'|'20'|'10'|'free', qty: 2 }
   ]
*/

(() => {
  const LS_KEY = 'ltv_activations_v1';
  const form = document.getElementById('activationForm');
  const planSelect = document.getElementById('planSelect');
  const qtyInput = document.getElementById('quantityInput');
  const dateInput = document.getElementById('dateInput');

  const filterDate = document.getElementById('filterDate');
  const filterMonth = document.getElementById('filterMonth');
  const filterYear = document.getElementById('filterYear');
  const applyFiltersBtn = document.getElementById('applyFilters');
  const resetFiltersBtn = document.getElementById('resetFilters');

  const totalDayEl = document.getElementById('totalDay');
  const totalMonthEl = document.getElementById('totalMonth');
  const totalYearEl = document.getElementById('totalYear');
  const tableBody = document.querySelector('#activationsTable tbody');
  const todayText = document.getElementById('todayText');

  const exportBtn = document.getElementById('exportJson');
  const importJsonBtn = document.getElementById('importJsonBtn');
  const importJsonInput = document.getElementById('importJson');

  const clearBtn = document.getElementById('clearBtn');

  // Charts
  let pieChart = null;
  let lineChart = null;

  // Utils
  const uid = () => 'id-' + Math.random().toString(36).slice(2,9);
  const readStore = () => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    } catch (e) {
      console.error(e);
      return [];
    }
  };
  const writeStore = (arr) => localStorage.setItem(LS_KEY, JSON.stringify(arr));

  const today = () => {
    const d = new Date();
    const iso = d.toISOString().slice(0,10);
    return iso;
  };

  // init date inputs
  dateInput.value = today();
  todayText.textContent = new Date().toLocaleDateString('pt-BR');

  // sample initial data if empty (optional)
  const ensureSample = () => {
    const current = readStore();
    if (current.length === 0) {
      const sample = [
        { id: uid(), date: today(), plan: '30', qty: 12 },
        { id: uid(), date: today(), plan: '25', qty: 4 },
        { id: uid(), date: today(), plan: 'free', qty: 1 },
      ];
      writeStore(sample);
    }
  };

  // Calculate totals (numbers refer to qty and value sums)
  const planLabel = p => {
    if (p === 'free') return 'GRÁTIS';
    return `R$ ${Number(p).toLocaleString('pt-BR', {minimumFractionDigits: p.includes('.') ? 2 : 0})}`;
  };
  const unitValue = p => (p === 'free' ? 0 : Number(p));

  // Filtering logic
  const applyFilters = (items) => {
    const fd = filterDate.value;
    const fm = filterMonth.value;
    const fy = filterYear.value;

    return items.filter(it => {
      if (fd && it.date !== fd) return false;
      if (fm) {
        const [y,m] = fm.split('-');
        if (!it.date.startsWith(`${y}-${m}`)) return false;
      }
      if (fy) {
        if (!it.date.startsWith(String(fy))) return false;
      }
      return true;
    });
  };

  // Render functions
  const renderTable = (items) => {
    tableBody.innerHTML = '';
    if (!items.length) {
      tableBody.innerHTML = '<tr><td colspan="6" style="opacity:.6;padding:18px">Nenhum lançamento encontrado.</td></tr>';
      return;
    }
    items.sort((a,b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    for (const it of items) {
      const tr = document.createElement('tr');
      const total = unitValue(it.plan) * it.qty;
      tr.innerHTML = `
        <td>${it.date}</td>
        <td>${planLabel(it.plan)}</td>
        <td>${it.qty}</td>
        <td>${unitValue(it.plan) === 0 ? '-' : unitValue(it.plan).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>
        <td>${unitValue(it.plan) === 0 ? '-' : total.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>
        <td class="actions">
          <button data-id="${it.id}" class="btn small del">Excluir</button>
        </td>
      `;
      tableBody.appendChild(tr);
    }

    // attach delete
    tableBody.querySelectorAll('.del').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        if (!confirm('Deseja excluir esse lançamento?')) return;
        const cur = readStore().filter(x => x.id !== id);
        writeStore(cur);
        refreshUI();
      });
    });
  };

  const computeTotals = (items) => {
    const sums = {
      dayCount: 0,
      monthCount: 0,
      yearCount: 0,
      byPlanThisMonth: {}
    };
    const now = new Date();
    const nowDay = now.toISOString().slice(0,10);
    const nowMonth = now.toISOString().slice(0,7);
    const nowYear = now.getFullYear();

    for (const it of items) {
      const monthKey = it.date.slice(0,7);
      const yearKey = it.date.slice(0,4);

      // day
      if (it.date === nowDay) sums.dayCount += it.qty;
      // month
      if (monthKey === nowMonth) sums.monthCount += it.qty;
      // year
      if (Number(yearKey) === nowYear) sums.yearCount += it.qty;

      // by plan this month (for pie)
      if (!sums.byPlanThisMonth[it.plan]) sums.byPlanThisMonth[it.plan] = 0;
      if (monthKey === nowMonth) sums.byPlanThisMonth[it.plan] += it.qty;
    }
    return sums;
  };

  const renderTopCards = (sums) => {
    totalDayEl.textContent = sums.dayCount.toLocaleString('pt-BR');
    totalMonthEl.textContent = sums.monthCount.toLocaleString('pt-BR');
    totalYearEl.textContent = sums.yearCount.toLocaleString('pt-BR');
  };

  const renderPie = (byPlanObj) => {
    const labels = [];
    const data = [];
    const bg = [];

    const order = ['30','25','21.5','20','10','free']; // consistent ordering
    for (const key of order) {
      const v = byPlanObj[key] || 0;
      labels.push(planLabel(key));
      data.push(v);
      // colors matched to gradient
      switch(key){
        case '30': bg.push('rgba(0,123,255,0.9)'); break;
        case '25': bg.push('rgba(139,60,255,0.9)'); break;
        case '21.5': bg.push('rgba(167,93,255,0.85)'); break;
        case '20': bg.push('rgba(72,150,255,0.9)'); break;
        case '10': bg.push('rgba(0,200,255,0.9)'); break;
        case 'free': bg.push('rgba(255,42,136,0.9)'); break;
        default: bg.push('rgba(200,200,200,0.9)');
      }
    }

    const ctx = document.getElementById('planPie').getContext('2d');
    if (pieChart) pieChart.destroy();
    pieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels, datasets: [{ data, backgroundColor: bg }]
      },
      options: {
        plugins: { legend: { position: 'bottom' } },
        responsive: true,
        maintainAspectRatio: false
      }
    });
  };

  const renderLine = (allItems) => {
    // build last 30 days labels and aggregated counts
    const days = 30;
    const labels = [];
    const counts = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0,10);
      labels.push(d.toLocaleDateString('pt-BR'));
      const sum = allItems.reduce((acc, it) => it.date === key ? acc + it.qty : acc, 0);
      counts.push(sum);
    }

    const ctx = document.getElementById('timeLine').getContext('2d');
    if (lineChart) lineChart.destroy();
    lineChart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ label: 'Ativações', data: counts, fill: true, tension: 0.25 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } },
          y: { beginAtZero: true }
        }
      }
    });
  };

  // Refresh UI from store with current filters
  const refreshUI = () => {
    const all = readStore();
    const filtered = applyFilters(all);

    const sums = computeTotals(all); // compute totals from all items (not filtered)
    renderTopCards(sums);
    renderPie(sums.byPlanThisMonth);
    renderLine(all);
    renderTable(filtered);
  };

  // Form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const plan = planSelect.value;
    const qty = Number(qtyInput.value) || 0;
    const date = dateInput.value;
    if (!date || qty <= 0) {
      alert('Preencha a data e quantidade corretamente.');
      return;
    }
    const cur = readStore();
    cur.push({ id: uid(), date, plan, qty });
    writeStore(cur);
    form.reset();
    dateInput.value = today();
    qtyInput.value = 1;
    refreshUI();
  });

  clearBtn.addEventListener('click', () => {
    form.reset();
    dateInput.value = today();
    qtyInput.value = 1;
  });

  applyFiltersBtn.addEventListener('click', () => refreshUI());
  resetFiltersBtn.addEventListener('click', () => {
    filterDate.value = '';
    filterMonth.value = '';
    filterYear.value = '';
    refreshUI();
  });

  // Export / Import
  exportBtn.addEventListener('click', () => {
    const data = readStore();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `live-tv-activations-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  importJsonBtn.addEventListener('click', () => importJsonInput.click());
  importJsonInput.addEventListener('change', (ev) => {
    const f = ev.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!Array.isArray(parsed)) throw new Error('Formato inválido');
        // basic validation
        const ok = parsed.every(x => x.id && x.date && x.plan && Number(x.qty) >= 0);
        if (!ok) throw new Error('Estrutura incorreta');
        // merge with existing (keeps unique ids)
        const existing = readStore();
        const merged = [...existing];
        for (const item of parsed) {
          if (!existing.some(e => e.id === item.id)) merged.push(item);
        }
        writeStore(merged);
        refreshUI();
        alert('Importação concluída.');
      } catch (err) {
        alert('Erro ao importar JSON: ' + err.message);
      }
    };
    reader.readAsText(f);
    ev.target.value = '';
  });

  // keyboard shortcut: "n" to focus qty
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'n' && document.activeElement.tagName.toLowerCase() !== 'input') {
      qtyInput.focus();
    }
  });

  // initial
  ensureSample();
  refreshUI();
})();