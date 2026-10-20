/* Duval Plomberie — direction a « Le tracé bleu »
   Contenu visible sans JS. GSAP + ScrollTrigger ne servent qu'au mouvement :
   aucun écouteur scroll, seulement transform / opacity / clip-path / tracé SVG. */
(function () {
  'use strict';
  var doc = document.documentElement;

  /* ---------- Menu mobile ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var menu = document.getElementById('menu-panel');
  function closeMenu() { menuBtn.setAttribute('aria-expanded', 'false'); menu.hidden = true; }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () {
      var open = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!open));
      menu.hidden = open;
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { closeMenu(); menuBtn.focus(); }
    });
  }

  /* ---------- Formulaire (maquette : validation locale, aucun envoi) ---------- */
  var form = document.getElementById('devis-form');
  if (form) {
    var rules = [
      { id: 'f-nom', err: 'e-nom', test: function (v) { return v.trim().length > 1; }, msg: 'Indiquez votre nom.' },
      { id: 'f-tel', err: 'e-tel', test: function (v) { return v.replace(/\D/g, '').length >= 10; }, msg: 'Indiquez un numéro pour que je puisse vous rappeler.' },
      { id: 'f-ville', err: 'e-ville', test: function (v) { return v.trim().length > 1; }, msg: 'Indiquez votre commune.' }
    ];
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var first = null;
      rules.forEach(function (r) {
        var input = document.getElementById(r.id);
        var field = input.closest('.field');
        var err = document.getElementById(r.err);
        if (!r.test(input.value)) {
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
      var status = form.querySelector('.form-status');
      if (first) { status.textContent = ''; first.focus(); return; }
      var btn = form.querySelector('button[type="submit"]');
      var label = btn.textContent;
      btn.textContent = 'Envoi…';
      setTimeout(function () {
        btn.textContent = label;
        status.textContent = 'Merci, c’est reçu. Je vous rappelle pendant mes horaires d’ouverture. Si c’est urgent, appelez le 05 61 23 45 67.';
        form.reset();
      }, 700);
    });
  }

  if (!window.gsap || !window.ScrollTrigger) return;
  doc.classList.add('js');
  gsap.registerPlugin(ScrollTrigger);
  var mm = gsap.matchMedia();
  var EASE = 'expo.out';                       /* ≈ cubic-bezier(0.16, 1, 0.3, 1) */
  var CLOSED = 'inset(0% 0% 100% 0%)';         /* dévoilement depuis le filet, vers le bas */
  var OPEN = 'inset(0% 0% -12% 0%)';
  var hdr = document.querySelector('.site-header');
  var hh = function () { return hdr ? hdr.offsetHeight : 0; };

  function remPx() { return parseFloat(getComputedStyle(doc).fontSize) || 16; }
  /* Géométrie de la grille 12 colonnes d'un élément .wrap, en px relatifs à `ref` */
  function gridOf(wrap, ref) {
    var cs = getComputedStyle(wrap);
    var pl = parseFloat(cs.paddingLeft), pr = parseFloat(cs.paddingRight);
    var wr = wrap.getBoundingClientRect(), rr = ref.getBoundingClientRect();
    var left = wr.left - rr.left + pl;
    var width = wr.width - pl - pr;
    var gap = 1.5 * remPx();
    var col = (width - 11 * gap) / 12;
    return { left: left, width: width, gap: gap, col: col, at: function (n) { return left + n * (col + gap); } };
  }

  /* ---------- Number ticker (une seule fois, tabular-nums) ---------- */
  function ticker(el, delay) {
    var to = parseFloat(el.getAttribute('data-to'));
    var from = parseFloat(el.getAttribute('data-from') || '0');
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var o = { v: from };
    var fmt = function (v) { return dec ? v.toFixed(dec).replace('.', ',') : String(Math.round(v)); };
    el.textContent = fmt(from);
    return gsap.to(o, { v: to, duration: 1.4, delay: delay || 0, ease: 'power3.out', onUpdate: function () { el.textContent = fmt(o.v); }, onComplete: function () { el.textContent = fmt(to); } });
  }

  /* ---------- Signature : le filet se trace, puis le titre se dévoile depuis lui ---------- */
  mm.add('(prefers-reduced-motion: no-preference)', function () {
    /* Entrée du hero : filet 600 ms, puis H1 ligne par ligne (stagger 90 ms). CTA et barre déjà là. */
    var intro = gsap.timeline();
    intro
      .fromTo('.hero-rule', { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: EASE }, 0.1)
      .fromTo('.hero .h1-line', { clipPath: CLOSED, yPercent: -18 }, { clipPath: OPEN, yPercent: 0, duration: 0.9, ease: EASE, stagger: { each: 0.09, grid: 'auto' }, clearProps: 'clipPath,transform' }, 0.45)
      .fromTo('.hero .hero-rv', { clipPath: CLOSED }, { clipPath: OPEN, duration: 0.8, ease: EASE, clearProps: 'clipPath' }, 0.5)
      .fromTo('.hero-media img', { scale: 1.06 }, { scale: 1, duration: 1.8, ease: 'power2.out', clearProps: 'transform' }, 0);
    var heroTick = document.querySelector('.hero-bar [data-ticker]');
    if (heroTick) ticker(heroTick, 0.6);

    gsap.utils.toArray('[data-reveal]').forEach(function (group) {
      var lines = group.querySelectorAll(':scope > .rule, :scope > * > .rule');
      var parts = group.querySelectorAll('.rv');
      if (lines.length) gsap.set(lines, { scaleX: 0 });
      if (parts.length) gsap.set(parts, { clipPath: CLOSED, y: 14 });
      ScrollTrigger.create({
        trigger: group, start: 'top 86%', once: true,
        onEnter: function () {
          var tl = gsap.timeline();
          if (lines.length) tl.to(lines, { scaleX: 1, duration: 0.6, ease: EASE });
          if (parts.length) tl.to(parts, { clipPath: OPEN, y: 0, duration: 0.85, ease: EASE, stagger: 0.08, clearProps: 'clipPath,transform' }, lines.length ? 0.3 : 0);
        }
      });
    });

    gsap.utils.toArray('.proofs [data-ticker]').forEach(function (el) {
      ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: function () { ticker(el, 0); } });
    });
    gsap.utils.toArray('.proof').forEach(function (p) {
      var big = p.querySelector('.proof-big');
      gsap.fromTo(big, { clipPath: 'inset(100% 0% 0% 0%)', yPercent: 20 }, {
        clipPath: 'inset(-10% 0% -10% 0%)', yPercent: 0, duration: 1, ease: EASE, clearProps: 'clipPath,transform',
        scrollTrigger: { trigger: p, start: 'top 85%', once: true }
      });
    });
  });

  /* ---------- HERO WAOUH (≥ 768 px) : la photo plein cadre se resserre en tuyau ---------- */
  mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', function () {
    var stage = document.querySelector('.hero-stage');
    var media = stage.querySelector('.hero-media');
    var wrap = stage.querySelector('.hero-grid');
    var type = stage.querySelector('.hero-type');
    var light = stage.querySelector('.hero-text--light');
    var pipeH = stage.querySelector('.hero-pipe--h');
    var pipeV = stage.querySelector('.hero-pipe--v');
    var g = { W: 0, H: 0, L: 0, R: 0, V: 0, tx: 0, ty: 0, tw: 0, th: 0 };
    var st = { p: 0 };

    function measure() {
      var sr = stage.getBoundingClientRect();
      var grid = gridOf(wrap, stage);
      var tr = type.getBoundingClientRect();
      g.W = stage.clientWidth; g.H = stage.clientHeight;
      g.L = grid.at(4);                                   /* bord gauche de la colonne 5 : 8 colonnes de droite */
      g.R = g.W - (grid.left + grid.width);
      g.D = grid.at(8);                                   /* descente : colonne 9, sur le 2e filet de la barre */
      var band = Math.max(window.innerHeight * 0.22, 120);
      g.V = Math.max(0, (g.H - band) / 2);
      g.Vb = Math.max(0, g.V - 1.5 * remPx());          /* bas de bande un peu plus bas : la 2e ligne du H1 reste dans la bande */
      g.tx = tr.left - sr.left; g.ty = tr.top - sr.top; g.tw = tr.width; g.th = tr.height;
      /* tuyau bleu : bord bas de la bande, puis descente le long du filet de la barre */
      pipeH.style.left = g.L + 'px'; pipeH.style.width = (g.W - g.R - g.L) + 'px'; pipeH.style.top = (g.H - g.Vb - 1.5) + 'px';
      pipeV.style.left = (g.D - 1) + 'px'; pipeV.style.top = (g.H - g.Vb) + 'px'; pipeV.style.height = g.Vb + 'px';
    }

    function apply() {
      var p = st.p;
      var T = g.V * p, B = g.Vb * p, L = g.L * p, R = g.R * p;
      media.style.clipPath = 'inset(' + T.toFixed(1) + 'px ' + R.toFixed(1) + 'px ' + B.toFixed(1) + 'px ' + L.toFixed(1) + 'px)';
      /* Couche blanche du texte = intersection avec la photo ; l'encre est dessous la photo. */
      var x0 = L - g.tx, y0 = T - g.ty, x1 = (g.W - R) - g.tx, y1 = (g.H - B) - g.ty;
      var it = Math.max(-40, y0), il = Math.max(-40, x0), ir = Math.max(-40, g.tw - x1), ib = Math.max(-40, g.th - y1);
      light.style.clipPath = 'inset(' + it.toFixed(1) + 'px ' + ir.toFixed(1) + 'px ' + ib.toFixed(1) + 'px ' + il.toFixed(1) + 'px)';
      stage.classList.toggle('white-bar', p > 0.26);
      stage.classList.toggle('white-cta', p > 0.6);
    }

    measure(); apply();
    gsap.set(pipeH, { scaleX: 0, scaleY: 1, transformOrigin: '0% 50%' });
    gsap.set(pipeV, { scaleY: 0, scaleX: 1, transformOrigin: '50% 0%' });

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: stage,
        start: function () { return 'top ' + hh(); },
        end: function () { return '+=' + Math.round(window.innerHeight * 0.8); },
        pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 2,
        onRefresh: function () { measure(); apply(); }
      }
    });
    tl.fromTo(st, { p: 0 }, { p: 1, duration: 1, ease: 'power2.inOut', onUpdate: apply }, 0)
      .to(pipeH, { scaleX: 1, duration: 0.16, ease: 'none' }, 0.84)
      .to(pipeV, { scaleY: 1, duration: 0.1, ease: 'none' }, 1.0);

    return function () {
      media.style.clipPath = ''; light.style.clipPath = '';
      stage.classList.remove('white-bar', 'white-cta');
    };
  });

  /* ---------- HERO mobile (< 768 px) : la photo se resserre en bande, sans épinglage ---------- */
  mm.add('(max-width: 767px) and (prefers-reduced-motion: no-preference)', function () {
    var media = document.querySelector('.hero-media');
    var inset = function () { return Math.max(0, (media.offsetHeight - window.innerHeight * 0.22) / 2); };
    gsap.fromTo(media, { clipPath: 'inset(0px 0px 0px 0px)' }, {
      clipPath: function () { var v = inset(); return 'inset(' + v + 'px 0px ' + v + 'px 0px)'; },
      ease: 'none',
      scrollTrigger: { trigger: media, start: function () { return 'top ' + hh(); }, end: 'bottom ' + 'top', scrub: 0.4, invalidateOnRefresh: true }
    });
    return function () { media.style.clipPath = ''; };
  });

  /* ---------- MOMENT WAOUH (≥ 1024 px) : scène épinglée, le tuyau trace l'appel jusqu'à la fuite réparée ---------- */
  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', function () {
    var scene = document.querySelector('.scene');
    var stage = scene.querySelector('.scene-stage');
    var svg = stage.querySelector('.scene-svg');
    var pPre = svg.querySelector('.p-pre');
    var pMain = svg.querySelector('.p-main');
    var steps = gsap.utils.toArray('.step', stage);
    var nums = steps.map(function (s) { return s.querySelector('.step-num'); });
    var texts = steps.map(function (s) { return s.querySelectorAll('h3, p'); });
    var cta = stage.querySelector('.scene-cta');
    var g = { pre: 0, cols: [], row: 0, total: 0 };

    scene.classList.add('scene--live');

    function measure() {
      var sr = stage.getBoundingClientRect();
      var W = stage.clientWidth, H = stage.clientHeight;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      var grid = gridOf(stage, stage);
      var xd = grid.at(8) + 0.5;                    /* même abscisse que la descente du hero (colonne 9) */
      var x0 = grid.left + 1.5;
      var xR = grid.left + grid.width - 1.5;
      var head = stage.querySelector('.scene-head').getBoundingClientRect();
      var y1 = head.bottom - sr.top + 0.75 * remPx();
      var ruleR = steps[0].querySelector('.step-rule').getBoundingClientRect();
      var yT = ruleR.top - sr.top + 1.5;
      var c = cta.getBoundingClientRect();
      var cl = c.left - sr.left, ct = c.top - sr.top, cb = c.bottom - sr.top;
      var cr = xR;
      pPre.setAttribute('d', 'M' + xd + ' 0 V' + y1 + ' H' + x0 + ' V' + yT);
      pMain.setAttribute('d', 'M' + x0 + ' ' + yT + ' H' + xR + ' V' + ct + ' H' + cl + ' V' + cb + ' H' + cr + ' V' + (ct - 1.5));
      g.pre = y1 + (xd - x0) + (yT - y1);
      g.cols = steps.map(function (s) { return s.getBoundingClientRect().left - sr.left - x0; });
      g.row = xR - x0;
      g.total = g.row + (ct - yT) + 2 * (cr - cl) + 2 * (cb - ct) + 1.5;
      pPre.style.strokeDasharray = g.pre; pMain.style.strokeDasharray = g.total;
      drawPre(pre.v); drawMain(main.v);
    }
    var pre = { v: 0 }, main = { v: 0 };
    function drawPre(v) { pPre.style.strokeDashoffset = (g.pre * (1 - v)).toFixed(1); }
    /* main.v : 0 → 4 = colonnes 1 à 4 ; 4 → 5 = rectangle autour du bouton */
    function lenAt(v) {
      if (v <= 4) {
        var i = Math.floor(Math.min(v, 3.9999)), f = v - i;
        var a = g.cols[i], b = i < 3 ? g.cols[i + 1] : g.row;
        return a + (b - a) * f;
      }
      return g.row + (g.total - g.row) * (v - 4);
    }
    function drawMain(v) { pMain.style.strokeDashoffset = (g.total - lenAt(v)).toFixed(1); }

    measure();
    gsap.set(nums, { clipPath: 'inset(100% 0% 0% 0%)', yPercent: 12, opacity: 1 });
    texts.forEach(function (t) { gsap.set(t, { clipPath: CLOSED, y: 10 }); });

    /* Prélude : le tuyau venu du hero descend et coude jusqu'à la ligne des étapes, pendant l'arrivée de la section */
    gsap.to(pre, {
      v: 1, ease: 'none', onUpdate: function () { drawPre(pre.v); },
      scrollTrigger: { trigger: stage, start: 'top 85%', end: function () { return 'top ' + (hh() + 1); }, scrub: 0.5, invalidateOnRefresh: true }
    });

    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: stage,
        start: function () { return 'top ' + hh(); },
        end: function () { return '+=' + Math.round(window.innerHeight * 4); },
        pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 1,
        onRefresh: measure,
        onUpdate: function (self) { cta.classList.toggle('is-filled', self.progress > 0.93); }
      }
    });
    var SEG = 0.2;
    steps.forEach(function (s, i) {
      var t0 = i * SEG;
      tl.to(main, { v: i + 1, duration: SEG * 0.75, onUpdate: function () { drawMain(main.v); } }, t0 + SEG * 0.02);
      tl.to(nums[i], { clipPath: 'inset(-12% 0% -6% 0%)', yPercent: 0, duration: SEG * 0.35, ease: 'power3.out' }, t0 + SEG * 0.08);
      tl.to(texts[i], { clipPath: OPEN, y: 0, duration: SEG * 0.3, stagger: SEG * 0.08, ease: 'power3.out' }, t0 + SEG * 0.3);
      if (i > 0) tl.to(nums[i - 1], { opacity: 0.5, duration: SEG * 0.25 }, t0);
    });
    tl.to(main, { v: 5, duration: 0.14, onUpdate: function () { drawMain(main.v); } }, 0.8);
    tl.to({}, { duration: 0.06 }, 0.94);

    return function () {
      scene.classList.remove('scene--live');
      cta.classList.remove('is-filled');
      pPre.removeAttribute('style'); pMain.removeAttribute('style');
    };
  });

  /* ---------- Scène, version mobile / tablette (< 1024 px) : trait vertical le long de la marge ---------- */
  mm.add('(max-width: 1023px) and (prefers-reduced-motion: no-preference)', function () {
    var wrap = document.querySelector('.steps-wrap');
    var pipe = wrap.querySelector('.m-pipe');
    gsap.fromTo(pipe, { scaleY: 0 }, {
      scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: wrap, start: 'top 72%', end: 'bottom 72%', scrub: 0.4 }
    });
    gsap.utils.toArray('.step', wrap).forEach(function (s) {
      var num = s.querySelector('.step-num');
      var t = s.querySelectorAll('h3, p');
      var tl = gsap.timeline({ scrollTrigger: { trigger: s, start: 'top 72%', toggleActions: 'play none none reverse' } });
      tl.fromTo(num, { clipPath: 'inset(100% 0% 0% 0%)', yPercent: 15 }, { clipPath: 'inset(-12% 0% -6% 0%)', yPercent: 0, duration: 0.7, ease: EASE })
        .fromTo(t, { clipPath: CLOSED, y: 10 }, { clipPath: OPEN, y: 0, duration: 0.7, stagger: 0.08, ease: EASE }, 0.15);
    });
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
