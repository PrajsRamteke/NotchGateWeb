// The water buddies that drop out of the notch: the robot, Spidey and Batman.
// Each is one static SVG (built once, ids suffixed per copy) with an empty
// .wb-face the caller fills per mood. Poses are CSS: set data-mood on the
// <svg> and toggle .is-drinking; css/buddies.css does the rest. Spidey and
// Batman are ported from the app's SwiftUI drawings (SpideyFigure, BatFigure,
// BuddyInk), in the same coordinates, so they match the app's art.
(function () {
  'use strict';
  const NG = (window.NG = window.NG || {});

  const MOODS = ['cheerful', 'excited', 'pleading', 'thirsty', 'delighted', 'sleepy', 'tickled'];
  /// Replaced with the copy's uid, so several copies can share a page.
  const UID = '{{uid}}';

  // MARK: Geometry

  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const mul = (a, s) => [a[0] * s, a[1] * s];
  const len = (a) => Math.hypot(a[0], a[1]);
  const unit = (a) => (len(a) ? mul(a, 1 / len(a)) : [0, 0]);
  const mid = (a, b) => mul(add(a, b), 0.5);
  /// Turned clockwise on screen by `deg` around the origin.
  const rot = (p, deg) => {
    const r = (deg * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
    return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
  };
  const angleOf = (v) => (Math.atan2(v[1], v[0]) * 180) / Math.PI;
  const num = (v) => String(Math.round(v * 10) / 10);
  const pt = (p) => `${num(p[0])} ${num(p[1])}`;
  const poly = (pts) => `M${pts.map(pt).join('L')}Z`;
  const line = (a, b) => `M${pt(a)}L${pt(b)}`;
  const quad = (s, c, e, t) => add(add(mul(s, (1 - t) * (1 - t)), mul(c, 2 * (1 - t) * t)), mul(e, t * t));
  const cubic = (p0, c1, c2, p3, t) => {
    const u = 1 - t;
    return add(add(mul(p0, u * u * u), mul(c1, 3 * u * u * t)), add(mul(c2, 3 * u * t * t), mul(p3, t * t * t)));
  };

  /// A limb along a quadratic curve, `r0` thick at `s` tapering to `r1` at `e`, round at both ends.
  function limb(s, c, e, r0, r1) {
    const steps = 14, left = [], right = [];
    let n0, n1;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const p = quad(s, c, e, t);
      let tangent = add(mul(sub(c, s), 2 * (1 - t)), mul(sub(e, c), 2 * t));
      if (len(tangent) < 0.001) tangent = sub(e, s);
      tangent = unit(tangent);
      const n = [-tangent[1], tangent[0]];
      const r = r0 + (r1 - r0) * t;
      left.push(add(p, mul(n, r)));
      right.push(sub(p, mul(n, r)));
      if (i === 0) n0 = n;
      if (i === steps) n1 = n;
    }
    const pts = left.slice();
    const a1 = Math.atan2(n1[1], n1[0]);
    for (let k = 1; k < 9; k++) {
      const a = a1 - (Math.PI * k) / 9;
      pts.push(add(e, [Math.cos(a) * r1, Math.sin(a) * r1]));
    }
    pts.push(...right.reverse());
    const a0 = Math.atan2(-n0[1], -n0[0]);
    for (let k = 1; k < 9; k++) {
      const a = a0 - (Math.PI * k) / 9;
      pts.push(add(s, [Math.cos(a) * r0, Math.sin(a) * r0]));
    }
    return pts;
  }

  /// A control point bowing a limb from `s` to `e` sideways by `bend` of its length.
  const elbow = (s, e, bend) => {
    const span = sub(e, s);
    return add(mid(s, e), mul([span[1], -span[0]], bend));
  };

  /// A polygon with its corners rounded off (as points, `n` per corner).
  function roundedPts(points, radius, n = 4) {
    const out = [];
    const count = points.length;
    for (let i = 0; i < count; i++) {
      const v = points[i], prev = points[(i + count - 1) % count], next = points[(i + 1) % count];
      const from = add(v, mul(unit(sub(prev, v)), Math.min(radius, len(sub(prev, v)) / 2)));
      const to = add(v, mul(unit(sub(next, v)), Math.min(radius, len(sub(next, v)) / 2)));
      for (let k = 0; k <= n; k++) out.push(quad(from, v, to, k / n));
    }
    return out;
  }

  /// An ellipse as points, centred at `c`, turned by `deg`.
  function ellipsePts(c, rx, ry, deg = 0, n = 28) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      out.push(add(c, rot([Math.cos(a) * rx, Math.sin(a) * ry], deg)));
    }
    return out;
  }

  const rrectPts = (x, y, w, h, r) => roundedPts([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], r, 4);

  /// Samples a closed path given as cubic segments [[p0, c1, c2, p3], ...].
  function cubicPts(segments, n = 10) {
    const out = [];
    segments.forEach(([p0, c1, c2, p3]) => {
      for (let i = 0; i < n; i++) out.push(cubic(p0, c1, c2, p3, i / n));
    });
    return out;
  }

  const area = (pts) => pts.reduce((sum, p, i) => {
    const q = pts[(i + 1) % pts.length];
    return sum + p[0] * q[1] - q[0] * p[1];
  }, 0) / 2;

  /// `subject` clipped to the convex polygon `clip` (Sutherland–Hodgman).
  function clipPoly(subject, clip) {
    const sign = area(clip) > 0 ? 1 : -1;
    let out = subject;
    for (let i = 0; i < clip.length && out.length; i++) {
      const a = clip[i], b = clip[(i + 1) % clip.length];
      const inside = (p) => sign * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) >= 0;
      const cross = (p, q) => {
        const d1 = sub(q, p), d2 = sub(b, a);
        const t = ((a[0] - p[0]) * d2[1] - (a[1] - p[1]) * d2[0]) / (d1[0] * d2[1] - d1[1] * d2[0]);
        return add(p, mul(d1, t));
      };
      const input = out;
      out = [];
      input.forEach((p, j) => {
        const prev = input[(j + input.length - 1) % input.length];
        if (inside(p)) {
          if (!inside(prev)) out.push(cross(prev, p));
          out.push(p);
        } else if (inside(prev)) out.push(cross(prev, p));
      });
    }
    return out;
  }
  const shift = (pts, d) => pts.map((p) => add(p, d));
  const halfPlaneBelow = (y) => [[-200, y], [200, y], [200, 200], [-200, 200]];

  /// A water droplet, point up, in the box (x, y, w, h).
  const dropD = (x, y, w, h) => {
    const r = w / 2, cy = y + h - r;
    return `M${pt([x + r, y])}Q${pt([x + w, y + h * 0.45])} ${pt([x + w, cy])}A${num(r)} ${num(r)} 0 0 1 ${pt([x, cy])}Q${pt([x, y + h * 0.45])} ${pt([x + r, y])}Z`;
  };

  // MARK: Ink (cel shading, as in the app's BuddyInk)

  /// Where the cel shadow falls and how far the rim light reaches; the light is up and to the left.
  const RIM = [0.9, 1.1];
  const SHADOW = [2.6, 3.2];
  const tone = (base, shade, light) => ({ base, shade, light });

  /// A drawing kit for one figure: shapes go into <defs> once and are drawn by reference.
  function kit(ink, width) {
    const defs = [];
    let count = 0;
    const ref = (id) => `#${id}-${UID}`;
    const url = (id) => `url(#${id}-${UID})`;
    const k = {
      ink,
      defs,
      url,
      /// Registers a shape (points or a path string) drawn in a frame turned by `turn` degrees.
      shape(geometry, turn = 0) {
        const id = `s${count++}`;
        const d = typeof geometry === 'string' ? geometry : poly(geometry);
        const rim = rot(RIM, -turn), shadow = rot(SHADOW, -turn);
        defs.push(`<path id="${id}-${UID}" d="${d}"/><clipPath id="${id}c-${UID}"><use href="${ref(id)}"/></clipPath><clipPath id="${id}r-${UID}"><use href="${ref(id)}" transform="translate(${pt(rim)})"/></clipPath>`);
        return { id, shadow };
      },
      /// A clip path from raw markup (a union of its children).
      clip(markup) {
        const id = `k${count++}`;
        defs.push(`<clipPath id="${id}-${UID}">${markup}</clipPath>`);
        return url(id);
      },
      /// Outline, drawn just outside the shape once the fill covers its inner half.
      outline: (s, w = width) => `<use href="${ref(s.id)}" fill="none" stroke="${ink}" stroke-width="${num(w * 2)}" stroke-linejoin="round"/>`,
      /// Rim light along the lit edge, base colour, and a shadow crescent on the far side.
      fill: (s, t) => `<use href="${ref(s.id)}" fill="${t.light}"/><g clip-path="${url(`${s.id}c`)}"><g clip-path="${url(`${s.id}r`)}"><use href="${ref(s.id)}" fill="${t.shade}"/><use href="${ref(s.id)}" fill="${t.base}" transform="translate(${pt(mul(s.shadow, -1))})"/></g></g>`,
      paint: (s, t) => k.outline(s) + k.fill(s, t),
      /// Several shapes as one silhouette: every outline first, then the fills.
      parts: (list) => list.map(([s]) => k.outline(s)).join('') + list.map(([s, t]) => k.fill(s, t)).join(''),
      within: (s, markup) => `<g clip-path="${url(`${s.id}c`)}">${markup}</g>`,
      crease: (d, w = 1, opacity = 0.6) => `<path d="${d}" fill="none" stroke="${ink}" stroke-opacity="${opacity}" stroke-width="${num(w)}" stroke-linecap="round" stroke-linejoin="round"/>`,
      creaseShape: (s, w = 1, opacity = 0.6) => `<use href="${ref(s.id)}" fill="none" stroke="${ink}" stroke-opacity="${opacity}" stroke-width="${num(w)}" stroke-linejoin="round"/>`,
      gloss: (c, rx, ry, deg, opacity = 0.5) => `<path d="${poly(ellipsePts(c, rx, ry, deg, 20))}" fill="#fff" fill-opacity="${opacity}"/>`,
    };
    return k;
  }

  /// A pose group CSS turns around (px, py): `vars` are its angles per mood or for drinking.
  const rig = (cls, pivot, vars, markup) => {
    const style = [`--px:${num(pivot[0])}px`, `--py:${num(pivot[1])}px`]
      .concat(Object.entries(vars).map(([key, deg]) => `--${key}:${num(deg)}deg`)).join(';');
    return `<g class="${cls}" style="${style}">${markup}</g>`;
  };

  /// Two-bone IK for the drinking arm: the upper arm turns `upper` around the shoulder,
  /// the forearm `fore` around the elbow, the wrist `wrist` around the grip, so the
  /// bottle's neck lands on `mouth` tipped to `angle`.
  function solveDrink({ shoulder, elbow: rest, grip, restAngle, mouth, angle, outward }) {
    const center = sub(mouth, rot(BOTTLE.neck, angle));
    const target = add(center, rot(BOTTLE.grip, angle));
    const l1 = len(sub(rest, shoulder)), l2 = len(sub(grip, rest));
    const span = sub(target, shoulder), d = Math.min(len(span), l1 + l2 - 0.01);
    const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    const u = unit(span), perp = mul([-u[1], u[0]], outward);
    const bent = add(add(shoulder, mul(u, a)), mul(perp, h));
    const upper = angleOf(sub(bent, shoulder)) - angleOf(sub(rest, shoulder));
    const foreWorld = angleOf(sub(target, bent)) - angleOf(sub(grip, rest));
    const wrap = (deg) => ((deg + 540) % 360) - 180;
    const fore = wrap(foreWorld - upper);
    const wrist = wrap(angle - restAngle - upper - fore);
    return { upper: wrap(upper), fore, wrist, total: upper + fore + wrist };
  }

  // MARK: Bottle (the same molded bottle for every buddy but the robot)

  const BOTTLE = {
    neck: [0, -26],
    grip: [-6, 7],
    silhouette: 'M-6 -24L-6 -19.5C-6 -15.5 -12 -14.5 -12 -9L-12 17Q-12 24 -5 24L5 24Q12 24 12 17L12 -9C12 -14.5 6 -15.5 6 -19.5L6 -24Z',
  };

  /// The bottle in its own frame (upright, centred), placed at `center` turned `angle`.
  /// Water stays level: its group counter-turns everything the arm does while drinking.
  function bottle(k, { center, angle, cap, label, drinkTurn }) {
    const clip = k.clip(`<path d="${BOTTLE.silhouette}"/>`);
    const capShape = k.shape(rrectPts(-7.6, -33, 15.2, 9.5, 2.6), angle);
    const ridges = [-4.5, -1.5, 1.5, 4.5].map((x) => line([x, -31], [x, -25.5])).join('');
    const water = `
      <g transform="rotate(${num(-angle)})">${rig('wb-drink wb-water-tilt', [0, 0], { drink: -drinkTurn }, `
        <g class="wb-water">
          <rect x="-40" y="-13" width="80" height="60" fill="${k.url('water')}"/>
          <rect x="-40" y="-13" width="80" height="1.6" fill="#fff" fill-opacity=".55"/>
          <circle cx="-5" cy="9" r="1.4" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width=".7"/>
          <circle cx="2.5" cy="2" r="1" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width=".7"/>
          <circle cx="5" cy="15" r="1.2" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width=".7"/>
        </g>`)}
      </g>`;
    return `
      <g class="wb-flask" transform="translate(${pt(center)}) rotate(${num(angle)})">
        <path d="${BOTTLE.silhouette}" fill="none" stroke="${k.ink}" stroke-width="3.2" stroke-linejoin="round"/>
        <path d="${BOTTLE.silhouette}" fill="#ddefff" fill-opacity=".32"/>
        <g clip-path="${clip}">
          ${water}
          <rect x="-13" y="1" width="26" height="12" fill="${label}" stroke="${k.ink}" stroke-opacity=".35" stroke-width=".8"/>
          <path d="${dropD(-2.6, 3, 5.2, 7.2)}" fill="#fff" fill-opacity=".92"/>
          <rect x="-9.4" y="-10" width="2.6" height="9" rx="1.3" fill="#fff" fill-opacity=".75"/>
          <rect x="-9.4" y="14" width="2.6" height="6" rx="1.3" fill="#fff" fill-opacity=".55"/>
          <path d="${BOTTLE.silhouette}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.6"/>
        </g>
        <g class="wb-cap">${k.paint(capShape, cap)}${k.crease(ridges, 0.8, 0.35)}</g>
      </g>`;
  }

  const waterGradient = () => `<linearGradient id="water-${UID}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a6e1ff"/><stop offset=".55" stop-color="#3d95e0"/></linearGradient>`;

  /// A mitten hand at `at`, fingers along `angle`, thumb on the `thumb` side (+1 or -1).
  function mitten(k, at, radius, angle, thumb) {
    const place = (p) => add(at, rot(p, angle));
    const palm = ellipsePts([0, 0], radius * 1.08, radius * 0.94, 0, 24).map(place);
    const thumbPts = ellipsePts([-radius * 0.05, -radius * 0.82 * thumb], radius * 0.5, radius * 0.3, -38 * thumb, 16).map(place);
    return { palm: k.shape(palm), thumb: k.shape(thumbPts) };
  }

  /// The part of a limb past `fraction` of the way from `s` to `e`, with a pointed cuff.
  function cuffRegion(s, e, fraction, point = -4.5, back = 0) {
    const along = unit(sub(e, s)), across = [-along[1], along[0]];
    const cuff = add(s, mul(sub(e, s), fraction));
    return [
      add(add(cuff, mul(across, 14)), mul(along, back)),
      add(cuff, mul(along, point)),
      add(add(cuff, mul(across, -14)), mul(along, back)),
      add(add(cuff, mul(across, -14)), mul(along, 60)),
      add(add(cuff, mul(across, 14)), mul(along, 60)),
    ];
  }

  const bbox = (pts) => pts.reduce((b, p) => [Math.min(b[0], p[0]), Math.min(b[1], p[1]), Math.max(b[2], p[0]), Math.max(b[3], p[1])], [Infinity, Infinity, -Infinity, -Infinity]);

  /// Shapes shared by the mood extras.
  const sweat = (at, ink, cls = 'wb-drip') => `<g class="${cls}"><path d="${dropD(at[0] - 4, at[1], 8, 11)}" fill="#a6e1ff" stroke="${ink}" stroke-width="2"/><path d="M${pt(add(at, [-1.6, 6]))}q.2 2.2 2 2.6" fill="none" stroke="#fff" stroke-width="1" stroke-linecap="round"/></g>`;
  /// Three z's rising from `at` along (dx, dy).
  const snores = (at, d, color) => `<g class="wb-zzz" style="--zx:${num(d[0])}px;--zy:${num(d[1])}px">${[0, 1, 2].map((i) =>
    `<text class="wb-zed" x="${num(at[0])}" y="${num(at[1])}" fill="${color}" style="--i:${i}">z</text>`).join('')}</g>`;

  // MARK: Robot (the site's original bot, unchanged)

  const ROBOT_FACES = {
    cheerful: '<path class="wb-glow" d="M40 58q5-6 10 0M70 58q5-6 10 0"/><path class="wb-glow" d="M55 67q5 4 10 0"/>',
    excited: `${['45', '75'].map((x) => `<path class="wb-fill" transform="translate(${x} 56)" d="M0-7l1.8 5.2L7 0l-5.2 1.8L0 7l-1.8-5.2L-7 0l5.2-1.8z"/>`).join('')}<path class="wb-fill" d="M56 66h8q-4 6-8 0z"/>`,
    pleading: '<circle class="wb-fill" cx="45" cy="57" r="6"/><circle class="wb-fill" cx="75" cy="57" r="6"/><circle cx="47" cy="55" r="2" fill="#1b1512"/><circle cx="77" cy="55" r="2" fill="#1b1512"/><circle class="wb-fill" cx="60" cy="68" r="2.2"/>',
    thirsty: '<path class="wb-glow" d="M39 57h11M70 57h11"/><path class="wb-glow" d="M53 69q2.5-3 5 0t5 0t5 0"/><path class="wb-sweat" d="M92 30q3 5 0 7q-3-2 0-7z"/>',
    delighted: '<path class="wb-glow" d="M40 58q5-6 10 0M70 58q5-6 10 0"/><path class="wb-fill" d="M54 65h12q-6 8-12 0z"/>',
    sleepy: '<path class="wb-glow" d="M40 57q5 4 10 0M70 57q5 4 10 0"/><circle class="wb-fill" cx="60" cy="68" r="1.2"/><text class="wb-z" x="94" y="22">z</text><text class="wb-z" x="101" y="13">z</text>',
    tickled: '<path class="wb-glow" d="M40 53l8 4-8 4M80 53l-8 4 8 4"/><path class="wb-glow" d="M55 66q5 5 10 0"/>',
  };

  const ROBOT_ART = `
      <defs>
        <linearGradient id="wb-shell-${UID}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf7ef"/><stop offset="1" stop-color="#e6dfd2"/></linearGradient>
        <linearGradient id="wb-water-${UID}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd0ff"/><stop offset="1" stop-color="#4b8fe6"/></linearGradient>
        <clipPath id="wb-bottle-clip-${UID}"><rect x="-10" y="-14" width="20" height="30" rx="6"/></clipPath>
      </defs>
      <path class="wb-arm-up" d="M26 92c-14-14-12-60 26-68"/>
      <circle cx="60" cy="14" r="7" fill="url(#wb-shell-${UID})" stroke="#c9bfae" stroke-width="1.2"/>
      <path d="M54 12h12M54 16h12" stroke="#c9bfae" stroke-width="1.2"/>
      <circle cx="13" cy="58" r="11" fill="#d97757"/><circle cx="13" cy="58" r="5" fill="#7a3f2a"/>
      <circle cx="107" cy="58" r="11" fill="#d97757"/><circle cx="107" cy="58" r="5" fill="#7a3f2a"/>
      <rect x="16" y="22" width="88" height="74" rx="34" fill="url(#wb-shell-${UID})"/>
      <path transform="translate(60 31)" d="M0-6.5L1.3-1.3 6.5 0 1.3 1.3 0 6.5-1.3 1.3-6.5 0-1.3-1.3z" fill="#d97757"/>
      <rect x="27" y="40" width="66" height="44" rx="19" fill="#1b1512"/>
      <ellipse cx="38" cy="67" rx="5" ry="3" fill="#d97757" opacity=".45"/><ellipse cx="82" cy="67" rx="5" ry="3" fill="#d97757" opacity=".45"/>
      <g class="wb-face"></g>
      <rect x="40" y="96" width="40" height="11" fill="#2a2420"/>
      <rect x="34" y="100" width="52" height="34" rx="15" fill="url(#wb-shell-${UID})"/>
      <rect x="34" y="117" width="52" height="6" fill="#d97757"/>
      <circle cx="60" cy="108" r="3.4" fill="#f3b48f"/>
      <rect x="44" y="132" width="7" height="9" fill="#2a2420"/><rect x="69" y="132" width="7" height="9" fill="#2a2420"/>
      <ellipse cx="46" cy="145" rx="11" ry="6.5" fill="url(#wb-shell-${UID})" stroke="#d97757" stroke-width="2"/>
      <ellipse cx="74" cy="145" rx="11" ry="6.5" fill="url(#wb-shell-${UID})" stroke="#d97757" stroke-width="2"/>
      <path d="M84 110l10 2" stroke="#2a2420" stroke-width="5" stroke-linecap="round"/>
      <g class="wb-drink-arm"><g>
        <rect x="-10" y="-14" width="20" height="30" rx="6" fill="rgba(220,238,255,.55)" stroke="#fff" stroke-width="1.6"/>
        <g clip-path="url(#wb-bottle-clip-${UID})"><rect class="wb-water" x="-10" y="-14" width="20" height="30" fill="url(#wb-water-${UID})"/></g>
        <circle cx="-3" cy="6" r="1.6" fill="none" stroke="#fff" stroke-width=".9"/><circle cx="3" cy="-2" r="1.2" fill="none" stroke="#fff" stroke-width=".9"/>
        <rect x="-6" y="-21" width="12" height="7" rx="2" fill="#d97757"/>
      </g></g>
      <circle cx="95" cy="113" r="6" fill="url(#wb-shell-${UID})" stroke="#2a2420" stroke-width="1.6"/>`;

  // MARK: Spidey

  const SP = {
    ink: '#1c070b',
    red: tone('#d8262f', '#9c1420', '#ff6a63'),
    blue: tone('#2559cc', '#163a8e', '#5e8ef2'),
    skin: tone('#f2c4a0', '#d69b78', '#ffe2cb'),
    web: '#4a0910',
    silk: '#f3f5fa',
    lens: '#ffffff',
    lensShade: '#cbd7e8',
    mouth: '#5a1e1e',
    head: [74, 152],
    ankle: [64, 32],
    leftShoulder: [55, 113],
    rightShoulder: [93, 113],
  };

  /// The head, upright around the origin (the figure hangs it upside down).
  const SPIDEY_HEAD = cubicPts([
    [[0, -39], [25, -39], [43, -25], [43, -4]],
    [[43, -4], [43, 19], [23, 38], [0, 38]],
    [[0, 38], [-23, 38], [-43, 19], [-43, -4]],
    [[-43, -4], [-43, -25], [-25, -39], [0, -39]],
  ], 12);

  /// The lens: broad at the outer top, tapering to a point by the nose (x toward the outer corner).
  const SPIDEY_LENS = cubicPts([
    [[-12.5, 7], [-11, -4], [-2, -11.5], [9, -11.5]],
    [[9, -11.5], [17.5, -11.5], [18.5, 1.5], [13, 6.5]],
    [[13, 6.5], [6, 11.5], [-4, 11], [-12.5, 7]],
  ], 12);

  /// Where the lens shutters sit per mood (lens space, y down, x toward the outer corner).
  const SPIDEY_LIDS = {
    cheerful: { blinks: true },
    excited: { scale: 1.14 },
    pleading: { top: [-40, -5], scale: 1.08, blinks: true },
    thirsty: { top: [-1, 1.5] },
    delighted: { bottom: [9, 6], arch: 13 },
    sleepy: { top: [3, 3.5], bottom: [5.5, 6] },
    tickled: { top: [5, -9], bottom: [7, 10] },
  };

  /// The free hand per mood, relative to the shoulder, and whether it throws the web-shooter sign.
  const SPIDEY_REACH = {
    cheerful: { reach: [-21, 36], hand: 115 },
    excited: { reach: [-32, 16], hand: 165, thwip: true },
    pleading: { reach: [-24, 32], hand: 105 },
    thirsty: { reach: [-19, 40], hand: 100 },
    delighted: { reach: [-31, 20], hand: 160, thwip: true },
    sleepy: { reach: [-17, 41], hand: 98 },
    tickled: { reach: [-30, 22], hand: 150 },
  };

  /// Head tilt per mood, degrees.
  const SPIDEY_TILT = { pleading: 9, thirsty: -8, sleepy: -10 };

  /// Blue leg parts; the last one ends in a red boot (cuffed by `region`) plus its toes.
  function spideyLeg(k, parts, boot) {
    const P = SP;
    const region = k.shape(boot.region);
    const lines = (() => {
      const b = bbox(boot.limbPts.concat(boot.toesPts));
      let d = '';
      for (let x = b[0] + 3.5; x < b[2]; x += 4.5) d += line([x, b[1]], [x + 2, b[3]]);
      return d;
    })();
    return parts.map((s) => k.outline(s)).join('') + k.outline(boot.toes) +
      parts.map((s) => k.fill(s, P.blue)).join('') +
      k.within(boot.limb, `<use href="#${region.id}-${UID}" fill="none" stroke="${P.ink}" stroke-width="3.4" stroke-linejoin="round"/>`) +
      k.within(region, k.fill(boot.limb, P.red)) +
      k.fill(boot.toes, P.red) +
      // Web lines on the boot: the leg past the cuff, and the toes.
      [k.within(region, k.within(boot.limb, '{lines}')), k.within(boot.toes, '{lines}')].join('')
        .split('{lines}').join(`<path d="${lines}" stroke="${P.web}" stroke-opacity=".62" stroke-width=".7" fill="none"/>`);
  }

  function spideyArt() {
    const P = SP;
    const k = kit(P.ink, INK_W);
    let out = '';

    // Legs: the web is tied round one ankle; the other leg hooks behind its knee.
    const hip = [81, 80], knee = add(hip, [20, -22]), foot = add(knee, [-27, -8]);
    const thigh = k.shape(limb(hip, mid(hip, knee), knee, 6.4, 5.6));
    const shinPts = limb(knee, mid(knee, foot), foot, 5.6, 5);
    const shin = k.shape(shinPts);
    const toesPts = limb(foot, add(foot, [-2, -4]), add(foot, [-4, -9]), 5, 4.2);
    out += `<g class="wb-kick">${spideyLeg(k, [thigh, shin], {
      limb: shin, limbPts: shinPts, toes: k.shape(toesPts), toesPts, region: cuffRegion(knee, foot, 0.42),
    })}</g>`;

    const straightHip = [67, 80], ankle = P.ankle;
    const legPts = limb(straightHip, [67.5, 56], ankle, 6.4, 5.2);
    const solePts = limb(ankle, add(ankle, [-4, -5]), add(ankle, [-9, -10]), 5.2, 4.4);
    const leg = k.shape(legPts);
    out += spideyLeg(k, [leg], {
      limb: leg, limbPts: legPts, toes: k.shape(solePts), toesPts: solePts, region: cuffRegion(straightHip, ankle, 0.62),
    });

    // Web wrapped round the ankle.
    [-5, 0.5].forEach((dy) => {
      const d = poly(ellipsePts(add(ankle, [0, dy]), 7.5, 2.3, 0, 24));
      out += `<path d="${d}" fill="none" stroke="${P.ink}" stroke-opacity=".75" stroke-width="2.8"/><path d="${d}" fill="none" stroke="${P.silk}" stroke-width="1.3"/>`;
    });

    // Blue trunks over the tops of the legs.
    out += k.paint(k.shape(rrectPts(57, 72, 35, 18, 8)), P.blue);

    // Torso: blue flanks, a red chest panel widening to the shoulders, the spider.
    const torso = k.shape(roundedPts([[60, 86], [89, 86], [97, 118], [51, 118]], 7));
    const panel = k.shape(`M67 84L82 84Q86 104 100 112L100 124L48 124L48 112Q63 104 67 84Z`);
    const emblem = [74, 104];
    let web = '';
    for (let a = 0; a < 360; a += 36) web += line(emblem, add(emblem, rot([34, 0], a)));
    [10, 18].forEach((r) => {
      web += `M${pt(add(emblem, [r, 0]))}`;
      for (let step = 1; step <= 10; step++) {
        const a = step * 36;
        web += `Q${pt(add(emblem, rot([r * 0.86, 0], a - 18)))} ${pt(add(emblem, rot([r, 0], a)))}`;
      }
    });
    const spiderLegs = [
      [[1.4, -3.4], [5.2, -6.2], [6, -10.5]], [[1.8, -1.6], [6.4, -3], [8.4, -6.8]],
      [[1.8, 1.4], [6.4, 3.2], [8.2, 7.6]], [[1.4, 3.4], [4.8, 6.8], [5.2, 11]],
    ];
    const spider = `<g transform="translate(${pt(emblem)}) scale(.9 -.9)"><path d="${[-1, 1].map((side) => spiderLegs.map((l) => `M${l.map((p) => pt([p[0] * side, p[1]])).join('L')}`).join('')).join('')}" fill="none" stroke="${P.ink}" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="0" cy="1.3" rx="2.4" ry="4.7" fill="${P.ink}"/><circle cx="0" cy="-5.2" r="1.9" fill="${P.ink}"/></g>`;
    out += k.paint(torso, P.blue);
    out += k.within(torso, `${k.fill(panel, P.red)}${k.creaseShape(panel, 1, 0.8)}<g clip-path="${k.url(`${panel.id}c`)}"><path d="${web}" fill="none" stroke="${P.web}" stroke-opacity=".62" stroke-width=".7"/>${k.gloss([61.5, 104], 3.5, 6, 10, 0.22)}</g>`);
    out += spider;

    // Head, drawn upright and hung upside down. Its light is turned with it.
    const headShape = k.shape(SPIDEY_HEAD, 180);
    const hub = [0, 5];
    const spokes = [];
    for (let a = -90; a < 270; a += 30) spokes.push(a);
    let mask = '';
    spokes.forEach((a) => { mask += line(hub, add(hub, rot([70, 0], a))); });
    [12, 23, 35, 48].forEach((r) => {
      mask += `M${pt(add(hub, rot([r, 0], spokes[0])))}`;
      spokes.slice(1).concat(spokes[0] + 360).forEach((a) => {
        mask += `Q${pt(add(hub, rot([r * 0.84, 0], a - 15)))} ${pt(add(hub, rot([r, 0], a)))}`;
      });
    });
    const head = `<g transform="translate(${pt(P.head)}) rotate(180)">
        ${k.paint(headShape, P.red)}
        ${k.within(headShape, `<path d="${mask}" fill="none" stroke="${P.web}" stroke-opacity=".62" stroke-width=".75"/>${k.gloss([21, 24.5], 11, 4.5, -30, 0.28)}`)}
        <g class="wb-face"></g>
      </g>`;
    out += rig('wb-pose wb-head', P.head, SPIDEY_TILT, `<g class="wb-head-wobble">${head}</g>`);

    // The drinking arm: shoulder → elbow → grip, bottle in hand.
    const restAngle = 12, center = [133, 158];
    const grip = add(center, rot(BOTTLE.grip, restAngle));
    const bend = [121, 139];
    const ik = solveDrink({
      shoulder: P.rightShoulder, elbow: bend, grip, restAngle, mouth: [77, 125], angle: -80, outward: -1,
    });
    const upperArm = spideyArm(k, P.rightShoulder, bend, 5.2, 4.8, -1, 0.06);
    const foreArm = spideyArm(k, bend, grip, 4.8, 4.3, -1, 0.04);
    const hand = mitten(k, grip, 5.8, restAngle - 10, -1);
    const glove = spideyGlove(k, hand, grip, restAngle - 10);
    out += rig('wb-drink wb-drink-arm', P.rightShoulder, { drink: ik.upper }, `
        ${upperArm.outline}
        ${rig('wb-drink wb-drink-fore', bend, { drink: ik.fore }, foreArm.outline)}
        ${upperArm.fill}
        ${rig('wb-drink wb-drink-fore', bend, { drink: ik.fore }, `${foreArm.fill}
          ${rig('wb-drink wb-drink-wrist', grip, { drink: ik.wrist }, `<g class="wb-bottle-shake">
            ${bottle(k, { center, angle: restAngle, cap: P.blue, label: P.blue.base, drinkTurn: ik.total })}
            ${glove}</g>`)}`)}`);

    // The free arm: hangs loose, beckons, or throws the web-shooter sign.
    const shoulder = P.leftShoulder;
    const baseDir = angleOf(SPIDEY_REACH.cheerful.reach);
    const handAt = add(shoulder, rot([40, 0], baseDir));
    const turns = {};
    MOODS.forEach((m) => { if (m !== 'cheerful') turns[m] = angleOf(SPIDEY_REACH[m].reach) - baseDir; });
    const freeArm = spideyArm(k, shoulder, handAt, 5.2, 4.3, 1, -0.08);
    const freeHand = mitten(k, handAt, 5.8, SPIDEY_REACH.cheerful.hand, 1);
    const thwipAngle = SPIDEY_REACH.excited.hand - turns.excited;
    out += rig('wb-pose wb-free-arm', shoulder, turns, `<g class="wb-wave">
        ${freeArm.outline}${freeArm.fill}
        <g class="wb-glove">${spideyGlove(k, freeHand, handAt, SPIDEY_REACH.cheerful.hand)}</g>
        <g class="wb-thwip">${thwip(k, handAt, thwipAngle)}</g>
      </g>`);

    return {
      defs: waterGradient() + k.defs.join(''),
      body: out,
    };
  }

  /// A red arm with blue running down its underside.
  function spideyArm(k, from, to, r0, r1, inward, bend) {
    const P = SP;
    const arm = k.shape(limb(from, elbow(from, to, bend), to, r0, r1));
    const outline = k.outline(arm);
    const fill = k.fill(arm, P.blue) + k.within(arm, `<g transform="translate(${num(-3.6 * inward)} -1)">${k.fill(arm, P.red)}${k.creaseShape(arm, 0.8, 0.7)}</g>`);
    return { outline, fill };
  }

  function spideyGlove(k, hand, at, angle) {
    const P = SP;
    const lines = [-2.4, 2.4].map((o) => line(add(at, rot([-8, o], angle)), add(at, rot([8, o], angle)))).join('');
    return k.parts([[hand.thumb, P.red], [hand.palm, P.red]]) +
      k.within(hand.palm, `<path d="${lines}" stroke="${P.web}" stroke-opacity=".62" stroke-width=".7"/>`);
  }

  /// The web-shooter sign: middle and ring fingers folded, the rest out.
  function thwip(k, at, angle) {
    const P = SP;
    const place = (p) => add(at, rot(p, angle));
    const finger = (s, c, e, r0, r1) => k.shape(limb(place(s), place(c), place(e), r0, r1));
    const palm = k.shape(ellipsePts([0, 0], 5.6, 5.4, 0, 24).map(place));
    const index = finger([2, -3.2], [6, -5], [10.5, -6.6], 1.9, 1.7);
    const pinky = finger([2, 3.2], [5.5, 4.8], [9, 6.4], 1.7, 1.5);
    const thumb = finger([-1, -4], [-1.5, -7.5], [-0.5, -10.5], 2, 1.8);
    const knuckles = [-1.2, 1.4].map((y) => {
      const c = [3.2, y];
      return `M${pt(place(add(c, rot([1.7, 0], -80))))}A1.7 1.7 0 0 1 ${pt(place(add(c, rot([1.7, 0], 80))))}`;
    }).join('');
    const button = place([-1.2, 0]);
    return k.parts([[index, P.red], [pinky, P.red], [thumb, P.red], [palm, P.red]]) +
      k.crease(knuckles, 0.9, 0.7) +
      `<circle cx="${num(button[0])}" cy="${num(button[1])}" r="1.3" fill="${P.ink}" fill-opacity=".75"/>`;
  }

  /// One lens for `mood` on `side` (-1 left, 1 right), in head space (upright).
  function spideyLens(lids, side) {
    const top = lids.top || [-40, -40], bottom = lids.bottom || [40, 40], arch = lids.arch || 0, scale = lids.scale || 1;
    const slope = (top[1] - top[0]) / 28;
    const open = [[-30, top[0] - 16 * slope], [30, top[1] + 16 * slope], [30, bottom[1]], [17, bottom[1]]];
    const control = [1.5, (bottom[0] + bottom[1]) / 2 - arch];
    for (let i = 1; i <= 12; i++) open.push(quad([17, bottom[1]], control, [-14, bottom[0]], i / 12));
    open.push([-30, bottom[0]]);
    const visible = clipPoly(open, SPIDEY_LENS);
    const toHead = (p) => [19 * side + side * scale * p[0], -3 + scale * p[1]];
    const shade = clipPoly(visible, halfPlaneBelow(2.5));
    const lens = visible.map(toHead);
    return `<path d="${poly(lens)}" fill="${SP.lens}"/>${shade.length > 2 && bbox(visible)[3] - bbox(visible)[1] > 6 ? `<path d="${poly(shade.map(toHead))}" fill="${SP.lensShade}"/>` : ''}<path d="${poly(lens)}" fill="none" stroke="${SP.ink}" stroke-width="3.2" stroke-linejoin="round"/>`;
  }

  /// Polygon cel shading for faces (no ids): light rim, base, shadow crescent; light turned `turn`.
  function celPoly(pts, t, turn, ink, outline) {
    const rim = rot(RIM, -turn), shadow = rot(SHADOW, -turn);
    const shaded = clipPoly(pts, shift(pts, rim));
    const base = clipPoly(shaded, shift(pts, mul(shadow, -1)));
    return (outline ? `<path d="${poly(pts)}" fill="none" stroke="${ink}" stroke-width="${num(INK_W * 2)}" stroke-linejoin="round"/>` : '') +
      `<path d="${poly(pts)}" fill="${t.light}"/><path d="${poly(shaded)}" fill="${t.shade}"/><path d="${poly(base)}" fill="${t.base}"/>`;
  }

  function spideyFace(mood) {
    const P = SP;
    const lids = SPIDEY_LIDS[mood];
    let out = '';
    if (mood === 'delighted') {
      // Mask rolled up to the nose: chin and mouth showing.
      const skin = clipPoly(halfPlaneBelow(18), SPIDEY_HEAD);
      out += celPoly(skin, P.skin, 180, P.ink, false);
      out += `<path class="wb-smile" d="M-5 27Q0 32 5 27" fill="none" stroke="${P.ink}" stroke-opacity=".9" stroke-width="1.6" stroke-linecap="round"/>`;
      out += `<ellipse class="wb-sip" cx="0" cy="28.5" rx="3.4" ry="2.8" fill="${P.mouth}"/>`;
      const roll = clipPoly(rrectPts(-45, 14, 90, 7.5, 3.75), SPIDEY_HEAD);
      out += celPoly(roll, P.red, 180, P.ink, true);
      let folds = '';
      for (let x = -32; x <= 32; x += 8) folds += line([x, 15], [x + 1.5, 20.5]);
      out += `<path d="${folds}" fill="none" stroke="${P.ink}" stroke-opacity=".45" stroke-width=".7" stroke-linecap="round"/>`;
    }
    const lenses = spideyLens(lids, -1) + spideyLens(lids, 1);
    out += lids.blinks ? `<g class="wb-blink">${lenses}</g>` : lenses;
    // Extras live in world orientation around the head centre.
    if (mood === 'thirsty') out += `<g transform="rotate(180)">${sweat([-44, -6], P.ink)}</g>`;
    if (mood === 'sleepy') out += `<g transform="rotate(180)">${snores([-52, 4], [-12, -30], P.silk)}</g>`;
    return out;
  }

  // MARK: Batman

  const BT = {
    ink: '#0b0d12',
    black: tone('#262d3b', '#161a23', '#55637c'),
    cape: tone('#202634', '#141821', '#4a5770'),
    suit: tone('#7c8798', '#5a6474', '#a9b4c4'),
    gunmetal: tone('#4b5260', '#313640', '#7d8696'),
    gold: tone('#f2bb3d', '#c88a1d', '#ffe08c'),
    skin: tone('#f2c6a2', '#d7a07d', '#ffe3cd'),
    lens: '#ffffff',
    lensShade: '#d3deec',
    mouth: '#5e2424',
    blush: '#f29c8f',
    fist: [44, 54],
    head: [90, 84],
    neck: [90, 116],
    leftShoulder: [71, 122],
    rightShoulder: [109, 122],
  };

  const BAT_SKULL = cubicPts([
    [[0, -34], [23, -34], [38, -21], [38, -1]],
    [[38, -1], [38, 19], [21, 34], [0, 34]],
    [[0, 34], [-21, 34], [-38, 19], [-38, -1]],
    [[-38, -1], [-38, -21], [-23, -34], [0, -34]],
  ], 12);

  const BAT_TILT = { pleading: 8, thirsty: -7, sleepy: -10 };

  /// Grey sleeve into a black gauntlet with three fins down its outer edge.
  function batArm(k, from, to, r0, r1, bend, outward, gauntletAt, fins) {
    const P = BT;
    const control = elbow(from, to, bend);
    const arm = k.shape(limb(from, control, to, r0, r1));
    const cuff = quad(from, control, to, gauntletAt);
    const region = k.shape(cuffRegion(cuff, to, 0, 1.5, -2));
    let finPts = '';
    fins.forEach((t) => {
      const p = quad(from, control, to, t);
      const along = unit(add(mul(sub(control, from), 1 - t), mul(sub(to, control), t)));
      const side = mul([-along[1], along[0]], outward);
      const base = add(p, mul(side, 3.6));
      finPts += poly([add(base, mul(along, 1.5)), sub(add(base, mul(side, 4)), mul(along, 2.8)), sub(base, mul(along, 3.4))]);
    });
    const finShape = k.shape(finPts);
    return {
      outline: k.outline(finShape) + k.outline(arm),
      fill: k.fill(finShape, P.black) + k.fill(arm, P.suit) +
        k.within(arm, k.outline(region)) + k.within(region, k.fill(arm, P.black)),
    };
  }

  function batGlove(k, at, angle, thumb) {
    const hand = mitten(k, at, 6, angle, thumb);
    return k.parts([[hand.thumb, BT.black], [hand.palm, BT.black]]);
  }

  function batArt() {
    const P = BT;
    const k = kit(P.ink, INK_W);
    let out = '';

    // Cape, behind everything, its hem scalloped like bat wings.
    const hem = [];
    for (let i = 0; i <= 5; i++) hem.push([44 + i * 19, 186 - Math.abs(i - 2.5) * 2.2]);
    let cape = `M70 108Q48 140 ${pt(hem[0])}`;
    for (let i = 1; i < hem.length; i++) cape += `Q${pt(add(mid(hem[i - 1], hem[i]), [0, -9]))} ${pt(hem[i])}`;
    cape += 'Q136 140 110 108Z';
    let folds = '';
    for (let i = 1; i < hem.length - 1; i++) {
      const top = [80 + (i - 1) * 6.5, 124];
      folds += `M${pt(top)}Q${pt(add(mid(top, hem[i]), [3, 0]))} ${pt(add(hem[i], [0, -4]))}`;
    }
    out += `<g class="wb-cape">${k.paint(k.shape(cape), P.cape)}${k.crease(folds, 0.9, 0.55)}</g>`;

    // Legs.
    [[82, 148], [98, 148]].forEach((hip) => {
      const foot = add(hip, [0, 28]);
      const leg = k.shape(limb(hip, mid(hip, foot), foot, 6.2, 5.2));
      const toe = k.shape(limb(foot, add(foot, [1, 3]), add(foot, [2.5, 5]), 5.4, 4.4));
      const region = k.shape(cuffRegion(hip, foot, 0.52, 1.5, -2));
      out += k.outline(leg) + k.outline(toe) + k.fill(leg, P.suit) +
        k.within(leg, k.outline(region)) + k.within(region, k.fill(leg, P.black)) + k.fill(toe, P.black);
    });

    // Torso: utility belt, the bat on the chest.
    const torso = k.shape(roundedPts([[69, 114], [111, 114], [104, 152], [76, 152]], 9));
    const belt = k.shape(poly([[70, 141], [110, 141], [110, 149], [70, 149]]));
    const pouches = [77, 99].map((x) => k.shape(rrectPts(x, 142, 5, 8, 1.4)));
    const buckle = k.shape(ellipsePts([90, 145], 4.5, 3.5, 0, 20));
    out += k.paint(torso, P.suit) + k.within(torso,
      k.fill(belt, P.gold) + k.creaseShape(belt, 1, 0.8) +
      pouches.map((s) => k.paint(s, P.gold)).join('') + k.paint(buckle, P.gold) +
      `<path d="${batEmblem([90, 128], 27)}" fill="${P.ink}"/>` + k.gloss([79, 120], 5, 3, -15, 0.25));

    // Head: cowl with ears, the jaw open below it.
    const ear = (side) => `M${pt([30 * side, -18])}Q${pt([31 * side, -36])} ${pt([25 * side, -50])}Q${pt([20 * side, -38])} ${pt([11 * side, -31])}Z`;
    const skull = k.shape(BAT_SKULL);
    const ears = [k.shape(ear(-1)), k.shape(ear(1))];
    const opening = k.shape('M-31 30L-28 11Q-17 7 -6 8L0 13L6 8Q17 7 28 11L31 30L0 46Z');
    const head = `<g transform="translate(${pt(P.head)})">
        ${k.outline(ears[0])}${k.outline(ears[1])}${k.outline(skull)}
        ${k.fill(ears[0], P.black)}${k.fill(ears[1], P.black)}${k.fill(skull, P.black)}
        ${k.within(skull, `${k.fill(opening, P.skin)}${k.creaseShape(opening, 1.3, 1)}${k.gloss([-17, -24], 11, 4, -25, 0.16)}`)}
        <g class="wb-face"></g>
      </g>`;
    out += rig('wb-pose wb-head', P.neck, BAT_TILT, `<g class="wb-head-wobble">${head}</g>`);

    // The drinking arm.
    const restAngle = 10, center = [135, 150];
    const grip = add(center, rot(BOTTLE.grip, restAngle));
    const bend = [117, 140];
    const ik = solveDrink({
      shoulder: P.rightShoulder, elbow: bend, grip, restAngle, mouth: [92, 107.5], angle: -92, outward: 1,
    });
    const upper = k.shape(limb(P.rightShoulder, elbow(P.rightShoulder, bend, -0.05), bend, 5.6, 5.1));
    const fore = batArm(k, bend, grip, 5.1, 4.6, -0.04, -1, 0.15, [0.3, 0.5, 0.7]);
    out += rig('wb-drink wb-drink-arm', P.rightShoulder, { drink: ik.upper }, `
        ${k.outline(upper)}
        ${rig('wb-drink wb-drink-fore', bend, { drink: ik.fore }, fore.outline)}
        ${k.fill(upper, P.suit)}
        ${rig('wb-drink wb-drink-fore', bend, { drink: ik.fore }, `${fore.fill}
          ${rig('wb-drink wb-drink-wrist', grip, { drink: ik.wrist }, `<g class="wb-bottle-shake">
            ${bottle(k, { center, angle: restAngle, cap: P.black, label: P.gold.base, drinkTurn: ik.total })}
            ${batGlove(k, grip, restAngle - 10, -1)}</g>`)}`)}`);

    // The grapnel gun, barrel up, the line running out of its muzzle; the arm holding it.
    const f = P.fist;
    const barrel = k.shape(rrectPts(f[0] - 4, f[1] - 27, 8, 16, 2));
    const muzzle = k.shape(rrectPts(f[0] - 5.5, f[1] - 30, 11, 5.5, 1.8));
    const gunBody = k.shape(roundedPts([[f[0] - 7, f[1] - 14], [f[0] + 7, f[1] - 14], [f[0] + 9, f[1] - 4], [f[0] - 7, f[1] - 4]], 2.5));
    out += k.parts([[barrel, P.gunmetal], [gunBody, P.gunmetal], [muzzle, P.gunmetal]]) +
      k.crease(line([f[0] - 4, f[1] - 22], [f[0] + 4, f[1] - 22]) + line([f[0] - 4, f[1] - 18], [f[0] + 4, f[1] - 18]), 0.9, 0.6) +
      `<rect x="${f[0] + 1}" y="${f[1] - 11}" width="5.5" height="2.2" rx="1.1" fill="${P.gold.base}"/>`;
    const grapnelArm = batArm(k, P.leftShoulder, f, 5.6, 4.6, 0.14, -1, 0.55, [0.6, 0.71, 0.82]);
    out += grapnelArm.outline + grapnelArm.fill + batGlove(k, f, -80, 1);

    return { defs: waterGradient() + k.defs.join(''), body: out };
  }

  /// The bat on his chest.
  function batEmblem(center, width) {
    const start = [0, -2.6];
    const segments = [
      [[1.7, -5.8]], [[2.7, -2.3]], [[13, -5.2], [7.5, -0.8]], [[10.6, 0.4], [12.6, -1.8]],
      [[7.4, 0.9], [9, -1.4]], [[4.4, 3.8], [5.1, 0.9]], [[0, 6], [1.8, 3.4]],
    ];
    const s = width / 26;
    const place = (p) => add(center, mul(p, s));
    const flip = (p) => [-p[0], p[1]];
    let d = `M${pt(place(start))}`;
    segments.forEach(([to, c]) => { d += c ? `Q${pt(place(c))} ${pt(place(to))}` : `L${pt(place(to))}`; });
    const points = [start].concat(segments.map((x) => x[0]));
    for (let i = segments.length - 1; i >= 0; i--) {
      const target = flip(points[i]), c = segments[i][1];
      d += c ? `Q${pt(place(flip(c)))} ${pt(place(target))}` : `L${pt(place(target))}`;
    }
    return `${d}Z`;
  }

  /// Eye slits per mood, in head space (x toward the outer corner on the right eye).
  const BAT_EYES = {
    excited: [[6, -5], [21, -11], [21.5, 1.5], [7, 2]],
    pleading: [[6.5, -8], [20.5, -5.5], [20, 1.5], [7.5, 1.5]],
    thirsty: [[6, -2], [21, -3.5], [20.5, 0.5], [7, 1]],
    cheerful: [[6, -3], [21.5, -9], [20.5, 0], [7, 1.2]],
  };

  function batFace(mood) {
    const P = BT;
    let out = '';
    if (['delighted', 'tickled', 'excited'].includes(mood)) {
      out += [-1, 1].map((side) => `<ellipse cx="${17 * side}" cy="19" rx="4" ry="2" fill="${P.blush}" fill-opacity=".7"/>`).join('');
    }
    const mirror = (side) => (p) => [p[0] * side, p[1]];
    const stroke2 = (d, outer, inner, join = 'round') => `<path d="${d}" fill="none" stroke="${P.ink}" stroke-width="${outer}" stroke-linecap="round" stroke-linejoin="${join}"/><path d="${d}" fill="none" stroke="${P.lens}" stroke-width="${inner}" stroke-linecap="round" stroke-linejoin="${join}"/>`;
    let eyes = '';
    [-1, 1].forEach((side) => {
      const m = mirror(side);
      if (mood === 'delighted') eyes += stroke2(`M${pt(m([7, -1]))}Q${pt(m([14, -10]))} ${pt(m([21, -2]))}`, 5, 2.6);
      else if (mood === 'sleepy') eyes += stroke2(`M${pt(m([7, -2]))}Q${pt(m([14, 2]))} ${pt(m([21, -3]))}`, 4.4, 2);
      else if (mood === 'tickled') eyes += stroke2(`M${pt(m([20, -9]))}L${pt(m([9, -3.5]))}L${pt(m([20, 2]))}`, 5, 2.4);
      else {
        const corners = BAT_EYES[mood] || BAT_EYES.cheerful;
        const slit = roundedPts(corners, 2, 3).map(m);
        const shade = clipPoly(slit, halfPlaneBelow(-1));
        eyes += `<path d="${poly(slit)}" fill="${P.lens}" stroke="${P.ink}" stroke-width="2.6" stroke-linejoin="round" paint-order="stroke"/>`;
        if (shade.length > 2) eyes += `<path d="${poly(shade)}" fill="${P.lensShade}"/>`;
        eyes += `<path d="${line(m(add(corners[0], [-1, -3.5])), m(add(corners[1], [1, -3.5])))}" stroke="${P.black.light}" stroke-opacity=".75" stroke-width="1.2" stroke-linecap="round"/>`;
      }
    });
    out += ['cheerful', 'pleading'].includes(mood) ? `<g class="wb-blink">${eyes}</g>` : eyes;

    const mouth = [0, 23];
    const at = (p) => pt(add(mouth, p));
    const crease = (d) => `<path d="${d}" fill="none" stroke="${P.ink}" stroke-opacity=".95" stroke-width="1.6" stroke-linecap="round"/>`;
    const grin = (w, drop) => {
      const pts = [];
      for (let i = 0; i <= 8; i++) pts.push(quad(add(mouth, [-w, -2]), add(mouth, [0, -3]), add(mouth, [w, -2]), i / 8));
      for (let i = 1; i < 8; i++) pts.push(quad(add(mouth, [w, -2]), add(mouth, [0, drop]), add(mouth, [-w, -2]), i / 8));
      const teeth = clipPoly([[mouth[0] - w, mouth[1] - 4], [mouth[0] + w, mouth[1] - 4], [mouth[0] + w, mouth[1] - 0.6], [mouth[0] - w, mouth[1] - 0.6]], pts);
      return `<path d="${poly(pts)}" fill="${P.mouth}"/>${teeth.length > 2 ? `<path d="${poly(teeth)}" fill="#fff"/>` : ''}<path d="${poly(pts)}" fill="none" stroke="${P.ink}" stroke-opacity=".95" stroke-width="1.2" stroke-linejoin="round"/>`;
    };
    switch (mood) {
      case 'cheerful': out += crease(`M${at([-5, 0])}Q${at([1, 3])} ${at([5.5, -2.5])}`); break;
      case 'excited': out += grin(6, 9); break;
      case 'tickled': out += grin(7, 10.5); break;
      case 'delighted':
        out += `<g class="wb-smile">${grin(6, 9)}</g><ellipse class="wb-sip" cx="${mouth[0]}" cy="${mouth[1]}" rx="3" ry="2.5" fill="${P.mouth}"/>`;
        break;
      case 'pleading': out += crease(`M${at([-4, 1])}Q${at([0, -3])} ${at([4, 1])}`); break;
      case 'thirsty': out += crease(`M${at([-6, 0])}Q${at([-3, -2.5])} ${at([0, 0])}Q${at([3, 2.5])} ${at([6, 0])}`); break;
      case 'sleepy': out += `<ellipse class="wb-snore" cx="${mouth[0]}" cy="${mouth[1]}" rx="1.5" ry="1.5" fill="${P.mouth}"/>`; break;
      default: break;
    }
    if (mood === 'thirsty') out += sweat([36, -16], P.ink);
    if (mood === 'sleepy') out += snores([40, -26], [14, -24], P.lens);
    return out;
  }

  // MARK: Assembly

  /// Outline weight (drawn just outside each shape), in figure units.
  const INK_W = 1.7;

  /// Builds a buddy from its art: `view` is the viewBox in figure units, `scale` px per unit.
  function buddy(key, { name, line: lineStyle, view, scale, anchor, bubbleAt, art, faces, lines }) {
    const [vx, vy, vw, vh] = view;
    const width = Math.round(vw * scale), height = Math.round(vh * scale);
    const px = (p) => [Math.round((p[0] - vx) * scale * 10) / 10, Math.round((p[1] - vy) * scale * 10) / 10];
    let template;
    const build = () => {
      if (template) return template;
      const built = typeof art === 'function' ? art() : art;
      template = typeof built === 'string' ? built : `<defs>${built.defs}</defs>${built.body}`;
      return template;
    };
    return {
      name,
      line: lineStyle,
      width,
      height,
      lineX: px(anchor)[0],
      lineTop: px(anchor)[1],
      bubble: { x: px(bubbleAt)[0], y: px(bubbleAt)[1] },
      svg(uid = nextUid()) {
        return `<svg class="wb-svg wb-${key}" viewBox="${view.join(' ')}" width="${width}" height="${height}" data-mood="cheerful" aria-hidden="true" focusable="false">${build().split(UID).join(uid)}</svg>`;
      },
      face: (mood) => faces(MOODS.includes(mood) ? mood : 'cheerful'),
      lines,
    };
  }

  let uidCount = 0;
  const nextUid = () => `wb${++uidCount}`;

  /// Faces are built on first use and kept.
  const memo = (fn) => {
    const cache = {};
    return (mood) => (cache[mood] !== undefined ? cache[mood] : (cache[mood] = fn(mood)));
  };

  const robot = buddy('robot', {
    name: 'Robot',
    line: 'rope',
    view: [0, 0, 132, 158],
    scale: 1,
    anchor: [60, 8],
    bubbleAt: [136, 22],
    art: ROBOT_ART,
    faces: (mood) => ROBOT_FACES[mood],
    lines: {
      cheerful: ['Drink water!', 'Sip time!', 'Hydration break!', 'Water o\'clock!'],
      excited: ['Yes! Grab a sip!', 'Ooh, you\'re here!', 'Let\'s hydrate!'],
      pleading: ['Pretty please?', 'Just one sip?', 'I carried this up here…'],
      thirsty: ['I\'m wilting here…', 'Brains are 75% water!', 'Even plants drink…'],
      delighted: ['Ahh, refreshing!', 'Hydrated!', 'Splash-tastic!'],
      sleepy: ['Zzz…'],
      tickled: ['Hehe, that tickles!', 'Boop! Now drink.', 'Hey! Water first!'],
    },
  });

  const spidey = buddy('spidey', {
    name: 'Spidey',
    line: 'web',
    view: [4, 10, 152, 186],
    scale: 0.875,
    anchor: [64, 25],
    bubbleAt: [142, 34],
    art: spideyArt,
    faces: memo(spideyFace),
    lines: {
      cheerful: ['Thwip! Water time!', 'Hang in there… and sip!', 'Your friendly hydration hero!'],
      excited: ['My spidey-sense says: drink!', 'Ooh, you found me!', 'Thwip thwip, let\'s go!'],
      pleading: ['Pretty please?', 'I swung all this way…', 'Just one sip, hero?'],
      thirsty: ['Great power, great hydration!', 'My web\'s drying out…', 'Even heroes need water!'],
      delighted: ['Thwip-tastic!', 'Hydration saved the day!', 'Amazing! Spectacular!'],
      sleepy: ['Zzz… hanging around'],
      tickled: ['Hey! Not the web!', 'Hehe, spidey-tickles!', 'Whoa, I\'m spinning!'],
    },
  });

  const batman = buddy('batman', {
    name: 'Batman',
    line: 'grapnel',
    view: [26, 16, 134, 178],
    scale: 0.92,
    anchor: [44, 25],
    bubbleAt: [140, 40],
    art: batArt,
    faces: memo(batFace),
    lines: {
      cheerful: ['I\'m Batman. Drink water.', 'Gotham needs you hydrated.', 'Even the night needs water.'],
      excited: ['To the water bottle!', 'You found me. Now drink.', 'Alfred says: hydrate!'],
      pleading: ['One sip, citizen.', 'Don\'t make me ask twice.', 'I came all this way…'],
      thirsty: ['Why so thirsty?', 'My utility belt is dry…', 'This city is parched.'],
      delighted: ['Justice… and hydration!', 'Mission accomplished.', 'Alfred would be proud.'],
      sleepy: ['Zzz… on patrol'],
      tickled: ['Hey! Not the cape!', 'Batman doesn\'t giggle.', 'That\'s classified!'],
    },
  });

  NG.buddies = {
    robot,
    spidey,
    batman,
    moods: MOODS.slice(),
    /// Full static SVG for one buddy in one mood (mood gallery, picker thumbnails).
    /// `drinking` defaults to true for "delighted" (that mood only shows while drinking).
    render(name, mood = 'cheerful', { uid, drinking = mood === 'delighted' } = {}) {
      const b = NG.buddies[name];
      if (!b || !b.svg) return '';
      return b.svg(uid || nextUid())
        .replace('data-mood="cheerful"', `data-mood="${mood}"`)
        .replace(`class="wb-svg wb-${name}"`, `class="wb-svg wb-${name}${drinking ? ' is-drinking' : ''}"`)
        .replace('<g class="wb-face"></g>', `<g class="wb-face">${b.face(mood)}</g>`);
    },
  };
})();
