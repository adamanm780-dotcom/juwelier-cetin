/* ═══════════════════════════════════════════════════════════════
   JUWELIER CETIN — interaction layer
   ═══════════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─────────── footer year
  const yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  // ─────────── nav: transparent → solid on scroll
  const nav = document.getElementById('nav');
  const onScrollNav = () => {
    if (window.scrollY > 40) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  };
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  // ─────────── mobile menu
  const burger = document.getElementById('burger');
  const sheet  = document.getElementById('sheet');
  if (burger && sheet) {
    const closeSheet = () => {
      burger.classList.remove('is-open');
      sheet.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      sheet.setAttribute('aria-hidden', 'true');
      document.documentElement.style.overflow = '';
    };
    burger.addEventListener('click', () => {
      const open = !burger.classList.contains('is-open');
      burger.classList.toggle('is-open', open);
      sheet.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      sheet.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.documentElement.style.overflow = open ? 'hidden' : '';
    });
    sheet.querySelectorAll('a').forEach(a => a.addEventListener('click', closeSheet));
  }

  // ─────────── reveal on scroll (+ optional delay via data-delay)
  const reveals = document.querySelectorAll('.reveal');
  reveals.forEach(el => {
    const d = parseInt(el.dataset.delay || '0', 10);
    if (d) el.style.setProperty('--reveal-delay', d);
  });

  if (prefersReduced) {
    reveals.forEach(el => el.classList.add('is-in'));
  } else if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-in'));
  }

  // ─────────── parallax background (punkte.png section)
  const parallaxBg = document.getElementById('parallaxBg');
  if (parallaxBg && !prefersReduced) {
    const parent = parallaxBg.parentElement;
    let tick = false;
    const update = () => {
      const r = parent.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // only compute when section is within viewport +/- margin
      if (r.bottom < -200 || r.top > vh + 200) { tick = false; return; }
      // progress: 0 when section top enters bottom of viewport, 1 when bottom leaves top of viewport
      const progress = 1 - (r.top + r.height) / (vh + r.height);
      const translate = (progress - 0.5) * 180; // range ≈ -90..90 px, upward on scroll
      parallaxBg.style.transform = `translate3d(0, ${-translate}px, 0)`;
      tick = false;
    };
    const onScroll = () => {
      if (!tick) {
        window.requestAnimationFrame(update);
        tick = true;
      }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }

  // ─────────── diamond scroll-scrub (50-frame polok sequence)
  const diamondSection = document.getElementById('diamant');
  const diamondCanvas  = document.getElementById('diamondCanvas');
  const scrubOK = window.matchMedia('(min-width: 901px)').matches;
  if (diamondSection && diamondCanvas && !prefersReduced && scrubOK) {
    const total = parseInt(diamondSection.dataset.frames || '50', 10);
    const path  = diamondSection.dataset.framePath || 'assets/polok/';
    const ctx   = diamondCanvas.getContext('2d');
    const scroller = diamondSection.querySelector('.diamond__scroller');
    const progressEl = document.getElementById('diamondProgress');
    const frames = new Array(total);
    let loaded = 0;
    let currentFrame = -1;
    let dprScaled = false;

    const scaleCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { clientWidth, clientHeight } = diamondCanvas;
      if (!clientWidth || !clientHeight) return;
      diamondCanvas.width  = Math.round(clientWidth * dpr);
      diamondCanvas.height = Math.round(clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dprScaled = true;
    };

    const drawFrame = (idx) => {
      const img = frames[idx];
      if (!img || !img.complete || img.naturalWidth === 0) return;
      if (!dprScaled) scaleCanvas();
      const cw = diamondCanvas.clientWidth;
      const ch = diamondCanvas.clientHeight;
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const ratio = Math.min(cw / iw, ch / ih);
      const dw = iw * ratio, dh = ih * ratio;
      const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, dx, dy, dw, dh);
    };

    const setFrame = (idx) => {
      idx = Math.max(0, Math.min(total - 1, idx));
      if (idx === currentFrame) return;
      currentFrame = idx;
      drawFrame(idx);
      if (progressEl) progressEl.style.transform = `scaleX(${(idx + 1) / total})`;
    };

    // preload all frames
    for (let i = 0; i < total; i++) {
      const img = new Image();
      img.decoding = 'async';
      img.src = path + String(i + 1).padStart(3, '0') + '.webp';
      img.onload = () => {
        loaded++;
        if (i === 0) setFrame(0);
      };
      frames[i] = img;
    }

    let ticking = false;
    const updateFromScroll = () => {
      const rect = scroller.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const progress = travel > 0 ? Math.max(0, Math.min(1, -rect.top / travel)) : 0;
      setFrame(Math.round(progress * (total - 1)));
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) { window.requestAnimationFrame(updateFromScroll); ticking = true; }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { dprScaled = false; scaleCanvas(); drawFrame(currentFrame); });
    updateFromScroll();
  } else if (diamondCanvas) {
    // mobile / reduced motion: draw the finished-ring frame statically
    const drawStill = () => {
      const img = new Image();
      img.onload = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const ctx = diamondCanvas.getContext('2d');
        const cw = diamondCanvas.clientWidth, ch = diamondCanvas.clientHeight;
        diamondCanvas.width  = Math.round(cw * dpr);
        diamondCanvas.height = Math.round(ch * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const ratio = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
        const dw = img.naturalWidth * ratio, dh = img.naturalHeight * ratio;
        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      };
      img.src = 'assets/polok/045.webp';
    };
    drawStill();
    window.addEventListener('resize', drawStill);
  }

  // ─────────── smooth anchor offset (compensate fixed nav)
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#' || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const navH = nav ? nav.getBoundingClientRect().height : 0;
      const y = target.getBoundingClientRect().top + window.pageYOffset - navH + 2;
      window.scrollTo({ top: y, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });
})();
