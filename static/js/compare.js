// Training-data comparison.
//
// For each task we show four episodes in a 2x2 grid. Every episode is its own
// four-way slider: the four clips are the same simulation trajectory shot from
// the same camera, so they can be stacked in registration and each clipped to
// one quadrant. Dragging a puck moves that episode's split point; pushing it
// into a corner gives the opposite clip the full frame.
//
// Quadrant layout puts the headline contrast along the top row: Simulation
// (top left) against RoboRender (top right), with Depth and Simulation + DR
// below.

(function () {
  'use strict';

  var TASKS = [
    {key: 'mug',    short: 'Mug',    label: 'Mug (pick and place)'},
    {key: 'bowl',   short: 'Bowl',   label: 'Bowl (pick and place)'},
    {key: 'apple',  short: 'Apple',  label: 'Apple (pick and place)'},
    {key: 'egg',    short: 'Egg',    label: 'Egg (pick and place)'},
    {key: 'fridge', short: 'Fridge', label: 'Open the fridge'},
    {key: 'drawer', short: 'Drawer', label: 'Open the drawer'},
    {key: 'radio',  short: 'Radio',  label: 'Pick up the radio'},
    {key: 'marker', short: 'Marker', label: 'Place the green marker'}
  ];

  var QUADRANTS = {
    tl: {slug: 'sim',        label: 'Simulation'},
    tr: {slug: 'roborender', label: 'RoboRender', accent: true},
    bl: {slug: 'depth',      label: 'Depth (condition)'},
    br: {slug: 'dr',         label: 'Simulation + DR'}
  };

  var EPISODES = 4;
  var MIN_VISIBLE = 0.14;
  var STEP = 0.02;

  // Start the split two fifths in from the left and two fifths up from the
  // bottom, so RoboRender (top right) opens at three fifths of the frame in
  // each direction.
  var DEFAULT_X = 2 / 5;
  var DEFAULT_Y = 3 / 5;

  var CURSOR = '<svg class="arch-icon" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M5 2 L5 19 L9.3 14.8 L12.2 21.5 L14.8 20.3 L11.9 13.8 L18 13.8 Z" ' +
    'fill="currentColor"/></svg>';

  var picker = document.getElementById('compare-buttons');
  var mount = document.getElementById('compare-panes');
  if (!picker || !mount) return;

  var buttons = {};
  TASKS.forEach(function (task) {
    var button = document.createElement('button');
    button.type = 'button';
    button.textContent = task.short;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', 'false');
    button.setAttribute('aria-label', task.label);
    button.addEventListener('click', function () { render(task.key); });
    picker.appendChild(button);
    buttons[task.key] = button;
  });

  function clipSrc(key, episode, slug) {
    return 'static/videos/compare/' + key + '_e' + episode + '_' + slug + '.mp4';
  }

  function makeVideo(src, label) {
    var video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.src = src;
    video.setAttribute('aria-label', label);
    return video;
  }

  function playAll(videos) {
    videos.forEach(function (v) {
      // play() rejects if autoplay is blocked; the clips are muted so it
      // normally succeeds, but swallow the rejection either way.
      var played = v.play();
      if (played && typeof played.catch === 'function') played.catch(function () {});
    });
  }

  // Keep one episode's clips from drifting apart: when the first wraps back to
  // the start, snap the others to zero so its quadrants stay frame-aligned.
  function syncGroup(videos) {
    if (videos.length < 2) return;
    var lead = videos[0];
    var previous = 0;
    lead.addEventListener('timeupdate', function () {
      if (lead.currentTime < previous) {
        videos.forEach(function (v) { if (v !== lead) v.currentTime = 0; });
      }
      previous = lead.currentTime;
    });
  }

  function buildQuad(key, episode) {
    var quad = document.createElement('div');
    quad.className = 'quad';

    var pct = function (n) { return (n * 100).toFixed(2) + '%'; };
    var inv = function (n) { return ((1 - n) * 100).toFixed(2) + '%'; };

    var videos = [];
    var parts = {};

    Object.keys(QUADRANTS).forEach(function (corner) {
      var spec = QUADRANTS[corner];
      var video = makeVideo(clipSrc(key, episode, spec.slug), spec.label);
      quad.appendChild(video);
      videos.push(video);

      var label = document.createElement('span');
      label.className = 'quad-label quad-label--' + corner + (spec.accent ? ' quad-label--accent' : '');
      label.textContent = spec.label;
      quad.appendChild(label);

      parts[corner] = {video: video, label: label};
    });

    var vline = document.createElement('div');
    vline.className = 'quad-line quad-line--v';
    var hline = document.createElement('div');
    hline.className = 'quad-line quad-line--h';

    var handle = document.createElement('div');
    handle.className = 'quad-handle';
    handle.tabIndex = 0;
    handle.setAttribute('role', 'application');
    handle.setAttribute('aria-label',
      'Episode ' + episode + ': drag to resize the four comparison panes. Arrow keys also work.');
    handle.innerHTML = '&#10021;';

    quad.appendChild(vline);
    quad.appendChild(hline);
    quad.appendChild(handle);

    var x = DEFAULT_X, y = DEFAULT_Y;

    function apply() {
      // clip-path insets are top right bottom left
      parts.tl.video.style.clipPath = 'inset(0 ' + inv(x) + ' ' + inv(y) + ' 0)';
      parts.tr.video.style.clipPath = 'inset(0 0 ' + inv(y) + ' ' + pct(x) + ')';
      parts.bl.video.style.clipPath = 'inset(' + pct(y) + ' ' + inv(x) + ' 0 0)';
      parts.br.video.style.clipPath = 'inset(' + pct(y) + ' 0 0 ' + pct(x) + ')';

      vline.style.left = pct(x);
      hline.style.top = pct(y);
      handle.style.left = pct(x);
      handle.style.top = pct(y);

      parts.tl.label.style.opacity = (x > MIN_VISIBLE && y > MIN_VISIBLE) ? 1 : 0;
      parts.tr.label.style.opacity = (1 - x > MIN_VISIBLE && y > MIN_VISIBLE) ? 1 : 0;
      parts.bl.label.style.opacity = (x > MIN_VISIBLE && 1 - y > MIN_VISIBLE) ? 1 : 0;
      parts.br.label.style.opacity = (1 - x > MIN_VISIBLE && 1 - y > MIN_VISIBLE) ? 1 : 0;
    }

    function clamp(n) { return n < 0 ? 0 : (n > 1 ? 1 : n); }

    function setFromEvent(event) {
      var box = quad.getBoundingClientRect();
      if (!box.width || !box.height) return;
      x = clamp((event.clientX - box.left) / box.width);
      y = clamp((event.clientY - box.top) / box.height);
      apply();
    }

    // dragging is per-quad, so the four episode sliders stay independent.
    var dragging = false;
    function onDown(event) { dragging = true; setFromEvent(event); event.preventDefault(); }
    function onMove(event) { if (dragging) { setFromEvent(event); event.preventDefault(); } }
    function onUp() { dragging = false; }

    handle.addEventListener('pointerdown', onDown);
    quad.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    handle.addEventListener('keydown', function (event) {
      var handled = true;
      switch (event.key) {
        case 'ArrowLeft':  x = clamp(x - STEP); break;
        case 'ArrowRight': x = clamp(x + STEP); break;
        case 'ArrowUp':    y = clamp(y - STEP); break;
        case 'ArrowDown':  y = clamp(y + STEP); break;
        case 'Home':       x = DEFAULT_X; y = DEFAULT_Y; break;
        default: handled = false;
      }
      if (handled) { apply(); event.preventDefault(); }
    });

    apply();
    return {node: quad, videos: videos};
  }

  function render(key) {
    var task = TASKS.filter(function (t) { return t.key === key; })[0];
    if (!task) return;

    mount.innerHTML = '';

    var grid = document.createElement('div');
    grid.className = 'columns is-multiline';

    for (var episode = 1; episode <= EPISODES; episode++) {
      var column = document.createElement('div');
      column.className = 'column is-half';

      var built = buildQuad(key, episode);
      column.appendChild(built.node);

      grid.appendChild(column);

      playAll(built.videos);
      syncGroup(built.videos);
    }

    mount.appendChild(grid);

    var hint = document.createElement('p');
    hint.className = 'quad-hint';
    hint.innerHTML = CURSOR +
      'Drag a circle to resize the quadrants or push it into a corner to see one full size.';
    mount.appendChild(hint);

    Object.keys(buttons).forEach(function (k) {
      buttons[k].setAttribute('aria-selected', String(k === key));
    });
  }

  render(TASKS[0].key);
})();
