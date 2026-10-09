// עמוד עריכה: טופס שנבנה מהסכמה שלמטה, תצוגה מקדימה חיה, ושמירה ל-GitHub דרך ה-API.
(() => {
  const DRAFT_KEY = 'site-draft';          // מה שהתצוגה המקדימה קוראת
  const UNSAVED_KEY = 'site-admin-unsaved'; // שינויים שלא נשמרו, לשחזור
  const GH_KEY = 'site-admin-gh';
  const FILE = 'content.json';

  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else if (k in n && typeof v !== 'string') n[k] = v;
      else n.setAttribute(k, v === true ? '' : v);
    }
    n.append(...kids.flat().filter((k) => k != null && k !== false));
    return n;
  };
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const store = {
    get(k, session) { try { return (session ? sessionStorage : localStorage).getItem(k); } catch { return null; } },
    set(k, v, session) { try { (session ? sessionStorage : localStorage).setItem(k, v); } catch { /* חסום */ } },
    del(k) { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch { /* חסום */ } },
  };

  // ===== סכמה: מה אפשר לערוך =====
  const T = (key, label, more) => ({ key, label, type: 'text', ...more });
  const TA = (key, label, more) => ({ key, label, type: 'textarea', ...more });
  const IMG = (key, label, more) => ({ key, label, type: 'image', ...more });
  const head = [T('navLabel', 'שם בתפריט'), T('eyebrow', 'כותרת קטנה'), T('title', 'כותרת'), TA('intro', 'טקסט פתיחה', { rows: 2 })];
  const cardFields = [
    { type: 'row', fields: [T('icon', 'אייקון (אימוג׳י)'), T('name', 'שם')] },
    TA('text', 'תיאור'),
    { key: 'tags', label: 'תגיות', type: 'tags', hint: 'מופרדות בפסיק' },
    { type: 'row', fields: [T('link', 'קישור', { dir: 'ltr' }), T('linkText', 'טקסט הכפתור', { placeholder: 'לפרטים' })] },
    IMG('image', 'תמונת אייקון (במקום האימוג׳י)'),
  ];
  const SCHEMA = [
    { key: 'site', title: 'הגדרות כלליות', fields: [
      { type: 'row', fields: [T('name', 'שם / מותג'), T('logo', 'לוגו (אות או אימוג׳י)')] },
      { key: 'accent', label: 'צבע ראשי', type: 'color' },
      T('title', 'כותרת בלשונית הדפדפן'),
      TA('description', 'תיאור קצר (לגוגל ולשיתוף)', { rows: 2 }),
      T('github', 'קישור ל-GitHub בתחתית', { dir: 'ltr' }),
    ] },
    { key: 'hero', title: 'פתיח (ראש העמוד)', toggle: true, fields: [
      T('badge', 'תגית מעל הכותרת'),
      TA('title', 'כותרת ראשית', { rows: 2 }),
      TA('subtitle', 'טקסט מתחת לכותרת'),
      { key: 'primaryButton', label: 'כפתור ראשי', type: 'group', fields: [{ type: 'row', fields: [T('text', 'טקסט'), T('link', 'קישור', { dir: 'ltr', hint: '#order = טופס ההזמנה' })] }] },
      { key: 'secondaryButton', label: 'כפתור משני', type: 'group', fields: [{ type: 'row', fields: [T('text', 'טקסט'), T('link', 'קישור', { dir: 'ltr' })] }] },
      { key: 'stats', label: 'מספרים מודגשים', type: 'list', titleKey: 'label', add: 'הוספת מספר', blank: { value: '', label: '' },
        fields: [{ type: 'row', fields: [T('value', 'מספר / מילה'), T('label', 'הסבר')] }] },
    ] },
    { key: 'm36', title: 'הגרסה ל-M36', toggle: true, fields: [
      ...head,
      { key: 'features', label: 'תכונות', type: 'list', titleKey: 'title', add: 'הוספת תכונה', blank: { icon: '✨', title: '', text: '' },
        fields: [{ type: 'row', fields: [T('icon', 'אייקון (אימוג׳י)'), T('title', 'כותרת')] }, TA('text', 'הסבר', { rows: 2 })] },
      { key: 'gallery', label: 'צילומי מסך', type: 'list', titleKey: 'caption', add: 'הוספת צילום מסך', blank: { image: '', caption: '' },
        fields: [IMG('image', 'תמונה'), T('caption', 'כיתוב')] },
    ] },
    { key: 'apps', title: 'אפליקציות', toggle: true, fields: [
      ...head,
      { key: 'items', label: 'אפליקציות', type: 'list', titleKey: 'name', add: 'הוספת אפליקציה',
        blank: { icon: '📱', image: '', name: '', text: '', tags: [], link: '', linkText: '' }, fields: cardFields },
    ] },
    { key: 'projects', title: 'פרויקטים ודוגמאות', toggle: true, fields: [
      ...head,
      { key: 'items', label: 'פרויקטים', type: 'list', titleKey: 'name', add: 'הוספת פרויקט',
        blank: { icon: '🧩', image: '', name: '', text: '', tags: [], link: '', linkText: 'לאתר', code: '' },
        fields: [...cardFields, T('code', 'קישור לקוד (GitHub)', { dir: 'ltr' }), IMG('cover', 'תמונה גדולה בראש הכרטיס')] },
    ] },
    { key: 'steps', title: 'איך מזמינים', toggle: true, fields: [
      T('navLabel', 'שם בתפריט'), T('eyebrow', 'כותרת קטנה'), T('title', 'כותרת'),
      { key: 'items', label: 'שלבים', type: 'list', titleKey: 'title', add: 'הוספת שלב', blank: { title: '', text: '' },
        fields: [T('title', 'כותרת'), TA('text', 'הסבר', { rows: 2 })] },
    ] },
    { key: 'faq', title: 'שאלות נפוצות', toggle: true, fields: [
      T('navLabel', 'שם בתפריט'), T('eyebrow', 'כותרת קטנה'), T('title', 'כותרת'),
      { key: 'items', label: 'שאלות', type: 'list', titleKey: 'q', add: 'הוספת שאלה', blank: { q: '', a: '' },
        fields: [T('q', 'שאלה'), TA('a', 'תשובה', { rows: 3 })] },
    ] },
    { key: 'order', title: 'טופס הזמנה', toggle: true, fields: [
      { type: 'row', fields: [T('whatsapp', 'מספר וואטסאפ', { dir: 'ltr', placeholder: '050-0000000', hint: 'ההזמנות יגיעו לכאן' }), T('email', 'מייל להזמנות', { dir: 'ltr', placeholder: 'name@example.com' })] },
      ...head,
      T('deviceDefault', 'דגם ברירת מחדל'),
      T('versionLabel', 'שאלת הגרסה'),
      { key: 'versions', label: 'אפשרויות גרסה', type: 'strings', add: 'הוספת גרסה' },
      T('extrasLabel', 'שאלת התוספות'),
      { key: 'extras', label: 'תוספות לבחירה', type: 'strings', add: 'הוספת תוספת', hint: '4 הראשונות מוצגות גם ליד הטופס' },
      T('messageTitle', 'כותרת ההודעה שנשלחת'),
      TA('successText', 'הודעה אחרי שליחה', { rows: 2 }),
    ] },
    { key: 'footer', title: 'תחתית העמוד', fields: [T('text', 'טקסט')] },
  ];

  // ===== מצב =====
  let data = null;      // התוכן שנערך
  let baseline = '';    // התוכן כפי שנטען/נשמר לאחרונה
  let gh = null;        // { owner, repo, branch, token }
  let sha = null;       // ה-sha של content.json ב-GitHub
  const openState = new Set(store.get('site-admin-open', true)?.split(',').filter(Boolean) || ['site']);

  const status = $('#status');
  const setStatus = (text, cls = '') => { status.textContent = text; status.className = 'status ' + cls; };
  const isDirty = () => JSON.stringify(data) !== baseline;
  const refreshStatus = () => isDirty() ? setStatus('יש שינויים שלא נשמרו', 'dirty') : setStatus(gh ? `מחובר ל-${gh.owner}/${gh.repo}` : 'אין שינויים');

  // ===== תצוגה מקדימה =====
  const frame = $('#preview');
  let previewTimer;
  function pushPreview(now) {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => {
      const json = JSON.stringify(data);
      store.set(DRAFT_KEY, json);
      if (isDirty()) store.set(UNSAVED_KEY, json); else store.del(UNSAVED_KEY);
      frame.contentWindow?.postMessage({ type: 'preview', content: data }, location.origin);
    }, now ? 0 : 250);
  }
  function changed() { refreshStatus(); pushPreview(); }

  document.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.seg button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    frame.style.width = b.dataset.w;
  }));

  // ===== בניית הטופס =====
  function input(obj, f) {
    const common = { dir: f.dir, placeholder: f.placeholder || '' };
    if (f.type === 'textarea') {
      const t = el('textarea', { ...common, rows: f.rows || 3 });
      t.value = obj[f.key] ?? '';
      t.addEventListener('input', () => { obj[f.key] = t.value; changed(); });
      return t;
    }
    if (f.type === 'tags') {
      const i = el('input', common);
      i.value = (obj[f.key] || []).join(', ');
      i.addEventListener('input', () => { obj[f.key] = i.value.split(/[,،]/).map((s) => s.trim()).filter(Boolean); changed(); });
      return i;
    }
    const i = el('input', common);
    i.value = obj[f.key] ?? '';
    i.addEventListener('input', () => { obj[f.key] = i.value; changed(); });
    return i;
  }

  function field(obj, f, onTitle) {
    if (f.type === 'row') return el('div', { class: 'row-2' }, f.fields.map((x) => field(obj, x, onTitle)));
    if (f.type === 'group') {
      obj[f.key] ??= {};
      return el('fieldset', { class: 'group' }, el('legend', {}, f.label), f.fields.map((x) => field(obj[f.key], x)));
    }
    if (f.type === 'list') return list(obj, f);
    if (f.type === 'strings') return strings(obj, f);

    let control;
    if (f.type === 'color') {
      const text = el('input', { dir: 'ltr' }); text.value = obj[f.key] || '#4f46e5';
      const pick = el('input', { type: 'color' }); pick.value = /^#[0-9a-f]{6}$/i.test(text.value) ? text.value : '#4f46e5';
      pick.addEventListener('input', () => { text.value = obj[f.key] = pick.value; changed(); });
      text.addEventListener('input', () => { obj[f.key] = text.value; if (/^#[0-9a-f]{6}$/i.test(text.value)) pick.value = text.value; changed(); });
      control = el('div', { class: 'color-row' }, pick, text);
    } else if (f.type === 'image') {
      control = imageField(obj, f);
    } else {
      control = input(obj, f);
      if (onTitle) control.addEventListener('input', onTitle);
    }
    return el('label', { class: 'f' }, el('span', {}, f.label), control, f.hint ? el('small', {}, f.hint) : null);
  }

  function imageField(obj, f) {
    const text = el('input', { dir: 'ltr', placeholder: 'images/… או קישור' });
    text.value = obj[f.key] || '';
    const thumb = el('img', { class: 'thumb', alt: '', src: text.value || '' });
    thumb.onerror = () => { if (thumb.getAttribute('src')) thumb.setAttribute('src', ''); };
    text.addEventListener('input', () => { obj[f.key] = text.value.trim(); thumb.src = text.value.trim(); changed(); });
    const file = el('input', { type: 'file', accept: 'image/*', hidden: true });
    const btn = el('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: (e) => { e.preventDefault(); file.click(); } }, 'העלאה');
    file.addEventListener('change', async () => {
      const f0 = file.files[0];
      file.value = '';
      if (!f0) return;
      if (!gh) { openGh('כדי להעלות תמונות צריך קודם להתחבר ל-GitHub.'); return; }
      btn.disabled = true; btn.textContent = 'מעלה…';
      try {
        const { blob, ext } = await shrink(f0);
        const base = (f0.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'img').slice(0, 40);
        const path = `images/${Date.now().toString(36)}-${base}.${ext}`;
        await api(`/contents/${path}`, { method: 'PUT', body: { message: `העלאת תמונה ${path}`, content: await blobToB64(blob), branch: gh.branch } });
        obj[f.key] = text.value = path;
        thumb.src = URL.createObjectURL(blob);
        changed();
        setStatus('התמונה הועלתה. היא תופיע באתר אחרי השמירה, תוך כדקה.', 'ok');
      } catch (err) {
        setStatus('העלאת התמונה נכשלה: ' + err.message, 'err');
      } finally {
        btn.disabled = false; btn.textContent = 'העלאה';
      }
    });
    return el('div', { class: 'img-row' }, thumb, text, btn, file);
  }

  function list(obj, f) {
    obj[f.key] ??= [];
    const arr = obj[f.key];
    const wrap = el('div', { class: 'list' });
    const draw = (openIdx) => {
      wrap.replaceChildren(el('div', { class: 'list-label' }, el('span', {}, `${f.label} (${arr.length})`)));
      arr.forEach((item, i) => {
        const title = el('span', { class: 'item-title' });
        const icon = el('span', { 'aria-hidden': 'true' });
        const setTitle = () => {
          const t = String(item[f.titleKey] || '').trim();
          title.textContent = t || 'ללא שם';
          title.classList.toggle('empty', !t);
          icon.textContent = item.icon || '';
        };
        setTitle();
        const act = (sym, label, fn, cls, disabled) => el('button', {
          type: 'button', class: 'icon-btn' + (cls ? ' ' + cls : ''), title: label, 'aria-label': label, disabled,
          onclick: (e) => { e.preventDefault(); e.stopPropagation(); fn(); },
        }, sym);
        const det = el('details', { class: 'item', open: i === openIdx },
          el('summary', {}, icon, title,
            act('↑', 'הזזה למעלה', () => { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; draw(); changed(); }, '', i === 0),
            act('↓', 'הזזה למטה', () => { [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; draw(); changed(); }, '', i === arr.length - 1),
            act('✕', 'מחיקה', () => {
              if (!confirm(`למחוק את ״${title.textContent}״?`)) return;
              arr.splice(i, 1); draw(); changed();
            }, 'del')),
          el('div', { class: 'item-body' }, f.fields.map((x) => field(item, x, setTitle))));
        wrap.append(det);
      });
      wrap.append(el('button', { type: 'button', class: 'add-btn', onclick: () => {
        arr.push(clone(f.blank || {}));
        draw(arr.length - 1); changed();
        wrap.querySelector('.item[open] input, .item[open] textarea')?.focus();
      } }, '+ ' + (f.add || 'הוספה')));
    };
    draw();
    return wrap;
  }

  function strings(obj, f) {
    obj[f.key] ??= [];
    const arr = obj[f.key];
    const wrap = el('div', { class: 'list' });
    const draw = (focusIdx) => {
      wrap.replaceChildren(el('div', { class: 'list-label' }, el('span', {}, f.label)));
      arr.forEach((v, i) => {
        const inp = el('input');
        inp.value = v;
        inp.addEventListener('input', () => { arr[i] = inp.value; changed(); });
        const btn = (sym, label, fn, disabled, cls) => el('button', { type: 'button', class: 'icon-btn' + (cls ? ' ' + cls : ''), title: label, 'aria-label': label, disabled, onclick: fn }, sym);
        wrap.append(el('div', { class: 'f' }, el('div', { class: 'str-row' }, inp,
          btn('↑', 'הזזה למעלה', () => { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; draw(); changed(); }, i === 0),
          btn('↓', 'הזזה למטה', () => { [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; draw(); changed(); }, i === arr.length - 1),
          btn('✕', 'מחיקה', () => { arr.splice(i, 1); draw(); changed(); }, false, 'del'))));
        if (i === focusIdx) queueMicrotask(() => inp.focus());
      });
      if (f.hint) wrap.append(el('small', { class: 'hint' }, f.hint));
      wrap.append(el('button', { type: 'button', class: 'add-btn', onclick: () => { arr.push(''); draw(arr.length - 1); changed(); } }, '+ ' + (f.add || 'הוספה')));
    };
    draw();
    return wrap;
  }

  function buildForm() {
    const form = $('#form');
    form.replaceChildren();
    for (const s of SCHEMA) {
      data[s.key] ??= {};
      const sec = data[s.key];
      const det = el('details', { class: 'sec', open: openState.has(s.key) });
      det.addEventListener('toggle', () => {
        det.open ? openState.add(s.key) : openState.delete(s.key);
        store.set('site-admin-open', [...openState].join(','), true);
      });
      det.append(el('summary', {}, el('span', { class: 'sec-title' }, s.title)), el('div', { class: 'sec-body' }, s.fields.map((f) => field(sec, f))));
      // המתג יושב מעל הכותרת אבל מחוץ ל-summary, כדי שלחיצה עליו לא תפתח/תסגור את האזור
      const wrap = el('div', { class: 'sec-wrap' }, det);
      if (s.toggle) {
        const cb = el('input', { type: 'checkbox', checked: sec.show !== false });
        cb.addEventListener('change', () => { sec.show = cb.checked; det.classList.toggle('off', !cb.checked); changed(); });
        det.classList.toggle('off', sec.show === false);
        wrap.append(el('label', { class: 'sw', title: 'הצגה באתר' }, el('span', {}, 'מוצג'), cb, el('i')));
      }
      form.append(wrap);
    }
  }

  function setData(next, markSaved) {
    data = next;
    if (markSaved) baseline = JSON.stringify(data);
    buildForm();
    refreshStatus();
    pushPreview(true);
  }

  // ===== GitHub =====
  async function api(path, { method = 'GET', body } = {}) {
    const r = await fetch(`https://api.github.com/repos/${gh.owner}/${gh.repo}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${gh.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
    const j = r.status === 204 ? null : await r.json().catch(() => null);
    if (!r.ok) {
      const msg = { 401: 'המפתח לא תקין או שפג תוקפו', 403: 'למפתח אין הרשאת כתיבה לריפו', 404: 'הריפו או הקובץ לא נמצאו, או שלמפתח אין גישה אליהם', 409: 'הקובץ השתנה בינתיים ב-GitHub' }[r.status];
      throw Object.assign(new Error(msg || j?.message || 'HTTP ' + r.status), { status: r.status });
    }
    return j;
  }

  const b64 = (str) => {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  };
  const unb64 = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g, '')), (c) => c.charCodeAt(0)));
  const blobToB64 = (blob) => new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result).split(',')[1]);
    fr.onerror = rej;
    fr.readAsDataURL(blob);
  });

  // מקטין תמונות גדולות כדי שהאתר יישאר מהיר
  async function shrink(file) {
    const extOf = (t) => ({ 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg' }[t] || 'png');
    if (/svg|gif/.test(file.type)) return { blob: file, ext: extOf(file.type) };
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
    const max = 1600, scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    if (scale === 1 && file.size < 400 * 1024) return { blob: file, ext: extOf(file.type) };
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise((res) => c.toBlob(res, 'image/webp', 0.85));
    return blob ? { blob, ext: 'webp' } : { blob: file, ext: extOf(file.type) };
  }

  const ghMsg = $('#gh-msg');
  const setGhMsg = (t, cls = '') => { ghMsg.textContent = t; ghMsg.className = 'hint ' + cls; };
  function openGh(msg) {
    $('#gh-panel').hidden = false;
    if (msg) setGhMsg(msg, 'err');
    $('#gh-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    (gh ? $('#gh-connect') : $('#gh-token')).focus({ preventScroll: true });
  }
  $('#gh-toggle').addEventListener('click', () => {
    const p = $('#gh-panel');
    p.hidden = !p.hidden;
    if (!p.hidden) p.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  async function connect(saved) {
    const cfg = saved || {
      owner: $('#gh-owner').value.trim(),
      repo: $('#gh-repo').value.trim(),
      token: $('#gh-token').value.trim(),
    };
    if (!cfg.owner || !cfg.repo || !cfg.token) { setGhMsg('נא למלא משתמש, ריפו ומפתח.', 'err'); return false; }
    gh = { ...cfg };
    setGhMsg('מתחבר…');
    try {
      const repo = await api('');
      if (repo.permissions && !repo.permissions.push) throw new Error('למפתח אין הרשאת כתיבה לריפו');
      gh.branch = repo.default_branch || 'main';
      const file = await api(`/contents/${FILE}?ref=${encodeURIComponent(gh.branch)}`);
      sha = file.sha;
      // הגרסה ב-GitHub עדכנית יותר מהאתר החי (שמתעדכן באיחור של כדקה)
      const remote = JSON.parse(unb64(file.content));
      if (!isDirty()) setData(remote, true);
      else baseline = JSON.stringify(remote);
      const remember = $('#gh-remember').checked;
      store.del(GH_KEY);
      store.set(GH_KEY, JSON.stringify(cfg), !remember);
      setGhMsg(`מחובר ל-${gh.owner}/${gh.repo} ✓`, 'ok');
      $('#gh-logout').hidden = false;
      $('#gh-toggle').textContent = 'מחובר ✓';
      refreshStatus();
      return true;
    } catch (err) {
      gh = null;
      setGhMsg('החיבור נכשל: ' + err.message, 'err');
      $('#gh-panel').hidden = false;
      return false;
    }
  }
  $('#gh-connect').addEventListener('click', () => connect());
  $('#gh-logout').addEventListener('click', () => {
    store.del(GH_KEY);
    gh = null; sha = null;
    $('#gh-token').value = '';
    $('#gh-logout').hidden = true;
    $('#gh-toggle').textContent = 'חיבור ל-GitHub';
    setGhMsg('התנתקת. המפתח נמחק מהדפדפן.');
    refreshStatus();
  });

  async function save() {
    if (!gh) { openGh('כדי לשמור צריך להתחבר ל-GitHub (פעם אחת).'); return; }
    if (!isDirty()) { setStatus('אין מה לשמור', ''); return; }
    const btn = $('#save');
    btn.disabled = true;
    setStatus('שומר…');
    const body = (s) => ({ message: 'עדכון תוכן האתר', content: b64(JSON.stringify(data, null, 2) + '\n'), sha: s, branch: gh.branch });
    try {
      let res;
      try {
        res = await api(`/contents/${FILE}`, { method: 'PUT', body: body(sha) });
      } catch (err) {
        if (err.status !== 409 && err.status !== 422) throw err;
        if (!confirm('הקובץ השתנה ב-GitHub מאז שנטען (אולי נערך ממקום אחר). לשמור בכל זאת ולדרוס את השינוי ההוא?')) { refreshStatus(); return; }
        const cur = await api(`/contents/${FILE}?ref=${encodeURIComponent(gh.branch)}`);
        res = await api(`/contents/${FILE}`, { method: 'PUT', body: body(cur.sha) });
      }
      sha = res.content.sha;
      baseline = JSON.stringify(data);
      store.del(UNSAVED_KEY);
      setStatus('נשמר ✓ האתר יתעדכן תוך כדקה', 'ok');
    } catch (err) {
      setStatus('השמירה נכשלה: ' + err.message, 'err');
    } finally {
      btn.disabled = false;
    }
  }
  $('#save').addEventListener('click', save);
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
  });
  window.addEventListener('beforeunload', (e) => { if (data && isDirty()) e.preventDefault(); });

  // ===== גיבוי =====
  $('#download').addEventListener('click', () => {
    const a = el('a', { href: URL.createObjectURL(new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' })), download: FILE });
    document.body.append(a); a.click(); a.remove();
  });
  $('#import').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try { setData(JSON.parse(await f.text())); setStatus('הקובץ נטען. לחצו ״שמירה ופרסום״ כדי לפרסם.', 'dirty'); }
    catch { setStatus('הקובץ לא תקין', 'err'); }
  });
  $('#revert').addEventListener('click', () => {
    if (!isDirty() || !confirm('לבטל את כל השינויים שלא נשמרו?')) return;
    store.del(UNSAVED_KEY);
    setData(JSON.parse(baseline));
  });

  // ===== התחלה =====
  async function init() {
    // ברירת מחדל: הריפו של האתר הזה (username.github.io)
    const host = location.hostname.match(/^([^.]+)\.github\.io$/i);
    const saved = (() => { try { return JSON.parse(store.get(GH_KEY) || store.get(GH_KEY, true) || 'null'); } catch { return null; } })();
    $('#gh-owner').value = saved?.owner || host?.[1] || 'tyuibbbbbbbbbbbb';
    const path = location.pathname.split('/').filter(Boolean)[0];
    $('#gh-repo').value = saved?.repo || (host && path && !path.endsWith('.html') ? path : `${$('#gh-owner').value}.github.io`);
    if (saved) $('#gh-remember').checked = !!store.get(GH_KEY);

    try {
      const r = await fetch(FILE, { cache: 'no-cache' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      setData(await r.json(), true);
    } catch (err) {
      setStatus('לא הצלחתי לטעון את content.json: ' + err.message, 'err');
      return;
    }
    frame.addEventListener('load', () => pushPreview(true));
    frame.src = 'index.html?preview=1';

    const unsaved = store.get(UNSAVED_KEY);
    if (unsaved && unsaved !== baseline) {
      $('#restore').hidden = false;
      $('#restore-yes').onclick = () => { $('#restore').hidden = true; try { setData(JSON.parse(unsaved)); } catch { store.del(UNSAVED_KEY); } };
      $('#restore-no').onclick = () => { $('#restore').hidden = true; store.del(UNSAVED_KEY); };
    }

    if (saved?.token) {
      $('#gh-token').value = saved.token;
      connect(saved);
    }
  }
  init();
})();
