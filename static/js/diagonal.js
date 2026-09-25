// Diagonal before/after reveal for the distractor clips.
//
// One frame per task holding both videos, split by a bar running bottom-left
// to top-right. The split is the line x/W + y/H = d, so d sweeps from the
// top-left corner (0) through the full diagonal (1) to the bottom-right (2),
// and the chord midpoint is always at (d/2, d/2) -- which is where the handle
// sits, for either half of the range.

(function () {
  'use strict';

  var TASKS = [
    {key: 'mug',   label: 'Mug'},
    {key: 'bowl',  label: 'Bowl'},
    {key: 'apple', label: 'Apple'},
    {key: 'egg',   label: 'Egg'}
  ];

  var DEFAULT_D = 1;
  var STEP = 0.06;
  var MIN_VISIBLE = 0.18;   // hide a label once its corner gets too small

  var mount = document.getElementById('diag-grid');
  if (!mount) return;

  function video(src, label) {
    var v = document.createElement('video');
    v.autoplay = true; v.muted = true; v.loop = true; v.playsInline = true;
    v.src = src;
    v.setAttribute('aria-label', label);
    return v;
  }

  function build(task) {
    var box = document.createElement('div');
    box.className = 'diag';

    var gen = video('static/videos/compare/distract_' + task.key + '_dcropgen.mp4',
                    'Distractor insertion, ' + task.label.toLowerCase());
    var depth = video('static/videos/compare/distract_' + task.key + '_dcropdepth.mp4',
                      'Cropped depth condition, ' + task.label.toLowerCase());
    gen.className = 'diag-top';
    box.appendChild(depth);
    box.appendChild(gen);

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'diag-line');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    svg.appendChild(line);
    box.appendChild(svg);

    var a = document.createElement('span');
    a.className = 'diag-label diag-label--tl diag-label--accent';
    a.textContent = 'Distractor insertion';
    var b = document.createElement('span');
    b.className = 'diag-label diag-label--br';
    b.textContent = 'Depth (cropped)';
    box.appendChild(a);
    box.appendChild(b);

    var handle = document.createElement('div');
    handle.className = 'diag-handle';
    handle.tabIndex = 0;
    handle.setAttribute('role', 'application');
    handle.setAttribute('aria-label',
      task.label + ': drag across the diagonal to compare the cropped depth with the video generated from it. Arrow keys also work.');
    // the split runs bottom-left to top-right, so the drag axis -- and the
    // arrow -- lies along the other diagonal
    handle.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M7.2 7.2 L16.8 16.8 M6.2 6.2 L6.2 11.4 M6.2 6.2 L11.4 6.2 ' +
      'M17.8 17.8 L17.8 12.6 M17.8 17.8 L12.6 17.8" ' +
      'fill="none" stroke="currentColor" stroke-width="2.2" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></svg>';
    box.appendChild(handle);

    var d = DEFAULT_D;

    function apply() {
      var p = (d <= 1)
        ? 'polygon(0 0, ' + (d * 100).toFixed(2) + '% 0, 0 ' + (d * 100).toFixed(2) + '%)'
        : 'polygon(0 0, 100% 0, 100% ' + ((d - 1) * 100).toFixed(2) + '%, ' +
          ((d - 1) * 100).toFixed(2) + '% 100%, 0 100%)';
      gen.style.clipPath = p;

      if (d <= 1) {
        line.setAttribute('x1', (d * 100).toFixed(2)); line.setAttribute('y1', 0);
        line.setAttribute('x2', 0); line.setAttribute('y2', (d * 100).toFixed(2));
      } else {
        line.setAttribute('x1', 100); line.setAttribute('y1', ((d - 1) * 100).toFixed(2));
        line.setAttribute('x2', ((d - 1) * 100).toFixed(2)); line.setAttribute('y2', 100);
      }

      handle.style.left = (d * 50).toFixed(2) + '%';
      handle.style.top = (d * 50).toFixed(2) + '%';

      a.style.opacity = d > MIN_VISIBLE * 2 ? 1 : 0;
      b.style.opacity = d < 2 - MIN_VISIBLE * 2 ? 1 : 0;
    }

    function clamp(v) { return v < 0 ? 0 : (v > 2 ? 2 : v); }

    function fromEvent(e) {
      var r = box.getBoundingClientRect();
      if (!r.width || !r.height) return;
      d = clamp((e.clientX - r.left) / r.width + (e.clientY - r.top) / r.height);
      apply();
    }

    var dragging = false;
    function down(e) { dragging = true; fromEvent(e); e.preventDefault(); }
    function move(e) { if (dragging) { fromEvent(e); e.preventDefault(); } }
    function up() { dragging = false; }

    handle.addEventListener('pointerdown', down);
    box.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);

    handle.addEventListener('keydown', function (e) {
      var hit = true;
      switch (e.key) {
        case 'ArrowLeft': case 'ArrowUp':    d = clamp(d - STEP); break;
        case 'ArrowRight': case 'ArrowDown': d = clamp(d + STEP); break;
        case 'Home': d = DEFAULT_D; break;
        default: hit = false;
      }
      if (hit) { apply(); e.preventDefault(); }
    });

    // the two clips are frame-matched, so keep them from drifting apart
    gen.addEventListener('timeupdate', function () {
      if (Math.abs(gen.currentTime - depth.currentTime) > 0.25) depth.currentTime = gen.currentTime;
    });

    apply();
    return {node: box, videos: [gen, depth]};
  }

  var CURSOR = '<svg class="arch-icon" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M5 2 L5 19 L9.3 14.8 L12.2 21.5 L14.8 20.3 L11.9 13.8 L18 13.8 Z" ' +
    'fill="currentColor"/></svg>';

  TASKS.forEach(function (t) {
    var cell = document.createElement('div');
    cell.className = 'diag-cell';
    var cap = document.createElement('p');
    cap.className = 'baseline-task';
    cap.textContent = t.label + ' — pick and place';
    cell.appendChild(cap);
    var built = build(t);
    cell.appendChild(built.node);
    mount.appendChild(cell);
    built.videos.forEach(function (v) {
      var p = v.play();
      if (p && typeof p.catch === 'function') p.catch(function () {});
    });
  });

  var hint = document.createElement('p');
  hint.className = 'quad-hint diag-hint';
  hint.innerHTML = CURSOR +
    'Drag the diagonal to wipe between the cropped depth and the video generated from it.';
  mount.parentNode.insertBefore(hint, mount.nextSibling);
})();
