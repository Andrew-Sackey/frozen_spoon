/* ============================================================
   SCRIPT.JS — Frozen Spoon v2
   Hero slideshow + Loader + Nav + Mobile drawer
============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    gsap.registerPlugin(ScrollTrigger);
  
  
    // ── HELPERS ──────────────────────────────────────────────
    function q(sel)  { return document.querySelector(sel); }
    function qa(sel) { return [...document.querySelectorAll(sel)]; }
  
  
    // ================================================================
    //  PAGE LOADER
    //  Logo scales up → hold → top/bottom panels split apart
    // ================================================================
    const loaderTop    = q('#loader-top');
    const loaderBottom = q('#loader-bottom');
    const loaderLogo   = q('#loader-logo');
    const navEl        = q('#nav');
  
    const loaderTL = gsap.timeline({
      onComplete: () => {
        q('#loader').style.display = 'none';
      }
    });
  
    loaderTL
      // Logo fades + scales in — quick and crisp
      .to(loaderLogo, {
        opacity:  1,
        scale:    1,
        duration: 0.55,
        ease:     'power2.out',
      })
      // Short hold
      .to({}, { duration: 0.35 })
      // Split reveal — panels fly out with decisive expo ease
      .to(loaderTop, {
        yPercent: -100,
        duration: 0.65,
        ease:     'power4.inOut',
      })
      .to(loaderBottom, {
        yPercent: 100,
        duration: 0.65,
        ease:     'power4.inOut',
      }, '<')
      // Hero launches mid-reveal so it feels instant
      .call(() => heroInit(), null, '-=0.25')
      // Nav drops in during the reveal
      .to(navEl, {
        opacity:  1,
        y:        0,
        duration: 0.5,
        ease:     'power3.out',
      }, '-=0.4');
  
    // Set nav start state
    gsap.set(navEl, { opacity: 0, y: -60 });

    // ── Nav: glass pill + scroll behaviour ───────────────────
    // Rules:
    //  • Always visible near top (<140px)
    //  • Scroll down → hides immediately
    //  • Scroll up past ~35% of viewport → appears for 3 s then auto-hides
    //  • After auto-hiding, must scroll upward another ~35vh before appearing again
    let lastScrollY      = 0;
    let navVisible       = true;
    let autoHideTimer    = null;
    let upAccum          = 0;          // px scrolled upward since last hide
    const SECTION_PX     = () => Math.round(window.innerHeight * 0.35);

    function showNavTemp() {
      if (!navVisible) {
        navVisible = true;
        upAccum    = 0;
        gsap.to(navEl, { y: 0, duration: 0.42, ease: 'power3.out', overwrite: 'auto' });
      }
      // Restart 3-second auto-hide every time this fires
      clearTimeout(autoHideTimer);
      autoHideTimer = setTimeout(() => {
        navVisible = false;
        upAccum    = 0;   // full section-scroll required to show again
        gsap.to(navEl, { y: '-115%', duration: 0.4, ease: 'power3.in', overwrite: 'auto' });
      }, 3000);
    }

    function hideNavNow() {
      clearTimeout(autoHideTimer);
      autoHideTimer = null;
      if (navVisible) {
        navVisible = false;
        upAccum    = 0;
        gsap.to(navEl, { y: '-115%', duration: 0.38, ease: 'power3.in', overwrite: 'auto' });
      }
    }

    // Light-background sections where nav links need to turn dark
    const lightSectionIds = ['gallery', 'about'];

    window.addEventListener('scroll', () => {
      const y     = window.scrollY;
      const delta = lastScrollY - y;   // positive = scrolling up

      navEl.classList.toggle('scrolled', y > 60);

      // Flip nav links dark when scrolled into a white-bg section
      const navH = navEl.offsetHeight || 80;
      const onLight = lightSectionIds.some(id => {
        const sec = document.getElementById(id);
        if (!sec) return false;
        const r = sec.getBoundingClientRect();
        return r.top <= navH && r.bottom > navH;
      });
      navEl.classList.toggle('on-light', onLight);

      if (y < 140) {
        // Near top — always show, cancel any pending timer
        clearTimeout(autoHideTimer);
        autoHideTimer = null;
        if (!navVisible) {
          navVisible = true;
          gsap.to(navEl, { y: 0, duration: 0.42, ease: 'power3.out', overwrite: 'auto' });
        }
      } else if (delta > 0) {
        // Scrolling up — accumulate distance
        upAccum += delta;
        if (upAccum >= SECTION_PX() && !navVisible) {
          showNavTemp();
        }
      } else if (delta < -12) {
        // Scrolling down — hide and reset accumulator
        hideNavNow();
      }

      lastScrollY = y;
    }, { passive: true });


    // ================================================================
    //  MOBILE DRAWER
    // ================================================================
    const hamburger    = q('#nav-hamburger');
    const mobileDrawer = q('#mobile-drawer');
    const drawerOverlay = q('#drawer-overlay');
    const drawerCloseBtn = q('#drawer-close');
    const hamburgerSpans = hamburger.querySelectorAll('span');
    let drawerOpen = false;

    function openDrawer() {
      drawerOpen = true;
      mobileDrawer.classList.add('open');
      drawerOverlay.classList.add('open');
      gsap.to(hamburgerSpans[0], { rotation: 45,  y: 7,  duration: 0.3 });
      gsap.to(hamburgerSpans[1], { opacity: 0,           duration: 0.2 });
      gsap.to(hamburgerSpans[2], { rotation: -45, y: -7, duration: 0.3 });
    }

    function closeDrawer() {
      drawerOpen = false;
      mobileDrawer.classList.remove('open');
      drawerOverlay.classList.remove('open');
      gsap.to(hamburgerSpans[0], { rotation: 0, y: 0, duration: 0.3 });
      gsap.to(hamburgerSpans[1], { opacity: 1,         duration: 0.2 });
      gsap.to(hamburgerSpans[2], { rotation: 0, y: 0, duration: 0.3 });
    }

    // Hamburger toggles open/close
    hamburger.addEventListener('click', () => drawerOpen ? closeDrawer() : openDrawer());

    // X button inside drawer
    drawerCloseBtn.addEventListener('click', closeDrawer);

    // Click outside (on the overlay) closes drawer
    drawerOverlay.addEventListener('click', closeDrawer);

    // Any nav link inside drawer closes it
    qa('#mobile-drawer a').forEach(a => a.addEventListener('click', closeDrawer));
  
  
    // ================================================================
    //  HERO SLIDESHOW
    // ================================================================
    const slides      = qa('.hero-slide');
    const dots        = qa('.hero-dot');
    const prevBtn     = q('#hero-prev');
    const nextBtn     = q('#hero-next');
    const SLIDE_COUNT = slides.length;
    const AUTO_MS     = 5500;
  
    let current       = 0;
    let autoTimer     = null;
    let transitioning = false;
  
    // ── Transition types per slide index (exit → enter) ──────
    // 0: horizontal push right
    // 1: vertical clip up
    // 2: crossfade + scale bloom
    // 3: diagonal wipe
    // 4: full flash fade
    const transitions = ['push', 'clip-up', 'bloom', 'diagonal', 'flash'];
  
  
    // ── Subtle image motion — no zoom (keeps images sharp) ───
    function startKenBurns(slide, reset) {
      const img  = slide.querySelector('.slide-img');
      const type = img?.dataset.zoom || 'in';
  
      if (reset) gsap.set(img, { scale: 1, x: 0 });
  
      // Drift slide: gentle horizontal pan only, no scale
      if (type === 'drift') {
        gsap.to(img, {
          x:        '2%',
          duration: AUTO_MS / 1000 + 1.5,
          ease:     'none',
          overwrite: true,
        });
      }
    }
  
  
    // ── Animate slide-specific content IN ────────────────────
    function animateContentIn(slide) {
      const style = slide.dataset.style;
  
      if (style === 'bottom-bold') {
        const innerSpans = slide.querySelectorAll('.sc-line > span');
        // Wrap lines if not already wrapped
        if (innerSpans.length === 0) {
          slide.querySelectorAll('.sc-line').forEach(line => {
            const txt = line.innerHTML;
            line.innerHTML = `<span>${txt}</span>`;
          });
        }
        gsap.fromTo(slide.querySelectorAll('.sc-line > span'),
          { y: '105%' },
          { y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1, delay: 0.2 }
        );
        gsap.fromTo([slide.querySelector('.sc-eyebrow'), slide.querySelector('.sc-body'), slide.querySelector('.sc-btn')],
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1, delay: 0.5 }
        );
      }
  
      else if (style === 'split') {
        const lines = slide.querySelectorAll('.sc-headline-split .sc-line');
        lines.forEach(line => {
          if (!line.querySelector('span')) {
            const txt = line.innerHTML;
            line.innerHTML = `<span style="display:block;transform:translateY(105%)">${txt}</span>`;
          }
        });
        gsap.to(slide.querySelectorAll('.sc-headline-split .sc-line span'),
          { y: 0, duration: 0.85, ease: 'power3.out', stagger: 0.12, delay: 0.25 }
        );
        gsap.fromTo([slide.querySelector('.sc-eyebrow'), slide.querySelector('.sc-body'), slide.querySelector('.sc-btn')],
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1, delay: 0.55 }
        );
      }
  
      else if (style === 'center-bold') {
        const massiveSpan = slide.querySelector('.sc-headline-massive > span') ||
                            (() => {
                              const h = slide.querySelector('.sc-headline-massive');
                              h.innerHTML = `<span style="display:block;transform:translateY(105%)">${h.textContent}</span>`;
                              return h.querySelector('span');
                            })();
        gsap.to(slide.querySelector('.sc-script'), { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.15 });
        gsap.to(massiveSpan, { y: 0, duration: 0.85, ease: 'power3.out', delay: 0.3 });
        gsap.fromTo([slide.querySelector('.sc-body'), slide.querySelector('.sc-btn')],
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.1, delay: 0.65 }
        );
      }
  
      else if (style === 'glass-card') {
        // Card slides up
        gsap.to(slide.querySelector('.sc-glass-card'), {
          opacity: 1, y: 0, duration: 0.75, ease: 'power3.out', delay: 0.2,
        });
        // Eyebrow fades in
        gsap.fromTo(slide.querySelector('.sc-eyebrow'),
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', delay: 0.38 }
        );
        // "Happiness" clips up from overflow hidden
        const titleEl = slide.querySelector('.sc-title-happiness');
        if (titleEl && !titleEl.querySelector('span')) {
          titleEl.innerHTML = `<span>${titleEl.textContent}</span>`;
        }
        gsap.to(slide.querySelector('.sc-title-happiness > span'), {
          y: 0, duration: 0.8, ease: 'power3.out', delay: 0.48,
        });
        // Vertical bullet words stagger in from below
        gsap.to(slide.querySelectorAll('.sc-vertical-item'), {
          opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: 0.12, delay: 0.78,
        });
        // Body + CTA
        gsap.fromTo([slide.querySelector('.sc-body'), slide.querySelector('.sc-btn')],
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.1, delay: 1.1 }
        );
      }
  
      else if (style === 'minimal-caption') {
        gsap.to(slide.querySelector('.caption-line-rule'), {
          scaleX: 1, duration: 0.7, ease: 'power3.out', delay: 0.3,
        });
        gsap.to(slide.querySelector('.sc-headline-caption'), {
          opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.55,
        });
        gsap.fromTo(slide.querySelector('.sc-body-caption'),
          { opacity: 0, y: 10 },
          { opacity: 1, y:  0, duration: 0.6, ease: 'power2.out', delay: 0.85 }
        );
      }
    }
  
    // ── Reset content state on a slide ───────────────────────
    function resetContent(slide) {
      const style = slide.dataset.style;
      if (style === 'glass-card') {
        gsap.set(slide.querySelector('.sc-glass-card'), { opacity: 0, y: 30 });
        const happinessSpan = slide.querySelector('.sc-title-happiness > span');
        if (happinessSpan) gsap.set(happinessSpan, { y: '110%' });
        gsap.set(slide.querySelectorAll('.sc-vertical-item'), { opacity: 0, y: 18 });
      }
      if (style === 'center-bold') {
        gsap.set(slide.querySelector('.sc-script'), { opacity: 0 });
        const h = slide.querySelector('.sc-headline-massive > span');
        if (h) gsap.set(h, { y: '105%' });
      }
      if (style === 'minimal-caption') {
        gsap.set(slide.querySelector('.caption-line-rule'), { scaleX: 0 });
        gsap.set(slide.querySelector('.sc-headline-caption'), { opacity: 0 });
      }
      const eyebrow = slide.querySelector('.sc-eyebrow');
      const body    = slide.querySelector('.sc-body');
      const btn     = slide.querySelector('.sc-btn');
      if (eyebrow) gsap.set(eyebrow, { opacity: 0, y: 16 });
      if (body)    gsap.set(body,    { opacity: 0, y: 16 });
      if (btn)     gsap.set(btn,     { opacity: 0, y: 16 });
      slide.querySelectorAll('.sc-line > span').forEach(s => gsap.set(s, { y: '105%' }));
    }
  
  
    // ── Core transition ───────────────────────────────────────
    function goTo(next, direction) {
      if (transitioning || next === current) return;
      transitioning = true;
  
      const fromSlide = slides[current];
      const toSlide   = slides[next];
      const transType = transitions[current];
  
      // Reset target slide content
      resetContent(toSlide);
  
      // Make target visible underneath
      gsap.set(toSlide, { opacity: 1, zIndex: 1 });
      gsap.set(fromSlide, { zIndex: 2 });
  
      // Pick transition
      let tl = gsap.timeline({
        onComplete: () => {
          fromSlide.classList.remove('active');
          fromSlide.removeAttribute('style');
          toSlide.classList.add('active');
          gsap.set(toSlide, { zIndex: '' });
          current = next;
          updateUI();
          animateContentIn(toSlide);
          startKenBurns(toSlide, true);
          transitioning = false;
        }
      });
  
      if (transType === 'push') {
        const dir = direction === 'next' ? '-100%' : '100%';
        tl.to(fromSlide, { x: dir, duration: 0.75, ease: 'power3.inOut' });
        gsap.fromTo(toSlide, { x: direction === 'next' ? '100%' : '-100%' },
          { x: 0, duration: 0.75, ease: 'power3.inOut' });
      }
      else if (transType === 'clip-up') {
        tl.to(fromSlide, {
          clipPath: 'inset(0 0 100% 0)',
          duration: 0.8,
          ease: 'power3.inOut'
        });
        gsap.set(fromSlide, { clipPath: 'inset(0 0 0% 0)' });
      }
      else if (transType === 'bloom') {
        tl.to(fromSlide, { opacity: 0, scale: 1.04, duration: 0.7, ease: 'power2.in' });
        gsap.fromTo(toSlide,
          { opacity: 0, scale: 0.97 },
          { opacity: 1, scale: 1, duration: 0.7, ease: 'power2.out' }
        );
      }
      else if (transType === 'diagonal') {
        tl.to(fromSlide, {
          clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)',
          duration: 0.85,
          ease: 'power3.inOut'
        });
        gsap.set(fromSlide, { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' });
      }
      else { // flash
        tl.to(fromSlide, { opacity: 0, duration: 0.55, ease: 'power2.inOut' });
      }
    }
  
  
    // ── UI state update ───────────────────────────────────────
    function updateUI() {
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }
  
  
    // ── Auto cycle ────────────────────────────────────────────
    function startAuto() {
      clearInterval(autoTimer);
      autoTimer = setInterval(() => {
        goTo((current + 1) % SLIDE_COUNT, 'next');
      }, AUTO_MS);
    }
  
    function resetAuto() {
      clearInterval(autoTimer);
      startAuto();
    }
  
  
    // ── Controls ──────────────────────────────────────────────
    nextBtn.addEventListener('click', () => {
      goTo((current + 1) % SLIDE_COUNT, 'next');
      resetAuto();
    });
  
    prevBtn.addEventListener('click', () => {
      goTo((current - 1 + SLIDE_COUNT) % SLIDE_COUNT, 'prev');
      resetAuto();
    });
  
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        goTo(i, i > current ? 'next' : 'prev');
        resetAuto();
      });
    });
  
    // Touch swipe
    let touchX = 0;
    q('#hero').addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    q('#hero').addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) {
        goTo(dx < 0
          ? (current + 1) % SLIDE_COUNT
          : (current - 1 + SLIDE_COUNT) % SLIDE_COUNT,
          dx < 0 ? 'next' : 'prev'
        );
        resetAuto();
      }
    }, { passive: true });
  
  
    // ── Keyboard ──────────────────────────────────────────────
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { goTo((current + 1) % SLIDE_COUNT, 'next'); resetAuto(); }
      if (e.key === 'ArrowLeft')  { goTo((current - 1 + SLIDE_COUNT) % SLIDE_COUNT, 'prev'); resetAuto(); }
    });
  
  
    // ── Init ──────────────────────────────────────────────────
    function heroInit() {
      slides[0].classList.add('active');
      animateContentIn(slides[0]);
      startKenBurns(slides[0], true);
      startAuto();
    }



    /* ============================================================
     ABOUT SECTION
  ============================================================ */

  const aboutTabs        = [...document.querySelectorAll('.ab-tab')];
  const aboutPanels      = [...document.querySelectorAll('.ab-panel')];
  let   aboutCurrent     = 0;
  let   aboutTransitioning = false;

  // ── Panel entrance animation ──────────────────────────────
  function animateAboutPanelIn(panel) {
    const tl = gsap.timeline();

    // Single image panels — spring up from below
    const imgWrap = panel.querySelector('.ab-img-wrap');
    if (imgWrap) {
      tl.fromTo(imgWrap,
        { opacity: 0, y: 55, scale: 0.93, rotation: -0.8 },
        { opacity: 1, y: 0,  scale: 1,    rotation: 0,
          duration: 1.0, ease: 'back.out(1.5)' },
        0
      );
    }

    // Vibe collage: portrait rises, stacked pair slides from right
    const collageMain = panel.querySelector('.ab-collage-main');
    const collageSecs = panel.querySelectorAll('.ab-collage-sec');
    if (collageMain) {
      tl.fromTo(collageMain,
        { opacity: 0, y: 50, scale: 0.93 },
        { opacity: 1, y: 0,  scale: 1, duration: 0.9, ease: 'back.out(1.4)' },
        0
      );
    }
    if (collageSecs.length) {
      tl.fromTo(collageSecs,
        { opacity: 0, x: 36, scale: 0.92 },
        { opacity: 1, x: 0,  scale: 1,
          duration: 0.75, ease: 'back.out(1.6)', stagger: 0.18 },
        0.2
      );
    }

    // Text panel sweeps in from the right
    const textPanel = panel.querySelector('.ab-text-panel');
    if (textPanel) {
      tl.fromTo(textPanel,
        { opacity: 0, x: 56, skewX: 1.5 },
        { opacity: 1, x: 0,  skewX: 0, duration: 0.75, ease: 'power4.out' },
        0.12
      );
    }

    // Eyebrow fades in first
    const eyebrow = panel.querySelector('.ab-panel-eyebrow');
    if (eyebrow) {
      tl.fromTo(eyebrow,
        { opacity: 0, y: 10, letterSpacing: '0.35em' },
        { opacity: 1, y: 0,  letterSpacing: '0.22em', duration: 0.5, ease: 'power2.out' },
        0.32
      );
    }

    // Name/headline does a big Y reveal
    const nameOrHead = panel.querySelector('.ab-panel-name, .ab-panel-headline');
    if (nameOrHead) {
      tl.fromTo(nameOrHead,
        { opacity: 0, y: 48, letterSpacing: '0.04em' },
        { opacity: 1, y: 0,  letterSpacing: nameOrHead.classList.contains('ab-panel-name') ? '-0.03em' : '-0.022em',
          duration: 0.85, ease: 'power3.out' },
        0.42
      );
    }

    // Body text lines stagger
    const bodyEls = panel.querySelectorAll('.ab-panel-body');
    if (bodyEls.length) {
      tl.fromTo(bodyEls,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.1 },
        0.56
      );
    }

    // Stats each bounce in individually
    const stats = panel.querySelectorAll('.ab-stat');
    if (stats.length) {
      tl.fromTo(stats,
        { opacity: 0, y: 24, scale: 0.78 },
        { opacity: 1, y: 0,  scale: 1, duration: 0.55, ease: 'back.out(2.8)', stagger: 0.1 },
        0.65
      );
    }

    // Link + tags
    const extras = panel.querySelectorAll('.ab-panel-link, .ab-vibe-tags');
    if (extras.length) {
      tl.fromTo(extras,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.1 },
        0.72
      );
    }

    return tl;
  }

  // ── Tab pill squish-pop ───────────────────────────────────
  function animateTabPop(tab) {
    gsap.timeline()
      .to(tab, { scaleX: 0.82, scaleY: 1.18, duration: 0.1,  ease: 'power2.in' })
      .to(tab, { scaleX: 1.1,  scaleY: 0.9,  duration: 0.15, ease: 'power2.out' })
      .to(tab, { scaleX: 1,    scaleY: 1,    duration: 0.35, ease: 'elastic.out(1.2, 0.5)' });
  }

  // ── Welcome header scroll reveal ──────────────────────────
  ScrollTrigger.create({
    trigger: '#about',
    start:   'top 75%',
    once:    true,
    onEnter: () => {
      const headerTL = gsap.timeline();
      headerTL
        .to('.aw-eyebrow', { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })
        .to('.aw-line',    { y: 0, duration: 0.85, ease: 'power3.out', stagger: 0.15 }, 0.1)
        .to('.aw-sub',     { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.5)
        .fromTo('.ab-tab',
          { opacity: 0, y: 20, scale: 0.85 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(2)', stagger: 0.12 },
          0.6
        );
      animateAboutPanelIn(aboutPanels[0]);
    },
  });

  // ── Panel switch ──────────────────────────────────────────
  function switchAboutPanel(nextIdx) {
    if (aboutTransitioning || nextIdx === aboutCurrent) return;
    aboutTransitioning = true;

    const fromPanel = aboutPanels[aboutCurrent];
    const toPanel   = aboutPanels[nextIdx];
    const dir       = nextIdx > aboutCurrent ? 1 : -1;

    // Update tab state + squish animation
    aboutTabs.forEach((t, i) => {
      t.classList.toggle('active', i === nextIdx);
      t.setAttribute('aria-selected', i === nextIdx ? 'true' : 'false');
    });
    animateTabPop(aboutTabs[nextIdx]);

    // Slide-and-shrink old panel out
    gsap.to(fromPanel, {
      opacity: 0, x: -dir * 60, scale: 0.96, duration: 0.38, ease: 'power3.in',
      onComplete: () => {
        fromPanel.classList.remove('active');
        gsap.set(fromPanel, { x: 0, scale: 1, position: 'absolute', inset: '0' });
      },
    });

    // Prepare new panel off-screen
    gsap.set(toPanel, { opacity: 0, x: dir * 60, scale: 0.96, position: 'absolute', inset: '0' });
    toPanel.style.pointerEvents = 'none';

    setTimeout(() => {
      toPanel.classList.add('active');
      gsap.set(toPanel, { position: 'relative', inset: '' });
      gsap.to(toPanel, { opacity: 1, x: 0, scale: 1, duration: 0.55, ease: 'power3.out' });
      animateAboutPanelIn(toPanel);
      toPanel.style.pointerEvents = 'auto';
      aboutCurrent     = nextIdx;
      aboutTransitioning = false;
    }, 300);
  }

  // ── Tab click handlers ────────────────────────────────────
  aboutTabs.forEach((tab, i) => tab.addEventListener('click', () => switchAboutPanel(i)));

  /* ============================================================
     END ABOUT SECTION
  ============================================================ */




  /* ============================================================
   MENU SECTION v2
   Slot inside DOMContentLoaded in script_v2.js,
   after about section code, before the final });
============================================================ */


const MENU_DATA = {
    breakfast: {
      label: 'Breakfast',
      items: [
        { name: 'Mushroom Omelette', desc: 'Eggs, butter, mushrooms, chives and toasted bread', img: './images/mush-omellete.webp' },
        { name: 'Lebanese Labneh Sandwich', desc: 'Lebanese saj bread, labneh, tomatoes, cucumber, fresh green olives, mint leaves & extra virgin olive oil', img: './images/lebanese-sandwich.webp' },
        { name: 'Smoked Salmon Bagel', desc: 'Bagel, smoked salmon, dill cream cheese, cucumber, onions, chives, mayonnaise, salt & black pepper', img: './images/smoked-salmon.webp' },
        { name: 'Croque Madame Bagel', desc: 'Sourdough bread, ham, emmental cheese, egg, mayonnaise & béchamel sauce', img: './images/mi-croque-madame.webp' },
        { name: 'Balsamic Avocado Bagel', desc: 'Bagel, avocado, tomatoes, red onions, mayonnaise & black pepper', img: './images/bagel.webp' },
        { name: 'Granola Bowl', desc: 'Granola, fresh berries, honey and yoghurt', img: './images/men13.webp' },
        { name: 'French Toast', desc: 'French toast with ice cream or maple syrup', img: './images/french-toast.webp' },
        { name: 'American Breakfast', desc: '4 pancakes, 3 bacon, scrambled eggs & fresh orange juice', img: './images/ame-breakfast.webp' },
        { name: 'Lebanese Breakfast', desc: 'Lebanese bread, labneh with extra virgin olive oil, green olives, cucumbers, tomatoes, minced meat with eggs & hot black tea', img: './images/mi-lebanese-breakfast.webp' },
        { name: 'English Breakfast', desc: '2 toast, 2 bacon, sausage, hashbrowns, fresh tomatoes, mushrooms, baked beans, eggs & fresh juice', img: './images/men10.webp' },
      ]
    },
    salads: {
      label: 'Salads',
      items: [
        { name: 'Avocado Salad', desc: 'Creamy avocado, mixed leaves, feta, pomegranate & lemon', img: './images/sal-avocado.webp' },
        { name: 'Caesar Salad', desc: 'Crisp romaine, parmesan shavings, croutons & Caesar dressing', img: './images/sal-caesar.webp' },
      ]
    },
    sandwiches: {
      label: 'Sandwiches',
      items: [
        { name: 'Tuna, Avocado & Sweetcorn Club Sandwich', desc: 'Tuna, avocado, sweetcorn, lettuce, cucumber & mayonnaise', img: './images/tuna-sandwich.webp' },
        { name: 'Chicken, Bacon & Avocado Club Sandwich', desc: 'Chicken, bacon, avocado, black pepper, lettuce & cucumber', img: './images/mi-club-sandwich.webp' },
        { name: 'Ham & Turkey Club Sandwich', desc: 'Ham, turkey breast, white cheddar, mozzarella, tomatoes, lettuce, baby spinach, mustard & mayonnaise', img: './images/mi-turkey-sandwich.webp' },
        { name: 'Smoked Turkey Breast Sandwich', desc: 'Chicken breast, lemon, rosemary, cheese, tomatoes, lettuce & mayonnaise', img: './images/mi-smoked-turkey.webp' },
      ]
    },
    burgers: {
      label: 'Burgers',
      items: [
        { name: 'Classic Beef Burger', desc: 'Beef patty, tomatoes, lettuce, burger sauce & mayo with fries', img: './images/classic-burger.webp' },
        { name: 'Bacon Cheeseburger', desc: 'Beef patty, bacon, tomatoes, red onions, pickled cucumber slices, burger sauce & mayonnaise with fries', img: './images/mi-bacon-cheeseburger.webp' },
        { name: 'Mushroom Beef Burger', desc: 'Beef patty, sautéed mushrooms, cheddar cheese, burger sauce & mayonnaise with fries', img: './images/mi-mushroom-burger.webp' },
        { name: 'Chicken Breast Burger', desc: 'Chicken breast, lemon, rosemary & ginger with fries', img: './images/mi-chicken-burger.webp' },
      ]
    },
    alacarte: {
      label: 'À La Carte',
      items: [
        { name: 'Spicy Chicken Wings', desc: 'Crispy wings with a fiery spice rub', img: './images/spicy-chicken-wings.webp' },
        { name: 'BBQ Chicken Wings', desc: 'Slow-glazed wings in smoky BBQ sauce', img: './images/bbq.webp' },
        { name: 'Samosa', desc: 'Golden fried pastry parcels', img: './images/samosa.webp' },
        { name: 'Spring Rolls', desc: 'Crisp rolls with a vegetable filling', img: './images/springroll.webp' },
        { name: 'Chicken Alfredo', desc: 'Tagliatelle pasta, creamy Alfredo sauce, chicken breast & parmesan cheese', img: './images/mi-chicken-alfredo.webp' },
        { name: 'Meatball Spaghetti', desc: 'Spaghetti, meatballs, tomato sauce, fresh parsley & black pepper', img: './images/men16.webp' },
        { name: 'Jollof Rice & Fish', desc: 'Smoky Ghanaian jollof with grilled fish', img: '' },
        { name: 'Jollof Rice & Chicken', desc: 'Smoky Ghanaian jollof with tender chicken', img: './images/gal6.webp' },
        { name: 'Jollof Rice & Goat Meat', desc: 'Smoky Ghanaian jollof with slow-cooked goat meat', img: '' },
        { name: 'Fried Rice & Fish', desc: 'Wok-fried seasoned rice with grilled fish', img: '' },
        { name: 'Fried Rice & Chicken', desc: 'Wok-fried seasoned rice with chicken', img: './images/men22.webp' },
        { name: 'Fried Rice & Goat Meat', desc: 'Wok-fried seasoned rice with slow-cooked goat meat', img: './images/fried-rice-goat.webp' },
        { name: 'Yam Chips & Goat Meat', desc: 'Crispy yam chips paired with goat meat', img: './images/yam-goat.webp' },
        { name: 'Fish & Chips', desc: 'Golden fried fish fillet with crispy chips', img: './images/gal10.webp' },
      ]
    },
    coffee: {
      label: 'Coffee',
      items: [
        { name: 'Cappuccino', desc: 'Double espresso, steamed milk and thick velvety foam', img: './images/cappucino.webp' },
        { name: 'Americano', desc: 'Double espresso diluted with hot water — clean and grounding', img: './images/americano.webp' },
        { name: 'Espresso Single', desc: 'One shot. Pure. Nothing added.', img: './images/espresso.webp' },
        { name: 'Espresso Double', desc: 'Two shots pulled together. The afternoon reset.', img: './images/mi-espresso-double.webp' },
      ]
    },
    juices: {
      label: 'Juices',
      items: [
        { name: 'Fresh Pineapple & Mint Juice', desc: 'Cold-pressed pineapple with fresh garden mint', img: './images/pine-mint.webp' },
        { name: 'Fresh Pineapple Juice', desc: 'Pure cold-pressed pineapple', img: './images/pine.webp' },
        { name: 'Fresh Orange Juice', desc: 'Squeezed Valencia oranges, nothing added', img: './images/men18.webp' },
        { name: 'Pineapple & Ginger Juice', desc: 'Pineapple with a warming ginger kick', img: './images/pine-gin.webp' },
      ]
    },
    smoothies: {
      label: 'Smoothies',
      items: [
        { name: 'Strawberry & Banana', desc: 'Strawberry, banana, yoghurt, honey, ginger and milk', img: './images/straw-banana.webp' },
        { name: 'Berry Fusion', desc: 'Blueberry, strawberry, yoghurt, honey & milk', img: './images/berry-fusion.webp' },
        { name: 'Tropical Mojito', desc: 'Pineapple juice, lemon juice, pineapple, mint, flax seeds & spinach', img: '' },
        { name: 'Mango & Banana Blast', desc: 'Milk, mango, banana and yoghurt', img: './images/men7.webp' },
        { name: 'Mango Passion', desc: 'Orange juice, mango, yoghurt and honey', img: './images/mango-pass.webp' },
        { name: 'Raspberry Heaven', desc: 'Raspberry, blueberry, apple and mango', img: './images/mi-raspberry-heaven.webp' },
        { name: 'Pineapple Sunset', desc: 'Pineapple, papaya and mango', img: './images/mi-pineapple-sunset.webp' },
        { name: 'Organic Sunshine', desc: 'Pineapple, mango and banana', img: '' },
        { name: 'Mango & Strawberry', desc: 'Mango, strawberry and orange juice', img: './images/mango-strawberry.webp' },
        { name: 'Green Reviver', desc: 'Kale, lemon juice, orange juice and banana', img: '' },
        { name: 'Healthy Living', desc: 'Avocado, dates, banana and almond milk', img: '' },
      ]
    },
    tea: {
      label: 'Tea',
      items: [
        { name: 'English Breakfast Tea', desc: 'Bold black tea, best with a small pour of cold milk', img: './images/eng-tea.webp' },
        { name: 'Chamomile', desc: 'Dried chamomile flowers steeped slow — evening tea', img: './images/chamo.webp' },
        { name: 'Mint Tea', desc: 'Fresh garden mint, hot water, a spoon of honey', img: './images/mint-tea.webp' },
      ]
    },
    freakshakes: {
      label: 'Freakshakes',
      items: [
        { name: 'Affogato', desc: 'A shot of hot espresso poured over a scoop of vanilla ice cream', img: './images/affogato.webp' },
        { name: 'Baileys Freakshake', desc: 'An indulgent tower of cream, chocolate and Baileys', img: '' },
        { name: 'Velvet Dream', desc: 'Strawberry ice cream milkshake, red velvet cake, whipped cream & strawberry syrup', img: './images/velvet-dream.webp' },
        { name: 'Fudge Deluxe', desc: 'Chocolate milkshake, nutella, oreo pieces, chocolate syrup, brownie waffle pieces, vanilla scoop & mini pancakes', img: './images/men12.webp' },
        { name: 'Dolcé Swirl', desc: 'Caramel ice cream milkshake, mini pancakes, maple syrup, cinnamon & whipped cream', img: './images/dolce-swirl.webp' },
      ]
    },
    pancakes: {
      label: 'Pancakes',
      items: [
        { name: 'Cinnamon Pancakes', desc: 'Fluffy pancakes dusted with warm cinnamon', img: './images/cinnamon-pancakes.webp' },
        { name: 'Biscoff Pancakes', desc: 'Pancakes with biscoff spread and biscuits', img: './images/biscoff-pancakes.webp' },
        { name: 'Pancake Cone Combo', desc: 'Pancake stack with two scoops of ice cream on a cone', img: './images/men14.webp' },
        { name: 'Pancake with Ice Cream', desc: 'Soft pancake stack with a generous scoop of ice cream', img: './images/pan-ice.webp' },
      ]
    },
    waffles: {
      label: 'Waffles',
      items: [
        { name: 'Brownie Waffle', desc: 'Chocolate brownie waffles', img: './images/men5.webp' },
        { name: 'Marble Waffles', desc: 'Chocolate and vanilla waffles', img: './images/marble-waffle.webp' },
        { name: 'Waffle with Ice Cream & Syrup', desc: 'Golden waffle with ice cream and a drizzle of syrup', img: './images/men8.webp' },
        { name: 'Waffle with Ice Cream', desc: 'Golden waffle topped with a creamy scoop', img: './images/waffle-cream.webp' },
        { name: 'Waffle with Syrup', desc: 'Classic waffle with warm maple syrup', img: './images/waffle-syrup-new.webp' },
        { name: 'Plain Waffle', desc: 'A perfectly golden waffle, simply done', img: './images/mi-waffle-icecream.webp' },
      ]
    },
    icecream: {
      label: 'Ice Cream',
      items: [
        { name: 'A Scoop of Ice Cream on a Cone', desc: 'One generous scoop of your choice on a classic cone', img: './images/men24.webp' },
        { name: 'A Scoop of Ice Cream', desc: 'One generous scoop served in a cup', img: './images/mi-icecream-scoop.webp' },
      ]
    },
  };


  // ── MENU: DOM REFS ─────────────────────────────────────
  const menuTabs        = [...document.querySelectorAll('.menu-tab')];
  const menuCardsWrap   = document.getElementById('menu-cards');
  const menuActiveName  = document.getElementById('menu-active-cat-name');
  const menuItemCount   = document.getElementById('menu-item-count');
  const menuHeroBanner  = document.getElementById('menu-header');
  const menuSpotImg     = document.getElementById('menu-spotlight-img');
  const menuSpotHeadline= document.getElementById('ms-headline-text');
  const menuSpotBody    = document.getElementById('ms-body-text');

  let menuCurrentCat    = 'breakfast';
  let menuIsDragging    = false;
  let menuDragStartX    = 0;
  let menuDragScrollX   = 0;
  let menuTransitioning = false;


  // ── MENU: RENDER CARDS ─────────────────────────────────
  function renderMenuCards(catKey, animate) {
    const cat   = MENU_DATA[catKey];
    if (!cat) return;

    menuActiveName.textContent = cat.label;
    menuItemCount.textContent  = cat.items.length;

    // Build cards HTML
    menuCardsWrap.innerHTML = cat.items.map((item, i) => `
      <div class="menu-card${item.img ? '' : ' menu-card-no-img'}" data-idx="${i}">
        ${item.img ? `<img class="menu-card-img" src="${item.img}" alt="${item.name}" loading="lazy"/>` : ''}
        <div class="menu-card-overlay"></div>
        <span class="menu-card-num">${String(i+1).padStart(2,'0')}</span>
        <div class="menu-card-info">
          <p class="menu-card-name">${item.name}</p>
          <p class="menu-card-desc">${item.desc}</p>
        </div>
      </div>
    `).join('');

    // Animate cards in
    if (animate) {
      const cards = menuCardsWrap.querySelectorAll('.menu-card');
      gsap.fromTo(cards,
        { opacity: 0, y: 50, scale: 0.95 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.08,
        }
      );
    } else {
      gsap.set(menuCardsWrap.querySelectorAll('.menu-card'), {
        opacity: 1, y: 0, scale: 1
      });
    }

    // Scroll rail back to start
    menuCardsWrap.scrollLeft = 0;

    // Update spotlight with first item
    updateSpotlight(cat.items[0]);
  }


  // ── MENU: SWITCH CATEGORY ──────────────────────────────
  function switchMenuCat(newCat) {
    if (newCat === menuCurrentCat || menuTransitioning) return;
    menuTransitioning = true;

    const cards = menuCardsWrap.querySelectorAll('.menu-card');

    // Animate out
    gsap.to(cards, {
      opacity: 0,
      y: -30,
      scale: 0.95,
      duration: 0.3,
      ease: 'power2.in',
      stagger: 0.04,
      onComplete: () => {
        menuCurrentCat = newCat;
        renderMenuCards(newCat, true);
        menuTransitioning = false;
      }
    });
  }


  // ── MENU: SPOTLIGHT UPDATE ─────────────────────────────
  function updateSpotlight(item) {
    if (!item) return;

    gsap.to('#menu-spotlight-img', {
      opacity: 0,
      duration: 0.35,
      ease: 'power2.in',
      onComplete: () => {
        if (item.img) {
          menuSpotImg.src = item.img;
          menuSpotImg.alt = item.name;
          menuSpotImg.style.visibility = 'visible';
        } else {
          menuSpotImg.removeAttribute('src');
          menuSpotImg.alt = '';
          menuSpotImg.style.visibility = 'hidden';
        }
        menuSpotHeadline.innerHTML = item.name;
        menuSpotBody.textContent   = item.desc;
        gsap.to('#menu-spotlight-img', {
          opacity: item.img ? 1 : 0, duration: 0.6, ease: 'power2.out'
        });
      }
    });
  }


  // ── MENU: TAB CLICKS ──────────────────────────────────
  menuTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      menuTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      switchMenuCat(tab.dataset.cat);
    });
  });


  // ── MENU: DRAG TO SCROLL RAIL ──────────────────────────
  menuCardsWrap.addEventListener('mousedown', e => {
    menuIsDragging = true;
    menuDragStartX  = e.pageX - menuCardsWrap.offsetLeft;
    menuDragScrollX = menuCardsWrap.scrollLeft;
    menuCardsWrap.classList.add('grabbing');
  });

  menuCardsWrap.addEventListener('mousemove', e => {
    if (!menuIsDragging) return;
    e.preventDefault();
    const x    = e.pageX - menuCardsWrap.offsetLeft;
    const walk = (x - menuDragStartX) * 1.4;
    menuCardsWrap.scrollLeft = menuDragScrollX - walk;
  });

  ['mouseup','mouseleave'].forEach(evt => {
    menuCardsWrap.addEventListener(evt, () => {
      menuIsDragging = false;
      menuCardsWrap.classList.remove('grabbing');
    });
  });


  // ── MENU: SCROLL ENTRY ANIMATIONS ─────────────────────
  // Typographic header — title blurs in, then rule lines join
  ScrollTrigger.create({
    trigger: '#menu-header',
    start:   'top 78%',
    once:    true,
    onEnter: () => {
      // Title rises and unblurs
      gsap.to('.mhdr-title', {
        opacity: 1, y: 0, filter: 'blur(0px)',
        duration: 1.4, ease: 'power3.out',
        onComplete: () => {
          // Diamond snaps in, then lines animate via CSS
          document.querySelector('.mhdr-rule')?.classList.add('is-visible');
        }
      });
    },
  });

  // Menu body: left panel + first cards
  ScrollTrigger.create({
    trigger: '#menu-body',
    start:   'top 80%',
    once:    true,
    onEnter: () => {
      gsap.fromTo('#menu-left-inner > *',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08 }
      );
      renderMenuCards('breakfast', true);

      // Tab strip
      gsap.fromTo('#menu-tab-strip',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.3 }
      );

      // Drag hint
      gsap.fromTo('#menu-drag-hint',
        { opacity: 0 },
        { opacity: 1, duration: 0.5, delay: 0.7 }
      );
    },
  });

  // Spotlight section
  ScrollTrigger.create({
    trigger: '#menu-spotlight',
    start:   'top 80%',
    once:    true,
    onEnter: () => {
      gsap.fromTo('#menu-spotlight-text > *',
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out', stagger: 0.1 }
      );
      gsap.fromTo('#menu-spotlight-img',
        { scale: 1.08 },
        { scale: 1.04, duration: 1.4, ease: 'power3.out' }
      );
    },
  });

  // ── "Order via WhatsApp" spotlight CTA ────────────────────
  const msCtaLink = document.getElementById('ms-cta-link');
  if (msCtaLink) {
    msCtaLink.addEventListener('click', function (e) {
      e.preventDefault();

      // Read whichever dish is currently spotlighted
      const dish = (menuSpotHeadline && menuSpotHeadline.textContent.trim()) || 'your menu';
      const msg  = `Hi Frozen Spoon! 👋 I'd love to order the *${dish}*. Could you help me place an order? Thank you!`;
      const url  = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;

      // Quick button pulse
      gsap.timeline()
        .to(msCtaLink, { scale: 0.94, duration: 0.1 })
        .to(msCtaLink, { scale: 1,    duration: 0.25, ease: 'back.out(2)' });

      setTimeout(() => window.open(url, '_blank'), 200);
    });
  }

