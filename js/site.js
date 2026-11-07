/* Deuce Cellars — page behaviour: age check, menu, and the wine cards built from wines.js */
(function () {
  var D = window.DEUCE || { wines: [], verticals: [] };

  function byYear(y) {
    for (var i = 0; i < D.wines.length; i++) if (D.wines[i].year === +y) return D.wines[i];
    return null;
  }
  function money(n) { return n == null ? '' : '$' + n; }
  function priceTag(item) {
    if (item.price) return '<span class="price">' + money(item.price) + '</span>';
    return '<span class="price price--soon">' + (item.status === 'coming' ? 'Coming soon' : 'Ask for price') + '</span>';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function mailto(subject, body) {
    return 'mailto:' + D.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }
  function wineName(w) { return w.year + ' Reserve Syrah'; }

  // One button per wine, depending on purchaseMode and whether a Square link exists.
  function buyButton(item, isVertical) {
    var label = isVertical ? item.name + ' (' + item.years.join(', ') + ')' : wineName(item);
    if (!isVertical && item.status === 'coming') {
      return '<a class="btn btn-ghost" href="' + esc(mailto('Notify me: ' + label,
        "Hi Deuce Cellars,\n\nPlease let me know when the " + label + " is released.\n\nName:\n")) + '">Notify me</a>';
    }
    if (D.purchaseMode === 'square' && item.squareLink) {
      return '<a class="btn" href="' + esc(item.squareLink) + '" target="_blank" rel="noopener">Buy now</a>';
    }
    var body = "Hi Deuce Cellars,\n\nI'd like to reserve:\n" + label + (item.price ? ' — ' + money(item.price) : '') +
      '\nQuantity: 1\n\nName:\nPhone:\n\nThank you!';
    return '<a class="btn" href="' + esc(mailto('Reserve: ' + label, body)) + '">Reserve</a>';
  }

  // Bottle pictures have a large twin named *-lg.webp that opens on tap
  function largeImage(src) { return src.replace(/\.webp$/, '-lg.webp'); }

  function tile(w) {
    var chip = '<span class="tile-chip">' + w.year + '</span>';
    var award = w.award ? '<span class="tile-award">' + esc(w.award) + '</span>' : '';
    if (w.image && w.image.indexOf('/bottles/') > -1) {
      return '<button type="button" class="tile tile--bottle" data-zoom="' + esc(largeImage(w.image)) +
        '" data-caption="' + esc(wineName(w) + ' · ' + w.region) + '" aria-label="Enlarge the ' + esc(wineName(w)) + ' bottle">' +
        chip + award + '<img src="' + esc(w.image) + '" alt="' + esc(wineName(w)) + ' bottle" loading="lazy"></button>';
    }
    if (w.image) {
      return '<div class="tile">' + chip + award +
        '<img src="' + esc(w.image) + '" alt="' + esc(wineName(w)) + ' label" loading="lazy"></div>';
    }
    // No label photo on file for this vintage yet: a typeset card in the label's colours.
    return '<div class="tile tile--type">' + chip + award +
      '<div class="tile-frame"><img class="tile-logo" src="images/logo.webp" alt="" loading="lazy">' +
      '<span class="tile-year">' + w.year + '</span><span class="tile-sub">Reserve Syrah</span>' +
      '<span class="tile-region">' + esc(w.region) + '</span></div></div>';
  }

  function card(w, full) {
    var meta = [w.region, w.cases ? w.cases + ' cases' : ''].filter(Boolean).join(' · ');
    return '<article class="wine-card" id="v' + w.year + '">' + tile(w) +
      '<div class="wine-card__body">' +
      '<h3 class="wine-name">' + esc(wineName(w)) + '</h3>' +
      '<p class="wine-meta">' + esc(meta) + '</p>' +
      (w.award ? '<p class="wine-award">' + esc(w.award + ' · ' + w.awardSource) + '</p>' : '') +
      (full && w.note ? '<p class="wine-note">' + esc(w.note) + '</p>' : '') +
      (w.limit ? '<p class="wine-limit">' + esc(w.limit) + '</p>' : '') +
      '<div class="wine-buy">' + priceTag(w) + buyButton(w) + '</div>' +
      '</div></article>';
  }

  // A set costs what its bottles add up to, so it follows any bottle price change.
  // If a bottle in the set has no price yet, the set shows "Ask for price".
  function setPrice(v) {
    var total = 0;
    for (var i = 0; i < v.years.length; i++) {
      var w = byYear(v.years[i]);
      if (!w || !w.price) return null;
      total += w.price;
    }
    return total;
  }

  function verticalCard(v) {
    v.price = setPrice(v);
    // A lineup of the actual bottles in the set, each labelled with its year
    var bottles = v.years.map(function (y) {
      var w = byYear(y);
      return '<figure class="vt-bottle"><img src="' + esc(w && w.image ? w.image : '') + '" alt="' + y + ' Reserve Syrah bottle" loading="lazy">' +
        '<figcaption>' + y + '</figcaption></figure>';
    }).join('');
    return '<article class="vertical-card">' +
      '<div class="vt-tile vt-tile--' + v.years.length + '"><div class="vt-lineup">' + bottles + '</div>' +
      '<span class="vt-count">' + v.years.length + ' bottles</span></div>' +
      '<div class="wine-card__body"><h3 class="wine-name">' + esc(v.name) + '</h3>' +
      '<p class="wine-meta">' + esc(v.years.join(' · ')) + '</p>' +
      '<p class="wine-note">' + esc(v.note) + '</p>' +
      '<div class="wine-buy">' + priceTag(v) + buyButton(v, true) + '</div>' +
      '</div></article>';
  }

  function renderWines() {
    document.querySelectorAll('[data-wines]').forEach(function (el) {
      var list;
      if (el.getAttribute('data-years')) {
        list = el.getAttribute('data-years').split(',').map(byYear).filter(Boolean);
      } else {
        var status = el.getAttribute('data-wines');
        list = D.wines.filter(function (w) { return w.status === status; });
      }
      var full = el.hasAttribute('data-full');
      el.innerHTML = list.map(function (w) { return card(w, full); }).join('');
    });
    document.querySelectorAll('[data-verticals]').forEach(function (el) {
      el.innerHTML = D.verticals.map(verticalCard).join('');
    });
    // Single fields, e.g. <span data-wine="2019" data-field="price">
    document.querySelectorAll('[data-wine][data-field]').forEach(function (el) {
      var w = byYear(el.getAttribute('data-wine'));
      if (!w) return;
      var f = el.getAttribute('data-field');
      if (f === 'buy') el.innerHTML = buyButton(w);
      else if (f === 'price') el.textContent = money(w.price);
      else if (f === 'cases') el.textContent = w.cases ? w.cases + ' cases' : '';
      else el.textContent = w[f] || '';
    });
    document.querySelectorAll('[data-purchase-note]').forEach(function (el) {
      el.textContent = D.purchaseMode === 'square'
        ? 'The current release can be purchased through our secure Square checkout. To reserve library vintages and verticals, tap Reserve and we will reply by email to confirm availability. You must be 21 or older to purchase.'
        : 'Tap Reserve and we will reply by email to confirm availability, then arrange payment and pickup at a Deuce Cellars event or private tasting. Quantities are very limited. You must be 21 or older to purchase.';
    });
    document.querySelectorAll('[data-email]').forEach(function (el) {
      el.textContent = D.email;
      if (el.tagName === 'A') el.href = 'mailto:' + D.email;
    });
  }

  function nav() {
    var header = document.querySelector('.site-header');
    var toggle = document.querySelector('.nav-toggle');
    if (toggle && header) {
      toggle.addEventListener('click', function () {
        var open = header.classList.toggle('nav-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.body.classList.toggle('no-scroll', open);
      });
      // Close the menu when a link inside it is tapped (e.g. Contact on the same page)
      document.querySelectorAll('.site-nav a').forEach(function (a) {
        a.addEventListener('click', function () {
          header.classList.remove('nav-open');
          toggle.setAttribute('aria-expanded', 'false');
          document.body.classList.remove('no-scroll');
        });
      });
    }
    // Netlify serves pages at clean addresses (/wines) as well as /wines.html, so compare page names only
    var page = function (p) { return (p.split('#')[0].split('/').pop() || 'index').replace(/\.html$/, ''); };
    var here = page(location.pathname);
    document.querySelectorAll('.site-nav a').forEach(function (a) {
      if (a.getAttribute('href').indexOf('#') === -1 && page(a.getAttribute('href')) === here) a.setAttribute('aria-current', 'page');
    });
    var onScroll = function () { if (header) header.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    document.querySelectorAll('[data-year-now]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  // Hero video: plays as soon as the page opens, with a pause button
  function heroVideo() {
    var v = document.querySelector('.hero-video'), b = document.querySelector('.video-toggle');
    if (!v || !b) return;
    var pausedByVisitor = false;
    function show(paused) {
      b.setAttribute('aria-pressed', paused ? 'true' : 'false');
      b.setAttribute('aria-label', paused ? 'Play video' : 'Pause video');
    }
    function play() {
      v.muted = true;
      var p = v.play();
      if (p && p.then) p.then(function () { show(false); }, function () { show(true); });
    }
    play();
    // Phones in battery-saver mode block autoplay; start it on the first tap or scroll instead
    var kick = function () { if (v.paused && !pausedByVisitor) play(); };
    ['touchstart', 'pointerdown', 'scroll', 'keydown'].forEach(function (ev) {
      window.addEventListener(ev, kick, { once: true, passive: true });
    });
    v.addEventListener('playing', function () { show(false); });
    b.addEventListener('click', function () {
      if (v.paused) { pausedByVisitor = false; play(); }
      else { pausedByVisitor = true; v.pause(); show(true); }
    });
  }

  // Tap a bottle or a travel photo to see it large. Photos from the same wall can be stepped through.
  function lightbox() {
    document.querySelectorAll('.gallery figure, .strip figure').forEach(function (f) {
      var img = f.querySelector('img'), cap = f.querySelector('figcaption');
      if (!img) return;
      var text = cap ? cap.textContent : img.alt;
      img.setAttribute('data-zoom', img.getAttribute('src'));
      img.setAttribute('data-caption', text);
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', 'Enlarge photo: ' + text);
      f.parentNode.setAttribute('data-zoom-group', '');
    });
    document.querySelectorAll('[data-drift]').forEach(function (d) { d.setAttribute('data-zoom-group', ''); });
    var box = null, lastFocus = null, set = [], at = 0;
    function close() {
      if (!box) return;
      box.remove(); box = null;
      document.body.classList.remove('no-scroll');
      if (lastFocus) lastFocus.focus();
    }
    function caption(t) {
      return esc(t.getAttribute('data-caption')) +
        (set.length > 1 ? '<span class="lightbox-count">' + (at + 1) + ' / ' + set.length + '</span>' : '');
    }
    function step(d) {
      if (!box || set.length < 2) return;
      at = (at + d + set.length) % set.length;
      var t = set[at], img = box.querySelector('img');
      img.classList.add('is-swap');
      setTimeout(function () {
        if (!box) return;
        img.onload = function () { img.classList.remove('is-swap'); };
        img.src = t.getAttribute('data-zoom');
        img.alt = t.getAttribute('data-caption');
        box.querySelector('figcaption').innerHTML = caption(t);
        box.setAttribute('aria-label', t.getAttribute('data-caption'));
        if (img.complete) img.classList.remove('is-swap');
      }, 200);
    }
    function open(t) {
      lastFocus = t;
      var group = t.closest('[data-zoom-group]');
      set = group ? Array.prototype.filter.call(group.querySelectorAll('[data-zoom]'), function (el) { return !el.closest('[hidden]') && !el.closest('[aria-hidden="true"]'); }) : [t];
      at = set.indexOf(t);
      // A repeated copy on the drifting wall opens as its original photo
      if (at < 0) at = set.map(function (el) { return el.getAttribute('data-zoom'); }).indexOf(t.getAttribute('data-zoom'));
      at = Math.max(0, at);
      if (!set.length) set = [t];
      box = document.createElement('div');
      box.className = 'lightbox';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      box.setAttribute('aria-label', t.getAttribute('data-caption'));
      box.innerHTML = '<figure><img src="' + esc(t.getAttribute('data-zoom')) + '" alt="' + esc(t.getAttribute('data-caption')) + '">' +
        '<figcaption>' + caption(t) + '</figcaption></figure>' +
        (set.length > 1 ? '<button type="button" class="lightbox-nav lightbox-prev" aria-label="Previous photo">‹</button>' +
          '<button type="button" class="lightbox-nav lightbox-next" aria-label="Next photo">›</button>' : '') +
        '<button type="button" class="lightbox-close" aria-label="Close">×</button>';
      box.addEventListener('click', function (ev) {
        if (ev.target.closest('.lightbox-prev')) return step(-1);
        if (ev.target.closest('.lightbox-next')) return step(1);
        if (ev.target === box || ev.target.closest('.lightbox-close')) close();
      });
      // Swipe left or right on a phone to change photo
      var sx = null;
      box.addEventListener('touchstart', function (ev) { sx = ev.touches[0].clientX; }, { passive: true });
      box.addEventListener('touchend', function (ev) {
        if (sx === null) return;
        var dx = ev.changedTouches[0].clientX - sx;
        sx = null;
        if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
      });
      document.body.appendChild(box);
      document.body.classList.add('no-scroll');
      box.querySelector('.lightbox-close').focus();
    }
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-zoom]');
      if (t && !box) open(t);
    });
    document.addEventListener('keydown', function (e) {
      if (box) {
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowRight') step(1);
        else if (e.key === 'ArrowLeft') step(-1);
        return;
      }
      // Photos are pictures, not buttons, so open them with Enter or Space too
      var t = e.target;
      if ((e.key === 'Enter' || e.key === ' ') && t.matches && t.matches('img[data-zoom]')) { e.preventDefault(); open(t); }
    });
  }

  function ageGate() {
    var ok = false;
    try { ok = localStorage.getItem('deuce-21') === 'yes'; } catch (e) {}
    if (ok) { document.documentElement.classList.remove('gate-up'); return; }
    var gate = document.createElement('div');
    gate.className = 'age-gate';
    gate.setAttribute('role', 'dialog');
    gate.setAttribute('aria-modal', 'true');
    gate.setAttribute('aria-labelledby', 'age-title');
    gate.innerHTML = '<div class="age-card"><img src="images/logo.webp" alt="Deuce Cellars" class="age-logo">' +
      '<h2 id="age-title">Welcome</h2><p class="age-copy">Please confirm you are 21 or older to enter.</p>' +
      '<div class="age-actions"><button class="btn" data-age="yes">I am 21 or older</button>' +
      '<button class="btn btn-ghost" data-age="no">I am under 21</button></div></div>';
    document.body.appendChild(gate);
    document.body.classList.add('no-scroll');
    gate.querySelector('[data-age="yes"]').focus();
    gate.addEventListener('click', function (e) {
      var b = e.target.closest('[data-age]');
      if (!b) return;
      if (b.getAttribute('data-age') === 'yes') {
        try { localStorage.setItem('deuce-21', 'yes'); } catch (err) {}
        document.body.classList.remove('no-scroll');
        document.documentElement.classList.remove('gate-up');   // lets the opening animation play
        gate.classList.add('is-leaving');
        setTimeout(function () { gate.remove(); }, document.documentElement.classList.contains('m') ? 450 : 0);
      } else {
        gate.querySelector('.age-copy').textContent = 'Sorry — you must be of legal drinking age to visit this site.';
        gate.querySelector('.age-actions').remove();
      }
    });
  }

  // Around the world: photos drift edge to edge. Hover to stop them, drag or swipe
  // to push them, tap one to see it larger.
  function drift() {
    // Visitors who ask for less motion get a slower drift; everyone gets the pause button
    var pace = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.5 : 1;

    document.querySelectorAll('[data-drift]').forEach(function (box) {
      var toggle = box.querySelector('.drift-toggle');
      var paused = false, hovering = false, started = false, raf = 0, last = 0;

      var rows = [].map.call(box.querySelectorAll('.drift-row'), function (el) {
        var track = el.querySelector('.drift-track');
        return {
          el: el, track: track, items: [].slice.call(track.children),
          speed: +el.getAttribute('data-speed') || 30, dir: -1, x: 0, v: 0, w: 0,
          press: null, dragging: false, justDragged: false
        };
      });

      // Repeat the photos so there is always another set waiting off-screen
      function fill(r) {
        var copies = Math.round(r.track.children.length / r.items.length);
        r.w = r.track.getBoundingClientRect().width / copies;
        if (!r.w) return;
        var need = Math.ceil(r.el.clientWidth / r.w) + 1;
        for (; copies < need; copies++) {
          r.items.forEach(function (item) {
            var c = item.cloneNode(true), img = c.querySelector('img');
            c.setAttribute('aria-hidden', 'true');
            img.alt = '';
            img.loading = 'eager';
            r.track.appendChild(c);
          });
        }
      }

      function place(r) {
        if (r.w) r.x = ((r.x % r.w) + r.w) % r.w - r.w;
        r.track.style.transform = 'translate3d(' + r.x.toFixed(2) + 'px,0,0)';
      }

      function frame(now) {
        var dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
        last = now;
        rows.forEach(function (r) {
          if (r.dragging) return;
          var cruise = paused || hovering ? 0 : r.speed * pace * r.dir;
          // Ease towards the cruising speed, so starts and pushes glide. Hovering settles
          // quickly, but a row that has just been pushed still gets to glide first.
          var ease = hovering && Math.abs(r.v) < 80 ? 7 : 1.5;
          r.v += (cruise - r.v) * (1 - Math.exp(-dt * ease));
          r.x += r.v * dt;
          place(r);
        });
        raf = requestAnimationFrame(frame);
      }

      function run(on) {
        if (on && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
        if (!on && raf) { cancelAnimationFrame(raf); raf = 0; }
      }

      function show() {
        if (!toggle) return;
        toggle.setAttribute('aria-pressed', paused ? 'true' : 'false');
        toggle.setAttribute('aria-label', paused ? 'Play photos' : 'Pause photos');
      }

      rows.forEach(function (r) {
        r.el.addEventListener('pointerdown', function (e) {
          if (e.button) return;
          r.press = { id: e.pointerId, startX: e.clientX, lastX: e.clientX, lastT: e.timeStamp, vel: 0, moved: false };
        });
        r.el.addEventListener('pointermove', function (e) {
          var p = r.press;
          if (!p || e.pointerId !== p.id) return;
          if (!p.moved) {
            if (Math.abs(e.clientX - p.startX) < 6) return;
            p.moved = true;
            r.dragging = true;
            r.el.setPointerCapture(e.pointerId);
            r.el.classList.add('is-dragging');
          }
          var step = e.clientX - p.lastX, ms = Math.max(e.timeStamp - p.lastT, 1);
          r.x += step;
          place(r);
          p.vel = 0.7 * (step / ms * 1000) + 0.3 * p.vel;
          p.lastX = e.clientX;
          p.lastT = e.timeStamp;
        });
        function release(e) {
          var p = r.press;
          if (!p || e.pointerId !== p.id) return;
          r.press = null;
          if (!p.moved) return;
          r.dragging = false;
          r.el.classList.remove('is-dragging');
          // Let go while moving and the row glides on, then keeps drifting that way
          r.v = e.timeStamp - p.lastT > 100 ? 0 : Math.max(-2600, Math.min(2600, p.vel));
          if (Math.abs(r.v) > 60) r.dir = r.v > 0 ? 1 : -1;
          r.justDragged = true;
          setTimeout(function () { r.justDragged = false; }, 60);
        }
        r.el.addEventListener('pointerup', release);
        r.el.addEventListener('pointercancel', release);
        // A drag shouldn't count as tapping a photo
        r.el.addEventListener('click', function (e) {
          if (r.justDragged) { e.stopPropagation(); e.preventDefault(); }
        }, true);
        r.el.addEventListener('dragstart', function (e) { e.preventDefault(); });
      });

      box.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hovering = true; });
      box.addEventListener('pointerleave', function () { hovering = false; });
      box.addEventListener('keydown', function (e) {
        var push = e.key === 'ArrowRight' ? -900 : e.key === 'ArrowLeft' ? 900 : 0;
        if (!push || e.target !== box) return;
        e.preventDefault();
        rows.forEach(function (r) { r.v += push; });
      });
      if (toggle) toggle.addEventListener('click', function () { paused = !paused; show(); });
      window.addEventListener('resize', function () { if (started) rows.forEach(fill); }, { passive: true });

      // Only move while on screen, and load the photos just before they're needed
      function nearScreen(on) {
        if (on && !started) {
          started = true;
          box.querySelectorAll('img').forEach(function (img) { img.loading = 'eager'; });
          rows.forEach(fill);
        }
        run(on);
      }
      box.classList.add('is-live');
      show();
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (seen) {
          nearScreen(seen[seen.length - 1].isIntersecting);
        }, { rootMargin: '400px 0px' }).observe(box);
      } else {
        nearScreen(true);
      }
    });
  }

  function ageGate() {
    var ok = false;
    try { ok = localStorage.getItem('deuce-21') === 'yes'; } catch (e) {}
    if (ok) return;
    var gate = document.createElement('div');
    gate.className = 'age-gate';
    gate.setAttribute('role', 'dialog');
    gate.setAttribute('aria-modal', 'true');
    gate.setAttribute('aria-labelledby', 'age-title');
    gate.innerHTML = '<div class="age-card"><img src="images/logo.webp" alt="Deuce Cellars" class="age-logo">' +
      '<h2 id="age-title">Welcome</h2><p class="age-copy">Please confirm you are 21 or older to enter.</p>' +
      '<div class="age-actions"><button class="btn" data-age="yes">I am 21 or older</button>' +
      '<button class="btn btn-ghost" data-age="no">I am under 21</button></div></div>';
    document.body.appendChild(gate);
    document.body.classList.add('no-scroll');
    gate.querySelector('[data-age="yes"]').focus();
    gate.addEventListener('click', function (e) {
      var b = e.target.closest('[data-age]');
      if (!b) return;
      if (b.getAttribute('data-age') === 'yes') {
        try { localStorage.setItem('deuce-21', 'yes'); } catch (err) {}
        gate.remove();
        document.body.classList.remove('no-scroll');
      } else {
        gate.querySelector('.age-copy').textContent = 'Sorry — you must be of legal drinking age to visit this site.';
        gate.querySelector('.age-actions').remove();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderWines();
    nav();
    heroVideo();
    lightbox();
    drift();
    ageGate();
    // The wine cards are added after the page loads, so re-do any #section jump once they're in
    var target = location.hash && document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView();
  });
})();
