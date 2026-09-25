// Real-robot figures, drawn natively.
//
// Replaces two PNGs. Fig. 6 values are the labels printed on the paper figure,
// and each one reproduces exactly as the mean of the corresponding cells in the
// success-rate table above. Fig. 7 values were recovered from the paper figure
// and snapped to 0.1 (every task is 10 rollouts); the per-category average
// checks out as the mean of its tasks at all six ticks.

(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }
  function txt(node, s) { node.textContent = s; return node; }

  // ---------------------------------------------------------------- Fig. 6
  (function categoryChart() {
    var mount = document.getElementById('cat-chart');
    var legendEl = document.getElementById('cat-legend');
    if (!mount || !legendEl) return;

    var METHODS = [
      {name: 'Sim',        colour: '#d77ea4'},
      {name: 'Sim + DR',   colour: '#db9f60'},
      {name: 'RoboRender', colour: '#8C1515'}
    ];
    // solid = with distractors at evaluation; open = same method without them
    var CATS = [
      {name: 'Droid PnP',         solid: [0.20, 0.33, 0.68], clean: [0.48, 0.70, 0.80]},
      {name: 'Articulated',       solid: [0.00, 0.00, 0.80], clean: null},
      {name: 'Unseen Embodiment', solid: [0.00, 0.15, 0.70], clean: null}
    ];

    var W = 640, H = 300, ML = 42, MR = 10, MT = 16, MB = 40;
    var svg = el('svg', {viewBox: '0 0 ' + W + ' ' + H, class: 'arq-svg', role: 'img',
                         'aria-label': 'Success rate by task category'});
    var y = function (v) { return H - MB - v * (H - MT - MB); };

    [0, 0.2, 0.4, 0.6, 0.8, 1.0].forEach(function (t) {
      svg.appendChild(el('line', {class: 'arq-grid', x1: ML, x2: W - MR, y1: y(t), y2: y(t)}));
      svg.appendChild(txt(el('text', {class: 'arq-tick', x: ML - 7, y: y(t) + 3.5,
                                      'text-anchor': 'end'}), t.toFixed(1)));
    });
    svg.appendChild(el('line', {class: 'arq-axis', x1: ML, x2: W - MR, y1: y(0), y2: y(0)}));
    svg.appendChild(el('line', {class: 'arq-axis', x1: ML, x2: ML, y1: y(0), y2: MT}));

    var band = (W - ML - MR) / CATS.length;
    var bw = band / (METHODS.length + 1.6);

    var bars = [];
    CATS.forEach(function (cat, ci) {
      var cx = ML + band * ci + band / 2;
      var x0 = cx - (METHODS.length * bw) / 2;
      METHODS.forEach(function (m, mi) {
        var bx = x0 + mi * bw, v = cat.solid[mi];
        if (cat.clean) {
          var c = cat.clean[mi];
          var open = el('rect', {class: 'cat-bar cat-bar--clean', x: bx + 1.5, width: bw - 3,
                                 y: y(c), height: Math.max(y(v) - y(c), 0),
                                 fill: m.colour, stroke: m.colour});
          svg.appendChild(open);
          bars.push({node: open, method: m, cat: cat, value: c, clean: true});
          svg.appendChild(txt(el('text', {class: 'cat-value cat-value--clean', x: bx + bw / 2,
                                          y: y(c) - 5, 'text-anchor': 'middle',
                                          fill: m.colour}), c.toFixed(2)));
        }
        var rect = el('rect', {class: 'cat-bar', x: bx + 1.5, width: bw - 3,
                               y: y(v), height: Math.max(y(0) - y(v), 0.8), fill: m.colour});
        svg.appendChild(rect);
        bars.push({node: rect, method: m, cat: cat, value: v, clean: false});
        svg.appendChild(txt(el('text', {class: 'cat-value', x: bx + bw / 2, y: y(v) - 5,
                                        'text-anchor': 'middle'}), v.toFixed(2)));
      });
      svg.appendChild(txt(el('text', {class: 'arq-axis-label', x: cx, y: H - MB + 18,
                                      'text-anchor': 'middle'}), cat.name));
    });

    svg.appendChild(txt(el('text', {class: 'arq-plot-title', x: ML + 4, y: MT - 3}),
                        'Success rate ↑'));
    mount.appendChild(svg);

    METHODS.forEach(function (m) {
      var li = document.createElement('li');
      li.className = 'arq-legend-item';
      li.innerHTML = '<span class="arq-key arq-key--block" style="background:' + m.colour +
                     '"></span>' + m.name;
      li.addEventListener('mouseenter', function () {
        bars.forEach(function (b) { b.node.classList.toggle('is-dim', b.method !== m); });
        li.classList.add('is-on');
      });
      li.addEventListener('mouseleave', function () {
        bars.forEach(function (b) { b.node.classList.remove('is-dim'); });
        li.classList.remove('is-on');
      });
      legendEl.appendChild(li);
    });
  })();

  // ---------------------------------------------------------------- Fig. 7
  (function scalingPlots() {
    var mount = document.getElementById('scale-plots');
    var readout = document.getElementById('scale-readout');
    if (!mount || !readout) return;

    var PANELS = [
      {title: 'Pick and place', ticks: ['1×', '2×', '3×'], reference: 0.675,
       series: [
         {name: 'Mug',   colour: '#6f9fd0', v: [0.8, 0.8, 0.9]},
         {name: 'Bowl',  colour: '#d1749f', v: [0.5, 0.6, 0.7]},
         {name: 'Apple', colour: '#9384d4', v: [0.5, 0.6, 0.5]},
         {name: 'Egg',   colour: '#d69a4f', v: [0.1, 0.3, 0.2]}
       ],
       average: [0.475, 0.575, 0.575]},
      {title: 'Opening', ticks: ['1×', '1.5×', '2×'], reference: 0.80,
       series: [
         {name: 'Drawer', colour: '#6f9fd0', v: [0.0, 0.8, 0.6]},
         {name: 'Fridge', colour: '#d1749f', v: [0.0, 0.1, 0.7]}
       ],
       average: [0.0, 0.45, 0.65]}
    ];

    var W = 330, H = 215, ML = 40, MR = 12, MT = 20, MB = 34;

    PANELS.forEach(function (p) {
      var svg = el('svg', {viewBox: '0 0 ' + W + ' ' + H, class: 'arq-svg', role: 'img',
                           'aria-label': p.title + ' scaling'});
      var n = p.ticks.length;
      var x = function (i) { return ML + i / (n - 1) * (W - ML - MR); };
      var y = function (v) { return H - MB - v * (H - MT - MB); };

      [0, 0.2, 0.4, 0.6, 0.8, 1.0].forEach(function (t) {
        svg.appendChild(el('line', {class: 'arq-grid', x1: ML, x2: W - MR, y1: y(t), y2: y(t)}));
        svg.appendChild(txt(el('text', {class: 'arq-tick', x: ML - 6, y: y(t) + 3.5,
                                        'text-anchor': 'end'}), t.toFixed(1)));
      });
      p.ticks.forEach(function (t, i) {
        svg.appendChild(txt(el('text', {class: 'arq-tick', x: x(i), y: H - MB + 15,
                                        'text-anchor': 'middle'}), t));
      });
      svg.appendChild(el('line', {class: 'arq-axis', x1: ML, x2: W - MR, y1: y(0), y2: y(0)}));
      svg.appendChild(el('line', {class: 'arq-axis', x1: ML, x2: ML, y1: y(0), y2: MT}));
      svg.appendChild(txt(el('text', {class: 'arq-plot-title', x: ML + 4, y: MT - 6}), p.title));

      // reference policy: trained with 2x more simulation trajectories
      svg.appendChild(el('line', {class: 'scale-ref', x1: ML, x2: W - MR,
                                  y1: y(p.reference), y2: y(p.reference)}));

      p.series.forEach(function (s) {
        svg.appendChild(el('polyline', {class: 'scale-task', fill: 'none', stroke: s.colour,
          points: s.v.map(function (v, i) { return x(i) + ',' + y(v); }).join(' ')}));
      });

      var avg = el('polyline', {class: 'scale-avg', fill: 'none',
        points: p.average.map(function (v, i) { return x(i) + ',' + y(v); }).join(' ')});
      svg.appendChild(avg);

      var guide = el('line', {class: 'scale-guide', y1: MT, y2: y(0), x1: ML, x2: ML});
      svg.appendChild(guide);

      var dots = p.average.map(function (v, i) {
        var dot = el('circle', {class: 'arq-dot scale-avg-dot', cx: x(i), cy: y(v), r: 3.6});
        svg.appendChild(dot);
        return dot;
      });

      // full-height bands rather than small circles: the whole column around a
      // tick is the target, so hitting it needs no precision
      p.ticks.forEach(function (tick, i) {
        var lo = i === 0 ? ML : (x(i - 1) + x(i)) / 2;
        var hi = i === n - 1 ? W - MR : (x(i) + x(i + 1)) / 2;
        var band = el('rect', {class: 'scale-band', x: lo, y: MT,
                               width: Math.max(hi - lo, 1), height: y(0) - MT});
        band.addEventListener('mouseenter', function () {
          dots.forEach(function (d, k) { d.classList.toggle('is-hot', k === i); });
          guide.setAttribute('x1', x(i));
          guide.setAttribute('x2', x(i));
          guide.classList.add('is-on');
          readout.innerHTML = '<span class="arq-readout-t">' + p.title + ' &middot; ' +
            tick + ' videos per trajectory</span>' +
            p.series.map(function (s) {
              return '<span class="arq-chip"><span class="arq-key" style="background:' +
                     s.colour + '"></span>' + s.name + ' <b>' +
                     Math.round(s.v[i] * 100) + '%</b></span>';
            }).join('') +
            '<span class="arq-chip is-avg"><span class="arq-key" style="background:#8C1515">' +
            '</span>Average <b>' + (p.average[i] * 100).toFixed(1).replace('.0', '') +
            '%</b></span>';
          readout.classList.remove('is-idle');
        });
        svg.appendChild(band);
      });

      // clearing on the svg, not per band, so sliding between bands never flickers
      svg.addEventListener('mouseleave', function () {
        dots.forEach(function (d) { d.classList.remove('is-hot'); });
        guide.classList.remove('is-on');
        idle();
      });

      var box = document.createElement('div');
      box.className = 'arq-plot';
      box.appendChild(svg);
      mount.appendChild(box);
    });

    var CURSOR = '<svg class="arch-icon" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M5 2 L5 19 L9.3 14.8 L12.2 21.5 L14.8 20.3 L11.9 13.8 L18 13.8 Z" ' +
      'fill="currentColor"/></svg>';
    function idle() {
      readout.innerHTML = CURSOR + 'Hover anywhere in the plot for the per-task breakdown at that point.';
      readout.classList.add('is-idle');
    }
    idle();
  })();
})();
