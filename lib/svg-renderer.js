/* ============================================================
 * Arrow Indicator - SVG renderer
 * ============================================================ */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ArrowIndicatorRenderer = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function num(v, f) {
    return (typeof v === 'number' && isFinite(v)) ? v : f;
  }
  function clamp(v, lo, hi) {
    v = num(v, lo);
    return Math.max(lo, Math.min(hi, v));
  }
  function fmt(n) {
    if (typeof n !== 'number' || !isFinite(n)) { return '0'; }
    return (Math.round(n * 100) / 100).toString();
  }
  function escAttr(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function polyToPath(pts) {
    var d = 'M' + fmt(pts[0][0]) + ' ' + fmt(pts[0][1]);
    for (var i = 1; i < pts.length; i++) {
      d += ' L' + fmt(pts[i][0]) + ' ' + fmt(pts[i][1]);
    }
    return d + ' Z';
  }
  function multiPath(subpaths) {
    return subpaths.map(polyToPath).join(' ');
  }
  // Convert a screen-angle (0=top, 90=right, 180=bottom, 270=left) and
  // radius around (cx,cy) into a [x,y] point.
  function ptScreen(cx, cy, r, deg) {
    var a = (deg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }
  function arcPoints(cx, cy, r, a0, a1, steps) {
    var pts = [];
    for (var i = 0; i <= steps; i++) {
      pts.push(ptScreen(cx, cy, r, a0 + (a1 - a0) * i / steps));
    }
    return pts;
  }

  /* ---- Path builders ---- */

  function straightPath(L, B, p) {
    var t  = p.bodyThickness * B;
    var hw = p.headWidth * B; if (hw < t) { hw = t; }
    var hl = p.headLength * L;
    var cy = B / 2, xBase = L - hl;
    if (xBase < 0) { xBase = 0; }
    return polyToPath([
      [0, cy - t / 2], [xBase, cy - t / 2], [xBase, cy - hw / 2],
      [L, cy], [xBase, cy + hw / 2], [xBase, cy + t / 2],
      [0, cy + t / 2]
    ]);
  }

  function pentagonPath(L, B, p) {
    var hl = p.headLength * L; if (hl > L) { hl = L; }
    return polyToPath([
      [0, 0], [L - hl, 0], [L, B / 2], [L - hl, B], [0, B]
    ]);
  }

  function chevronPath(L, B, p) {
    var hl = p.headLength * L; if (hl > L * 0.5) { hl = L * 0.5; }
    return polyToPath([
      [0, 0], [L - hl, 0], [L, B / 2],
      [L - hl, B], [0, B], [hl, B / 2]
    ]);
  }

  function notchedPath(L, B, p) {
    var t  = p.bodyThickness * B;
    var hw = p.headWidth * B; if (hw < t) { hw = t; }
    var hl = p.headLength * L;
    var cy = B / 2, xBase = L - hl;
    if (xBase < 0) { xBase = 0; }
    var notch = Math.min(t * 0.9, xBase);
    return polyToPath([
      [0, cy - t / 2], [xBase, cy - t / 2], [xBase, cy - hw / 2],
      [L, cy], [xBase, cy + hw / 2], [xBase, cy + t / 2],
      [0, cy + t / 2], [notch, cy]
    ]);
  }

  function twoWayPath(L, B, p) {
    var t  = p.bodyThickness * B;
    var hw = p.headWidth * B; if (hw < t) { hw = t; }
    var hl = p.headLength * L;
    if (hl * 2 > L * 0.95) { hl = L * 0.475; }
    var cy = B / 2;
    return polyToPath([
      [0, cy], [hl, cy - hw / 2], [hl, cy - t / 2],
      [L - hl, cy - t / 2], [L - hl, cy - hw / 2], [L, cy],
      [L - hl, cy + hw / 2], [L - hl, cy + t / 2],
      [hl, cy + t / 2], [hl, cy + hw / 2]
    ]);
  }

  function fourWayPath(W, H, p) {
    var M = Math.min(W, H);
    var cx = W / 2, cy = H / 2;
    var arm = M / 2;
    var t  = p.bodyThickness * M * 0.6;
    var hw = p.headWidth * M * 0.55; if (hw < t) { hw = t; }
    var hl = p.headLength * M * 0.5;
    var hs = arm - hl; if (hs < t / 2) { hs = t / 2; }
    return polyToPath([
      [cx, cy - arm],
      [cx + hw / 2, cy - hs], [cx + t / 2, cy - hs],
      [cx + t / 2, cy - t / 2],
      [cx + hs, cy - t / 2], [cx + hs, cy - hw / 2],
      [cx + arm, cy],
      [cx + hs, cy + hw / 2], [cx + hs, cy + t / 2],
      [cx + t / 2, cy + t / 2],
      [cx + t / 2, cy + hs], [cx + hw / 2, cy + hs],
      [cx, cy + arm],
      [cx - hw / 2, cy + hs], [cx - t / 2, cy + hs],
      [cx - t / 2, cy + t / 2],
      [cx - hs, cy + t / 2], [cx - hs, cy + hw / 2],
      [cx - arm, cy],
      [cx - hs, cy - hw / 2], [cx - hs, cy - t / 2],
      [cx - t / 2, cy - t / 2],
      [cx - t / 2, cy - hs], [cx - hw / 2, cy - hs]
    ]);
  }

  function elbowPath(W, H, p) {
    var minA = Math.min(W, H);
    var t  = p.bodyThickness * minA;
    var hw = p.headWidth * H;
    var hl = p.headLength * W;
    var Ri = p.cornerRadius * (minA / 2);
    var horiz = t + Ri + hl;
    if (horiz > W) {
      var k = (W * 0.98) / horiz;
      t *= k; Ri *= k; hl *= k;
    }
    if (hw < t) { hw = t; }
    if (hw > H) { hw = H; }
    var cx = t / 2, cy = H - hw / 2;
    var maxRi = cy - t / 2;
    if (Ri > maxRi) { Ri = Math.max(0, maxRi); }
    var Ro = Ri + t;
    var Ox = cx + t / 2 + Ri, Oy = cy - t / 2 - Ri;
    var xTip = W, xBase = xTip - hl;
    if (xBase < Ox) { xBase = Ox; }
    var d = [];
    d.push('M' + fmt(cx - t / 2) + ' 0');
    d.push('L' + fmt(cx + t / 2) + ' 0');
    d.push('L' + fmt(cx + t / 2) + ' ' + fmt(Oy));
    d.push('A' + fmt(Ri) + ' ' + fmt(Ri) + ' 0 0 0 ' +
      fmt(Ox) + ' ' + fmt(Oy + Ri));
    d.push('L' + fmt(xBase) + ' ' + fmt(cy - t / 2));
    d.push('L' + fmt(xBase) + ' ' + fmt(cy - hw / 2));
    d.push('L' + fmt(xTip) + ' ' + fmt(cy));
    d.push('L' + fmt(xBase) + ' ' + fmt(cy + hw / 2));
    d.push('L' + fmt(xBase) + ' ' + fmt(cy + t / 2));
    d.push('L' + fmt(Ox) + ' ' + fmt(cy + t / 2));
    d.push('A' + fmt(Ro) + ' ' + fmt(Ro) + ' 0 0 1 ' +
      fmt(cx - t / 2) + ' ' + fmt(Oy));
    d.push('Z');
    return d.join(' ');
  }

  // Curved arrow : smooth 90° arc, enters from top, exits right
  // (canonical "top-right" orientation, matches elbow placements).
  function curvedPath(W, H, p) {
    var cx = W, cy = 0;
    var R0 = Math.min(W, H);
    var t  = clamp(p.bodyThickness, 0.05, 0.95) * R0 * 0.45;
    var hw = t + clamp(p.headWidth, 0.20, 1.00) * R0 * 0.35;
    var Rc = R0 - hw / 2 - 2;
    if (Rc < t * 1.2) { Rc = t * 1.2; }
    var a0 = 270, a1 = 180;        // top -> right (going CCW visually)
    var hSpan = clamp(p.headLength, 0.05, 0.9) * 28;
    var ab = a1 + hSpan;
    var steps = 32;
    var pts = [];
    // Outer arc
    for (var i = 0; i <= steps; i++) {
      var deg = a0 + (ab - a0) * i / steps;
      pts.push(ptScreen(cx, cy, Rc + t / 2, deg));
    }
    pts.push(ptScreen(cx, cy, Rc + hw / 2, ab));
    pts.push(ptScreen(cx, cy, Rc, a1));
    pts.push(ptScreen(cx, cy, Rc - hw / 2, ab));
    // Inner arc back
    for (var j = 0; j <= steps; j++) {
      var deg2 = ab + (a0 - ab) * j / steps;
      pts.push(ptScreen(cx, cy, Rc - t / 2, deg2));
    }
    return polyToPath(pts);
  }

  // Step (Z) arrow : horizontal top → vertical drop → horizontal exit
  // (canonical pointing right).
  function stepPath(L, B, p) {
    var t  = p.bodyThickness * B * 0.6;
    var hw = p.headWidth * B * 0.7; if (hw < t) { hw = t; }
    var hl = p.headLength * L * 0.3;
    var X1 = L * 0.45;
    if (X1 < t) { X1 = t; }
    if (X1 > L - hl - t) { X1 = L - hl - t; }
    var cyR3 = B - t / 2;
    var headBase = L - hl;
    if (headBase < X1) { headBase = X1; }
    return polyToPath([
      [0, 0],
      [X1, 0],
      [X1, B - t],
      [headBase, B - t],
      [headBase, cyR3 - hw / 2],
      [L, cyR3],
      [headBase, cyR3 + hw / 2],
      [headBase, B],
      [X1 - t, B],
      [X1 - t, t],
      [0, t]
    ]);
  }

  // Striped arrow : main body + 3 small stripes at the tail.
  function stripedPath(L, B, p) {
    var t  = p.bodyThickness * B;
    var hw = p.headWidth * B; if (hw < t) { hw = t; }
    var hl = p.headLength * L;
    var stripeArea = L * 0.28;
    var bodyStart = stripeArea;
    var bodyEnd = L - hl;
    if (bodyEnd < bodyStart) { bodyEnd = bodyStart; }
    var cy = B / 2;
    var body = [
      [bodyStart, cy - t / 2],
      [bodyEnd, cy - t / 2],
      [bodyEnd, cy - hw / 2],
      [L, cy],
      [bodyEnd, cy + hw / 2],
      [bodyEnd, cy + t / 2],
      [bodyStart, cy + t / 2]
    ];
    // 3 stripes : sw = gap = stripeArea / 7 (so total = 3*sw + 3*gap + leading = 7*sw)
    var sw = stripeArea / 7;
    var gap = sw;
    var subs = [body];
    for (var k = 0; k < 3; k++) {
      var x = k * (sw + gap);
      subs.push([
        [x, cy - t / 2],
        [x + sw, cy - t / 2],
        [x + sw, cy + t / 2],
        [x, cy + t / 2]
      ]);
    }
    return multiPath(subs);
  }

  // U-turn arrow : two vertical legs connected by a half-circle arch,
  // arrowhead at the bottom of the right leg pointing down (canonical
  // "down" = U opens down).
  function uturnPath(W, H, p) {
    var R0 = Math.min(W, H);
    var t  = clamp(p.bodyThickness, 0.05, 0.95) * R0 * 0.45;
    var hw = t + clamp(p.headWidth, 0.20, 1.00) * R0 * 0.35;
    var hl = clamp(p.headLength, 0.05, 0.9) * H * 0.25;

    var cx = W / 2;
    var Ro = W / 2;
    if (Ro > H * 0.6) { Ro = H * 0.6; }
    var Ri = Ro - t;
    if (Ri < t * 0.3) { Ri = t * 0.3; t = Ro - Ri; }
    var cyArch = Ro;

    // Right leg : outer x = cx + Ro, inner x = cx + Ri, centerline x = cx + Ro - t/2
    var legR_outer = cx + Ro;
    var legR_inner = cx + Ri;
    var legR_cx = cx + Ro - t / 2;
    var headBase = H - hl;
    if (headBase < cyArch + t) { headBase = cyArch + t; }

    // Left leg : outer x = cx - Ro, inner x = cx - Ri
    var legL_outer = cx - Ro;
    var legL_inner = cx - Ri;

    var steps = 28;
    var pts = [];
    // Start at top of outer arch (cx, 0) and go CW : 0° → 90° (right outer)
    pts = pts.concat(arcPoints(cx, cyArch, Ro, 0, 90, steps));
    // Down right outer leg to head base
    pts.push([legR_outer, headBase]);
    // Head right outer corner
    pts.push([legR_cx + hw / 2, headBase]);
    // Tip pointing down
    pts.push([legR_cx, H]);
    // Head left corner
    pts.push([legR_cx - hw / 2, headBase]);
    // Step back to inner leg edge
    pts.push([legR_inner, headBase]);
    // Up inner right leg
    pts.push([legR_inner, cyArch]);
    // Inner arch CCW from right inner (90°) up over to left inner (270°)
    pts = pts.concat(arcPoints(cx, cyArch, Ri, 90, -90, 2 * steps));
    // Down left inner leg
    pts.push([legL_inner, H]);
    // Across bottom of left leg
    pts.push([legL_outer, H]);
    // Up left outer leg
    pts.push([legL_outer, cyArch]);
    // Outer arch CW from left outer (270°) to top (360° = 0°)
    pts = pts.concat(arcPoints(cx, cyArch, Ro, 270, 360, steps));
    return polyToPath(pts);
  }

  /* ---- Placement ---- */

  function dir4Placement(direction, W, H) {
    switch (direction) {
      case 'right':
        return { L: W, B: H, transform: '' };
      case 'left':
        return { L: W, B: H, transform: 'matrix(-1 0 0 -1 ' + W + ' ' + H + ')' };
      case 'up':
        return { L: H, B: W, transform: 'translate(0 ' + H + ') rotate(-90)' };
      case 'down':
        return { L: H, B: W, transform: 'translate(' + W + ' 0) rotate(90)' };
      default:
        return { L: W, B: H, transform: '' };
    }
  }
  function twoWayPlacement(orientation, W, H) {
    if (orientation === 'vertical') {
      return { L: H, B: W, transform: 'translate(' + W + ' 0) rotate(90)' };
    }
    return { L: W, B: H, transform: '' };
  }
  function elbowPlacement(direction, W, H) {
    var T = 'matrix(0 1 1 0 0 0)';
    switch (direction) {
      case 'top-right':
        return { box: 'WH', transform: '' };
      case 'top-left':
        return { box: 'WH', transform: 'translate(' + W + ' 0) scale(-1 1)' };
      case 'bottom-right':
        return { box: 'WH', transform: 'translate(0 ' + H + ') scale(1 -1)' };
      case 'bottom-left':
        return { box: 'WH', transform: 'translate(' + W + ' ' + H + ') scale(-1 -1)' };
      case 'left-down':
        return { box: 'HW', transform: T };
      case 'left-up':
        return { box: 'HW', transform: 'translate(0 ' + H + ') scale(1 -1) ' + T };
      case 'right-down':
        return { box: 'HW', transform: 'translate(' + W + ' 0) scale(-1 1) ' + T };
      case 'right-up':
        return { box: 'HW', transform: 'translate(' + W + ' ' + H + ') scale(-1 -1) ' + T };
      default:
        return { box: 'WH', transform: '' };
    }
  }
  // U-turn : 4 orientations describing which way the U opens.
  // Canonical = "down" (opens down, arrow on right pointing down).
  function uturnPlacement(direction, W, H) {
    switch (direction) {
      case 'down':
        return { W: W, H: H, transform: '' };
      case 'up':
        return { W: W, H: H, transform: 'matrix(-1 0 0 -1 ' + W + ' ' + H + ')' };
      case 'right':
        return { W: H, H: W, transform: 'translate(' + W + ' 0) rotate(90)' };
      case 'left':
        return { W: H, H: W, transform: 'translate(0 ' + H + ') rotate(-90)' };
      default:
        return { W: W, H: H, transform: '' };
    }
  }

  function normalize(cfg) {
    cfg = cfg || {};
    var validTypes = ['straight', 'pentagon', 'chevron', 'notched',
      'two-way', 'four-way', 'elbow', 'curved', 'step', 'striped', 'uturn'];
    var type = (validTypes.indexOf(cfg.type) >= 0) ? cfg.type : 'straight';
    return {
      type: type,
      direction4: cfg.direction4 || 'right',
      twoWayOrientation: cfg.twoWayOrientation || 'horizontal',
      elbowDirection: cfg.elbowDirection || 'top-right',
      curvedDirection: cfg.curvedDirection || 'top-right',
      uturnDirection: cfg.uturnDirection || 'down',
      style: (cfg.style === 'outline') ? 'outline' : 'filled',
      color: cfg.color || '#3a4a5a',
      backgroundColor: cfg.backgroundColor || 'transparent',
      bodyThickness: clamp(num(cfg.bodyThickness, 0.40), 0.05, 0.95),
      headLength:    clamp(num(cfg.headLength,    0.42), 0.05, 0.90),
      headWidth:     clamp(num(cfg.headWidth,     0.82), 0.10, 1.00),
      cornerRadius:  clamp(num(cfg.cornerRadius,  0.45), 0, 1),
      strokeWidth:   clamp(num(cfg.strokeWidth,   4), 0, 20),
      marginLeft:    clamp(num(cfg.marginLeft,    0.06), 0, 0.45),
      marginRight:   clamp(num(cfg.marginRight,   0.06), 0, 0.45),
      marginTop:     clamp(num(cfg.marginTop,     0.06), 0, 0.45),
      marginBottom:  clamp(num(cfg.marginBottom,  0.06), 0, 0.45)
    };
  }

  // Natural width/height ratio per shape and orientation. The shape
  // is then fitted into the inner box keeping this ratio (no stretch).
  function isVerticalDir4(d) { return d === 'up' || d === 'down'; }
  function naturalAspect(c) {
    var horiz;
    switch (c.type) {
      case 'straight':  horiz = 2.0; break;
      case 'notched':   horiz = 2.0; break;
      case 'pentagon':  horiz = 1.5; break;
      case 'chevron':   horiz = 1.4; break;
      case 'striped':   horiz = 2.3; break;
      case 'step':      horiz = 1.5; break;
      case 'two-way':
        return (c.twoWayOrientation === 'vertical') ? 1 / 2.6 : 2.6;
      case 'four-way':
        return 1;
      case 'elbow':
      case 'curved':
        return 1;
      case 'uturn':
        return (c.uturnDirection === 'left' || c.uturnDirection === 'right')
          ? 1 / 1.15 : 1.15;
      default:
        horiz = 2.0;
    }
    return isVerticalDir4(c.direction4) ? 1 / horiz : horiz;
  }

  function buildArrowSvg(width, height, config) {
    var W = Math.max(2, num(width, 100));
    var H = Math.max(2, num(height, 100));
    var c = normalize(config);

    var mL = c.marginLeft * W, mR = c.marginRight * W;
    var mT = c.marginTop * H,  mB = c.marginBottom * H;
    var iW = Math.max(2, W - mL - mR);
    var iH = Math.max(2, H - mT - mB);

    // Fit the shape inside the inner box while keeping its natural
    // aspect ratio. The shape is centered, no stretching applied.
    var aspect = naturalAspect(c);
    var iAspect = iW / iH;
    var fitW, fitH;
    if (iAspect > aspect) {
      fitH = iH;
      fitW = iH * aspect;
    } else {
      fitW = iW;
      fitH = iW / aspect;
    }
    var fitX = mL + (iW - fitW) / 2;
    var fitY = mT + (iH - fitH) / 2;

    var params = {
      bodyThickness: c.bodyThickness,
      headLength: c.headLength,
      headWidth: c.headWidth,
      cornerRadius: c.cornerRadius
    };

    var pathD = '', placement = '';
    switch (c.type) {
      case 'pentagon': {
        var p1 = dir4Placement(c.direction4, fitW, fitH);
        pathD = pentagonPath(p1.L, p1.B, params); placement = p1.transform; break;
      }
      case 'chevron': {
        var p2 = dir4Placement(c.direction4, fitW, fitH);
        pathD = chevronPath(p2.L, p2.B, params); placement = p2.transform; break;
      }
      case 'notched': {
        var p3 = dir4Placement(c.direction4, fitW, fitH);
        pathD = notchedPath(p3.L, p3.B, params); placement = p3.transform; break;
      }
      case 'two-way': {
        var p4 = twoWayPlacement(c.twoWayOrientation, fitW, fitH);
        pathD = twoWayPath(p4.L, p4.B, params); placement = p4.transform; break;
      }
      case 'four-way':
        pathD = fourWayPath(fitW, fitH, params); break;
      case 'elbow': {
        var p5 = elbowPlacement(c.elbowDirection, fitW, fitH);
        pathD = (p5.box === 'HW')
          ? elbowPath(fitH, fitW, params)
          : elbowPath(fitW, fitH, params);
        placement = p5.transform; break;
      }
      case 'curved': {
        var p6 = elbowPlacement(c.curvedDirection, fitW, fitH);
        pathD = (p6.box === 'HW')
          ? curvedPath(fitH, fitW, params)
          : curvedPath(fitW, fitH, params);
        placement = p6.transform; break;
      }
      case 'step': {
        var p7 = dir4Placement(c.direction4, fitW, fitH);
        pathD = stepPath(p7.L, p7.B, params); placement = p7.transform; break;
      }
      case 'striped': {
        var p8 = dir4Placement(c.direction4, fitW, fitH);
        pathD = stripedPath(p8.L, p8.B, params); placement = p8.transform; break;
      }
      case 'uturn': {
        var p9 = uturnPlacement(c.uturnDirection, fitW, fitH);
        pathD = uturnPath(p9.W, p9.H, params); placement = p9.transform; break;
      }
      default: {
        var p0 = dir4Placement(c.direction4, fitW, fitH);
        pathD = straightPath(p0.L, p0.B, params); placement = p0.transform;
      }
    }

    var fill, stroke, sw;
    if (c.style === 'outline') {
      fill = (c.backgroundColor !== 'transparent') ? c.backgroundColor : 'none';
      stroke = c.color;
      sw = Math.max(0.5, c.strokeWidth);
    } else {
      fill = c.color;
      stroke = 'none';
      sw = 0;
    }

    var parts = [];
    parts.push('<svg xmlns="http://www.w3.org/2000/svg" ' +
      'width="100%" height="100%" viewBox="0 0 ' + fmt(W) + ' ' + fmt(H) + '" ' +
      'preserveAspectRatio="xMidYMid meet" class="arrowind-svg" ' +
      'shape-rendering="geometricPrecision" ' +
      'role="img" aria-label="Arrow">');

    if (c.backgroundColor !== 'transparent' && c.style === 'filled') {
      parts.push('<rect x="0" y="0" width="' + fmt(W) + '" height="' +
        fmt(H) + '" fill="' + escAttr(c.backgroundColor) + '"/>');
    }

    parts.push('<g transform="translate(' + fmt(fitX) + ' ' + fmt(fitY) + ')">');
    parts.push(placement ? '<g transform="' + placement + '">' : '<g>');
    parts.push('<path d="' + pathD + '" ' +
      'fill="' + escAttr(fill) + '" ' +
      'stroke="' + escAttr(stroke) + '" ' +
      'stroke-width="' + fmt(sw) + '" ' +
      'stroke-linejoin="round" stroke-linecap="round" ' +
      'vector-effect="non-scaling-stroke" ' +
      'shape-rendering="geometricPrecision" ' +
      'fill-rule="evenodd"/>');
    parts.push('</g></g></svg>');

    return parts.join('');
  }

  return { buildArrowSvg: buildArrowSvg, normalize: normalize };
});
