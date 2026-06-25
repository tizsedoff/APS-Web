// ===========================================
// Asistente de APS — chatbot basado en reglas
// 100% local, sin APIs externas, sin costo.
// ===========================================

const WHATSAPP_NUMBER = '543755301413';

const chatWidget = document.getElementById('chatWidget');
const chatToggle = document.getElementById('chatToggle');
const chatPanel = document.getElementById('chatPanel');
const chatBody = document.getElementById('chatBody');
const chatQuick = document.getElementById('chatQuick');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');

let chatOpened = false;

// ---------- Open / close ----------
chatToggle.addEventListener('click', () => {
  const isOpen = chatPanel.classList.toggle('open');
  chatWidget.classList.toggle('open', isOpen);
  if (isOpen && !chatOpened) {
    chatOpened = true;
    bootChat();
  }
  if (isOpen) chatInput.focus();
});

// ---------- Message rendering ----------
function addMessage(text, sender = 'bot') {
  const wrap = document.createElement('div');
  wrap.className = `chat-msg chat-msg-${sender}`;
  wrap.innerHTML = text;
  chatBody.appendChild(wrap);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function addTyping() {
  const wrap = document.createElement('div');
  wrap.className = 'chat-msg chat-msg-bot chat-typing';
  wrap.id = 'chatTyping';
  wrap.innerHTML = '<span></span><span></span><span></span>';
  chatBody.appendChild(wrap);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById('chatTyping');
  if (t) t.remove();
}

function botSay(text, delay = 550) {
  return new Promise(resolve => {
    addTyping();
    setTimeout(() => {
      removeTyping();
      addMessage(text, 'bot');
      resolve();
    }, delay);
  });
}

// ---------- Quick reply buttons ----------
function setQuickReplies(options) {
  chatQuick.innerHTML = '';
  if (!options || !options.length) return;
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'chat-quick-btn';
    btn.textContent = opt.label;
    btn.addEventListener('click', () => handleUserChoice(opt));
    chatQuick.appendChild(btn);
  });
}

function clearQuickReplies() {
  chatQuick.innerHTML = '';
}

// ---------- Knowledge base ----------
const KB = {
  servicios: {
    label: 'Servicios',
    keywords: ['servicio', 'hacen', 'haces', 'ofrecen', 'ofreces', 'que hace', 'que hacen'],
    reply: `Construyo <strong>sitios institucionales</strong>, <strong>tiendas online</strong>, <strong>landing pages</strong> y herramientas con <strong>IA integrada</strong> (chatbots como este, automatizaciones, etc). También doy soporte y mantenimiento después de la entrega.`,
    follow: [
      { label: 'Ver precios', next: 'precios' },
      { label: 'Ver portfolio', next: 'portfolio' }
    ]
  },
  precios: {
    label: 'Precios',
    keywords: ['precio', 'cuesta', 'cuanto', 'cuánto', 'vale', 'presupuesto', 'cotiza', 'plata', 'dinero', 'pago'],
    reply: `Los precios varían según el tipo de proyecto, cantidad de secciones y funcionalidades extra. Lo más rápido es usar la <strong>calculadora interactiva</strong> de la página: armás tu combinación y te tira una estimación al instante.`,
    action: { label: 'Ir a la calculadora', type: 'scroll', target: '#calculadora' },
    follow: [
      { label: 'Hablar por WhatsApp', next: 'whatsapp' }
    ]
  },
  portfolio: {
    label: 'Portfolio',
    keywords: ['portfolio', 'proyecto', 'trabajo', 'ejemplo', 'ejemplos', 'hiciste', 'hiciste antes'],
    reply: `Tengo 3 proyectos reales en producción: <strong>ReBien Boutique</strong> (tienda de moda), <strong>LUVAR</strong> (landing para gimnasio) y <strong>Mecánica Sedoff</strong> (sitio institucional para taller). Los podés ver en la sección de portfolio.`,
    action: { label: 'Ver portfolio', type: 'scroll', target: '#portfolio' },
    follow: [
      { label: 'Ver precios', next: 'precios' }
    ]
  },
  tiempos: {
    label: 'Tiempos de entrega',
    keywords: ['tiempo', 'demora', 'tarda', 'cuando', 'cuándo', 'entrega', 'rapido', 'rápido', 'urgente'],
    reply: `Depende de la complejidad: una landing simple puede estar lista en pocos días, un proyecto más grande lleva más tiempo. Si necesitás algo urgente, hay una opción de <strong>entrega prioritaria</strong> en la calculadora.`,
    follow: [
      { label: 'Ir a la calculadora', next: 'precios' }
    ]
  },
  ia: {
    label: 'IA y automatizaciones',
    keywords: ['ia', 'inteligencia artificial', 'chatbot', 'bot', 'automatizacion', 'automatización', 'automatizaciones'],
    reply: `La IA se integra donde realmente suma: chatbots como este (gratis, sin depender de APIs pagas), respuestas automáticas, conexión entre WhatsApp/mail/planillas, generación de contenido, etc. Se evalúa caso por caso según tu negocio.`,
    follow: [
      { label: 'Ver servicios', next: 'servicios' }
    ]
  },
  contacto: {
    label: 'Contacto',
    keywords: ['contacto', 'whatsapp', 'hablar', 'llamar', 'telefono', 'teléfono', 'escribir', 'consultar'],
    reply: `Lo más directo es WhatsApp — respondo personalmente, sin intermediarios.`,
    action: { label: 'Escribir por WhatsApp', type: 'whatsapp' }
  },
  saludo: {
    label: 'Saludo',
    keywords: ['hola', 'buenas', 'buen dia', 'buen día', 'que tal', 'qué tal', 'hey'],
    reply: `¡Hola! 👋 Soy el asistente de APS. Puedo contarte sobre servicios, precios, tiempos de entrega o mostrarte el portfolio. ¿Qué te gustaría saber?`
  }
};

