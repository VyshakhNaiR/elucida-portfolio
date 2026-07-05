/* ======================================================================
   ELUCIDA — shared FX: backdrop, cursor, nav, reveal, transitions
   ====================================================================== */
window.Elucida = (function () {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Nav scroll + progress + burger ---------- */
  function initNav() {
    const nav = document.getElementById('nav');
    const prog = document.getElementById('scrollProgress');
    const burger = document.getElementById('burger');
    const links = document.querySelector('.nav__links');
    function onScroll() {
      const y = window.scrollY;
      if (nav) nav.classList.toggle('is-scrolled', y > 40);
      if (prog) {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        prog.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    if (burger && links) {
      burger.addEventListener('click', () => links.classList.toggle('is-open'));
      links.addEventListener('click', (e) => { if (e.target.tagName === 'A') links.classList.remove('is-open'); });
    }
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach((el) => io.observe(el));
  }

  /* ---------- Counters ---------- */
  function initCounters() {
    const nums = document.querySelectorAll('[data-count]');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target, target = parseFloat(el.dataset.count), suffix = el.dataset.suffix || '';
        const dur = 1500, start = performance.now();
        function tick(now) {
          const p = Math.min((now - start) / dur, 1), e = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * e) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: 0.6 });
    nums.forEach((el) => io.observe(el));
  }

  /* ---------- Cursor glow ---------- */
  function initCursor() {
    if (reduced || matchMedia('(pointer: coarse)').matches) return;
    const g = document.querySelector('.cursor-glow');
    if (!g) return;
    let tx = 0, ty = 0, x = 0, y = 0;
    window.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; });
    (function loop() { x += (tx - x) * 0.14; y += (ty - y) * 0.14; g.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`; requestAnimationFrame(loop); })();
  }

  /* ---------- Magnetic buttons ---------- */
  function initMagnetic() {
    if (reduced || matchMedia('(pointer: coarse)').matches) return;
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Scroll-linked engine: parallax + tracer + title draw ---------- */
  const parallaxEls = [];
  const tracers = [];
  let ticking = false;

  function initParallax() {
    if (reduced) return;
    document.querySelectorAll('[data-parallax]').forEach((el) => parallaxEls.push({ el, s: parseFloat(el.dataset.parallax) || 0.15 }));
  }
  function initTracer() {
    document.querySelectorAll('[data-tracer]').forEach((wrap) => {
      tracers.push({
        wrap,
        fill: wrap.querySelector('.tracer__fill'),
        comet: wrap.querySelector('.tracer__comet'),
        steps: Array.from(wrap.querySelectorAll('.jstep'))
      });
    });
  }
  function updateScroll() {
    ticking = false;
    const vh = window.innerHeight, mid = vh * 0.5;
    for (const p of parallaxEls) {
      const r = p.el.getBoundingClientRect();
      const off = (r.top + r.height / 2) - mid;
      p.el.style.transform = `translate3d(0, ${(-off * p.s).toFixed(1)}px, 0)`;
    }
    for (const t of tracers) {
      const r = t.wrap.getBoundingClientRect();
      let prog = (mid - r.top) / r.height;
      prog = Math.max(0, Math.min(1, prog));
      if (t.fill) t.fill.style.height = (prog * 100) + '%';
      if (t.comet) t.comet.style.top = (prog * 100) + '%';
      t.steps.forEach((s) => {
        const node = s.querySelector('.jstep__node') || s;
        const nr = node.getBoundingClientRect();
        s.classList.toggle('is-active', (nr.top + nr.height / 2) < mid + 60);
      });
    }
  }
  function onScrollTick() { if (!ticking) { ticking = true; requestAnimationFrame(updateScroll); } }

  /* ---------- Kinetic typography ---------- */
  function splitChars(el) {
    const text = el.textContent;
    el.textContent = '';
    el.classList.add('kt');
    [...text].forEach((ch, i) => {
      const wrap = document.createElement('span'); wrap.className = 'kt__c';
      const inner = document.createElement('span'); inner.className = 'kt__i';
      inner.textContent = ch === ' ' ? ' ' : ch;
      inner.style.transitionDelay = (i * 0.04) + 's';
      wrap.appendChild(inner); el.appendChild(wrap);
    });
  }
  function splitLines(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    const spans = words.map((w) => { const s = document.createElement('span'); s.className = 'kt__w'; s.textContent = w; return s; });
    spans.forEach((s, i) => { el.appendChild(s); if (i < spans.length - 1) el.appendChild(document.createTextNode(' ')); });
    // group by top offset into lines
    let lines = [], cur = [], top = null;
    spans.forEach((s) => { const t = s.offsetTop; if (top === null || Math.abs(t - top) < 4) { cur.push(s); } else { lines.push(cur); cur = [s]; } top = t; });
    if (cur.length) lines.push(cur);
    el.textContent = ''; el.classList.add('kt');
    lines.forEach((line, li) => {
      const lw = document.createElement('span'); lw.className = 'kt__line';
      const inner = document.createElement('span'); inner.className = 'kt__lineI';
      inner.style.transitionDelay = (li * 0.09) + 's';
      inner.textContent = line.map((s) => s.textContent).join(' ');
      lw.appendChild(inner); el.appendChild(lw); el.appendChild(document.createTextNode(' '));
    });
  }
  function initKinetic() {
    if (reduced) return;
    document.querySelectorAll('[data-split="chars"]').forEach(splitChars);
    document.querySelectorAll('[data-split="lines"]').forEach((el) => { try { splitLines(el); } catch (e) {} });
    const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { threshold: 0.25 });
    document.querySelectorAll('.kt').forEach((el) => io.observe(el));
  }

  /* ---------- Scramble / decrypt ---------- */
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef0123456789<>/\\{}[]#*+=$%';
  function scramble(el, finalText, dur) {
    const len = finalText.length; const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const reveal = Math.floor(p * len);
      let out = '';
      for (let i = 0; i < len; i++) {
        if (i < reveal || finalText[i] === ' ') out += finalText[i];
        else out += GLYPHS[(Math.floor(now / 30) + i) % GLYPHS.length];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(tick); else el.textContent = finalText;
    }
    requestAnimationFrame(tick);
  }
  function initScramble() {
    if (reduced) return;
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (en.isIntersecting) { const el = en.target; scramble(el, el.dataset.text || el.textContent, 1100); io.unobserve(el); }
    }), { threshold: 0.6 });
    document.querySelectorAll('[data-scramble]').forEach((el) => { el.dataset.text = el.textContent; io.observe(el); });
  }

  /* ---------- Blend-mode cursor ring ---------- */
  function initCursorRing() {
    if (reduced || matchMedia('(pointer: coarse)').matches) return;
    const ring = document.createElement('div'); ring.className = 'cursor-ring'; document.body.appendChild(ring);
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
    window.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; });
    document.addEventListener('mouseover', (e) => { ring.classList.toggle('is-hot', !!e.target.closest('a,button,[data-magnetic],.egg,.shot,.tool-card')); });
    (function loop() { x += (tx - x) * 0.2; y += (ty - y) * 0.2; ring.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`; requestAnimationFrame(loop); })();
  }

  /* ---------- Smooth inertia scroll (Lenis-lite) ---------- */
  function initSmooth() {
    if (reduced || matchMedia('(pointer: coarse)').matches) return;
    let target = window.scrollY, current = target, running = false;
    const max = () => document.documentElement.scrollHeight - window.innerHeight;
    function loop() {
      const diff = target - current;
      current += diff * 0.18;                                   // snappier follow
      if (Math.abs(diff) < 0.5) { current = target; running = false; window.scrollTo(0, current); return; }
      window.scrollTo(0, Math.round(current)); requestAnimationFrame(loop);
    }
    window.addEventListener('wheel', (e) => {
      if (e.ctrlKey) return;                 // let pinch-zoom through
      // normalise delta across input devices: mouse wheels report lines, not pixels
      let d = e.deltaY;
      if (e.deltaMode === 1) d *= 16;        // DOM_DELTA_LINE  → px
      else if (e.deltaMode === 2) d *= window.innerHeight;  // DOM_DELTA_PAGE
      e.preventDefault();
      target = Math.max(0, Math.min(max(), target + d));
      if (!running) { running = true; requestAnimationFrame(loop); }
    }, { passive: false });
    // keep target synced when user uses keyboard / scrollbar / anchor jumps
    window.addEventListener('scroll', () => { if (!running) { target = window.scrollY; current = target; } }, { passive: true });
  }

  /* ---------- Page transition veil ---------- */
  function initTransitions() {
    const veil = document.querySelector('.veil');
    if (!veil) return;
    document.querySelectorAll('a[data-transition]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (!href || href.startsWith('#') || a.target === '_blank') return;
        e.preventDefault();
        veil.classList.add('is-on');
        setTimeout(() => { window.location.href = href; }, 480);
      });
    });
    window.addEventListener('pageshow', (e) => { if (e.persisted) veil.classList.remove('is-on'); });
  }

  /* ---------- Constellation canvas ---------- */
  function initConstellation() {
    const canvas = document.getElementById('constellation');
    if (!canvas) return;
    if (reduced) { canvas.style.display = 'none'; return; }
    const ctx = canvas.getContext('2d');
    let w, h, dpr, particles = [];
    const mouse = { x: -9999, y: -9999 };
    function accent() {
      const s = getComputedStyle(document.body);
      return [s.getPropertyValue('--accent-rgb').trim() || '139,92,246', s.getPropertyValue('--accent2-rgb').trim() || '34,211,238'];
    }
    let COLORS = accent();
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = innerWidth * dpr; h = canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px';
      const count = Math.min(88, Math.floor((innerWidth * innerHeight) / 17000));
      particles = [];
      for (let i = 0; i < count; i++) particles.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.26 * dpr, vy: (Math.random() - 0.5) * 0.26 * dpr,
        r: (Math.random() * 1.6 + 0.6) * dpr, c: COLORS[(Math.random() * 2) | 0]
      });
    }
    addEventListener('resize', resize);
    addEventListener('mousemove', (e) => { mouse.x = e.clientX * dpr; mouse.y = e.clientY * dpr; });
    addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
    resize();
    const LINK = 128;
    (function frame() {
      ctx.clearRect(0, 0, w, h);
      const ld = LINK * dpr;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const mdx = mouse.x - p.x, mdy = mouse.y - p.y, md = Math.hypot(mdx, mdy);
        if (md < 160 * dpr && md > 0) { p.x += (mdx / md) * 0.4; p.y += (mdy / md) * 0.4; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fillStyle = 'rgba(' + p.c + ',.85)'; ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j], d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < ld) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.strokeStyle = 'rgba(' + p.c + ',' + (0.13 * (1 - d / ld)) + ')'; ctx.lineWidth = dpr * 0.6; ctx.stroke(); }
        }
        if (md < ld) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.strokeStyle = 'rgba(' + COLORS[1] + ',' + (0.2 * (1 - md / ld)) + ')'; ctx.lineWidth = dpr * 0.7; ctx.stroke(); }
      }
      requestAnimationFrame(frame);
    })();
    // refresh palette shortly after load (theme vars applied)
    setTimeout(() => { COLORS = accent(); particles.forEach((p) => { p.c = COLORS[(Math.random() * 2) | 0]; }); }, 60);
  }

  function init(opts) {
    opts = opts || {};
    initNav(); initReveal(); initCounters(); initCursor(); initCursorRing(); initMagnetic(); initTransitions();
    initParallax(); initTracer();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { initKinetic(); initScramble(); });
    else { initKinetic(); initScramble(); }
    window.addEventListener('scroll', onScrollTick, { passive: true });
    window.addEventListener('resize', onScrollTick, { passive: true });
    updateScroll();
    // Native scrolling is used deliberately — a JS wheel-hijack ("smooth scroll")
    // added latency and felt sluggish. CSS scroll-behavior handles anchor jumps.
    void initSmooth; // kept for reference, intentionally not called
    if (opts.constellation !== false) initConstellation();
  }
  return { init, reduced };
})();