/* ============================================================
   END MENU SECTION v2
============================================================ */


  /* ============================================================
     STATEMENT SECTION — full-screen video sequence
  ============================================================ */

  // ── Video playlist ─────────────────────────────────────────
  // Add your .mp4 files inside a /videos folder.
  // Currently v2–v4 are .MP4 (uppercase) — adjust extensions to match your files.
  const STMT_VIDEOS = [
    { src: './videos/v1.MP4',  caption: 'Sunny days.'           },
    { src: './videos/v2.MP4',  caption: 'Make memories.' },
    { src: './videos/v3.MP4',  caption: 'Made cold.'             },
    { src: './videos/v4.MP4',  caption: 'Worth returning for.'   },
    { src: './videos/v5.mp4',  caption: 'Every detail counts.'   },
    { src: './videos/v6.mp4',  caption: 'Crafted with care.'     },
    { src: './videos/v7.MP4',  caption: 'Freshness first.'       },
    { src: './videos/v8.MP4',  caption: 'Come as you are.'       },
  ];

  const stmtSection     = q('#statement');
  const stmtVideo       = q('#stmt-video');
  const stmtFlash       = q('#stmt-flash');
  const stmtCapInner    = q('#stmt-caption-inner');
  const stmtCaption     = q('#stmt-caption');
  const stmtProgFill    = q('#stmt-progress-fill');
  const stmtPauseIcon   = q('#stmt-pause-icon');
  const stmtOverlay     = q('#stmt-overlay');
  const stmtMuteBtn     = q('#stmt-mute');

  let stmtIdx     = 0;
  let stmtStarted = false;
  let stmtBusy    = false;   // lock during transitions
  let stmtMuted   = true;    // starts muted (autoplay policy)

  // ── Helpers ───────────────────────────────────────────────
  const stmtWait = ms => new Promise(r => setTimeout(r, ms));

  function stmtShowCaption(text) {
    stmtCapInner.innerHTML = '';
    const chars = [...text].map(ch => {
      const s = document.createElement('span');
      s.textContent = ch === ' ' ? '\u00A0' : ch;
      gsap.set(s, { opacity: 0, y: 28 });
      stmtCapInner.appendChild(s);
      return s;
    });
    gsap.to(chars, {
      opacity: 1, y: 0,
      duration: 0.55, ease: 'power3.out',
      stagger: 0.032, delay: 0.1,
    });
  }

  async function stmtHideCaption() {
    await gsap.to(stmtCapInner, {
      opacity: 0, y: -14,
      duration: 0.38, ease: 'power2.in',
    }).then();
    stmtCapInner.innerHTML = '';
    gsap.set(stmtCapInner, { opacity: 1, y: 0 });
  }

  function stmtUpdateProgress() {
    if (!stmtVideo.duration) return;
    const seg  = 100 / STMT_VIDEOS.length;
    const fill = stmtIdx * seg + (stmtVideo.currentTime / stmtVideo.duration) * seg;
    stmtProgFill.style.width = fill + '%';
  }

  // ── Transition to next video ──────────────────────────────
  async function stmtNext() {
    if (stmtBusy) return;
    stmtBusy = true;

    // 1. Caption exits first
    await stmtHideCaption();
    await stmtWait(120);

    // 2. Flash to black (slow blink)
    gsap.to(stmtFlash, { opacity: 1, duration: 0.04, ease: 'none' });
    await stmtWait(80);

    // 3. Find next loadable video (skip placeholders not yet added)
    const total = STMT_VIDEOS.length;
    let tried = 0;
    let ok = false;
    while (!ok && tried < total) {
      stmtIdx = (stmtIdx + 1) % total;
      ok = await stmtLoad(stmtIdx);
      tried++;
    }
    stmtVideo.play().catch(() => {});

    // 4. Fade up from black
    gsap.to(stmtFlash, { opacity: 0, duration: 0.5, ease: 'power2.out' });
    await stmtWait(350);

    // 5. New caption
    stmtShowCaption(STMT_VIDEOS[stmtIdx].caption);
    stmtBusy = false;
  }

  // ── Load a video by index, skipping missing files ────────
  function stmtLoad(idx) {
    return new Promise((resolve) => {
      stmtVideo.src = STMT_VIDEOS[idx].src;
      stmtVideo.load();
      stmtVideo.muted = stmtMuted;

      const onOk  = () => { cleanup(); resolve(true); };
      const onErr = () => { cleanup(); resolve(false); };

      function cleanup() {
        stmtVideo.removeEventListener('canplay', onOk);
        stmtVideo.removeEventListener('error',   onErr);
      }

      stmtVideo.addEventListener('canplay', onOk,  { once: true });
      stmtVideo.addEventListener('error',   onErr, { once: true });

      // Timeout fallback — treat as missing after 4 s
      setTimeout(() => { cleanup(); resolve(false); }, 4000);
    });
  }

  // ── Kick off the sequence ─────────────────────────────────
  async function stmtInit() {
    if (stmtStarted) return;
    stmtStarted = true;

    // Find first loadable video
    let startIdx = 0;
    for (let i = 0; i < STMT_VIDEOS.length; i++) {
      const ok = await stmtLoad(i);
      if (ok) { startIdx = i; break; }
    }
    stmtIdx = startIdx;

    stmtVideo.play().catch(() => {});
    stmtWait(400).then(() => stmtShowCaption(STMT_VIDEOS[stmtIdx].caption));

    stmtVideo.addEventListener('ended', stmtNext);
    stmtVideo.addEventListener('timeupdate', stmtUpdateProgress);
  }

  // ── Click to pause / resume ───────────────────────────────
  stmtOverlay.addEventListener('click', () => {
    if (stmtVideo.paused) {
      stmtVideo.play();
      gsap.to(stmtPauseIcon, {
        opacity: 0, scale: 0.75,
        duration: 0.3, ease: 'power2.in',
      });
    } else {
      stmtVideo.pause();
      gsap.fromTo(stmtPauseIcon,
        { opacity: 0, scale: 0.7 },
        { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2.2)' }
      );
    }
  });

  // ── Mute / unmute toggle ──────────────────────────────────
  stmtMuteBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // don't trigger the pause overlay
    stmtMuted = !stmtMuted;
    stmtVideo.muted = stmtMuted;
    stmtMuteBtn.classList.toggle('unmuted', !stmtMuted);
    // Brief scale pulse for feedback
    gsap.fromTo(stmtMuteBtn,
      { scale: 0.85 },
      { scale: 1, duration: 0.3, ease: 'back.out(2)' }
    );
  });

  // ── Auto-mute when user scrolls away from the section ────
  function stmtForceMute() {
    if (!stmtMuted) {
      stmtMuted = true;
      stmtVideo.muted = true;
      stmtMuteBtn.classList.remove('unmuted');
    }
  }

  ScrollTrigger.create({
    trigger: '#statement',
    start:   'top bottom',   // section enters viewport
    end:     'bottom top',   // section fully leaves viewport
    onLeave:     stmtForceMute,   // scrolled past (going down)
    onLeaveBack: stmtForceMute,   // scrolled past (going up)
  });

  // ── Section entry via ScrollTrigger ──────────────────────
  ScrollTrigger.create({
    trigger: '#statement',
    start:   'top 88%',
    once:    true,
    onEnter: () => {
      // Section scales up from 95% — "revealed" effect
      gsap.fromTo(stmtSection,
        { scale: 0.95, borderRadius: '20px' },
        { scale: 1,    borderRadius: '0px',
          duration: 1.1, ease: 'power3.out',
          onComplete: stmtInit,
        }
      );
      // Caption clips in from below as section opens
      gsap.to(stmtCaption, {
        clipPath: 'inset(0% 0 0% 0)',
        duration: 0.85, ease: 'power3.out', delay: 0.55,
      });
    },
  });

  /* ============================================================
     END STATEMENT SECTION
  ============================================================ */




  /* ============================================================
   GALLERY SECTION v2
   Slot inside DOMContentLoaded in script_v2.js,
   after menu section code, before the final });
============================================================ */


  // ── GALLERY: DOM REFS ──────────────────────────────────
  const galCards    = [...document.querySelectorAll('.gal-card')];
  const galLightbox = document.getElementById('gal-lightbox');
  const galBackdrop = document.getElementById('gal-lb-backdrop');
  const galLbImg    = document.getElementById('gal-lb-img');
  const galLbPrev   = document.getElementById('gal-lb-prev');
  const galLbNext   = document.getElementById('gal-lb-next');
  const galLbClose  = document.getElementById('gal-lb-close');
  const galLbCounter= document.getElementById('gal-lb-counter');

  let galLbCurrent  = 0;
  const galImgSrcs  = galCards.map(c => c.querySelector('img').src);



  // ── GALLERY: HEADER REVEAL ─────────────────────────────
  ScrollTrigger.create({
    trigger: '#gallery',
    start:   'top 75%',
    once:    true,
    onEnter: () => {
      gsap.to('.gal-eyebrow', {
        opacity: 1, y: 0, duration: 0.5, ease: 'power2.out',
      });
      gsap.to('.gal-hl-line', {
        y: 0, duration: 0.85, ease: 'power3.out', stagger: 0.14, delay: 0.1,
      });
      gsap.to('.gal-sub', {
        opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.4,
      });
    },
  });


  // ── GALLERY: GRID STAGGER REVEAL ──────────────────────
  // Cards arrange themselves in a wave — left-to-right, top-to-bottom
  ScrollTrigger.create({
    trigger:  '#gallery-grid',
    start:    'top 82%',
    once:     true,
    onEnter:  () => {
      gsap.to(galCards, {
        opacity:  1,
        scale:    1,
        duration: 0.65,
        ease:     'power3.out',
        stagger: {
          amount: 0.9,       // total stagger time spread across all cards
          from:   'start',   // left-to-right wave
          grid:   'auto',
        },
      });
    },
  });


  // ── GALLERY: LIGHTBOX OPEN ─────────────────────────────
  function openLightbox(idx) {
    galLbCurrent = idx;
    galLbImg.src = galImgSrcs[idx];
    galLbCounter.textContent = `${idx + 1} / ${galCards.length}`;

    galBackdrop.classList.add('visible');
    galLightbox.classList.add('visible');
    document.body.style.overflow = 'hidden';

    gsap.fromTo('#gal-lb-img-wrap',
      { scale: 0.9, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, ease: 'power3.out' }
    );
  }

  function closeLightbox() {
    gsap.to('#gal-lb-img-wrap', {
      scale:   0.93,
      opacity: 0,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        galBackdrop.classList.remove('visible');
        galLightbox.classList.remove('visible');
        document.body.style.overflow = '';
        galLbImg.src = '';
      },
    });
  }

  function lbGoTo(nextIdx) {
    const clamped = (nextIdx + galCards.length) % galCards.length;
    gsap.to('#gal-lb-img', {
      opacity: 0,
      duration: 0.18,
      ease: 'power2.in',
      onComplete: () => {
        galLbCurrent = clamped;
        galLbImg.src = galImgSrcs[clamped];
        galLbCounter.textContent = `${clamped + 1} / ${galCards.length}`;
        gsap.to('#gal-lb-img', {
          opacity: 1, duration: 0.25, ease: 'power2.out',
        });
      },
    });
  }


  // ── GALLERY: EVENT BINDINGS ────────────────────────────
  galCards.forEach((card, i) => {
    card.addEventListener('click', () => openLightbox(i));
  });

  galLbClose.addEventListener('click',   closeLightbox);
  galBackdrop.addEventListener('click',  closeLightbox);
  galLbPrev.addEventListener('click', () => lbGoTo(galLbCurrent - 1));
  galLbNext.addEventListener('click', () => lbGoTo(galLbCurrent + 1));

  // Keyboard nav
  document.addEventListener('keydown', e => {
    if (!galLightbox.classList.contains('visible')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowRight')  lbGoTo(galLbCurrent + 1);
    if (e.key === 'ArrowLeft')   lbGoTo(galLbCurrent - 1);
  });

  // Touch swipe in lightbox
  let galLbTouchX = 0;
  galLightbox.addEventListener('touchstart', e => {
    galLbTouchX = e.touches[0].clientX;
  }, { passive: true });

  galLightbox.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - galLbTouchX;
    if (Math.abs(dx) > 50) {
      lbGoTo(dx < 0 ? galLbCurrent + 1 : galLbCurrent - 1);
    }
  }, { passive: true });

