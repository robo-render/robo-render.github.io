// Per-frame quality along autoregressive rollouts, drawn natively.
//
// Replaces a PNG of the same plot. Values were recovered from the vector art
// in the paper rather than read off the raster, and cross-check against the
// table above: RoboRender's LPIPS at 3 s is 0.142 in both.

(function () {
  'use strict';

  var T = [3, 6, 9, 12, 15];

  var SERIES = [
    {name: 'Wan-Fun-Control',    colour: '#4E79A7',
     psnr:  [18.37, 16.96, 16.03, 15.48, 14.84],
     lpips: [0.205, 0.251, 0.278, 0.305, 0.322]},
    {name: 'Cosmos-Transfer2.5', colour: '#F28E2B',
     psnr:  [12.70, 12.52, 12.45, 12.41, 12.18],
     lpips: [0.435, 0.443, 0.449, 0.454, 0.459]},
    {name: 'RoboRender',         colour: '#8C1515',
     psnr:  [21.68, 20.15, 19.53, 18.56, 18.07],
     lpips: [0.142, 0.183, 0.201, 0.232, 0.238]}
  ];

  var PLOTS = [
    {key: 'psnr',  title: 'PSNR ↑',  min: 10, max: 25,  ticks: [10, 15, 20, 25],
     better: 'high',
     fmt: function (v) { return v.toFixed(0); }, val: function (v) { return v.toFixed(2); }},
    {key: 'lpips', title: 'LPIPS ↓', min: 0,  max: 0.6, ticks: [0, 0.2, 0.4, 0.6],
     better: 'low',
     fmt: function (v) { return v.toFixed(1); }, val: function (v) { return v.toFixed(3); }}
  ];

  var mount = document.getElementById('arq-plots');
  var legendEl = document.getElementById('arq-legend');
  if (!mount || !legendEl) return;

  var NS = 'http://www.w3.org/2000/svg';
  var W = 330, H = 215, ML = 44, MR = 10, MT = 20, MB = 36;

  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  var lineNodes = {}, dotNodes = {};
  SERIES.forEach(function (s) { lineNodes[s.name] = []; dotNodes[s.name] = []; });

  var readout = document.getElementById('arq-readout');
  var hotDots = [];   // every dot sharing the hovered time, across both plots
  var guides = [];

  PLOTS.forEach(function (p) {
    var svg = el('svg', {viewBox: '0 0 ' + W + ' ' + H, class: 'arq-svg',
                         role: 'img', 'aria-label': p.title + ' along autoregressive rollouts'});

    var x = function (t) { return ML + (t - T[0]) / (T[T.length - 1] - T[0]) * (W - ML - MR); };
    var y = function (v) { return H - MB - (v - p.min) / (p.max - p.min) * (H - MT - MB); };
    p.x = x; p.y = y;

    p.ticks.forEach(function (tv) {
      svg.appendChild(el('line', {class: 'arq-grid', x1: ML, x2: W - MR, y1: y(tv), y2: y(tv)}));
      var lab = el('text', {class: 'arq-tick', x: ML - 7, y: y(tv) + 3.5, 'text-anchor': 'end'});
      lab.textContent = p.fmt(tv);
      svg.appendChild(lab);
    });

    T.forEach(function (t) {
      var lab = el('text', {class: 'arq-tick', x: x(t), y: H - MB + 15, 'text-anchor': 'middle'});
      lab.textContent = t;
      svg.appendChild(lab);
    });

    svg.appendChild(el('line', {class: 'arq-axis', x1: ML, x2: W - MR, y1: y(p.min), y2: y(p.min)}));
    svg.appendChild(el('line', {class: 'arq-axis', x1: ML, x2: ML, y1: y(p.min), y2: MT}));

    // vertical guide, revealed on hover to tie the point to its time
    var guide = el('line', {class: 'arq-guide', y1: MT, y2: H - MB, x1: ML, x2: ML});
    svg.appendChild(guide);
    guides.push({node: guide, x: x});

    var xlab = el('text', {class: 'arq-axis-label', x: W - MR, y: H - 4, 'text-anchor': 'end'});
    xlab.textContent = 't (s)';
    svg.appendChild(xlab);

    var title = el('text', {class: 'arq-plot-title', x: ML + 4, y: MT - 6});
    title.textContent = p.title;
    svg.appendChild(title);

    SERIES.forEach(function (s) {
      var pts = s[p.key].map(function (v, i) { return x(T[i]) + ',' + y(v); }).join(' ');
      var line = el('polyline', {class: 'arq-line', points: pts, fill: 'none', stroke: s.colour});
      svg.appendChild(line);
      lineNodes[s.name].push(line);

      s[p.key].forEach(function (v, i) {
        var dot = el('circle', {class: 'arq-dot', cx: x(T[i]), cy: y(v), r: 3.4, fill: s.colour});
        dot.dataset.i = i;
        svg.appendChild(dot);
        dotNodes[s.name].push(dot);
      });
    });

    // full-height bands rather than per-point circles: the whole column around a
    // tick is the target, so reading a time needs no precision
    T.forEach(function (t, i) {
      var lo = i === 0 ? ML : (x(T[i - 1]) + x(t)) / 2;
      var hi = i === T.length - 1 ? W - MR : (x(t) + x(T[i + 1])) / 2;
      var band = el('rect', {class: 'arq-hit', x: lo, y: MT,
                             width: Math.max(hi - lo, 1), height: y(p.min) - MT});
      band.addEventListener('mouseenter', function () { showPoint(p, i); });
      svg.appendChild(band);
    });

    // clearing on the svg, not per band, so sliding between columns never flickers
    svg.addEventListener('mouseleave', clearPoint);

    var box = document.createElement('div');
    box.className = 'arq-plot';
    box.appendChild(svg);
    mount.appendChild(box);
  });

  function clearPoint() {
    hotDots.forEach(function (d) { d.classList.remove('is-hot', 'is-peer'); });
    hotDots = [];
    guides.forEach(function (g) { g.node.classList.remove('is-on'); });
    idleReadout();
  }

  function showPoint(plot, i) {
    clearPoint();

    // mark every point at this time, in both plots
    SERIES.forEach(function (s) {
      dotNodes[s.name].forEach(function (d) {
        if (+d.dataset.i !== i) return;
        d.classList.add('is-peer');
        hotDots.push(d);
      });
    });

    guides.forEach(function (g) {
      g.node.setAttribute('x1', g.x(T[i]));
      g.node.setAttribute('x2', g.x(T[i]));
      g.node.classList.add('is-on');
    });

    // mark the leader at this time, respecting the metric's direction --
    // PSNR wants the highest value, LPIPS the lowest
    var vals = SERIES.map(function (s) { return s[plot.key][i]; });
    var bestVal = plot.better === 'low' ? Math.min.apply(null, vals)
                                        : Math.max.apply(null, vals);

    var rows = SERIES.map(function (s, k) {
      var cls = 'arq-chip';
      if (vals[k] === bestVal) cls += ' is-best';
      return '<span class="' + cls + '">' +
             '<span class="arq-key" style="background:' + s.colour + '"></span>' +
             s.name + ' <b>' + plot.val(vals[k]) + '</b></span>';
    }).join('');
    readout.innerHTML = '<span class="arq-readout-t">t = ' + T[i] + ' s &middot; ' +
                        plot.title + '</span>' + rows;
    readout.classList.remove('is-idle');
  }

  var CURSOR = '<svg class="arch-icon" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M5 2 L5 19 L9.3 14.8 L12.2 21.5 L14.8 20.3 L11.9 13.8 L18 13.8 Z" ' +
    'fill="currentColor"/></svg>';

  function idleReadout() {
    readout.innerHTML = CURSOR + 'Hover a point to compare all three models at that time.';
    readout.classList.add('is-idle');
  }

  SERIES.forEach(function (s) {
    var li = document.createElement('li');
    li.className = 'arq-legend-item';
    li.dataset.series = s.name;
    li.tabIndex = 0;
    li.innerHTML = '<span class="arq-key" style="background:' + s.colour + '"></span>' + s.name;
    li.addEventListener('mouseenter', function () { highlight(s.name); });
    li.addEventListener('focus', function () { highlight(s.name); });
    li.addEventListener('mouseleave', function () { highlight(null); });
    li.addEventListener('blur', function () { highlight(null); });
    legendEl.appendChild(li);
  });

  idleReadout();
})();
