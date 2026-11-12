(() => {
  const LABELS = ['Hola, soy Teo', 'T.E.O', 'Testimonios', 'Planes', 'Empezar'];

  const sections = Array.from(document.querySelectorAll('[data-scene-index]'));
  const cubeElements = Array.from(document.querySelectorAll('.cardio-layout .cube-float'));
  const cardElements = Array.from(document.querySelectorAll('.cardio-layout .feature-card'));
  const dotsList = document.getElementById('dots');
  const activeLabelEl = document.getElementById('activeLabel');

  // Nav dots: five static elements, one per scene, class-toggled by index.
  const dots = LABELS.map((label, i) => {
    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.title = label;
    dotsList.appendChild(dot);
    return dot;
  });

  let activeIndex = -1;
  let cardioActive = false;
  let ticking = false;
  const waFloat = document.getElementById('waFloat');
  let waHidden = false;

  // Touch and small screens animate only transform and opacity, which keeps finger scrolling smooth.
  const liteMotion = window.matchMedia('(hover: none), (max-width: 720px)');
  let wasLite = liteMotion.matches;

  // Kept fixed while scrolling: the height changes as the phone's browser bar hides, which would make the effects jump.
  let viewportW = window.innerWidth;
  let viewportH = window.innerHeight;

  const scenes = sections.map((section) => ({
    section,
    bg: section.querySelector('[data-role="bg"]'),
    content: section.querySelector('[data-role="content"]'),
    hint: section.querySelector('[data-role="scrollhint"]'),
    stage: section.querySelector('[data-role="stage"]'),
  }));

  // Height the scene's content needs, measured outside its fixed 100dvh box.
  function naturalHeight(section, content) {
    const props = { position: 'relative', inset: 'auto', height: 'auto', 'min-height': '0' };
    Object.entries(props).forEach(([prop, value]) => content.style.setProperty(prop, value));
    let height = content.offsetHeight;
    // T.E.O cards open on demand, so measure each one open, without its animation.
    section.querySelectorAll('.feature-card').forEach((card) => {
      const animated = [card.querySelector('.feature-card-copy-wrap'), card.querySelector('.feature-card-copy')];
      const previous = card.getAttribute('data-highlight');
      animated.forEach((el) => { el.style.transition = 'none'; });
      card.setAttribute('data-highlight', 'true');
      height = Math.max(height, content.offsetHeight);
      if (previous === null) card.removeAttribute('data-highlight');
      else card.setAttribute('data-highlight', previous);
      void content.offsetHeight; // apply the closed state before the animation comes back
      animated.forEach((el) => { el.style.transition = ''; });
    });
    Object.keys(props).forEach((prop) => content.style.removeProperty(prop));
    return height;
  }

  // A scene that does not fit the screen becomes .is-flow (see style.css) instead of scrolling inside itself.
  function fitScenes() {
    scenes.forEach(({ section, content, stage }) => {
      section.classList.remove('is-flow');
      const available = Math.min(stage.clientHeight, viewportH);
      section.classList.toggle('is-flow', naturalHeight(section, content) > available);
    });
  }

  function applyDesktopMotion({ bg, content, stage }, progress, inP) {
    const scale = 1 + progress * 0.08;
    const parallax = (1 - progress) * 12;
    const slideX = (1 - progress) * 70;
    bg.style.transform = `perspective(1600px) translate3d(${slideX}px, ${parallax}px, 0) scale(${scale})`;
    bg.style.filter = `brightness(${0.55 + progress * 0.12})`;

    content.style.opacity = String(inP);
    content.style.transform = `perspective(1400px) translate3d(${(1 - inP) * -28}px, ${(1 - inP) * 34}px, 0) rotateY(${(1 - inP) * 10}deg)`;
    content.style.filter = `blur(${(1 - inP) * 8}px)`;

    stage.style.transform = `translate3d(${(1 - progress) * 24}px, 0, 0)`;
    stage.style.boxShadow = `inset 0 0 0 1px rgba(255,255,255,0.03), 0 ${8 + progress * 10}px ${22 + progress * 12}px rgba(0,0,0,${0.12 + progress * 0.08})`;
    stage.style.filter = `brightness(${0.86 + progress * 0.08}) saturate(${0.92 + progress * 0.06})`;
    stage.style.opacity = String(0.92 + progress * 0.06);
  }

  function applyLiteMotion({ bg, content }, progress, inP) {
    // The base scale keeps the image covering the screen edges through the whole ±30px slide.
    const scale = 1 + 60 / viewportW + progress * 0.08;
    const slideX = (0.5 - progress) * 60;
    const parallax = (1 - progress) * 12;
    bg.style.transform = `translate3d(${slideX}px, ${parallax}px, 0) scale(${scale})`;

    content.style.opacity = String(inP);
    content.style.transform = `translate3d(0, ${(1 - inP) * 34}px, 0)`;
  }

  // Inline styles from one motion mode must not leak into the other (e.g. on rotating a tablet).
  function clearMotionStyles() {
    scenes.forEach(({ bg, content, stage }) => {
      [bg, content, stage].forEach((el) => {
        ['transform', 'filter', 'opacity', 'box-shadow'].forEach((prop) => el.style.removeProperty(prop));
      });
    });
  }

  function setActiveIndex(i) {
    if (i === activeIndex) return;
    activeIndex = i;
    dots.forEach((dot, di) => dot.classList.toggle('is-active', di === i));
    activeLabelEl.textContent = `0${i + 1} / ${LABELS[i]}`;
  }

  function updateCardioState(isActive) {
    cubeElements.forEach((cube) => cube.setAttribute('data-active', String(isActive)));
    cardElements.forEach((card) => card.setAttribute('data-active', String(isActive)));
  }

  function update() {
    const vh = viewportH;
    const lite = liteMotion.matches;
    let bestIdx = 0;
    let bestDist = Infinity;

    // Read every position first and write styles afterwards, so the browser only computes layout once per frame.
    const rects = sections.map((section) => section.getBoundingClientRect());

    scenes.forEach((scene, i) => {
      const rect = rects[i];
      const center = rect.top + rect.height / 2;
      const dist = Math.abs(center - vh / 2);
      if (dist < bestDist) { bestDist = dist; bestIdx = i; }

      // Scenes far from the screen are not visible, so they do not need styles this frame.
      if (rect.bottom < -vh * 0.5 || rect.top > vh * 1.5) return;

      const progress = Math.max(0, Math.min(1, (vh - rect.top) / (rect.height + vh)));
      // A tall .is-flow scene would reveal too late if this followed its whole height.
      const reveal = scene.section.classList.contains('is-flow') ? (vh - rect.top) / (vh * 0.68) : progress / 0.28;
      const inP = Math.max(0, Math.min(1, reveal));

      if (lite) applyLiteMotion(scene, progress, inP);
      else applyDesktopMotion(scene, progress, inP);

      if (scene.hint) scene.hint.style.opacity = String(Math.max(0, 1 - progress / 0.12));
    });

    sections.forEach((section, i) => section.classList.toggle('is-active', i === bestIdx));

    const nextCardioActive = bestIdx === 1;
    if (nextCardioActive !== cardioActive) {
      cardioActive = nextCardioActive;
      updateCardioState(cardioActive);
    }

    setActiveIndex(bestIdx);

    // The final scene has its own WhatsApp button, so the floating one steps aside there.
    const nextWaHidden = bestIdx === sections.length - 1;
    if (waFloat && nextWaHidden !== waHidden) {
      waHidden = nextWaHidden;
      waFloat.classList.toggle('is-hidden', waHidden);
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  // Black Friday: end of November 30 in Colombia. After this the regular prices come back on their own.
  const PROMO_END = new Date('2026-12-01T00:00:00-05:00').getTime();
  const promoUnits = {};
  document.querySelectorAll('[data-promo-unit]').forEach((el) => { promoUnits[el.dataset.promoUnit] = el; });
  const promoShort = document.querySelectorAll('[data-promo-short]');

  function setPromoUnit(name, value) {
    const text = String(value).padStart(2, '0');
    if (promoUnits[name].textContent !== text) promoUnits[name].textContent = text;
  }

  // Returns false once the promotion is over.
  function updatePromo() {
    const seconds = Math.ceil((PROMO_END - Date.now()) / 1000);
    if (seconds <= 0) {
      document.documentElement.classList.add('promo-ended');
      return false;
    }
    setPromoUnit('days', Math.floor(seconds / 86400));
    setPromoUnit('hours', Math.floor((seconds % 86400) / 3600));
    setPromoUnit('minutes', Math.floor((seconds % 3600) / 60));
    setPromoUnit('seconds', seconds % 60);
    // The short line under the hero button, e.g. "19d 02h 15m 30s".
    const pad = (n) => String(n).padStart(2, '0');
    const short = `${Math.floor(seconds / 86400)}d ${pad(Math.floor((seconds % 86400) / 3600))}h ${pad(Math.floor((seconds % 3600) / 60))}m ${pad(seconds % 60)}s`;
    promoShort.forEach((el) => { if (el.textContent !== short) el.textContent = short; });
    return true;
  }

  // One confetti burst from the Black Friday banner. A canvas over the page draws it, so the
  // page layout is untouched; it runs about 3.5 seconds and then removes itself.
  function launchConfetti(origin) {
    const canvas = document.createElement('canvas');
    canvas.className = 'confetti';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const colors = ['#c9973b', '#e0b45a', '#f7d58b', '#fff3d1', '#b8862f', '#ffffff'];
    const count = liteMotion.matches ? 70 : 140;
    const pieces = Array.from({ length: count }, () => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.9; // mostly upwards, fanned out
      const speed = 10 + Math.random() * 10;
      return {
        x: origin.x + (Math.random() - 0.5) * origin.spread,
        y: origin.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 5 + Math.random() * 6,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        tilt: Math.random() * Math.PI,
        color: colors[Math.floor(Math.random() * colors.length)],
        round: Math.random() < 0.3,
      };
    });

    const start = performance.now();
    let last = start;
    function frame(now) {
      const step = Math.min(2.5, (now - last) / 16.67); // frame-rate independent
      last = now;
      const fade = Math.max(0, 1 - Math.max(0, now - start - 2600) / 900);
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = fade;
      pieces.forEach((p) => {
        // Shoots up, then flutters down slowly like paper: gravity with a capped fall speed and a side sway.
        p.vy = Math.min(3.2, (p.vy + 0.2 * step) * 0.975 ** step);
        p.vx *= 0.975 ** step;
        p.x += (p.vx + Math.sin(p.tilt) * 0.8) * step;
        p.y += p.vy * step;
        p.rot += p.vr * step;
        p.tilt += 0.12 * step;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.round) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2.4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, (p.size / 2) * Math.abs(Math.cos(p.tilt)) + 1);
        }
        ctx.restore();
      });
      if (fade > 0) requestAnimationFrame(frame);
      else canvas.remove();
    }
    requestAnimationFrame(frame);
  }

  // Fires once, the first time the banner is well in view.
  function watchPromoBanner() {
    const banner = document.querySelector('.promo-banner');
    if (!banner || !('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      // A short delay lets the scene's fade-in finish first.
      setTimeout(() => {
        if (document.documentElement.classList.contains('promo-ended')) return;
        const r = banner.getBoundingClientRect();
        launchConfetti({ x: r.left + r.width / 2, y: r.top + r.height / 2, spread: r.width * 0.8 });
      }, 350);
    }, { threshold: 0.9 });
    observer.observe(banner);
  }

  // Runs before fitScenes, because prices and the banner change how tall the Planes scene is.
  if (updatePromo()) {
    watchPromoBanner();
    const promoTimer = setInterval(() => {
      if (updatePromo()) return;
      clearInterval(promoTimer);
      refit();
    }, 1000);
  }

  fitScenes();
  update();

  // Text and images can change the heights after the first paint.
  function refit() {
    viewportW = window.innerWidth;
    viewportH = window.innerHeight;
    if (liteMotion.matches !== wasLite) {
      wasLite = liteMotion.matches;
      clearMotionStyles();
    }
    fitScenes();
    update();
  }
  window.addEventListener('load', refit);
  if (document.fonts) document.fonts.ready.then(refit);

  // Decoding the backgrounds up front avoids a stall the first time each scene comes into view.
  scenes.forEach(({ bg }) => {
    if (bg.decode) bg.decode().catch(() => {});
  });

  // Cubes <-> cards: one card expanded at a time. Desktop previews on hover/focus; a click/tap
  // "pins" a card open (this is what drives it on phones, where there is no hover).
  const hasHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pinnedKey = null;

  // "Ver planes" in the hero: glides to the prices instead of jumping (the #planes href is the fallback).
  document.querySelectorAll('[data-scroll-to]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const target = document.getElementById(link.dataset.scrollTo);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });

  // Phones fire resize when the browser bar hides on scroll, which only changes the height.
  // Ignoring that keeps scenes from switching layout while the user is scrolling.
  let lastWidth = window.innerWidth;
  let lastHeight = window.innerHeight;
  window.addEventListener('resize', () => {
    const widthChanged = window.innerWidth !== lastWidth;
    const heightChanged = window.innerHeight !== lastHeight;
    lastWidth = window.innerWidth;
    lastHeight = window.innerHeight;
    if (widthChanged || (hasHover && heightChanged)) refit();
  }, { passive: true });

  function collapseAll() {
    cubeElements.forEach((c) => c.setAttribute('data-hover', 'false'));
    cardElements.forEach((c) => {
      c.setAttribute('data-highlight', 'false');
      c.setAttribute('aria-expanded', 'false');
    });
  }
  function expand(key) {
    cubeElements.forEach((c) => c.setAttribute('data-hover', String(c.getAttribute('data-cube') === key)));
    cardElements.forEach((c) => {
      const on = c.getAttribute('data-card') === key;
      c.setAttribute('data-highlight', String(on));
      c.setAttribute('aria-expanded', String(on));
    });
  }
  function toggle(key) {
    if (pinnedKey === key) {
      pinnedKey = null;
      collapseAll();
    } else {
      pinnedKey = key;
      expand(key);
    }
  }
  function bindTrigger(el, key) {
    el.addEventListener('click', (e) => { e.preventDefault(); toggle(key); });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(key); }
    });
    if (hasHover) {
      el.addEventListener('mouseenter', () => { if (!pinnedKey) expand(key); });
      el.addEventListener('mouseleave', () => { if (!pinnedKey) collapseAll(); });
    }
    el.addEventListener('focus', () => { if (!pinnedKey) expand(key); });
    el.addEventListener('blur', () => { if (!pinnedKey) collapseAll(); });
  }
  cubeElements.forEach((cube) => bindTrigger(cube, cube.getAttribute('data-cube')));
  cardElements.forEach((card) => bindTrigger(card, card.getAttribute('data-card')));

  // Subtle pointer-tracked 3D tilt on the card grids — reinforces the same
  // "physical card" language as the T/E/O cubes, off for touch/reduced-motion.
  if (hasHover && !reducedMotion) {
    const tiltEls = Array.from(document.querySelectorAll('.feature-card, .testi-card, .plan-card'));
    tiltEls.forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--tilt-x', (-py * 7).toFixed(2) + 'deg');
        el.style.setProperty('--tilt-y', (px * 7).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--tilt-x', '0deg');
        el.style.setProperty('--tilt-y', '0deg');
      });
    });
  }
})();
