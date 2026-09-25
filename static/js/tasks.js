// Task selector for the generated-video gallery: swaps in eight clips per
// task, laid out four across.

(function () {
  'use strict';

  var TASKS = [
    {key: 'mug', short: 'Mug',    label: 'Mug (pick and place)'},
    {key: 'bowl', short: 'Bowl',   label: 'Bowl (pick and place)'},
    {key: 'apple', short: 'Apple',  label: 'Apple (pick and place)'},
    {key: 'egg', short: 'Egg',    label: 'Egg (pick and place)'},
    {key: 'fridge', short: 'Fridge', label: 'Open the fridge'},
    {key: 'drawer', short: 'Drawer', label: 'Open the drawer'},
    {key: 'radio', short: 'Radio',  label: 'Pick up the radio'},
    {key: 'marker', short: 'Marker', label: 'Place the marker'}
  ];

  var CLIPS_PER_TASK = 8;

  var picker = document.getElementById('task-buttons');
  var grid = document.getElementById('task-videos');
  if (!picker || !grid) return;

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

  function render(key) {
    var task = TASKS.filter(function (t) { return t.key === key; })[0];
    if (!task) return;

    grid.innerHTML = '';
    for (var i = 1; i <= CLIPS_PER_TASK; i++) {
      var column = document.createElement('div');
      column.className = 'column is-one-quarter';

      var video = document.createElement('video');
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.setAttribute('height', '100%');
      video.src = 'static/videos/tasks/' + key + '_' + i + '.mp4';

      column.appendChild(video);
      grid.appendChild(column);

      // play() rejects if autoplay is blocked; the clips are muted so it
      // normally succeeds, but swallow the rejection either way.
      var played = video.play();
      if (played && typeof played.catch === 'function') played.catch(function () {});
    }
    Object.keys(buttons).forEach(function (k) {
      buttons[k].setAttribute('aria-selected', String(k === key));
    });
  }

  render(TASKS[0].key);
})();
