/* Duval Plomberie, direction b « L'atelier ».
   Contenu visible sans JS ; GSAP + ScrollTrigger uniquement pour le mouvement. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var q = function (s, r) { return (r || document).querySelector(s); };
  var qa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  doc.classList.add('js');

  /* En-tête : transparent sur le hero, crème dès que la page défile (IntersectionObserver, pas d'écouteur scroll) */
  var hdr = q('#hdr');
  var sentinel = q('#top-sentinel');
  if (hdr && sentinel && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      hdr.classList.toggle('is-solid', !e[0].isIntersecting);
    }).observe(sentinel);
  }

  /* Menu */
  var menuBtn = q('.menu-btn');
  var menu = q('#menu-panel');
  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    hdr.classList.toggle('menu-open', open);
    menuBtn.textContent = open ? 'Fermer' : 'Menu';
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () { setMenu(menu.hidden); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); }
    });
  }

  /* Formulaire (maquette : validation locale, aucun envoi) */
  var form = q('#devis-form');
  if (form) {
    var rules = [
      { id: 'f-nom', err: 'e-nom', ok: function (v) { return v.trim().length > 1; }, msg: 'Indiquez votre nom.' },
      { id: 'f-tel', err: 'e-tel', ok: function (v) { return v.replace(/\D/g, '').length >= 10; }, msg: 'Indiquez un numéro pour que je puisse vous rappeler.' },
      { id: 'f-ville', err: 'e-ville', ok: function (v) { return v.trim().length > 1; }, msg: 'Indiquez votre commune.' }
    ];
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var first = null;
      rules.forEach(function (r) {
        var input = document.getElementById(r.id);
        var field = input.closest('.field');
        var err = document.getElementById(r.err);
        if (!r.ok(input.value)) {
          field.setAttribute('data-error', '');
          input.setAttribute('aria-invalid', 'true');
          err.textContent = r.msg;
          if (!first) first = input;
        } else {
          field.removeAttribute('data-error');
          input.removeAttribute('aria-invalid');
          err.textContent = '';
        }
      });
      var status = q('.form-status', form);
      if (first) { first.focus(); status.textContent = ''; return; }
      var btn = q('button[type="submit"]', form);
      btn.textContent = 'Envoi…';
      setTimeout(function () {
        btn.textContent = 'Envoyer ma demande de devis';
        status.textContent = 'Merci, c’est reçu. Je vous rappelle pendant mes horaires d’ouverture. Si c’est urgent, appelez le 05 61 23 45 67.';
        form.reset();
      }, 700);
    });
  }

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  var mm = gsap.matchMedia();
  var NOMOTION = '(prefers-reduced-motion: no-preference)';

  /* Number ticker « 4,8 » : une seule fois (les deux couches du hero) */
  mm.add(NOMOTION, function () {
    var els = qa('[data-count]');
    if (!els.length) return;
    var o = { v: 0 };
    els.forEach(function (el) { el.textContent = '0,0'; });
    gsap.to(o, {
      v: 4.8, duration: 1.2, delay: 0.6, ease: 'power2.out',
      onUpdate: function () {
        var s = o.v.toFixed(1).replace('.', ',');
        els.forEach(function (el) { el.textContent = s; });
      }
    });
  });

  /* HERO WAOUH (≥ 768 px) : la photo plein cadre se contracte en bande arrondie.
     Deux couches de texte (crème / blanc) découpées par le même clip-path : le texte
     passe du blanc à l'encre exactement au bord de la photo. */
  mm.add('(min-width: 768px) and ' + NOMOTION, function () {
    var stage = q('.hero-stage');
    var photo = q('.hero-photo');
    var light = q('.hero-copy--light');
    var inner = q('.hero-copy--dark .eyebrow');
    var img = q('.hero-photo img');
    var geo = { t: 0, b: 0, s: 0, r: 16 };
    var state = { p: 0 };

    function measure() {
      var rem = parseFloat(getComputedStyle(doc).fontSize) || 16;
      var H = stage.clientHeight;
      var top = inner.getBoundingClientRect().top - stage.getBoundingClientRect().top;
      var bandBottom = top - 1.25 * rem;
      var bandH = Math.max(Math.min(0.18 * H, bandBottom - hdr.offsetHeight - rem), 4 * rem);
      geo.t = Math.max(bandBottom - bandH, 0);
      geo.b = H - bandBottom;
      geo.s = Math.max(2 * rem, 0);
      geo.r = rem;
    }
    function apply() {
      var p = state.p;
      var v = 'inset(' + (geo.t * p).toFixed(1) + 'px ' + (geo.s * p).toFixed(1) + 'px ' + (geo.b * p).toFixed(1) + 'px ' + (geo.s * p).toFixed(1) + 'px round ' + (geo.r * p).toFixed(1) + 'px)';
      photo.style.clipPath = v;
      light.style.clipPath = v;
    }
    measure();
    apply();

    gsap.timeline({
      scrollTrigger: {
        trigger: stage,
        start: 'top top',
        end: function () { return '+=' + Math.round(window.innerHeight * 0.8); },
        pin: true,
        scrub: 0.5,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        refreshPriority: 2,
        onRefresh: function () { measure(); apply(); }
      }
    })
      .to(state, { p: 1, ease: 'power1.inOut', duration: 1, onUpdate: apply }, 0)
      .fromTo(img, { scale: 1 }, { scale: 1.1, ease: 'none', duration: 1 }, 0);

    return function () {
      photo.style.clipPath = '';
      light.style.clipPath = '';
    };
  });

  /* HERO mobile : photo 62 svh, texte dessous ; au premier défilement la photo devient une bande arrondie */
  mm.add('(max-width: 767px) and ' + NOMOTION, function () {
    var photo = q('.hero-photo');
    gsap.fromTo(photo,
      { clipPath: 'inset(0% 0px 0% 0px round 0px)' },
      {
        clipPath: 'inset(24% 16px 24% 16px round 16px)', ease: 'none',
        scrollTrigger: { trigger: photo, start: 'top top', end: 'bottom top', scrub: true }
      });
  });

  /* SCÈNE URGENCE (≥ 768 px) : épinglée ≈ 4 écrans, filet cuivre, 4 étapes une à une */
  mm.add('(min-width: 768px) and ' + NOMOTION, function () {
    var stage = q('.scene-stage');
    var fill = q('.scene-line i');
    var head = qa('.scene-head > *');
    var steps = qa('.step');
    var cta = q('.btn-final');
    var ring = q('.btn-final .ring rect');
    var fillbg = q('.btn-final .fillbg');
    var out = 'power2.out';

    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: stage,
        start: 'top top',
        end: function () { return '+=' + Math.round(window.innerHeight * 3.8); },
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });
    tl.fromTo(fill, { scaleX: 0 }, { scaleX: 1, duration: 4 }, 0);
    tl.fromTo(head, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, stagger: 0.1, ease: out }, 0);

    steps.forEach(function (s, i) {
      var num = q('.num', s);
      var rest = qa('h3, p', s);
      var t = i + 0.1;
      tl.fromTo(num, { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: out }, t);
      tl.fromTo(rest, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, stagger: 0.08, ease: out }, t + 0.1);
      if (i > 0) tl.to(steps[i - 1], { opacity: i === 3 ? 0.35 : 0.28, duration: 0.3, ease: out }, t);
      if (i > 1) tl.to(steps[i - 2], { opacity: 0.14, duration: 0.3, ease: out }, t);
    });

    tl.fromTo(cta, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.25, ease: out }, 3.3);
    tl.fromTo(ring, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.45 }, 3.35);
    tl.fromTo(fillbg, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: out }, 3.8);
    tl.to({}, { duration: 0.15 }, 4);
  });

  /* SCÈNE URGENCE mobile : étapes empilées, chaque chiffre monte quand il entre dans l'écran (sans épinglage) */
  mm.add('(max-width: 767px) and ' + NOMOTION, function () {
    gsap.fromTo('.scene-line i', { scaleX: 0 }, {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: '.scene-line', start: 'top 85%', end: 'top 35%', scrub: true }
    });
    qa('.step').forEach(function (s) {
      var num = q('.num', s);
      var rest = qa('h3, p', s);
      gsap.set(num, { y: 32, opacity: 0 });
      gsap.set(rest, { y: 16, opacity: 0 });
      ScrollTrigger.create({
        trigger: s, start: 'top 85%', once: true,
        onEnter: function () {
          gsap.timeline()
            .to(num, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' })
            .to(rest, { y: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power2.out' }, 0.1);
        }
      });
    });
  });

  /* Signature : le fondu vertical. Titre, puis contenu en cascade (400 ms, power2.out, 100 ms) */
  mm.add(NOMOTION, function () {
    var items = qa('.rv');
    gsap.set(items, { opacity: 0, y: 24 });
    ScrollTrigger.batch(items, {
      start: 'top 90%',
      once: true,
      interval: 0.1,
      batchMax: 6,
      onEnter: function (els) {
        gsap.to(els, { opacity: 1, y: 0, duration: 0.45, stagger: 0.1, ease: 'power2.out', clearProps: 'transform,opacity' });
      }
    });
  });

  /* Parallaxe douce des photos (ordinateur, transform seul) */
  mm.add('(min-width: 768px) and ' + NOMOTION, function () {
    qa('.ph').forEach(function (ph) {
      var par = q('.ph-par', ph);
      if (!par) return;
      gsap.fromTo(par, { yPercent: -4 }, {
        yPercent: 4, ease: 'none',
        scrollTrigger: { trigger: ph, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  });

  /* Recalcul quand les polices et les images sont prêtes */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
