/* Deuce Cellars — Where to Buy: search, filters, "near me", and a self-drawn map of Oregon.
   The map is drawn in the page itself (no map service), so it never needs an account or key. */
(function () {
  var LOCS = (window.DEUCE_LOCATIONS || []).map(function (l, i) { l.i = i; return l; });
  var REGIONS = ['Portland', 'Portland suburbs & Vancouver', 'Willamette Valley', 'Oregon coast', 'Columbia Gorge', 'Central Oregon'];

  // Rough centre of each 3-digit ZIP area, used when a ZIP isn't on our list and online lookup isn't available
  var ZIP3 = {
    '970': [45.40, -122.75], '971': [45.25, -123.20], '972': [45.52, -122.67], '973': [44.94, -123.03],
    '974': [44.05, -123.09], '975': [42.33, -122.87], '976': [42.22, -121.78], '977': [44.06, -121.31],
    '978': [45.67, -118.79], '979': [44.03, -116.96], '980': [47.61, -122.33], '981': [47.61, -122.33],
    '982': [48.00, -122.20], '983': [47.25, -122.44], '984': [47.25, -122.44], '985': [47.04, -122.90],
    '986': [45.64, -122.60], '988': [47.42, -120.31], '989': [46.60, -120.51], '990': [47.66, -117.43],
    '991': [47.66, -117.43], '992': [47.66, -117.43], '993': [46.23, -119.10], '994': [46.42, -117.04]
  };

  var state = { q: '', cat: 'all', origin: null, originLabel: '', view: 'oregon', selected: null };
  var lastShown = [];
  var $ = function (id) { return document.getElementById(id); };
  var list = $('loc-list'), status = $('loc-status'), svg = $('loc-map');
  if (!list || !svg) return;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' '); }
  function miles(a, b) {
    var R = 3958.8, toR = Math.PI / 180, dLat = (b[0] - a[0]) * toR, dLng = (b[1] - a[1]) * toR;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a[0] * toR) * Math.cos(b[0] * toR) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function fmtMiles(m) { return m < 0.1 ? 'Under 0.1 mi' : (m < 10 ? m.toFixed(1) : Math.round(m)) + ' mi'; }
  function directions(l) {
    return 'https://www.google.com/maps/dir/?api=1&destination=' +
      encodeURIComponent(l.name + ', ' + l.street + ', ' + l.city + ', ' + l.state + ' ' + l.zip);
  }

  // ---- Filtering ---------------------------------------------------------
  function visible() {
    var words = norm(state.q).split(/\s+/).filter(Boolean);
    var isZip = /^\d{5}$/.test(state.q.trim());
    return LOCS.filter(function (l) {
      if (state.cat !== 'all' && l.cat !== state.cat) return false;
      if (!words.length || isZip || state.origin) return true;
      var hay = norm([l.name, l.city, l.street, l.type, l.zip, l.region].join(' '));
      return words.every(function (w) { return hay.indexOf(w) > -1; });
    });
  }

  // ---- List --------------------------------------------------------------
  function card(l, dist) {
    return '<article class="loc' + (l.i === state.selected ? ' is-on' : '') + '" data-i="' + l.i + '" id="loc-' + l.i + '">' +
      '<div class="loc-head"><h3>' + esc(l.name) + '</h3>' +
      '<span class="loc-type loc-type--' + l.cat + '">' + esc(l.type) + '</span></div>' +
      '<p class="loc-addr">' + esc(l.street) + '<br>' + esc(l.city + ', ' + l.state + ' ' + l.zip) + '</p>' +
      '<div class="loc-foot"><a class="loc-phone" href="tel:+1' + l.phone.replace(/\D/g, '') + '">' + esc(l.phone) + '</a>' +
      (dist != null ? '<span class="loc-dist">' + fmtMiles(dist) + '</span>' : '') +
      '<a class="loc-dir" href="' + esc(directions(l)) + '" target="_blank" rel="noopener">Directions</a></div>' +
      '</article>';
  }

  function render() {
    var items = visible(), html = '';
    if (state.origin) {
      items = items.map(function (l) { return { l: l, d: miles(state.origin, [l.lat, l.lng]) }; })
        .sort(function (a, b) { return a.d - b.d; });
      html = items.map(function (x) { return card(x.l, x.d); }).join('');
      status.innerHTML = 'Nearest to ' + esc(state.originLabel) + ' · <button type="button" class="loc-clear">Show all</button>';
    } else {
      REGIONS.forEach(function (r) {
        var inR = items.filter(function (l) { return l.region === r; })
          .sort(function (a, b) { return (a.city + a.name).localeCompare(b.city + b.name); });
        if (!inR.length) return;
        html += '<h3 class="loc-region">' + esc(r) + ' <span>' + inR.length + '</span></h3>' + inR.map(function (l) { return card(l); }).join('');
      });
      var label = state.cat === 'store' ? 'shops' : state.cat === 'restaurant' ? 'restaurants and bars' : 'locations';
      status.textContent = items.length ? items.length + ' ' + (items.length === 1 ? label.replace(/s$/, '') : label) +
        (state.q ? ' matching “' + state.q + '”' : '') : '';
    }
    if (!items.length) {
      html = '<p class="loc-empty">No matches for “' + esc(state.q) + '”. Try a city name, a ZIP code, or ' +
        '<button type="button" class="loc-clear">show all locations</button>.</p>';
      status.textContent = '';
    }
    list.innerHTML = html;
    lastShown = items.map(function (x) { return x.l || x; });
    drawDots(lastShown);
  }

  // ---- Search ------------------------------------------------------------
  function geocodeZip(zip) {
    var mine = LOCS.filter(function (l) { return l.zip === zip; });
    var fallback = mine.length
      ? [mine.reduce(function (s, l) { return s + l.lat; }, 0) / mine.length, mine.reduce(function (s, l) { return s + l.lng; }, 0) / mine.length]
      : ZIP3[zip.slice(0, 3)] || null;
    // On the live site this asks OpenStreetMap for the ZIP's exact spot; if that isn't reachable, use the estimate
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 3500);
    return fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&postalcode=' + zip, ctrl ? { signal: ctrl.signal } : {})
      .then(function (r) { return r.json(); })
      .then(function (j) { clearTimeout(timer); return j && j[0] ? [+j[0].lat, +j[0].lon] : fallback; })
      .catch(function () { clearTimeout(timer); return fallback; });
  }

  function search(q) {
    state.q = q.trim(); state.origin = null; state.selected = null;
    if (/^\d{5}$/.test(state.q)) {
      status.textContent = 'Finding ' + state.q + '…';
      geocodeZip(state.q).then(function (pt) {
        if (pt) { state.origin = pt; state.originLabel = 'ZIP ' + state.q; }
        else { status.textContent = 'We don’t recognize that ZIP. Try a city name instead.'; }
        render(); if (pt) fitTo(pt);
      });
      return;
    }
    render();
  }

  $('loc-form').addEventListener('submit', function (e) { e.preventDefault(); search($('loc-q').value); });
  $('loc-q').addEventListener('input', function () {
    var v = this.value.trim();
    if (!/^\d+$/.test(v)) search(v);         // filter as you type (ZIPs wait for Search)
  });

  document.querySelectorAll('[data-cat]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.cat = b.getAttribute('data-cat');
      document.querySelectorAll('[data-cat]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      render();
    });
  });

  $('loc-near').addEventListener('click', function () {
    if (!navigator.geolocation) { status.textContent = 'Your browser can’t share its location. Search by city or ZIP instead.'; return; }
    status.textContent = 'Finding your location…';
    navigator.geolocation.getCurrentPosition(function (p) {
      state.q = ''; $('loc-q').value = '';
      state.origin = [p.coords.latitude, p.coords.longitude]; state.originLabel = 'your location';
      render(); fitTo(state.origin);
    }, function () {
      status.textContent = 'We couldn’t get your location. Search by city or ZIP instead.';
    }, { timeout: 9000, maximumAge: 600000 });
  });

  list.addEventListener('click', function (e) {
    if (e.target.closest('.loc-clear')) { state.q = ''; state.origin = null; $('loc-q').value = ''; render(); return; }
    if (e.target.closest('a')) return;
    var c = e.target.closest('.loc'); if (c) select(+c.getAttribute('data-i'), false);
  });
  status.addEventListener('click', function (e) {
    if (e.target.closest('.loc-clear')) { state.q = ''; state.origin = null; $('loc-q').value = ''; render(); }
  });
  list.addEventListener('mouseover', function (e) {
    var c = e.target.closest('.loc'); highlight(c ? +c.getAttribute('data-i') : null);
  });
  list.addEventListener('mouseleave', function () { highlight(null); });

  // ---- Map ---------------------------------------------------------------
  // Plain projection: x from longitude (scaled for Oregon's latitude), y from latitude
  var K = Math.cos(45.5 * Math.PI / 180) * 100;
  function px(lat, lng) { return [(lng + 125) * K, (47 - lat) * 100]; }
  function path(pts, close) { return pts.map(function (p, i) { var q = px(p[0], p[1]); return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('') + (close ? 'Z' : ''); }

  var OREGON = [[46.26, -124.08], [46.18, -123.83], [46.19, -123.40], [46.12, -123.05], [45.98, -122.88], [45.86, -122.80],
    [45.65, -122.76], [45.62, -122.70], [45.60, -122.55], [45.56, -122.39], [45.57, -122.10], [45.67, -121.89], [45.71, -121.52], [45.61, -121.18],
    [45.67, -120.83], [45.72, -120.20], [45.85, -119.65], [45.92, -119.34], [46.00, -119.00], [46.00, -116.92], [45.82, -116.75],
    [45.46, -116.56], [45.10, -116.85], [44.75, -117.05], [44.30, -117.20], [44.10, -116.95], [43.80, -117.03], [42.00, -117.03],
    [42.00, -124.21], [42.40, -124.43], [42.75, -124.50], [43.10, -124.43], [43.40, -124.30], [43.70, -124.19], [44.00, -124.13],
    [44.40, -124.10], [44.70, -124.06], [45.00, -124.01], [45.40, -123.97], [45.75, -123.96], [46.00, -123.93]];
  var COLUMBIA = [[46.26, -124.08], [46.18, -123.83], [46.19, -123.40], [46.12, -123.05], [45.98, -122.88], [45.86, -122.80],
    [45.65, -122.76], [45.62, -122.70], [45.60, -122.55], [45.56, -122.39], [45.57, -122.10], [45.67, -121.89], [45.71, -121.52]];
  var WILLAMETTE = [[44.05, -123.09], [44.56, -123.26], [44.94, -123.04], [45.15, -123.05], [45.25, -123.00], [45.28, -122.92],
    [45.30, -122.77], [45.35, -122.62], [45.41, -122.66], [45.52, -122.67], [45.58, -122.74], [45.65, -122.76]];
  var LABELS = {
    oregon: [['Portland', 45.60, -122.40], ['Salem', 44.94, -123.03], ['Eugene', 44.05, -123.09], ['Bend', 44.06, -121.31],
      ['Hood River', 45.71, -121.52], ['Cannon Beach', 45.89, -123.96]],
    portland: [['Portland', 45.565, -122.70, 'end'], ['Vancouver, WA', 45.66, -122.60], ['Beaverton', 45.485, -122.82, 'end'],
      ['Lake Oswego', 45.41, -122.66], ['Oregon City', 45.35, -122.60], ['Wilsonville', 45.29, -122.78, 'end'],
      ['Newberg', 45.31, -122.97], ['Forest Grove', 45.52, -123.11]]
  };
  function box(view) {      // [x, y, w, h] in map units
    var a = view === 'portland' ? px(45.70, -123.20) : px(46.45, -124.75);
    var b = view === 'portland' ? px(45.22, -122.32) : px(41.85, -116.30);
    return [a[0], a[1], b[0] - a[0], b[1] - a[1]];
  }
  var NS = 'http://www.w3.org/2000/svg';
  function el(name, attrs, parent) { var n = document.createElementNS(NS, name); for (var k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; }

  var base = el('g', { 'class': 'map-base' }, svg);
  el('path', { d: path(OREGON, true), 'class': 'map-land', 'vector-effect': 'non-scaling-stroke' }, base);
  el('path', { d: path(COLUMBIA), 'class': 'map-river', 'vector-effect': 'non-scaling-stroke' }, base);
  el('path', { d: path(WILLAMETTE), 'class': 'map-river', 'vector-effect': 'non-scaling-stroke' }, base);
  var labelLayer = el('g', { 'class': 'map-labels' }, svg);
  var dotLayer = el('g', { 'class': 'map-dots' }, svg);
  var current = box('oregon'), dots = {};

  function scale() { return current[2] / (svg.clientWidth || 600); }    // map units per screen pixel

  function drawLabels() {
    labelLayer.innerHTML = '';
    var s = scale();
    LABELS[state.view].forEach(function (t) {
      var p = px(t[1], t[2]), end = t[3] === 'end';
      var n = el('text', { x: p[0] + (end ? -8 : 8) * s, y: p[1] - 7 * s, 'font-size': 12 * s, 'stroke-width': 3 * s,
        'text-anchor': end ? 'end' : 'start' }, labelLayer);
      n.textContent = t[0];
    });
  }

  function drawDots(shown) {
    var on = {}; shown.forEach(function (l) { on[l.i] = true; });
    var s = scale();
    dotLayer.innerHTML = ''; dots = {};
    // draw dimmed ones first so matches sit on top
    LOCS.slice().sort(function (a, b) { return (on[a.i] ? 1 : 0) - (on[b.i] ? 1 : 0); }).forEach(function (l) {
      var p = px(l.lat, l.lng);
      var c = el('circle', {
        cx: p[0], cy: p[1], r: (l.i === state.selected ? 8 : 5) * s, 'stroke-width': 1.5 * s,
        'class': 'dot dot--' + l.cat + (on[l.i] ? '' : ' is-dim') + (l.i === state.selected ? ' is-on' : '')
      }, dotLayer);
      el('title', {}, c).textContent = l.name + ' · ' + l.city;
      c.addEventListener('click', function () { select(l.i, true); });
      dots[l.i] = c;
    });
  }

  function setBox(b) { current = b; svg.setAttribute('viewBox', b.map(function (v) { return v.toFixed(2); }).join(' ')); }
  function animateTo(view) {
    state.view = view;
    document.querySelectorAll('[data-view]').forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-view') === view ? 'true' : 'false'); });
    var from = current.slice(), to = box(view), t0 = null;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    function step(t) {
      if (t0 === null) t0 = t;
      var k = reduce ? 1 : Math.min(1, (t - t0) / 450), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      setBox(from.map(function (v, i) { return v + (to[i] - v) * e; }));
      drawLabels(); drawDots(lastShown);
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function inPortland(lat, lng) { return lat < 45.70 && lat > 45.22 && lng > -123.20 && lng < -122.32; }
  function fitTo(pt) { var v = inPortland(pt[0], pt[1]) ? 'portland' : 'oregon'; if (v !== state.view) animateTo(v); }

  function highlight(i) {
    Object.keys(dots).forEach(function (k) { dots[k].classList.toggle('is-hover', +k === i); });
    if (i != null && dots[i]) dotLayer.appendChild(dots[i]);   // bring the hovered dot to the front
  }
  function select(i, fromMap) {
    state.selected = i;
    var l = LOCS[i];
    if (inPortland(l.lat, l.lng) && state.view !== 'portland') animateTo('portland'); else drawDots(lastShown);
    list.querySelectorAll('.loc').forEach(function (c) { c.classList.toggle('is-on', +c.getAttribute('data-i') === i); });
    if (fromMap) {
      var c = document.getElementById('loc-' + i);
      if (c) {
        // keep the list panel scrolling inside itself on desktop
        if (list.scrollHeight > list.clientHeight + 4) list.scrollTo({ top: c.offsetTop - list.offsetTop - 12, behavior: 'smooth' });
        else c.scrollIntoView({ behavior: 'smooth', block: 'center' });
        c.classList.add('is-on');
      }
    }
  }

  document.querySelectorAll('[data-view]').forEach(function (b) {
    b.addEventListener('click', function () { animateTo(b.getAttribute('data-view')); });
  });
  window.addEventListener('resize', function () { drawLabels(); drawDots(lastShown); });

  document.querySelectorAll('[data-loc-count]').forEach(function (n) { n.textContent = LOCS.length; });
  setBox(current); drawLabels(); render();
})();
