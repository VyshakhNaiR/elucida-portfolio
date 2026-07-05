/* ======================================================================
   ELUCIDA — tool page: lazy video autoplay + lightbox
   ====================================================================== */
(function () {
  'use strict';

  /* ---------- Lazy-play videos only when in view ---------- */
  const vids = document.querySelectorAll('video[data-lazy]');
  const vio = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const v = en.target;
      if (en.isIntersecting) { if (v.paused) v.play().catch(() => {}); }
      else { if (!v.paused) v.pause(); }
    });
  }, { threshold: 0.25 });
  vids.forEach((v) => { v.muted = true; v.setAttribute('playsinline', ''); vio.observe(v); });

  /* ---------- Lightbox ---------- */
  const lb = document.getElementById('lightbox');
  if (lb) {
    const img = document.getElementById('lbImg');
    const cap = document.getElementById('lbCap');
    const shots = Array.from(document.querySelectorAll('.shot'));
    let cur = -1;
    function open(i) {
      cur = i; const s = shots[i];
      img.src = s.dataset.src; img.alt = s.dataset.cap || ''; cap.textContent = s.dataset.cap || '';
      lb.classList.add('is-open'); document.body.style.overflow = 'hidden';
    }
    function close() { lb.classList.remove('is-open'); document.body.style.overflow = ''; }
    function step(d) { if (cur < 0) return; cur = (cur + d + shots.length) % shots.length; open(cur); }
    shots.forEach((s, i) => s.addEventListener('click', () => open(i)));
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-next').addEventListener('click', () => step(1));
    lb.querySelector('.lb-prev').addEventListener('click', () => step(-1));
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    });
  }

  window.ElucidaGL && window.ElucidaGL.init('glbg');
  window.Elucida.init();
})();