const FALLBACK_REPLY = `No tengo una respuesta puntual para eso —soy un asistente simple, no un modelo de lenguaje completo. Pero puedo derivarte directo con Tiziano (el desarrollador) por WhatsApp para que te responda personalmente.`;

function findIntent(text) {
  const normalized = text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // remove accents for matching
  for (const key in KB) {
    const entry = KB[key];
    const hit = entry.keywords && entry.keywords.some(kw => {
      const kwNorm = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return normalized.includes(kwNorm);
    });
    if (hit) return key;
  }
  return null;
}

function whatsappLink(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function renderAction(action) {
  if (!action) return;
  if (action.type === 'scroll') {
    const link = document.createElement('a');
    link.href = action.target;
    link.className = 'chat-action-btn';
    link.textContent = action.label;
    link.addEventListener('click', () => {
      chatPanel.classList.remove('open');
      chatWidget.classList.remove('open');
    });
    chatBody.appendChild(link);
  } else if (action.type === 'whatsapp') {
    const link = document.createElement('a');
    link.href = whatsappLink('Hola APS, tengo una consulta.');
    link.target = '_blank';
    link.rel = 'noopener';
    link.className = 'chat-action-btn';
    link.textContent = action.label;
    chatBody.appendChild(link);
  }
  chatBody.scrollTop = chatBody.scrollHeight;
}

async function respondToIntent(key) {
  if (key === 'whatsapp') {
    await botSay('Te dejo el link directo:');
    renderAction({ label: 'Escribir por WhatsApp', type: 'whatsapp' });
    clearQuickReplies();
    return;
  }

  const entry = KB[key];
  await botSay(entry.reply);
  if (entry.action) renderAction(entry.action);

  if (entry.follow && entry.follow.length) {
    setQuickReplies(entry.follow.map(f => ({ label: f.label, next: f.next })));
  } else {
    setQuickReplies([
      { label: 'Ver más temas', next: '__menu' }
    ]);
  }
}

function handleUserChoice(opt) {
  if (opt.next === '__menu') {
    addMessage('Ver más temas', 'user');
    showMainMenu();
    return;
  }
  addMessage(opt.label, 'user');
  clearQuickReplies();
  respondToIntent(opt.next);
}

function showMainMenu() {
  setQuickReplies([
    { label: 'Servicios', next: 'servicios' },
    { label: 'Precios', next: 'precios' },
    { label: 'Portfolio', next: 'portfolio' },
    { label: 'Tiempos de entrega', next: 'tiempos' },
    { label: 'Hablar con Tiziano', next: 'whatsapp' }
  ]);
}

async function bootChat() {
  await botSay('¡Hola! Soy el asistente de APS 👋');
  await botSay('Respondo preguntas frecuentes sobre el servicio. Elegí un tema o escribí tu consulta.');
  showMainMenu();
}

// ---------- Free text input ----------
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  addMessage(escapeHtml(text), 'user');
  chatInput.value = '';
  clearQuickReplies();

  const intent = findIntent(text);
  if (intent) {
    await respondToIntent(intent);
  } else {
    await botSay(FALLBACK_REPLY);
    renderAction({ label: 'Escribir por WhatsApp', type: 'whatsapp' });
    setQuickReplies([{ label: 'Ver temas frecuentes', next: '__menu' }]);
  }
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
