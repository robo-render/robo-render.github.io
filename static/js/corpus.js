// Task-type composition of the training corpus, drawn natively.
//
// Replaces a PNG of the same chart so the colours, type and spacing follow the
// page's CSS. Percentages are derived from the counts rather than stored, so
// the ring, the legend and the table total cannot drift apart; the counts sum
// to the 126,950 in the table above.

(function () {
  'use strict';

  // label, sample count, slice colour (sampled from the original figure)
  var TASKS = [
    ['Pick &amp; place',        60663, '#3b64a8'],
    ['Fold / deform',           24238, '#da7841'],
    ['Open / close',             8880, '#45a059'],
    ['Hang / unhang',            6565, '#be3d41'],
    ['Freeform / multi-step',    4765, '#7564ac'],
    ['Press / button',           4300, '#896b51'],
    ['Wipe / clean',             4252, '#d680bd'],
    ['Lid on / off',             3859, '#818181'],
    ['Push / pull',              2147, '#c7b267'],
    ['Pour',                     2043, '#55aec8'],
    ['Insert / plug',            1869, '#98c4f3'],
    ['Twist / turn',              924, '#ffad76'],
    ['Dip',                       844, '#a8e26f'],
    ['Stack',                     790, '#ff9691'],
    ['Stir',                      683, '#cbb4ff'],
    ['Other',                     128, '#faa8e1']
  ];

  var svg = document.getElementById('corpus-donut');
  var legend = document.getElementById('corpus-legend');
  if (!svg || !legend) return;

  var valueEl = document.getElementById('corpus-value');
  var labelEl = document.getElementById('corpus-label');

  var R = 70, CX = 100, CY = 100, C = 2 * Math.PI * R;
  var total = TASKS.reduce(function (a, t) { return a + t[1]; }, 0);
  var NS = 'http://www.w3.org/2000/svg';

  function commas(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function pct(n) { return (n / total * 100).toFixed(1) + '%'; }

  var arcs = [], rows = [], offset = 0;

  TASKS.forEach(function (t, i) {
    var name = t[0], count = t[1], colour = t[2];
    var frac = count / total;

    var arc = document.createElementNS(NS, 'circle');
    arc.setAttribute('class', 'corpus-arc');
    arc.setAttribute('cx', CX);
    arc.setAttribute('cy', CY);
    arc.setAttribute('r', R);
    arc.setAttribute('fill', 'none');
    arc.setAttribute('stroke', colour);
    arc.setAttribute('stroke-width', 38);
    arc.setAttribute('stroke-dasharray', (frac * C).toFixed(3) + ' ' + C.toFixed(3));
    arc.setAttribute('stroke-dashoffset', (-offset * C).toFixed(3));
    // start the ring at twelve o'clock rather than three
    arc.setAttribute('transform', 'rotate(-90 ' + CX + ' ' + CY + ')');
    svg.appendChild(arc);
    arcs.push(arc);
    offset += frac;

    var row = document.createElement('li');
    row.className = 'corpus-row';
    row.tabIndex = 0;
    row.innerHTML = '<span class="corpus-swatch" style="background:' + colour + '"></span>' +
                    '<span class="corpus-name">' + name + '</span>' +
                    '<span class="corpus-pct">' + pct(count) + '</span>';
    legend.appendChild(row);
    rows.push(row);

    function enter() { highlight(i); }
    function leave() { highlight(-1); }
    row.addEventListener('mouseenter', enter);
    row.addEventListener('focus', enter);
    row.addEventListener('mouseleave', leave);
    row.addEventListener('blur', leave);
    arc.addEventListener('mouseenter', enter);
    arc.addEventListener('mouseleave', leave);
  });

  function highlight(idx) {
    arcs.forEach(function (a, i) { a.classList.toggle('is-dim', idx >= 0 && i !== idx); });
    rows.forEach(function (r, i) { r.classList.toggle('is-on', i === idx); });
    if (idx < 0) {
      valueEl.textContent = commas(total);
      labelEl.textContent = 'samples';
    } else {
      valueEl.textContent = commas(TASKS[idx][1]);
      labelEl.innerHTML = pct(TASKS[idx][1]) + ' of samples';
    }
  }

  highlight(-1);
})();
