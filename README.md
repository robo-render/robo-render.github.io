# RoboRender — project page

Source for <https://robo-render.github.io> (public release page).

The anonymous review copy is a **separate** repo, `anonymous2662/anonymous2662.github.io`,
built as a single commit with this README excluded. Keep author-identifying details out of
that repo; this one may carry them.

Static HTML: no build step, no Jekyll (`.nojekyll` is present). Edit `index.html` and push to
`main`; GitHub Pages serves the repo root.

## Layout

```
index.html                 # the whole page
static/videos/             # see below
static/css/, static/js/    # vendored Nerfies/Bulma template assets, unmodified
```

Styling is the stock [Nerfies](https://github.com/nerfies/nerfies.github.io) template. The only
deviation is a single rule in a `<style>` block in `index.html`, setting the title to Stanford
Cardinal `#8C1515` to match `behavior-robot-suite.github.io` and `stereopolicy.github.io`.
Please keep new styling out of
the vendored CSS and out of the page unless it is genuinely needed.

## Videos

Cut from the supplementary reel (`video+roborender.mp4`, 5120x2880, 186s):

| File | Source range | Content |
|---|---|---|
| `walkthrough.mp4` | full, 1080p | complete supplementary video |
| `overview.mp4` | 24-48s | "Our Approach" / Figure 1 animation |
| `method_demo.mp4` | 67-107s | conditioning signals -> generated video, with prompts |
| `real_pnp.mp4` | 113-137s | real Franka tabletop pick and place |
| `real_opening.mp4` | 139-161s | real drawer / fridge opening |
| `real_mobile.mp4` | 169-186s | R1Pro mobile manipulation |
| `gen_fridge.mp4`, `gen_drawer.mp4` | 72-87s | generated output panel, rows 1 and 2 |
| `gen_apple.mp4`, `gen_mug.mp4` | 96-105s | generated output panel, rows 1 and 2 |

The `gen_*.mp4` clips are cropped from the rightmost "Photorealistic Video" panel of the method
section (`crop=iw*0.223:ih*0.230:iw*0.760:ih*Y`, with `Y=0.0776` for row 1 and `0.5445` for row 2).
The panel is only populated for parts of that section -- check the frame before re-cutting.

### Task gallery (`static/videos/tasks/`)

`<task>_1..9.mp4` for mug, bowl, apple, egg, fridge, drawer, radio -- nine generated episodes
each, driven by the dropdown in `static/js/tasks.js`.

Built by `build_gallery.py` (kept with the job, not in this repo):
1. download the primary view for every candidate episode,
2. take an 8x8 RGB signature of a frame,
3. greedy max-min selection to pick the 9 most visually distinct,
4. download the remaining views for those 9, concatenate batches, `vstack` them.

Each tile stacks views vertically: external + wrist (Franka) or head + left wrist + right wrist
(R1Pro, so 416x720). Episodes chosen:

```
mug    [9, 16, 7, 4, 6, 8, 0, 19, 2]      bowl   [3, 9, 0, 7, 14, 2, 1, 19, 12]
apple  [8, 17, 7, 11, 18, 2, 13, 4, 3]    egg    [1, 16, 18, 5, 10, 2, 13, 3, 7]
radio  [8, 13, 7, 17, 16, 0, 15, 18, 4]   drawer [3, 14, 8, 10, 7, 13, 12, 9, 4]
fridge [5, 8, 0, 7, 10, 3, 4, 6, 2]
marker [s920003, s946014, s950022, s948016, s933006, s922006, s928025, s957018, s935011]
```

Sources (all public HF datasets):

| Task | Repo | Path |
|---|---|---|
| mug, bowl, apple, egg | `wensi-ai/s2rg_<task>_depthpatch_500x3_0527` | `videos/chunk-000/observation.real.rgb.external_1/episode_00000N.mp4` |
| radio | `wensi-ai/s2rg_radio_s2rg_0524` | `videos/chunk-000/observation.real.rgb.head/episode_00000N.mp4` |
| drawer | `Ravenh97/generated_video` | `dresser/gen/chunk_001/generated_episode_0000000N_exo_camera_1_batch_1_of_1_cam_rand.mp4` |
| fridge | `Ravenh97/generated_video` | `fridge_m_v2/gen_chunks/chunk_001/generated_episode_0000000N_exo_camera_1_batch_{1..4}_of_4_cam_rand.mp4` (concatenated) |
| marker (Yam) | `teacher_videos.zip`, supplied locally | `teacher_videos/episode_sNNNNNN_{ego,wrist}.mp4` |
| distractor clips | `wensi-ai/s2rg_<task>_depthcrop_0519` (cluster copy carries depth + masks) | mug e7, bowl e38, apple e0, egg e31 |
| wan / cosmos baselines | `Ravenh97/generated_video` | `3drawers`, `fridge_m_2house`, `cosmos_*` |

**Careful:** `Ravenh97/generated_video` also has `wan_*` directories -- those are the
Wan-Fun-Control *baseline*, not RoboRender. Confirm against each variant's `GEN_SETUP.md`.
It also holds several fridge/drawer variants; `fridge_m_v2` and `dresser` were chosen because
they are the ones with a `GEN_SETUP.md` recording the RoboRender LoRA.

Native durations differ a lot (pick-and-place ~5-6 s at 30 fps, drawer ~17 s and fridge ~80 s
at 15 fps), so drawer is re-timed 2x and fridge 8x. The speed-up is stated in each task's
`note` field -- keep it accurate if you re-cut them.

`static/images/roborender-icon.png` is the prism logo, lifted from the title card at t=2s. It is the
site favicon and the GitHub org avatar.

```bash
ffmpeg -ss <start> -t <dur> -i video+roborender.mp4 \
  -c:v libx264 -pix_fmt yuv420p -crf 26 -preset slow -movflags +faststart -an \
  -vf scale=1280:720 out.mp4
```

Cut boundaries matter: several land on title cards or mid-transition. Verify the first frame
before committing a new cut.

`<task>_ep00_{sim,depth}.mp4` are the simulation-side clips, split out of the earlier
Cosmos-Transfer2.5 side-by-side renders. **Note:** Cosmos-Transfer2.5 is a *baseline* in the
paper, not the method — do not label its output as RoboRender output.

## Local preview

```bash
python3 -m http.server -d . 8000   # then open http://localhost:8000
```

## Remaining TODOs

Search `index.html` for `TODO`: arXiv / paper / data URLs, the social preview card, and
de-anonymizing the author block at camera ready. Also `git rm robots.txt` to allow indexing.

## Credits

Built on the [Nerfies](https://github.com/nerfies/nerfies.github.io) project page template,
licensed [CC BY-SA 4.0](http://creativecommons.org/licenses/by-sa/4.0/).