/* ============================================================
   END GALLERY SECTION v2
============================================================ */




/* ============================================================
   SERVICES / WHAT WE DO SECTION v2
   Slot inside DOMContentLoaded in script_v2.js,
   after gallery section code, before the final });
============================================================ */


  // ── SERVICES: INTRO REVEAL ─────────────────────────────
  // Split each headline line into word spans for staggered reveal
  qa('.svc-hl-line').forEach(line => {
    const words = line.innerHTML.trim().split(/(\s+)/);
    line.innerHTML = words.map(w =>
      w.trim() ? `<span class="svc-word" style="display:inline-block;overflow:hidden;vertical-align:bottom"><span class="svc-word-inner" style="display:inline-block;transform:translateY(110%)">${w}</span></span>` : w
    ).join('');
  });

  ScrollTrigger.create({
    trigger: '.svc-intro',
    start:   'top 72%',
    once:    true,
    onEnter: () => {
      // Eyebrow fades up
      gsap.to('.svc-intro-eyebrow', {
        opacity: 1, y: 0, duration: 0.6, ease: 'power3.out',
      });

      // Words slide up from clip with blur — staggered per word
      const wordInners = [...document.querySelectorAll('.svc-word-inner')];
      gsap.fromTo(wordInners,
        { y: '110%', opacity: 0, filter: 'blur(6px)' },
        {
          y: 0, opacity: 1, filter: 'blur(0px)',
          duration: 1.0, ease: 'power4.out',
          stagger: 0.07, delay: 0.15,
        }
      );
    },
  });


  // ── SERVICES ACCORDION ───────────────────────────────────
  const accItems = [...qa('.svc-acc-item')];
  let openAccItem = null;

  function openAcc(item) {
    if (openAccItem === item) return;
    if (openAccItem) closeAcc(openAccItem);

    const panel   = item.querySelector('.svc-acc-panel');
    const content = item.querySelector('.svc-acc-content');
    const icon    = item.querySelector('.svc-acc-icon');
    const row     = item.querySelector('.svc-acc-row');

    item.classList.add('open');
    row.setAttribute('aria-expanded', 'true');

    // Animate panel open (GSAP supports height:'auto')
    gsap.to(panel, { height: 'auto', duration: 0.6, ease: 'power3.inOut' });

    // Rotate arrow
    gsap.to(icon, { rotation: 180, duration: 0.4, ease: 'power2.out' });

    // Fade + slide content in
    gsap.fromTo(content,
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', delay: 0.25 }
    );

    // Settle image zoom
    gsap.to(item.querySelector('.svc-acc-img img'), {
      scale: 1.0, duration: 0.9, ease: 'power3.out', delay: 0.2,
    });

    openAccItem = item;
  }

  function closeAcc(item) {
    const panel   = item.querySelector('.svc-acc-panel');
    const content = item.querySelector('.svc-acc-content');
    const icon    = item.querySelector('.svc-acc-icon');
    const row     = item.querySelector('.svc-acc-row');

    item.classList.remove('open');
    row.setAttribute('aria-expanded', 'false');

    gsap.to(content, { opacity: 0, duration: 0.18, ease: 'power2.in' });
    gsap.to(panel,   { height: 0,  duration: 0.5,  ease: 'power3.inOut', delay: 0.1 });
    gsap.to(icon,    { rotation: 0, duration: 0.35, ease: 'power2.out' });

    openAccItem = null;
  }

  accItems.forEach(item => {
    item.querySelector('.svc-acc-row').addEventListener('click', () => {
      if (item.classList.contains('open')) {
        closeAcc(item);
      } else {
        openAcc(item);
      }
    });
  });

  // Open first item when accordion scrolls into view
  ScrollTrigger.create({
    trigger: '#svc-accordion',
    start:   'top 72%',
    once:    true,
    onEnter: () => openAcc(accItems[0]),
  });

