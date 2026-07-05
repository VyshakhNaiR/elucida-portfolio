/* ======================================================================
   ELUCIDA — home (NFS Unbound): easter eggs + sparkle bursts
   ====================================================================== */
(function () {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Easter eggs: tap-to-toggle on touch ---------- */
  document.querySelectorAll('.egg').forEach((egg) => {
    egg.addEventListener('click', (e) => {
      if (matchMedia('(pointer: coarse)').matches) {
        e.preventDefault();
        document.querySelectorAll('.egg').forEach((o) => { if (o !== egg) o.classList.remove('is-open'); });
        egg.classList.toggle('is-open');
      }
    });
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.egg')) document.querySelectorAll('.egg').forEach((o) => o.classList.remove('is-open')); });

  /* ---------- Sparkle burst ---------- */
  const COLORS = ['#ff2e88', '#19e3ff', '#ffdd2d', '#b6ff3c', '#a855f7'];
  const SPARK = "<svg viewBox='0 0 24 24'><path d='M12 0C13 8 16 11 24 12C16 13 13 16 12 24C11 16 8 13 0 12C8 11 11 8 12 0Z' fill='currentColor'/></svg>";
  function burst(x, y, n) {
    if (reduced) return;
    for (let i = 0; i < n; i++) {
      const s = document.createElement('div');
      s.className = 'spark';
      s.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${10 + Math.random() * 16}px;height:${10 + Math.random() * 16}px;z-index:130;pointer-events:none;color:${COLORS[(Math.random() * COLORS.length) | 0]};will-change:transform,opacity;`;
      s.innerHTML = SPARK;
      document.body.appendChild(s);
      const ang = Math.random() * 6.28, dist = 40 + Math.random() * 90;
      const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 30;
      const rot = (Math.random() * 2 - 1) * 220;
      s.animate([
        { transform: 'translate(-50%,-50%) scale(.2) rotate(0deg)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1.1) rotate(${rot}deg)`, opacity: 1, offset: .7 },
        { transform: `translate(calc(-50% + ${dx * 1.2}px), calc(-50% + ${dy * 1.2 + 40}px)) scale(.3) rotate(${rot}deg)`, opacity: 0 }
      ], { duration: 700 + Math.random() * 300, easing: 'cubic-bezier(.22,1,.36,1)' }).onfinish = () => s.remove();
    }
  }
  // burst from cards + primary buttons on click
  document.querySelectorAll('.card, .btn--primary, .contact__mail').forEach((el) => {
    el.addEventListener('pointerenter', (e) => burst(e.clientX, e.clientY, 5));
  });
  document.addEventListener('click', (e) => {
    const t = e.target.closest('.btn--primary, .card__go, .egg--m');
    if (t) { const r = t.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 12); }
  });

  /* ---------- Glitch bursts on the ELUCIDA title ---------- */
  const glitch = document.querySelector('.glitch');
  if (glitch && !reduced) {
    setInterval(() => { glitch.classList.add('burst'); setTimeout(() => glitch.classList.remove('burst'), 340); }, 4600);
  }

  /* ---------- Hero parallax (dynamic on hover) ---------- */
  if (!reduced && !matchMedia('(pointer: coarse)').matches) {
    const layer = document.getElementById('doodleLayer');
    const title = document.querySelector('.nhero__title');
    const tags = document.querySelector('.nhero__tagtop');
    let tx = 0, ty = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', (e) => { tx = (e.clientX / innerWidth - 0.5); ty = (e.clientY / innerHeight - 0.5); });
    (function loop() {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      if (layer) layer.style.transform = `translate(${cx * 34}px, ${cy * 30}px)`;
      if (title) title.style.transform = `translate(${cx * 12}px, ${cy * 8}px)`;
      if (tags) tags.style.transform = `translate(${cx * 20}px, ${cy * 14}px)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Hover-play polaroid video ---------- */
  document.querySelectorAll('video[data-hoverplay]').forEach((v) => {
    v.muted = true;
    const p = v.closest('.polaroid');
    (p || v).addEventListener('pointerenter', () => v.play().catch(() => {}));
    (p || v).addEventListener('pointerleave', () => v.pause());
  });

  /* ---------- Multiverse font-glitch (name + ELUCIDA title) ---------- */
  const MV = [
    { grad: true,                       sk: 0,  ls: '.01em', st: 'normal', w: '400', tt: 'uppercase', sc: 1 },   // brand gradient (Anton)
    { f: "'Bungee',sans-serif",         c: 'var(--cyan)',   sk: 0,  ls: '0',      st: 'normal', w: '400', tt: 'uppercase', sc: .72 },
    { f: "'Rubik Glitch',system-ui",    c: 'var(--yellow)', sk: 0,  ls: '0',      st: 'normal', w: '400', tt: 'none',      sc: .9 },
    { f: "'VT323',monospace",           c: 'var(--lime)',   sk: 0,  ls: '-.02em', st: 'normal', w: '400', tt: 'uppercase', sc: 1.25 },
    { f: "'Monoton',cursive",           c: 'var(--purple)', sk: -2, ls: '.03em',  st: 'normal', w: '400', tt: 'uppercase', sc: .78 },
    { f: "'Permanent Marker',cursive",  c: '#fff',          sk: 3,  ls: '0',      st: 'normal', w: '400', tt: 'none',      sc: .88 },
    { f: "'Space Grotesk',sans-serif",  c: 'var(--cyan)',   sk: -6, ls: '-.01em', st: 'italic', w: '700', tt: 'uppercase', sc: .95 }
  ];
  function multiverse(el, opts) {
    if (!el || reduced) return;
    opts = opts || {};
    const GRAD = 'linear-gradient(100deg,var(--pink),var(--purple) 45%,var(--cyan))';
    function apply(v) {
      if (v.grad) {
        el.style.background = GRAD; el.style.webkitBackgroundClip = 'text'; el.style.backgroundClip = 'text';
        el.style.webkitTextFillColor = 'transparent'; el.style.color = 'transparent'; el.style.textShadow = 'none';
        el.style.fontFamily = "'Anton',sans-serif";
      } else {
        el.style.background = 'none'; el.style.webkitTextFillColor = v.c; el.style.color = v.c;
        el.style.textShadow = '0 0 18px ' + v.c; el.style.fontFamily = v.f;
      }
      el.style.fontStyle = v.st; el.style.fontWeight = v.w; el.style.letterSpacing = v.ls; el.style.textTransform = v.tt;
      el.style.transform = 'skewX(' + v.sk + 'deg) scale(' + v.sc + ')';
    }
    let iv, i = 0;
    apply(MV[0]);
    function morph(idx) {
      el.classList.add('flick');
      setTimeout(() => apply(MV[idx]), 95);
      setTimeout(() => el.classList.remove('flick'), 420);
    }
    function step() {
      if (opts.mode === 'flash') {
        // title: flash to a random alt font, then snap back to the brand gradient
        const alt = 1 + Math.floor(Math.random() * (MV.length - 1));
        morph(alt);
        setTimeout(() => morph(0), opts.hold || 700);
      } else {
        i = (i + 1) % MV.length; morph(i);
      }
    }
    function pace(ms) { clearInterval(iv); iv = setInterval(step, ms); }
    pace(opts.every || 2200);
    el.style.cursor = 'crosshair';
    el.addEventListener('mouseenter', () => { clearInterval(iv); (opts.mode === 'flash' ? step() : morph(i = (i + 1) % MV.length)); pace(opts.every || 2200); });
  }
  multiverse(document.getElementById('mvName'), { mode: 'cycle', every: 2000 });
  multiverse(document.getElementById('mvElucida'), { mode: 'flash', every: 3000, hold: 650 });

  /* ---------- init WebGL light + shared FX ---------- */
  window.ElucidaGL && window.ElucidaGL.init('glbg');
  window.Elucida.init();
})();
