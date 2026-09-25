// Tab switcher for the Video Model section: one topic panel at a time.
//
// Panels are hidden with the `hidden` attribute rather than CSS so that
// browsers stop decoding the videos inside them. Switching back re-issues
// play(), because a video paused while hidden does not always resume.

(function () {
  'use strict';

  var tablist = document.querySelector('.vm-tabs');
  if (!tablist) return;

  var buttons = [].slice.call(tablist.querySelectorAll('[data-vm-tab]'));
  var panels = {};
  buttons.forEach(function (b) {
    var el = document.getElementById('vm-' + b.dataset.vmTab);
    if (el) panels[b.dataset.vmTab] = el;
  });

  function playIn(panel) {
    panel.querySelectorAll('video').forEach(function (v) {
      // play() rejects if autoplay is blocked; the clips are muted so it
      // normally succeeds, but swallow the rejection either way.
      var p = v.play();
      if (p && typeof p.catch === 'function') p.catch(function () {});
    });
  }

  function select(key) {
    if (!panels[key]) return;
    buttons.forEach(function (b) {
      b.setAttribute('aria-selected', String(b.dataset.vmTab === key));
    });
    Object.keys(panels).forEach(function (k) {
      if (k === key) panels[k].removeAttribute('hidden');
      else panels[k].setAttribute('hidden', '');
    });
    playIn(panels[key]);
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () { select(b.dataset.vmTab); });
    b.addEventListener('keydown', function (e) {
      var i = buttons.indexOf(b), n = buttons.length;
      var j = e.key === 'ArrowRight' ? (i + 1) % n
            : e.key === 'ArrowLeft'  ? (i - 1 + n) % n : -1;
      if (j < 0) return;
      buttons[j].focus(); select(buttons[j].dataset.vmTab); e.preventDefault();
    });
  });

  // Deep links such as #training-data point into a panel that may be hidden,
  // so open the right tab first and then scroll to it.
  function openFromHash(hash) {
    var key = hash.replace(/^#/, '');
    if (!panels[key]) return false;
    select(key);
    panels[key].scrollIntoView({block: 'start', behavior: 'smooth'});
    return true;
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (openFromHash(a.getAttribute('href'))) e.preventDefault();
    });
  });

  if (window.location.hash) openFromHash(window.location.hash);
  select(buttons[0].dataset.vmTab);
})();
