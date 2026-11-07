/* Deuce Cellars — movement: scroll reveals, parallax, tilting bottles, the pour between pages,
   the vintage scrubber on the Wines page and the places filter on Around the World.
   Anything that moves only runs when html has the class "m", which the head script sets
   unless the visitor's device asks for reduced motion. No libraries. */
(function () {
  var root = document.documentElement;
  var M = root.classList.contains('m');
  root.classList.add('m-ok');
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // ---- One scroll loop for everything that follows the scroll -----------------
  var jobs = [], ticking = false;
  function onFrame(fn) { jobs.push(fn); }
  function tick() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset, vh = window.innerHeight;
    for (var i = 0; i < jobs.length; i++) jobs[i](y, vh);
  }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }

  // Only work on things that are on screen
  var onScreen = new WeakMap();
  var screenWatch = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { onScreen.set(e.target, e.isIntersecting); });
    request();
  }, { rootMargin: '120px 0px' }) : null;
  function watch(el) { onScreen.set(el, true); if (screenWatch) screenWatch.observe(el); }
  function seen(el) { return onScreen.get(el) !== false; }

  // ---- Headlines rise word by word -------------------------------------------
  function splitWords(el) {
    var n = 0;
    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span'), inner = document.createElement('span');
            w.className = 'w';
            inner.textContent = part;
            inner.style.setProperty('--wi', n++);
            w.appendChild(inner);
            frag.appendChild(w);
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1) {
          walk(c);
        }
      });
    }
    walk(el);
    el.classList.add('split');
  }

  // ---- Scroll reveals ----------------------------------------------------------
  var REVEAL = [
    '.section .eyebrow', '.section .h2', '.section .caps-heading', '.section-head p', '.section .lede',
    '.section .muted', '.section .actions', '.release-name', '.facts', '.buy-row', '.section .fine',
    '.award', '.wine-card', '.vertical-card', '.method > div', '.contact-grid > div', '.quote',
    '.stat-row', '.strip figure', '.gallery figure', '.purchase-note', '.places', '.scrub',
    '.bigword .lede', '.bigword .actions', '.footer-grid > div', '.split-media .pm', '.timeline li',
    '.release-stage'
  ];

  function reveals() {
    var els = $$(REVEAL.join(','));
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; });
      batch.sort(function (a, b) {
        var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        return (ra.top - rb.top) || (ra.left - rb.left);
      });
      batch.forEach(function (el, i) {
        io.unobserve(el);
        var delay = Math.min(i, 6) * 90;
        el.style.setProperty('--rd', delay + 'ms');
        el.classList.add('in', 'seen');
        $$('[data-count]', el).concat(el.hasAttribute('data-count') ? [el] : []).forEach(function (c) { countUp(c, delay); });
        // Once it's in, drop the reveal classes so hover effects run at their own speed
        setTimeout(function () { el.classList.remove('rv', 'in'); el.style.removeProperty('--rd'); }, delay + 1900);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) {
      if (el.closest('.hero, .page-hero')) return;
      el.classList.add('rv');
      io.observe(el);
    });
  }

  // ---- Numbers count up when they come into view --------------------------------
  function prepCounters() {
    $$('.facts b, .stat b, .award b').forEach(function (b) {
      var text = b.textContent.trim(), m = text.match(/^(\d+(?:\.\d+)?)(.*)$/);
      if (!m) return;
      b.setAttribute('data-count', m[1]);
      b.setAttribute('data-suffix', m[2]);
      b.classList.add('count');
      if (M) b.textContent = (m[1].indexOf('.') > -1 ? '0.0' : '0') + m[2];
    });
  }
  function countUp(b, delay) {
    if (!M || b._counted) return;
    b._counted = true;
    var end = parseFloat(b.getAttribute('data-count')), suffix = b.getAttribute('data-suffix') || '';
    var dec = (b.getAttribute('data-count').split('.')[1] || '').length, dur = 1600, t0 = null;
    function step(t) {
      if (t0 === null) t0 = t;
      var p = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 4);
      b.textContent = (end * e).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    setTimeout(function () { requestAnimationFrame(step); }, delay + 150);
  }

  // Bars under the barrel-time numbers: 34 months next to a typical 12
  function statBars() {
    $$('.stat-row').forEach(function (row) {
      var stats = $$('.stat', row), vals = stats.map(function (s) {
        var b = s.querySelector('b');
        return b ? parseFloat(b.getAttribute('data-count') || b.textContent) || 0 : 0;
      });
      var max = Math.max.apply(null, vals);
      if (!max) return;
      stats.forEach(function (s, i) {
        var b = s.querySelector('b'), bar = document.createElement('span');
        bar.className = 'stat-bar';
        bar.setAttribute('aria-hidden', 'true');
        bar.innerHTML = '<i style="--v:' + (vals[i] / max).toFixed(3) + '"></i>';
        b.parentNode.insertBefore(bar, b.nextSibling);
      });
    });
  }

  // ---- Frames for pictures: parallax inside, hover zoom ---------------------------
  function frames() {
    $$('.split-media > img').forEach(function (img) {
      var pm = document.createElement('span');
      pm.className = 'pm';
      img.parentNode.insertBefore(pm, img);
      pm.appendChild(img);
      watch(pm);
      onFrame(function (y, vh) {
        if (!seen(pm)) return;
        var r = pm.getBoundingClientRect();
        var p = clamp((r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2), -1, 1);
        img.style.setProperty('--py', (p * r.height * 0.06).toFixed(1) + 'px');
      });
    });
    $$('.strip figure > img, .gallery figure > img').forEach(function (img) {
      var ph = document.createElement('span');
      ph.className = 'ph';
      img.parentNode.insertBefore(ph, img);
      ph.appendChild(img);
    });
  }

  // ---- Hero layers move at different speeds -------------------------------------
  function heroes() {
    $$('.hero, .page-hero').forEach(function (sec) {
      var media = sec.querySelector('.hero-video, .page-hero > img, .hero > img');
      var content = sec.querySelector('.hero-content, .wrap');
      var title = sec.querySelector('.display');
      if (title) splitWords(title);
      watch(sec);
      onFrame(function (y) {
        if (!seen(sec)) return;
        var top = sec.getBoundingClientRect().top + y, h = sec.offsetHeight;
        var s = clamp(y - top, 0, h);
        if (media) media.style.setProperty('--hy', (s * 0.35).toFixed(1) + 'px');
        if (content) {
          content.style.setProperty('--cy', (s * 0.16).toFixed(1) + 'px');
          content.style.setProperty('--co', clamp(1 - (s / h) * 1.25, 0, 1).toFixed(3));
        }
      });
    });
  }

  // ---- The "Taste" band drifts sideways ------------------------------------------
  function bigwords() {
    $$('.bigword').forEach(function (b) {
      var w = b.querySelector('.word'), img = b.querySelector('.bigword > img');
      watch(b);
      onFrame(function (y, vh) {
        if (!seen(b)) return;
        var r = b.getBoundingClientRect(), p = clamp((vh - r.top) / (vh + r.height), 0, 1);
        if (w) w.style.setProperty('--wx', ((0.6 - p) * 14).toFixed(2) + 'vw');
        if (img) img.style.setProperty('--py', ((p - 0.5) * -60).toFixed(1) + 'px');
      });
    });
  }

  // ---- Bottles that turn toward you ----------------------------------------------
  function stages() {
    $$('.release-stage').forEach(function (st) {
      var bottle = st.querySelector('.bottle'), bg = st.querySelector('.bg');
      if (!bottle) return;
      var glare = document.createElement('span');
      glare.className = 'glare';
      glare.setAttribute('aria-hidden', 'true');
      st.appendChild(glare);
      function set(px, py) {
        bottle.style.setProperty('--ry', (px * 22).toFixed(2) + 'deg');
        bottle.style.setProperty('--rx', (py * -8).toFixed(2) + 'deg');
        if (bg) {
          bg.style.setProperty('--bx', (px * -22).toFixed(1) + 'px');
          bg.style.setProperty('--by', (py * -16).toFixed(1) + 'px');
        }
        glare.style.setProperty('--gx', (50 + px * 80).toFixed(1) + '%');
        glare.style.setProperty('--gy', (32 + py * 60).toFixed(1) + '%');
      }
      if (fine) {
        st.addEventListener('pointermove', function (e) {
          var r = st.getBoundingClientRect();
          set((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5);
        });
        st.addEventListener('pointerleave', function () { set(0, 0); });
      } else {
        // On phones the bottle turns a little as it scrolls past
        watch(st);
        onFrame(function (y, vh) {
          if (!seen(st)) return;
          var r = st.getBoundingClientRect();
          set((clamp((r.top + r.height / 2) / vh, 0, 1) - 0.5) * -0.9, 0);
        });
      }
    });
    if (!fine) return;
    $$('.tile--bottle').forEach(function (t) {
      var img = t.querySelector('img');
      if (!img) return;
      t.addEventListener('pointermove', function (e) {
        var r = t.getBoundingClientRect();
        img.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 24).toFixed(2) + 'deg');
        img.style.setProperty('--rx', (((e.clientY - r.top) / r.height - 0.5) * -8).toFixed(2) + 'deg');
      });
      t.addEventListener('pointerleave', function () {
        img.style.removeProperty('--ry');
        img.style.removeProperty('--rx');
      });
    });
  }

  // ---- Buttons lean toward the pointer --------------------------------------------
  function magnets() {
    if (!fine) return;
    document.addEventListener('pointermove', function (e) {
      var b = e.target.closest && e.target.closest('.btn');
      if (!b || b.closest('.age-gate')) return;
      var r = b.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width / 2) * 0.2, y = (e.clientY - r.top - r.height / 2) * 0.3;
      b.style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';
      if (!b._mag) {
        b._mag = true;
        b.addEventListener('pointerleave', function () { b.style.translate = ''; });
      }
    }, { passive: true });
  }

  // ---- A soft ring follows the mouse --------------------------------------------
  function cursorRing() {
    if (!fine) return;
    var c = document.createElement('div');
    c.className = 'cursor';
    c.setAttribute('aria-hidden', 'true');
    c.innerHTML = '<span></span>';
    document.body.appendChild(c);
    var label = c.firstChild, x = -100, y = -100, cx = x, cy = y, raf = null;
    function loop() {
      cx += (x - cx) * 0.22;
      cy += (y - cy) * 0.22;
      c.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.4 ? requestAnimationFrame(loop) : null;
    }
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      x = e.clientX; y = e.clientY;
      if (!c.classList.contains('is-on')) { cx = x; cy = y; c.classList.add('is-on'); }
      if (!raf) raf = requestAnimationFrame(loop);
      var t = e.target.closest ? e.target : document.body;
      var z = t.closest('[data-cursor]') || t.closest('[data-zoom]');
      var txt = z ? (z.getAttribute('data-cursor') || 'View') : '';
      var link = t.closest('a, button, input[type="range"], select, label, .loc');
      c.classList.toggle('is-label', !!txt);
      if (txt && label.textContent !== txt) label.textContent = txt;
      c.classList.toggle('is-link', !txt && !!link);
      c.classList.toggle('is-dark', !!t.closest('.section--night, .hero, .page-hero, .bigword, .site-footer, .lightbox, .age-gate, .announce'));
    }, { passive: true });
    document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) c.classList.remove('is-on'); });
  }

  // ---- Home travel strip: drag it with the mouse, with a little glide -------------
  function strips() {
    if (!fine) return;
    $$('.strip').forEach(function (s) {
      s.setAttribute('data-cursor', 'Drag');
      var down = false, moved = false, sx = 0, sl = 0, vx = 0, lastX = 0, lastT = 0, raf = null;
      s.addEventListener('dragstart', function (e) { e.preventDefault(); });
      s.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        down = true; moved = false; sx = lastX = e.clientX; sl = s.scrollLeft; lastT = performance.now(); vx = 0;
        if (raf) cancelAnimationFrame(raf);
      });
      window.addEventListener('pointermove', function (e) {
        if (!down) return;
        var dx = e.clientX - sx;
        if (!moved && Math.abs(dx) > 5) { moved = true; s.classList.add('is-drag'); }
        if (!moved) return;
        s.scrollLeft = sl - dx;
        var now = performance.now();
        vx = (e.clientX - lastX) / Math.max(1, now - lastT);
        lastX = e.clientX; lastT = now;
      });
      window.addEventListener('pointerup', function () {
        if (!down) return;
        down = false;
        if (!moved) return;
        var v = -vx * 16;
        (function glide() {
          s.scrollLeft += v;
          v *= 0.93;
          if (Math.abs(v) > 0.5) raf = requestAnimationFrame(glide);
          else { raf = null; s.classList.remove('is-drag'); }
        })();
      });
      // A drag isn't a tap: don't open the photo after dragging
      s.addEventListener('click', function (e) {
        if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
      }, true);
    });
  }

  // ---- Story timeline: a line of wine runs down the years ------------------------
  function timelines() {
    $$('.timeline').forEach(function (tl) {
      var items = $$('li', tl);
      if (!items.length) return;
      tl.classList.add('is-live');
      items[items.length - 1].classList.add('now');
      var DOT = 41;
      function measure() {
        var top = items[0].offsetTop + DOT, last = items[items.length - 1].offsetTop + DOT;
        tl.style.setProperty('--lt', top + 'px');
        tl.style.setProperty('--lh', (last - top) + 'px');
        return { top: top, len: last - top };
      }
      var m = measure();
      window.addEventListener('resize', function () { m = measure(); });
      watch(tl);
      onFrame(function (y, vh) {
        if (!seen(tl)) return;
        var r = tl.getBoundingClientRect(), line = vh * 0.62;
        tl.style.setProperty('--tp', clamp((line - r.top - m.top) / (m.len || 1), 0, 1).toFixed(4));
        items.forEach(function (li) { li.classList.toggle('on', li.getBoundingClientRect().top + DOT <= line); });
      });
    });
  }

  // ---- Leaving a page: the glass fills; arriving: it drains ------------------------
  function pours() {
    var pour = null;
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      var url;
      try { url = new URL(a.href, location.href); } catch (err) { return; }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      if (!/(\.html|\/|\/[^.\/]+)$/.test(url.pathname)) return;   // pages, including Netlify's clean addresses like /wines
      e.preventDefault();
      try { sessionStorage.setItem('deuce-pour', '1'); } catch (err) {}
      if (!pour) {
        pour = document.createElement('div');
        pour.className = 'pour';
        pour.setAttribute('aria-hidden', 'true');
        document.body.appendChild(pour);
        void pour.offsetWidth;
      }
      pour.classList.add('go');
      setTimeout(function () { location.href = url.href; }, 560);
    });
    // Coming back with the Back button: let the glass drain again
    window.addEventListener('pageshow', function (e) {
      if (e.persisted && pour) pour.classList.remove('go');
    });
    if (root.classList.contains('pour-in')) setTimeout(function () { root.classList.remove('pour-in'); }, 1300);
    // Start fetching a page as soon as the pointer rests on its link
    var fetched = {};
    document.addEventListener('pointerover', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.origin !== location.origin || !/(\.html|\/[^.\/]+)$/.test(a.pathname)) return;
      var href = a.href.split('#')[0];
      if (fetched[href] || href === location.href.split('#')[0]) return;
      fetched[href] = true;
      var l = document.createElement('link');
      l.rel = 'prefetch';
      l.href = href;
      document.head.appendChild(l);
    }, { passive: true });
  }

  // ---- Where to Buy: the dots drop onto the map the first time -------------------
  function mapIntro() {
    var svg = document.getElementById('loc-map');
    if (!svg) return;
    svg.classList.add('map-intro');
    setTimeout(function () { svg.classList.remove('map-intro'); }, 1600);
  }

  // ---- Vintage scrubber (Wines page) ------------------------------------------------
  function scrubber() {
    var host = document.querySelector('[data-scrubber]');
    var D = window.DEUCE;
    if (!host || !D || !D.wines || !D.wines.length) return;
    var wines = D.wines.filter(function (w) { return w.image; }).slice().sort(function (a, b) { return a.year - b.year; });
    var n = wines.length, cur = 0;
    wines.forEach(function (w, i) { if (w.status === 'current') cur = i; });
    var STATUS = { current: 'Current release', library: 'Library vintage', coming: 'Resting in bottle' };

    host.innerHTML =
      '<div class="scrub-stage"><div class="scrub-year" aria-hidden="true"></div><div class="scrub-bottles"></div></div>' +
      '<div class="scrub-info"><div class="scrub-text" aria-live="polite"></div></div>' +
      '<div class="scrub-rail"><input class="scrub-range" type="range" min="0" max="' + (n - 1) + '" step="1" value="' + cur + '" aria-label="Choose a vintage">' +
      '<div class="scrub-ticks" aria-hidden="true">' + wines.map(function (w, i) {
        return '<button type="button" tabindex="-1" data-i="' + i + '"><span>' + w.year + '</span></button>';
      }).join('') + '</div>' +
      '<p class="scrub-hint">Drag through the vintages</p></div>';

    var range = host.querySelector('.scrub-range'), yearBox = host.querySelector('.scrub-year');
    var bottles = host.querySelector('.scrub-bottles'), text = host.querySelector('.scrub-text');
    var ticks = $$('.scrub-ticks button', host);
    var shown = -1, textTimer = null;

    // Load every bottle up front so sliding never waits on a picture
    wines.forEach(function (w) { var im = new Image(); im.src = w.image; });

    function target(w) {
      if (w.status === 'current') return document.getElementById('current') ? '#current' : '';
      return document.getElementById('v' + w.year) ? '#v' + w.year : '';
    }
    function info(w) {
      var meta = [w.region, w.cases ? w.cases + ' cases' : '', w.oak].filter(Boolean).join(' · ');
      var price = w.price ? '<span class="price">$' + w.price + '</span>'
        : '<span class="price price--soon">' + (w.status === 'coming' ? 'Coming soon' : 'Ask for price') + '</span>';
      var href = target(w);
      return '<span class="scrub-status' + (w.status === 'current' ? ' scrub-status--current' : '') + '">' + esc(STATUS[w.status] || '') + '</span>' +
        '<h3 class="scrub-name">' + w.year + ' Reserve Syrah</h3>' +
        '<p class="scrub-meta">' + esc(meta) + '</p>' +
        (w.award ? '<p class="scrub-award">' + esc(w.award) + (w.awardSource ? ' · ' + esc(w.awardSource) : '') + '</p>' : '') +
        (w.note ? '<p class="scrub-note">' + esc(w.note) + '</p>' : '') +
        '<div class="scrub-foot">' + price +
        (href ? '<a class="link-arrow" href="' + href + '">' + (w.status === 'coming' ? 'Get notified' : 'Reserve this vintage') + '</a>' : '') +
        '</div>';
    }
    function swapIn(box, el, cls, dirVar, dir) {
      var old = box.lastElementChild;
      if (!M || !old) {
        box.innerHTML = '';
        box.appendChild(el);
        return;
      }
      box.style.setProperty(dirVar, dir);
      el.classList.add('is-pre');
      box.appendChild(el);
      void el.offsetWidth;
      el.classList.remove('is-pre');
      $$(cls, box).forEach(function (o) {
        if (o === el) return;
        o.classList.add('is-out');
        setTimeout(function () { if (o.parentNode) o.parentNode.removeChild(o); }, 700);
      });
    }
    function go(i, quick) {
      i = clamp(i, 0, n - 1);
      if (i === shown) return;
      var w = wines[i], fwd = i > shown, first = shown === -1;
      range.value = i;
      range.style.setProperty('--fill', (i / (n - 1) * 100) + '%');
      range.setAttribute('aria-valuetext', w.year + ' Reserve Syrah, ' + (STATUS[w.status] || ''));
      ticks.forEach(function (t, k) { t.classList.toggle('is-on', k === i); });

      var y = document.createElement('span');
      y.textContent = w.year;
      swapIn(yearBox, y, 'span', '--dir', fwd ? '-40%' : '40%');

      var img = document.createElement('img');
      img.src = w.image;
      img.alt = w.year + ' Deuce Cellars Reserve Syrah bottle';
      swapIn(bottles, img, 'img', '--bdx', fwd ? '-40px' : '40px');
      bottles.style.setProperty('--bdr', fwd ? '-4deg' : '4deg');

      shown = i;
      clearTimeout(textTimer);
      if (!M || first) { text.innerHTML = info(w); return; }
      text.classList.add('is-swap');
      textTimer = setTimeout(function () {
        text.innerHTML = info(wines[shown]);
        text.classList.remove('is-swap');
      }, quick ? 60 : 200);
    }

    var userMoved = false;
    range.addEventListener('input', function () { userMoved = true; go(+range.value); });
    host.addEventListener('click', function (e) {
      var t = e.target.closest('.scrub-ticks button');
      if (t) { userMoved = true; go(+t.getAttribute('data-i')); range.focus(); }
    });
    // Swipe across the bottle to step through the years
    var stage = host.querySelector('.scrub-stage'), sx = null;
    stage.addEventListener('pointerdown', function (e) { sx = e.clientX; });
    stage.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx;
      sx = null;
      if (Math.abs(dx) > 40) { userMoved = true; go(shown + (dx < 0 ? 1 : -1)); }
    });

    if (!M || !('IntersectionObserver' in window)) { go(cur); return; }
    // The first time it comes into view, it runs up through the years to the current release
    go(0);
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      var i = 0;
      (function step() {
        if (userMoved || i >= cur) return;
        i++;
        go(i, true);
        setTimeout(step, i === cur ? 0 : 230);
      })();
    }, { threshold: 0.45 });
    io.observe(host);
  }

  // ---- Around the World: filter the photos by country -------------------------------
  function places() {
    var g = document.querySelector('.gallery[data-places]');
    if (!g) return;
    var figs = $$('figure', g), counts = {}, order = [];
    figs.forEach(function (f) {
      var p = f.getAttribute('data-place');
      if (!p) return;
      if (!counts[p]) { counts[p] = 0; order.push(p); }
      counts[p]++;
    });
    order.sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b); });
    var bar = document.createElement('div');
    bar.className = 'places';
    bar.innerHTML = '<p class="places-count"><b>' + figs.length + '</b> photos <b>' + order.length + '</b> countries</p>' +
      '<div class="chips" role="group" aria-label="Show photos from">' +
      ['All'].concat(order).map(function (p) {
        return '<button type="button" class="chip" data-place="' + esc(p) + '" aria-pressed="' + (p === 'All') + '">' +
          esc(p) + '<i>' + (p === 'All' ? figs.length : counts[p]) + '</i></button>';
      }).join('') + '</div>';
    g.parentNode.insertBefore(bar, g);
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      var p = b.getAttribute('data-place');
      $$('.chip', bar).forEach(function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
      var k = 0;
      figs.forEach(function (f) {
        var show = p === 'All' || f.getAttribute('data-place') === p;
        if (show) {
          if (f.hidden) {
            f.hidden = false;
            f.classList.remove('rv');
            if (M) {
              f.classList.add('is-out');
              f.style.transitionDelay = (Math.min(k++, 8) * 50) + 'ms';
              requestAnimationFrame(function () { requestAnimationFrame(function () { f.classList.remove('is-out'); }); });
              setTimeout(function () { f.style.transitionDelay = ''; }, 900);
            }
          } else {
            f.classList.remove('is-out');
          }
        } else if (!f.hidden) {
          if (M) {
            f.classList.add('is-out');
            setTimeout(function () { if (f.classList.contains('is-out')) f.hidden = true; }, 320);
          } else {
            f.hidden = true;
          }
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    prepCounters();
    statBars();
    scrubber();
    places();
    if (!M) return;
    frames();
    heroes();
    bigwords();
    stages();
    timelines();
    reveals();
    magnets();
    cursorRing();
    strips();
    pours();
    mapIntro();
    var header = document.querySelector('.site-header');
    if (header) {
      var line = document.createElement('span');
      line.className = 'scroll-line';
      line.setAttribute('aria-hidden', 'true');
      header.appendChild(line);
      onFrame(function (y, vh) {
        var max = root.scrollHeight - vh;
        line.style.setProperty('--sp', max > 0 ? clamp(y / max, 0, 1).toFixed(4) : 0);
      });
    }
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    request();
  });
})();
