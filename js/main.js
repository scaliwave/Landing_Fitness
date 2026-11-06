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

  // Phones skip the sideways slide: it pushes each scene off-center and reads as horizontal scroll.
  const narrowViewport = window.matchMedia('(max-width: 720px)');

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
    sections.forEach((section) => {
      section.classList.remove('is-flow');
      const content = section.querySelector('[data-role="content"]');
      const stage = section.querySelector('[data-role="stage"]');
      section.classList.toggle('is-flow', naturalHeight(section, content) > stage.clientHeight);
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
    const vh = window.innerHeight;
    const allowSlideX = !narrowViewport.matches;
    let bestIdx = 0;
    let bestDist = Infinity;

    sections.forEach((section, i) => {
      const rect = section.getBoundingClientRect();
      const total = rect.height + vh;
      let progress = (vh - rect.top) / total;
      progress = Math.max(0, Math.min(1, progress));

      const bg = section.querySelector('[data-role="bg"]');
      const content = section.querySelector('[data-role="content"]');
      const hint = section.querySelector('[data-role="scrollhint"]');
      const stage = section.querySelector('[data-role="stage"]');

      if (bg) {
        const scale = 1 + progress * 0.08;
        const parallax = (1 - progress) * 12;
        const slideX = allowSlideX ? (1 - progress) * 70 : 0;
        bg.style.transform = `perspective(1600px) translate3d(${slideX}px, ${parallax}px, 0) scale(${scale})`;
        const brightness = 0.55 + progress * 0.12;
        bg.style.filter = `brightness(${brightness})`;
      }

      if (content) {
        // A tall .is-flow scene would reveal too late if this followed its whole height.
        const reveal = section.classList.contains('is-flow') ? (vh - rect.top) / (vh * 0.68) : progress / 0.28;
        const inP = Math.max(0, Math.min(1, reveal));
        content.style.opacity = String(inP);
        const contentX = allowSlideX ? (1 - inP) * -28 : 0;
        content.style.transform = `perspective(1400px) translate3d(${contentX}px, ${(1 - inP) * 34}px, 0) rotateY(${(1 - inP) * 10}deg)`;
        content.style.filter = `blur(${(1 - inP) * 8}px)`;
      }

      if (stage) {
        const stageProgress = Math.max(0, Math.min(1, progress));
        stage.style.setProperty('--scene-progress', String(stageProgress));
        stage.style.setProperty('--scene-veil-opacity', String(0.7 + stageProgress * 0.2));
        stage.style.transform = allowSlideX ? `translate3d(${(1 - stageProgress) * 24}px, 0, 0)` : 'none';
        stage.style.boxShadow = `inset 0 0 0 1px rgba(255,255,255,0.03), 0 ${8 + stageProgress * 10}px ${22 + stageProgress * 12}px rgba(0,0,0,${0.12 + stageProgress * 0.08})`;
        stage.style.filter = `brightness(${0.86 + stageProgress * 0.08}) saturate(${0.92 + stageProgress * 0.06})`;
        stage.style.opacity = String(0.92 + stageProgress * 0.06);
      }

      if (hint) {
        hint.style.opacity = String(Math.max(0, 1 - progress / 0.12));
      }

      const center = rect.top + rect.height / 2;
      const dist = Math.abs(center - vh / 2);
      if (dist < bestDist) { bestDist = dist; bestIdx = i; }
    });

    sections.forEach((section, i) => section.classList.toggle('is-active', i === bestIdx));

    const nextCardioActive = bestIdx === 1;
    if (nextCardioActive !== cardioActive) {
      cardioActive = nextCardioActive;
      updateCardioState(cardioActive);
    }

    setActiveIndex(bestIdx);
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
  fitScenes();
  update();

  // Text and images can change the heights after the first paint.
  function refit() {
    fitScenes();
    update();
  }
  window.addEventListener('load', refit);
  if (document.fonts) document.fonts.ready.then(refit);

  // Cubes <-> cards: one card expanded at a time. Desktop previews on hover/focus; a click/tap
  // "pins" a card open (this is what drives it on phones, where there is no hover).
  const hasHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pinnedKey = null;

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