/* ============================================================
   END SERVICES / WHAT WE DO SECTION v2
============================================================ */





/* ============================================================
   CONTACT / RESERVATION SECTION v2
   Slot inside DOMContentLoaded in script_v2.js,
   after services section code, before the final });
============================================================ */


  // ── CONTACT: SCROLL ENTRY ANIMATIONS ──────────────────
  ScrollTrigger.create({
    trigger: '#contact',
    start:   'top 75%',
    once:    true,
    onEnter: () => {
      gsap.to('.ct-eyebrow', {
        opacity: 1, y: 0, duration: 0.5, ease: 'power2.out',
      });
      gsap.to('.ct-hl-line', {
        y: 0, duration: 0.85, ease: 'power3.out', stagger: 0.15, delay: 0.1,
      });
    },
  });

  ScrollTrigger.create({
    trigger: '#ct-body',
    start:   'top 80%',
    once:    true,
    onEnter: () => {
      // Form column
      gsap.fromTo('#ct-form-col > *',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out', stagger: 0.09 }
      );
      // Info column
      gsap.fromTo('#ct-info-col > *, .ct-info-block',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08, delay: 0.15 }
      );
    },
  });


  // ── CONTACT: WHATSAPP RESERVATION ─────────────────────
  const reservationForm = document.getElementById('reservation-form');
  const WA_NUMBER = '233557388773';   // International format, no +

  if (reservationForm) {
    reservationForm.addEventListener('submit', e => {
      e.preventDefault();

      const name  = document.getElementById('rf-name').value.trim();
      const date  = document.getElementById('rf-date').value;
      const time  = document.getElementById('rf-time').value;
      const party = document.getElementById('rf-party').value;
      const notes = document.getElementById('rf-notes').value.trim();

      // Basic validation
      let valid = true;
      ['rf-name', 'rf-date', 'rf-time', 'rf-party'].forEach(id => {
        const el = document.getElementById(id);
        if (!el.value.trim()) {
          el.classList.add('invalid');
          valid = false;
        } else {
          el.classList.remove('invalid');
        }
      });

      if (!valid) {
        // Shake the button
        gsap.to('#rf-submit', {
          x: [-6, 6, -5, 5, -3, 3, 0],
          duration: 0.4,
          ease: 'power1.inOut',
        });
        return;
      }

      // Format date nicely
      let formattedDate = date;
      try {
        formattedDate = new Date(date).toLocaleDateString('en-GB', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
      } catch(e) {}

      // Format time nicely
      let formattedTime = time;
      try {
        const [h, m] = time.split(':');
        const d = new Date();
        d.setHours(+h, +m);
        formattedTime = d.toLocaleTimeString('en-GB', {
          hour: '2-digit', minute: '2-digit', hour12: true
        });
      } catch(e) {}

      // Build WhatsApp message
      const message = [
        'Hi Frozen Spoon! 👋 I would like to make a reservation.',
        '',
        `*Name:* ${name}`,
        `*Date:* ${formattedDate}`,
        `*Time:* ${formattedTime}`,
        `*Party size:* ${party} ${parseInt(party) === 1 ? 'person' : 'people'}`,
        notes ? `*Special requests:* ${notes}` : null,
        '',
        'Please confirm when available. Thank you!',
      ].filter(l => l !== null).join('\n');

      // Animate button before opening WA
      gsap.timeline()
        .to('#rf-submit', { scale: 0.96, duration: 0.12 })
        .to('#rf-submit', { scale: 1.0, duration: 0.2, ease: 'back.out(2)' });

      // Small delay then open WhatsApp
      setTimeout(() => {
        const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      }, 250);
    });

    // Remove invalid class on input
    reservationForm.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('input', () => el.classList.remove('invalid'));
    });
  }

