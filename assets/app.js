// מציג את האתר מתוך content.json. את התוכן עורכים ב-admin.html או ישירות בקובץ.
(() => {
  const DRAFT_KEY = 'site-draft';
  const isPreview = new URLSearchParams(location.search).has('preview');

  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // **מודגש** ושורות חדשות
  // "ל-M36" לא נשבר בין שורות
  const fmt = (s) => esc(s)
    .replace(/(^|[\s(])([\u05D0-\u05EA]{1,3}-[^\s<]+)/g, '$1<span style="white-space:nowrap">$2</span>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  const safeUrl = (u) => {
    u = String(u ?? '').trim();
    if (!u) return '';
    return /^[a-z][a-z0-9+.-]*:/i.test(u) && !/^(https?|mailto|tel):/i.test(u) ? '' : u;
  };
  const shown = (sec) => sec && sec.show !== false;
  const isExternal = (u) => /^https?:/i.test(u) && !u.startsWith(location.origin);
  const linkAttrs = (u) => `href="${esc(u)}"${isExternal(u) ? ' target="_blank" rel="noopener"' : ''}`;

  function sectionHead(sec) {
    return `<div class="section-head">
      ${sec.eyebrow ? `<span class="eyebrow">${fmt(sec.eyebrow)}</span>` : ''}
      <h2 class="section-title">${fmt(sec.title)}</h2>
      ${sec.intro ? `<p class="section-intro">${fmt(sec.intro)}</p>` : ''}
    </div>`;
  }

  function iconOrImage(item) {
    const img = safeUrl(item.image);
    if (img) return `<img class="card-img" src="${esc(img)}" alt="" loading="lazy">`;
    return `<span class="card-icon" aria-hidden="true">${fmt(item.icon || '✦')}</span>`;
  }

  function hero(h, site) {
    const btn = (b, cls) => b && b.text ? `<a class="btn ${cls}" ${linkAttrs(safeUrl(b.link) || '#')}>${fmt(b.text)}</a>` : '';
    const stats = (h.stats || []).filter((s) => s.value || s.label);
    const now = new Date();
    const time = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
    const date = now.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
    return `<section class="hero" id="top">
      <div class="container hero-grid">
        <div>
          ${h.badge ? `<span class="badge">${fmt(h.badge)}</span>` : ''}
          <h1>${fmt(h.title)}</h1>
          ${h.subtitle ? `<p class="hero-sub">${fmt(h.subtitle)}</p>` : ''}
          <div class="hero-actions">${btn(h.primaryButton, 'btn-primary')}${btn(h.secondaryButton, 'btn-ghost')}</div>
          ${stats.length ? `<div class="stats">${stats.map((s) => `
            <div class="stat"><div class="stat-value">${fmt(s.value)}</div><div class="stat-label">${fmt(s.label)}</div></div>`).join('')}
          </div>` : ''}
        </div>
        <div class="phone-wrap" aria-hidden="true">
          <div class="phone"><div class="phone-screen">
            <div class="phone-status"><span>${fmt(time)}</span><span>4G ▮▮▮</span></div>
            <div class="phone-clock">${fmt(time)}</div>
            <div class="phone-date">${fmt(date)}</div>
            <div class="face">
              <svg viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 15V10a4 4 0 0 1 4-4h5M33 6h5a4 4 0 0 1 4 4v5M42 33v5a4 4 0 0 1-4 4h-5M15 42h-5a4 4 0 0 1-4-4v-5"/>
                <path d="M17 19v3M31 19v3M24 19v8h-2M18 32c3.5 3 8.5 3 12 0"/>
              </svg>
            </div>
            <div class="phone-hint">הביטו במסך לפתיחה</div>
            <div class="phone-os">ANDROID 16 · ${esc(site.name || '')}</div>
          </div></div>
        </div>
      </div>
    </section>`;
  }

  function m36(s, alt) {
    const gallery = (s.gallery || []).filter((g) => safeUrl(g.image));
    return `<section class="section${alt ? ' section-alt' : ''}" id="m36"><div class="container">
      ${sectionHead(s)}
      <div class="grid">${(s.features || []).map((f) => `
        <article class="card feature">
          ${iconOrImage(f)}
          <div><h3>${fmt(f.title)}</h3>${f.text ? `<p>${fmt(f.text)}</p>` : ''}</div>
        </article>`).join('')}
      </div>
      ${gallery.length ? `<div class="gallery">${gallery.map((g) => `
        <figure><img src="${esc(safeUrl(g.image))}" alt="${esc(g.caption)}" loading="lazy">${g.caption ? `<figcaption>${fmt(g.caption)}</figcaption>` : ''}</figure>`).join('')}
      </div>` : ''}
    </div></section>`;
  }

  function cards(s, id, alt) {
    return `<section class="section${alt ? ' section-alt' : ''}" id="${id}"><div class="container">
      ${sectionHead(s)}
      <div class="grid grid-wide">${(s.items || []).map((it) => {
        const link = safeUrl(it.link), code = safeUrl(it.code), cover = safeUrl(it.cover);
        const actions = [
          link ? `<a class="btn btn-primary btn-sm" ${linkAttrs(link)}>${fmt(it.linkText || 'לפרטים')}</a>` : '',
          code ? `<a class="btn btn-ghost btn-sm" ${linkAttrs(code)}>קוד ב-GitHub</a>` : '',
        ].join('');
        return `<article class="card">
          ${cover ? `<div class="card-cover"><img src="${esc(cover)}" alt="" loading="lazy"></div>` : ''}
          <div class="card-head">${iconOrImage(it)}<h3>${fmt(it.name)}</h3></div>
          ${it.text ? `<p>${fmt(it.text)}</p>` : ''}
          ${(it.tags || []).length ? `<div class="tags">${it.tags.map((t) => `<span class="tag">${fmt(t)}</span>`).join('')}</div>` : ''}
          ${actions ? `<div class="card-actions">${actions}</div>` : ''}
        </article>`;
      }).join('')}
      </div>
    </div></section>`;
  }

  function steps(s, alt) {
    return `<section class="section${alt ? ' section-alt' : ''}" id="how"><div class="container">
      ${sectionHead(s)}
      <div class="steps">${(s.items || []).map((st, i) => `
        <div class="step"><span class="step-num">${i + 1}</span><h3>${fmt(st.title)}</h3>${st.text ? `<p>${fmt(st.text)}</p>` : ''}</div>`).join('')}
      </div>
    </div></section>`;
  }

  function faq(s, alt) {
    return `<section class="section${alt ? ' section-alt' : ''}" id="faq"><div class="container">
      ${sectionHead(s)}
      <div class="faq">${(s.items || []).map((q) => `
        <details><summary>${fmt(q.q)}</summary><p>${fmt(q.a)}</p></details>`).join('')}
      </div>
    </div></section>`;
  }

  function order(o, alt) {
    const versions = (o.versions || []).filter(Boolean);
    const extras = (o.extras || []).filter(Boolean);
    const hasWa = !!waNumber(o.whatsapp), hasMail = !!String(o.email || '').trim();
    return `<section class="section${alt ? ' section-alt' : ''}" id="order"><div class="container">
      <div class="order-card">
        <div class="order-aside">
          ${o.eyebrow ? `<span class="eyebrow">${fmt(o.eyebrow)}</span>` : ''}
          <h2 class="section-title">${fmt(o.title)}</h2>
          ${o.intro ? `<p class="section-intro">${fmt(o.intro)}</p>` : ''}
          ${extras.length ? `<ul class="order-points">${extras.slice(0, 4).map((e) => `<li>${fmt(e)}</li>`).join('')}</ul>` : ''}
        </div>
        <form class="form" id="order-form" novalidate>
          <div class="form-row">
            <label class="field"><span>שם מלא</span><input name="name" autocomplete="name" required></label>
            <label class="field"><span>טלפון</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" dir="ltr" required></label>
          </div>
          <label class="field"><span>דגם המכשיר</span><input name="device" value="${esc(o.deviceDefault || '')}"></label>
          ${versions.length ? `<fieldset class="fieldset"><legend>${fmt(o.versionLabel || 'גרסה')}</legend><div class="choices">
            ${versions.map((v, i) => `<label class="choice"><input type="radio" name="version" value="${esc(v)}"${i === 0 ? ' checked' : ''}><span>${fmt(v)}</span></label>`).join('')}
          </div></fieldset>` : ''}
          ${extras.length ? `<fieldset class="fieldset"><legend>${fmt(o.extrasLabel || 'תוספות')}</legend><div class="choices">
            ${extras.map((v) => `<label class="choice"><input type="checkbox" name="extras" value="${esc(v)}" checked><span>${fmt(v)}</span></label>`).join('')}
          </div></fieldset>` : ''}
          <label class="field"><span>הערות</span><textarea name="notes" placeholder="כל מה שחשוב שאדע"></textarea></label>
          <div class="form-actions">
            ${hasWa ? `<button class="btn btn-wa" type="submit" data-via="wa">שליחה בוואטסאפ</button>` : ''}
            ${hasMail ? `<button class="btn ${hasWa ? 'btn-ghost' : 'btn-primary'}" type="submit" data-via="mail">שליחה במייל</button>` : ''}
            <button class="btn btn-ghost" type="submit" data-via="copy">העתקת ההזמנה</button>
          </div>
          <p class="form-note" id="order-note" role="status">${hasWa || hasMail ? '' : 'העתיקו את ההזמנה ושלחו אותה אליי.'}</p>
        </form>
      </div>
    </div></section>`;
  }

  // 050-1234567 → 972501234567
  function waNumber(n) {
    let d = String(n || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.startsWith('00')) d = d.slice(2);
    if (d.startsWith('0')) d = '972' + d.slice(1);
    return d;
  }

  function bindOrder(o) {
    const form = $('#order-form');
    if (!form) return;
    const note = $('#order-note');
    const setNote = (text, cls = '') => { note.textContent = text; note.className = 'form-note ' + cls; };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const via = e.submitter?.dataset.via || 'copy';
      const fd = new FormData(form);
      const name = String(fd.get('name') || '').trim();
      const phone = String(fd.get('phone') || '').trim();
      if (!name || !phone) {
        setNote('נא למלא שם וטלפון.', 'err');
        (name ? form.phone : form.name).focus();
        return;
      }
      const lines = [
        o.messageTitle || 'הזמנה מהאתר',
        `שם: ${name}`,
        `טלפון: ${phone}`,
        fd.get('device') ? `מכשיר: ${fd.get('device')}` : '',
        fd.get('version') ? `גרסה: ${fd.get('version')}` : '',
        fd.getAll('extras').length ? `תוספות: ${fd.getAll('extras').join(', ')}` : '',
        fd.get('notes') ? `הערות: ${fd.get('notes')}` : '',
      ].filter(Boolean);
      const text = lines.join('\n');
      if (via === 'wa') {
        window.open(`https://wa.me/${waNumber(o.whatsapp)}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
        setNote(o.successText || 'ההזמנה מוכנה לשליחה.', 'ok');
      } else if (via === 'mail') {
        location.href = `mailto:${encodeURIComponent(String(o.email).trim())}?subject=${encodeURIComponent(o.messageTitle || 'הזמנה מהאתר')}&body=${encodeURIComponent(text)}`;
        setNote(o.successText || 'ההזמנה מוכנה לשליחה.', 'ok');
      } else {
        try {
          await navigator.clipboard.writeText(text);
          setNote('ההזמנה הועתקה. אפשר להדביק ולשלוח.', 'ok');
        } catch {
          window.prompt('העתיקו את ההזמנה:', text);
        }
      }
    });
  }

  function render(c) {
    const site = c.site || {};
    document.title = site.title || site.name || '';
    $('meta[name="description"]').setAttribute('content', site.description || '');
    if (site.accent) document.documentElement.style.setProperty('--accent', site.accent);
    $('#brand-name').textContent = site.name || '';
    $('#brand-logo').textContent = site.logo || '★';

    const blocks = [];
    const nav = [];
    if (shown(c.hero)) blocks.push(hero(c.hero, site));
    let alt = true; // רקע לסירוגין בין האזורים
    const add = (key, id, fn) => {
      const s = c[key];
      if (!shown(s)) return;
      blocks.push(fn(s, alt));
      if (key !== 'order') nav.push({ id, label: s.navLabel || s.title });
      alt = !alt;
    };
    add('m36', 'm36', (s, a) => m36(s, a));
    add('apps', 'apps', (s, a) => cards(s, 'apps', a));
    add('projects', 'projects', (s, a) => cards(s, 'projects', a));
    add('steps', 'how', (s, a) => steps(s, a));
    add('faq', 'faq', (s, a) => faq(s, a));
    add('order', 'order', (s, a) => order(s, a));
    $('#main').innerHTML = blocks.join('');

    const navEl = $('#nav');
    navEl.innerHTML = nav.map((n) => `<a href="#${n.id}">${fmt(n.label)}</a>`).join('') +
      (shown(c.order) ? `<a class="nav-cta" href="#order">${fmt(c.order.navLabel || 'הזמנה')}</a>` : '');

    const f = c.footer || {};
    const gh = safeUrl(site.github);
    $('#footer').innerHTML = `<span>© ${new Date().getFullYear()} ${esc(site.name)}${f.text ? ' · ' + esc(f.text) : ''}</span>
      ${gh ? `<a ${linkAttrs(gh)}>GitHub</a>` : ''}`;

    if (shown(c.order)) bindOrder(c.order);
  }

  // תפריט במובייל
  const menuBtn = $('#menu-btn'), navEl = $('#nav');
  const closeMenu = () => { navEl.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); };
  menuBtn.addEventListener('click', () => {
    const open = !navEl.classList.contains('open');
    navEl.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  navEl.addEventListener('click', (e) => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  async function load() {
    if (isPreview) {
      try {
        const d = localStorage.getItem(DRAFT_KEY);
        if (d) return JSON.parse(d);
      } catch { /* אין גישה ל-localStorage */ }
    }
    const r = await fetch('content.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  load().then(render).catch((err) => {
    $('#main').innerHTML = `<div class="loading">לא הצלחתי לטעון את התוכן (${esc(err.message)}).</div>`;
  });

  if (isPreview) {
    document.body.insertAdjacentHTML('beforeend', '<div class="preview-banner">תצוגה מקדימה</div>');
    // עדכון חי מעמוד העריכה
    window.addEventListener('message', (e) => {
      if (e.origin !== location.origin || e.data?.type !== 'preview') return;
      const y = window.scrollY;
      render(e.data.content);
      window.scrollTo(0, y);
    });
  }
})();
