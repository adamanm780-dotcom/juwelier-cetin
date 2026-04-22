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