/* ============================================================
   END CONTACT / RESERVATION SECTION v2
============================================================ */


/* ============================================================
   TESTIMONIALS — entrance animation
============================================================ */
  (function initTestimonials() {
    const tsmSection = document.querySelector('#testimonials');
    if (!tsmSection) return;

    // Entrance: header fades + slides up, feed scales from 96%
    gsap.fromTo('#testimonials .tsm-header', {
      opacity: 0,
      y: 48
    }, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '#testimonials',
        start: 'top 78%',
        toggleActions: 'play none none none'
      }
    });

    gsap.fromTo('#testimonials .tsm-feed', {
      opacity: 0,
      scale: 0.96,
      y: 32
    }, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 1.1,
      ease: 'power3.out',
      delay: 0.18,
      scrollTrigger: {
        trigger: '#testimonials',
        start: 'top 72%',
        toggleActions: 'play none none none'
      }
    });
  })();
/* ============================================================
   END TESTIMONIALS
============================================================ */


/* ============================================================
   FOOTER — entrance animations
============================================================ */
  (function initFooter() {
    if (!document.querySelector('#footer')) return;

    // Logo drop in
    gsap.fromTo('.ft-logo-link', {
      opacity: 0, y: 28, scale: .9
    }, {
      opacity: 1, y: 0, scale: 1, duration: .9, ease: 'power3.out',
      scrollTrigger: { trigger: '#footer', start: 'top 85%', toggleActions: 'play none none none' }
    });

    // Tagline lines clip up one by one
    gsap.fromTo('.ft-tag-line', {
      opacity: 0, y: 24
    }, {
      opacity: 1, y: 0, duration: .75, ease: 'power3.out', stagger: .18, delay: .3,
      scrollTrigger: { trigger: '#footer', start: 'top 82%', toggleActions: 'play none none none' }
    });

    // Grid columns stagger in
    gsap.fromTo('.ft-col', {
      opacity: 0, y: 32
    }, {
      opacity: 1, y: 0, duration: .8, ease: 'power3.out', stagger: .1, delay: .2,
      scrollTrigger: { trigger: '.ft-grid', start: 'top 88%', toggleActions: 'play none none none' }
    });

    // Bottom bar
    gsap.fromTo('.ft-bottom', {
      opacity: 0
    }, {
      opacity: 1, duration: .7, ease: 'power2.out', delay: .5,
      scrollTrigger: { trigger: '.ft-bottom', start: 'top 95%', toggleActions: 'play none none none' }
    });
  })();
/* ============================================================
   END FOOTER
============================================================ */

  
  }); // DOMContentLoaded