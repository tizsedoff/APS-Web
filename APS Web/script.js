// ===== Mobile nav toggle =====
const navToggle = document.getElementById('navToggle');
const navLinks = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ===== Calculator =====
const calcGroups = document.querySelectorAll('.calc-options');
const receiptLines = document.getElementById('receiptLines');
const receiptTotal = document.getElementById('receiptTotal');
const whatsappBtn = document.getElementById('whatsappBtn');

const labels = {
  landing: 'Landing page',
  institucional: 'Sitio institucional',
  ecommerce: 'Tienda online',
  webapp: 'Web app a medida',
  '1-3': '1–3 secciones',
  '4-6': '4–6 secciones',
  '7+': '7+ secciones',
  ia: 'Chatbot / IA integrada',
  auto: 'Automatizaciones',
  admin: 'Panel de administración',
  pagos: 'Pagos online',
  multi: 'Multiidioma',
  seo: 'SEO avanzado',
  estandar: 'Entrega estándar',
  urgente: 'Entrega urgente'
};

const selections = {
  tipo: null,
  paginas: null,
  features: new Set(),
  tiempo: null
};

const prices = {};

calcGroups.forEach(group => {
  const groupName = group.dataset.group;
  const mode = group.dataset.mode;

  group.querySelectorAll('.calc-opt').forEach(opt => {
    prices[opt.dataset.value] = parseInt(opt.dataset.price, 10);

    opt.addEventListener('click', () => {
      if (mode === 'single') {
        group.querySelectorAll('.calc-opt').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        selections[groupName] = opt.dataset.value;
      } else {
        opt.classList.toggle('active');
        if (opt.classList.contains('active')) {
          selections[groupName].add(opt.dataset.value);
        } else {
          selections[groupName].delete(opt.dataset.value);
        }
      }
      renderReceipt();
    });
  });
});

function formatARS(n) {
  return '$ ' + n.toLocaleString('es-AR');
}

function renderReceipt() {
  const lines = [];

  if (selections.tipo) lines.push({ key: selections.tipo });
  if (selections.paginas && prices[selections.paginas] > 0) lines.push({ key: selections.paginas });
  selections.features.forEach(f => lines.push({ key: f }));
  if (selections.tiempo === 'urgente') lines.push({ key: 'urgente' });

  if (lines.length === 0) {
    receiptLines.innerHTML = '<p class="receipt-empty">Elegí las opciones para ver tu estimación</p>';
    receiptTotal.textContent = '$ 0';
    updateWhatsappLink(0, []);
    return;
  }

  let total = 0;
  receiptLines.innerHTML = lines.map(({ key }) => {
    const price = prices[key] || 0;
    total += price;
    const priceText = price > 0 ? formatARS(price) : 'incl.';
    return `<div class="receipt-line"><span>${labels[key]}</span><span>${priceText}</span></div>`;
  }).join('');

  // base price floor if no tipo selected but other things are
  receiptTotal.textContent = formatARS(total);
  updateWhatsappLink(total, lines.map(l => labels[l.key]));
}

function updateWhatsappLink(total, lineLabels) {
  const parts = ['Hola APS, quiero cotizar un proyecto con estas características:'];
  if (lineLabels.length) {
    parts.push(...lineLabels.map(l => `- ${l}`));
  }
  if (total > 0) {
    parts.push('', `Total estimado: ${formatARS(total)}`);
  }
  const message = encodeURIComponent(parts.join('\n'));
  whatsappBtn.href = `https://wa.me/543755301413?text=${message}`;
}

renderReceipt();
