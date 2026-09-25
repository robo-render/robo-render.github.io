// Interactive architecture figure.
//
// The diagram is a flat PNG, so the clickable regions are percentage-positioned
// buttons laid over it -- percentages rather than pixels so they track the
// image as it scales. Hovering a region previews its explanation; clicking
// pins it, so the card survives moving the pointer away (and taps work on
// touch, where there is no hover).
//
// A component may own more than one region: the previous-frame path, the
// stacked tokens and the decoder each appear in two places in the figure.

(function () {
  'use strict';

  var COMPONENTS = {
    prev: {
      title: 'Previous frame &mdash; optional',
      body: 'Generation is autoregressive: every chunk after the first is conditioned on the ' +
            'last frame of the chunk before it, encoded by the same Video VAE. That is what ' +
            'lets a variable-length demonstration run past the model’s fixed frame window. ' +
            'The dashed path marks it optional — the first chunk is generated without it.'
    },
    video: {
      title: 'RGB video &mdash; the training target',
      body: 'In training, the raw RGB video is VAE-encoded and noised to form the diffusion ' +
            'input. At generation time this is the stream the model produces; only the ' +
            'conditions to the left are supplied. The model is fine-tuned on ~130k <i>real</i> ' +
            'robot samples and never trained on simulation renders — simulation enters ' +
            'only as conditioning.'
    },
    mask: {
      title: 'Robot RGB mask &mdash; embodiment',
      body: 'A rendered mask of the arm fixes the embodiment and the arm motion. Because the ' +
            'robot is specified by the mask rather than memorised per platform, the model ' +
            'renders arms it never saw in training — both the R1Pro and the YAM arm are ' +
            'unseen during video-model training.'
    },
    depth: {
      title: 'Simulated depth &mdash; geometry',
      body: 'Per-view depth from the simulator pins scene geometry and object motion. Since ' +
            'geometry and actions both come from the simulator, every generated video inherits ' +
            'exact action labels, which is what makes the rendered episodes usable for policy ' +
            'learning rather than just nice to look at.'
    },
    prompt: {
      title: 'Text prompt &rarr; CLIP &mdash; appearance',
      body: 'The prompt controls everything depth and mask leave free: textures, materials, ' +
            'lighting and background semantics. It is CLIP-encoded and injected as semantic ' +
            'conditioning, so one simulated trajectory can be rendered into many different ' +
            'rooms. Task-specific scene prompts are written by Claude Opus 4.6.'
    },
    vae: {
      title: 'Video VAE &mdash; shared latent space',
      body: 'Every stream — RGB, depth, robot mask and the previous frame — goes ' +
            'through the same encoder. Putting the conditions and the target in one latent ' +
            'space is what allows them to be concatenated rather than fused by a separate ' +
            'adapter network.'
    },
    tokens: {
      title: 'Multi-view stacked tokens',
      body: 'Per-view condition latents are concatenated with the noised latents, and the views ' +
            'are then stacked into a single unified multi-view latent instead of being denoised ' +
            'independently. This is the mechanism behind multi-view consistency: shared objects ' +
            'such as the table stay put across the external and wrist cameras.'
    },
    dit: {
      title: 'Diffusion Transformer',
      body: 'The Wan2.1-T2V-1.3B backbone, fine-tuned as a robot-oriented renderer, denoises the ' +
            'stacked multi-view latent. Rendering a whole dataset means many diffusion passes, ' +
            'so this block is the cost bottleneck — see <b>Rendering cost</b> below for the ' +
            'TeaCache and DMD2 optimizations that take a 3-view clip to 4.29&nbsp;s.'
    },
    decoder: {
      title: 'VAE decoder',
      body: 'Decodes the denoised latents back to pixels, splitting the unified multi-view ' +
            'latent into one video per camera.'
    },
    views: {
      title: 'Multi-view output',
      body: 'All views come out of a single pass — third-person, wrist, and any further ' +
            'cameras. Rendering the same rig the target robot actually has matters, because the ' +
            'policy consumes those same views at deployment time.'
    }
  };

  var CURSOR = '<svg class="arch-icon" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M5 2 L5 19 L9.3 14.8 L12.2 21.5 L14.8 20.3 L11.9 13.8 L18 13.8 Z" ' +
    'fill="currentColor"/></svg>';

  var IDLE = {
    title: CURSOR + 'Explore the architecture',
    body: 'Hover any block in the figure to see what it does, or click to keep it open.'
  };

  var wrap = document.querySelector('.arch-wrap');
  var card = document.getElementById('arch-card');
  if (!wrap || !card) return;

  var titleEl = document.getElementById('arch-card-title');
  var bodyEl = document.getElementById('arch-card-body');
  var hots = [].slice.call(wrap.querySelectorAll('.arch-hot'));
  var pinned = null;

  function paint(key) {
    var d = COMPONENTS[key] || IDLE;
    titleEl.innerHTML = d.title;
    bodyEl.innerHTML = d.body;
    card.classList.toggle('is-idle', !COMPONENTS[key]);
    hots.forEach(function (h) {
      h.classList.toggle('is-active', !!key && h.dataset.arch === key);
    });
  }

  function show(key) { if (!pinned) paint(key); }
  function clear() { paint(pinned); }

  hots.forEach(function (h) {
    var key = h.dataset.arch;
    h.addEventListener('mouseenter', function () { show(key); });
    h.addEventListener('focus', function () { show(key); });
    h.addEventListener('mouseleave', clear);
    h.addEventListener('blur', clear);
    h.addEventListener('click', function (e) {
      e.preventDefault();
      pinned = (pinned === key) ? null : key;
      paint(pinned || key);
    });
  });

  // Clicking outside the figure releases a pinned region.
  document.addEventListener('click', function (e) {
    if (pinned && !wrap.contains(e.target) && !card.contains(e.target)) {
      pinned = null;
      paint(null);
    }
  });

  paint(null);
})();
