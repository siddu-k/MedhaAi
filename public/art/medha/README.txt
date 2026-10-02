MEDHA 2D AVATAR — mouth-layer lip-sync (viseme swapping)

Base (required):
  body.png            <- transparent Medha portrait (already placed)

Mouth overlays (transparent PNGs, same canvas size as body.png,
only the mouth painted, rest transparent). Drop all 8 here:
  mouth_rest.png      <- silence / neutral closed mouth
  mouth_A.png         <- a, aa
  mouth_E.png         <- e, i
  mouth_O.png         <- o, u
  mouth_M.png         <- m, b, p (lips closed)
  mouth_F.png         <- f, v (teeth on lip)
  mouth_L.png         <- l, t, d, n (tongue up)
  mouth_S.png         <- s, sh, k, c (teeth together)

How the code uses them (Medha2DAvatar.jsx):
  TTS speak() -> lipsyncManager.viseme (via word-boundary phoneme map)
        -> viseme_aa/E/O/PP/FF/DD/SS -> A/E/O/M/F/L/S file
        -> <img> src swaps at ~70ms, mouth <div> overlays body face
  Silence -> mouth_rest.png. Missing files fall back to rest (no break).

Mouth position: tweak MOUTH_STYLE in Medha2DAvatar.jsx
  (left/top/width %) to sit exactly over body.png lips.

Life effects (no extra assets): blink (scaleY pulse 3-6s),
head sway +-1.5deg, breathing scale, brow nudge while speaking.
