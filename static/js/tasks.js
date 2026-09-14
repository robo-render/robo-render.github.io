// Task selector for the generated-video gallery: swaps in five clips per task.

(function () {
  'use strict';

  var TASKS = [
    {key: 'mug',    label: 'Mug (pick and place)',        note: 'Franka \u00b7 external and wrist views, stacked'},
    {key: 'bowl',   label: 'Bowl (pick and place)',       note: 'Franka \u00b7 external and wrist views, stacked'},
    {key: 'apple',  label: 'Apple (pick and place)',      note: 'Franka \u00b7 external and wrist views, stacked'},
    {key: 'egg',    label: 'Egg (pick and place)',        note: 'Franka \u00b7 external and wrist views, stacked'},
    {key: 'fridge', label: 'Open the fridge',             note: 'Franka \u00b7 external and wrist views, stacked \u00b7 8\u00d7 speed'},
    {key: 'drawer', label: 'Open the drawer',             note: 'Franka \u00b7 external and wrist views, stacked \u00b7 2\u00d7 speed'},
    {key: 'radio',  label: 'Pick up the radio',           note: 'R1Pro \u00b7 head and both wrist views, stacked'},
    {key: 'marker', label: 'Place the marker',            note: 'Yam \u00b7 ego and wrist views, stacked \u00b7 2\u00d7 speed'}
  ];

  var CLIPS_PER_TASK = 9;

  var select = document.getElementById('task-select');
  var grid = document.getElementById('task-videos');
  var note = document.getElementById('task-note');
  if (!select || !grid) return;

  TASKS.forEach(function (task) {
    var option = document.createElement('option');
    option.value = task.key;
    option.textContent = task.label;
    select.appendChild(option);
  });

  function render(key) {
    var task = TASKS.filter(function (t) { return t.key === key; })[0];
    if (!task) return;

    grid.innerHTML = '';
    for (var i = 1; i <= CLIPS_PER_TASK; i++) {
      var column = document.createElement('div');
      column.className = 'column is-one-third';

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
    if (note) note.textContent = task.note;
  }

  select.addEventListener('change', function () { render(select.value); });
  render(TASKS[0].key);
})();
