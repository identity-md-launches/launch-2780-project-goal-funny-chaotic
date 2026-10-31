import type { Outfit } from "./outfits.ts";
import { isObstacle, type Runner, type EntityKind } from "./engine.ts";

type Ctx = CanvasRenderingContext2D;
const INK = "#29372c";
const FUR = "#d7a16a";
const CREAM = "#fff0d8";

function ellipse(
  c: Ctx,
  x: number,
  y: number,
  rx: number,
  ry: number,
  fill: string,
  stroke = true,
) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
  if (stroke) c.stroke();
}
function path(c: Ctx, points: number[][], fill?: string) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  if (fill) {
    c.closePath();
    c.fillStyle = fill;
    c.fill();
  }
  c.stroke();
}
function rect(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  color: string,
) {
  c.beginPath();
  c.roundRect(x, y, w, h, radius);
  c.fillStyle = color;
  c.fill();
  c.stroke();
}

export function drawHead(c: Ctx, id: Outfit["head"]) {
  c.save();
  c.lineWidth = 3;
  c.strokeStyle = INK;
  c.lineJoin = "round";
  switch (id) {
    case "sunglasses":
      rect(c, -48, -129, 43, 25, 7, INK);
      rect(c, 5, -129, 43, 25, 7, INK);
      path(c, [
        [-6, -122],
        [6, -122],
      ]);
      c.strokeStyle = "#fff9e8";
      c.lineWidth = 3;
      path(c, [
        [-38, -121],
        [-29, -114],
      ]);
      path(c, [
        [15, -121],
        [24, -114],
      ]);
      break;
    case "cooker":
      rect(c, -53, -174, 106, 35, 9, "#b8c6c1");
      rect(c, -68, -168, 16, 10, 3, INK);
      rect(c, 52, -168, 16, 10, 3, INK);
      ellipse(c, 0, -174, 56, 10, "#e5eee5");
      rect(c, -12, -190, 24, 11, 4, INK);
      c.strokeStyle = "#627369";
      c.lineWidth = 2;
      path(c, [
        [-36, -163],
        [-36, -149],
      ]);
      path(c, [
        [-27, -163],
        [-27, -149],
      ]);
      c.strokeStyle = INK;
      path(c, [
        [35, -184],
        [35, -194],
      ]);
      ellipse(c, 35, -196, 5, 3, "#ed997c");
      break;
    case "cone":
      path(
        c,
        [
          [-36, -147],
          [0, -215],
          [36, -147],
        ],
        "#f08e59",
      );
      path(
        c,
        [
          [-23, -173],
          [23, -173],
          [15, -188],
          [-15, -188],
        ],
        CREAM,
      );
      rect(c, -47, -150, 94, 12, 4, "#ed8857");
      break;
    case "banana":
      c.beginPath();
      c.moveTo(-4, -182);
      c.quadraticCurveTo(-14, -146, -58, -127);
      c.quadraticCurveTo(-54, -166, -4, -182);
      c.fillStyle = "#f7d85e";
      c.fill();
      c.stroke();
      c.beginPath();
      c.moveTo(-4, -182);
      c.quadraticCurveTo(12, -141, 59, -132);
      c.quadraticCurveTo(38, -171, -4, -182);
      c.fill();
      c.stroke();
      path(
        c,
        [
          [-4, -182],
          [0, -139],
          [18, -153],
        ],
        "#fff3aa",
      );
      rect(c, -9, -194, 10, 15, 2, "#9b7e42");
      break;
    case "dunce":
      path(
        c,
        [
          [-42, -144],
          [4, -216],
          [42, -144],
        ],
        "#c6b6ef",
      );
      c.fillStyle = INK;
      c.font = "bold 26px sans-serif";
      c.textAlign = "center";
      c.fillText("D", 2, -158);
      break;
    case "crown":
      path(
        c,
        [
          [-36, -145],
          [-40, -179],
          [-17, -166],
          [0, -190],
          [17, -166],
          [40, -179],
          [35, -145],
        ],
        "#f4ce5d",
      );
      ellipse(c, 0, -157, 5, 5, "#ec8b7a");
      break;
    case "vr":
      rect(c, -57, -131, 114, 32, 9, INK);
      rect(c, -47, -137, 94, 43, 12, "#bcb2df");
      rect(c, -35, -127, 70, 24, 7, "#475b59");
      c.strokeStyle = "#c8f0e9";
      path(c, [
        [-24, -119],
        [-10, -108],
      ]);
      break;
  }
  c.restore();
}

export function drawHand(c: Ctx, id: Outfit["hand"]) {
  c.save();
  c.strokeStyle = INK;
  c.lineWidth = 3;
  c.lineCap = "round";
  c.lineJoin = "round";
  switch (id) {
    case "sword":
      rect(c, -5, -12, 10, 30, 3, "#ba8b65");
      rect(c, -20, -22, 40, 9, 3, "#efc963");
      path(
        c,
        [
          [-9, -23],
          [-9, -91],
          [0, -106],
          [9, -91],
          [9, -23],
        ],
        "#d2e3dd",
      );
      break;
    case "watergun":
      rect(c, -8, -40, 16, 58, 4, "#af9ad7");
      rect(c, -26, -65, 75, 29, 6, "#8ecfc2");
      rect(c, -22, -80, 40, 16, 6, "#f2d96e");
      rect(c, 43, -61, 14, 21, 2, "#ef9875");
      break;
    case "brush":
      rect(c, -5, -66, 10, 85, 4, "#9ac8c3");
      ellipse(c, 0, -80, 20, 27, "#fff4de");
      c.lineWidth = 2;
      for (let i = -1; i <= 1; i++)
        path(c, [
          [i * 10, -100],
          [i * 11 + 2, -62],
        ]);
      break;
    case "plunger":
      rect(c, -5, -77, 10, 95, 4, "#d6af7f");
      c.beginPath();
      c.moveTo(-28, -76);
      c.bezierCurveTo(-24, -111, 24, -111, 28, -76);
      c.closePath();
      c.fillStyle = "#ed947f";
      c.fill();
      c.stroke();
      rect(c, -33, -78, 66, 10, 3, "#ea8a76");
      break;
    case "spoon":
      rect(c, -5, -62, 10, 80, 4, "#b6c9c8");
      ellipse(c, 0, -87, 23, 32, "#dce8e1");
      ellipse(c, 0, -90, 14, 22, "#bdceca", false);
      break;
    case "chicken":
      ellipse(c, 0, -38, 17, 32, "#f5d866");
      rect(c, -7, -82, 14, 32, 5, "#f5d866");
      ellipse(c, 0, -87, 13, 16, "#f5d866");
      path(
        c,
        [
          [8, -90],
          [24, -85],
          [10, -80],
        ],
        "#ed9277",
      );
      ellipse(c, 3, -92, 2, 2, INK);
      path(c, [
        [-8, -10],
        [-13, 9],
        [-22, 9],
      ]);
      path(c, [
        [6, -10],
        [11, 9],
        [20, 9],
      ]);
      c.strokeStyle = "#bc6552";
      path(c, [
        [-9, -102],
        [-12, -111],
        [-4, -106],
        [2, -113],
        [6, -103],
      ]);
      break;
    case "selfie":
      rect(c, -4, -88, 8, 108, 3, "#afbdba");
      rect(c, -21, -128, 42, 56, 6, "#ad9acf");
      rect(c, -15, -119, 30, 36, 2, "#d7ebd7");
      ellipse(c, 0, -78, 2, 2, INK);
      break;
    case "saber":
      rect(c, -8, -20, 16, 40, 4, "#7e9188");
      rect(c, -6, -117, 12, 97, 6, "#b9f27c");
      c.strokeStyle = CREAM;
      c.lineWidth = 3;
      path(c, [
        [0, -109],
        [0, -28],
      ]);
      break;
  }
  c.restore();
}

export function drawHamster(
  c: Ctx,
  x: number,
  y: number,
  scale: number,
  outfit: Outfit,
  stride = 0,
  jump = 0,
  crashed = false,
) {
  c.save();
  c.translate(x, y - jump * scale * 70);
  c.scale(scale, scale);
  if (crashed) c.rotate(-0.32);
  c.strokeStyle = INK;
  c.lineWidth = 3;
  c.lineJoin = "round";
  c.lineCap = "round";
  if (outfit.extra === "cape")
    path(
      c,
      [
        [-24, -99],
        [-95 - stride * 8, -23],
        [21, -13],
        [33, -95],
      ],
      "#b2a0d8",
    );
  if (outfit.extra === "rocket") {
    rect(c, -65, -92, 27, 67, 12, "#a2bcb5");
    path(
      c,
      [
        [-63, -27],
        [-52, 16 + Math.abs(stride) * 12],
        [-41, -27],
      ],
      "#efb36b",
    );
    path(
      c,
      [
        [-62, -92],
        [-52, -112],
        [-41, -92],
      ],
      "#ee9c86",
    );
  }
  ellipse(c, -32, -8 + stride * 5, 24, 10, "#ecc9a0");
  ellipse(c, 34, -8 - stride * 5, 24, 10, "#ecc9a0");
  ellipse(c, 0, -59, 58, 58, FUR);
  ellipse(c, 0, -49, 40, 45, CREAM, false);
  ellipse(c, -45, -144, 23, 23, FUR);
  ellipse(c, 45, -144, 23, 23, FUR);
  ellipse(c, -45, -144, 13, 13, "#e9aa98", false);
  ellipse(c, 45, -144, 13, 13, "#e9aa98", false);
  c.beginPath();
  c.moveTo(-59, -111);
  c.bezierCurveTo(-58, -162, 57, -162, 59, -111);
  c.bezierCurveTo(81, -67, 40, -57, 0, -60);
  c.bezierCurveTo(-40, -57, -81, -67, -59, -111);
  c.fillStyle = "#e6b57f";
  c.fill();
  c.stroke();
  ellipse(c, -22, -86, 29, 23, CREAM, false);
  ellipse(c, 22, -86, 29, 23, CREAM, false);
  ellipse(c, -47, -92, 12, 7, "#e9a190", false);
  ellipse(c, 47, -92, 12, 7, "#e9a190", false);
  if (crashed) {
    path(c, [
      [-29, -122],
      [-17, -109],
    ]);
    path(c, [
      [-29, -109],
      [-17, -122],
    ]);
    path(c, [
      [17, -122],
      [29, -109],
    ]);
    path(c, [
      [17, -109],
      [29, -122],
    ]);
  } else {
    ellipse(c, -23, -116, 5, 7, INK, false);
    ellipse(c, 23, -116, 5, 7, INK, false);
    ellipse(c, -24, -119, 1.7, 2, "#ffffff", false);
    ellipse(c, 22, -119, 1.7, 2, "#ffffff", false);
  }
  path(
    c,
    [
      [-7, -96],
      [7, -96],
      [0, -90],
    ],
    "#d1847b",
  );
  c.beginPath();
  c.moveTo(0, -90);
  c.lineTo(0, -85);
  c.quadraticCurveTo(-10, -77, -14, -86);
  c.moveTo(0, -85);
  c.quadraticCurveTo(10, -77, 14, -86);
  c.stroke();
  rect(c, -5, -81, 10, 11, 2, CREAM);
  path(c, [
    [0, -81],
    [0, -70],
  ]);
  c.lineWidth = 2;
  path(c, [
    [-38, -91],
    [-72, -99],
  ]);
  path(c, [
    [-40, -84],
    [-70, -82],
  ]);
  path(c, [
    [38, -91],
    [72, -99],
  ]);
  path(c, [
    [40, -84],
    [70, -82],
  ]);
  c.lineWidth = 3;
  ellipse(c, -48, -47, 13, 22, "#e6b57f");
  c.save();
  c.translate(61, -48);
  c.rotate(0.22 + stride * 0.05);
  drawHand(c, outfit.hand);
  c.restore();
  ellipse(c, 49, -46, 14, 15, "#ecc9a0");
  drawHead(c, outfit.head);
  if (outfit.extra === "mustache") {
    c.beginPath();
    c.moveTo(0, -89);
    c.bezierCurveTo(-12, -103, -19, -77, -30, -92);
    c.bezierCurveTo(-28, -65, -5, -75, 0, -82);
    c.bezierCurveTo(5, -75, 28, -65, 30, -92);
    c.bezierCurveTo(19, -77, 12, -103, 0, -89);
    c.fillStyle = INK;
    c.fill();
  }
  if (outfit.extra === "googly") {
    ellipse(c, -25, -118, 16, 17, "#fff");
    ellipse(c, 25, -118, 16, 17, "#fff");
    ellipse(c, -24 + stride * 4, -113, 6, 7, INK, false);
    ellipse(c, 20 - stride * 4, -119, 6, 7, INK, false);
  }
  c.restore();
}

export function drawItem(
  c: Ctx,
  kind: EntityKind,
  x: number,
  y: number,
  scale: number,
) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  c.lineWidth = 2.5;
  c.strokeStyle = INK;
  switch (kind) {
    case "seed":
      c.rotate(0.4);
      c.beginPath();
      c.moveTo(0, -21);
      c.bezierCurveTo(-25, 0, -14, 23, 0, 21);
      c.bezierCurveTo(14, 23, 25, 0, 0, -21);
      c.fillStyle = "#e8c98b";
      c.fill();
      c.stroke();
      path(c, [
        [0, -13],
        [0, 14],
      ]);
      break;
    case "coin":
      ellipse(c, 0, 0, 21, 23, "#f7d66a");
      ellipse(c, 0, 0, 14, 16, "#f7d66a");
      c.font = "bold 21px sans-serif";
      c.fillStyle = INK;
      c.textAlign = "center";
      c.fillText("S", 0, 8);
      break;
    case "sock":
      path(
        c,
        [
          [-11, -22],
          [10, -22],
          [10, 2],
          [26, 8],
          [20, 23],
          [-9, 15],
        ],
        "#b5a4dc",
      );
      path(c, [
        [-10, -12],
        [10, -12],
      ]);
      break;
    case "cone":
      path(
        c,
        [
          [-22, 18],
          [0, -31],
          [22, 18],
        ],
        "#f09a68",
      );
      path(
        c,
        [
          [-13, -2],
          [13, -2],
          [8, -13],
          [-8, -13],
        ],
        CREAM,
      );
      rect(c, -29, 17, 58, 9, 3, "#e98c61");
      break;
    case "poop":
      ellipse(c, 0, 14, 27, 12, "#aa7a5c");
      ellipse(c, 0, 2, 20, 11, "#aa7a5c");
      ellipse(c, 1, -8, 12, 10, "#aa7a5c");
      c.beginPath();
      c.moveTo(-8, -13);
      c.quadraticCurveTo(3, -18, 0, -29);
      c.quadraticCurveTo(21, -15, 9, -11);
      c.fillStyle = "#aa7a5c";
      c.fill();
      c.stroke();
      ellipse(c, -8, 7, 4, 5, CREAM);
      ellipse(c, 8, 7, 4, 5, CREAM);
      break;
    case "toaster":
      rect(c, -17, -37, 30, 27, 7, "#edd3a5");
      rect(c, -28, -18, 56, 44, 8, "#bacac4");
      path(c, [
        [-17, -14],
        [16, -14],
      ]);
      rect(c, 25, -8, 9, 6, 2, INK);
      ellipse(c, 0, 8, 7, 7, "#e5a187");
      break;
  }
  c.restore();
}

export function drawScene(
  c: Ctx,
  w: number,
  h: number,
  runner: Runner,
  outfit: Outfit,
  reducedMotion: boolean,
) {
  c.clearRect(0, 0, w, h);
  c.fillStyle = "#e8eddf";
  c.fillRect(0, 0, w, h);
  const ready = runner.phase === "ready";
  // A small hand-drawn exercise room, all artwork generated locally.
  c.fillStyle = "#dde5d5";
  c.fillRect(0, h * 0.63, w, h * 0.37);
  c.strokeStyle = "#bcc9b4";
  c.lineWidth = 1.5;
  path(c, [
    [0, h * 0.63],
    [w, h * 0.63],
  ]);
  const cx = w / 2,
    cy = h * 0.48,
    radius = Math.min(w * 0.37, h * 0.46);
  c.save();
  c.translate(cx, cy);
  c.strokeStyle = "#68836e";
  c.lineWidth = 13;
  ellipse(c, 0, 0, radius, radius, "#c9d5be");
  c.lineWidth = 3;
  c.strokeStyle = "#a4b99c";
  ellipse(c, 0, 0, radius - 20, radius - 20, "#dce6d0");
  c.save();
  c.rotate(reducedMotion || ready ? -0.2 : runner.distance * 0.025);
  for (let i = 0; i < 16; i++) {
    c.rotate(Math.PI / 8);
    path(c, [
      [0, radius - 21],
      [0, radius - 3],
    ]);
  }
  c.restore();
  c.strokeStyle = "#9cb391";
  c.lineWidth = 4;
  path(c, [
    [-radius * 0.7, radius * 0.68],
    [radius * 0.7, -radius * 0.68],
  ]);
  path(c, [
    [radius * 0.7, radius * 0.68],
    [-radius * 0.7, -radius * 0.68],
  ]);
  ellipse(c, 0, 0, 12, 12, "#c8d8bf");
  c.restore();
  if (ready) {
    c.strokeStyle = "#acbba4";
    c.lineWidth = 2;
    ellipse(c, cx, h * 0.76, Math.min(w * 0.24, 145), 13, "#c4d1ba", false);
    drawHamster(c, cx, h * 0.76, Math.min(w / 360, h / 300) * 0.92, outfit);
    const s = Math.min(w / 720, 1);
    drawItem(c, "seed", w * 0.12, h * 0.75, s * 0.9);
    drawItem(c, "coin", w * 0.87, h * 0.42, s * 0.9);
    drawItem(c, "sock", w * 0.13, h * 0.31, s * 0.8);
    c.save();
    c.translate(w * 0.83, h * 0.75);
    c.rotate(-0.15);
    drawItem(c, "cone", 0, 0, s);
    c.restore();
    return;
  }
  // Three-lane running belt. Depth and speed are shared with collision coordinates.
  c.fillStyle = "#cbd6bd";
  c.beginPath();
  c.moveTo(cx - w * 0.1, h * 0.28);
  c.lineTo(cx + w * 0.1, h * 0.28);
  c.lineTo(w * 0.98, h);
  c.lineTo(w * 0.02, h);
  c.fill();
  const projection = (lane: number, z: number) => ({
    x: cx + (lane - 1) * w * (0.065 + 0.245 * z),
    y: h * (0.28 + 0.67 * z),
    scale: 0.25 + z * 0.9,
  });
  c.strokeStyle = "#a5b79b";
  c.lineWidth = 2;
  for (const lane of [0.5, 1.5]) {
    const a = projection(lane, 0),
      b = projection(lane, 1.1);
    path(c, [
      [a.x, a.y],
      [b.x, b.y],
    ]);
  }
  for (let i = 0; i < 9; i++) {
    const z = (i / 9 + (reducedMotion ? 0 : runner.distance * 0.012)) % 1;
    const left = projection(-0.5, z),
      right = projection(2.5, z);
    c.strokeStyle = "#b4c3aa";
    path(c, [
      [left.x, left.y],
      [right.x, right.y],
    ]);
  }
  for (const e of [...runner.entities].sort((a, b) => a.z - b.z)) {
    if (e.hit && !isObstacle(e.kind)) continue;
    const p = projection(e.lane, e.z);
    drawItem(c, e.kind, p.x, p.y, p.scale * Math.min(w / 400, 1.2));
  }
  const p = projection(runner.visualLane, 0.84);
  ellipse(c, p.x, p.y + 8, 31, 8, "#aebfa0", false);
  const stride =
    reducedMotion || runner.phase !== "running"
      ? 0
      : Math.sin(runner.elapsed * 19);
  drawHamster(
    c,
    p.x,
    p.y,
    Math.min(w / 480, h / 440) * 0.8,
    outfit,
    stride,
    runner.jump,
    runner.phase === "over",
  );
  if (runner.phase === "over") {
    c.save();
    const x = Math.min(w - 90, Math.max(10, p.x + 18));
    const y = p.y - Math.min(w / 480, h / 440) * 155;
    c.strokeStyle = INK;
    c.lineWidth = 2;
    rect(c, x, y, 76, 34, 10, "#f1b49d");
    c.fillStyle = INK;
    c.font = "600 20px Fredoka, sans-serif";
    c.textAlign = "center";
    c.fillText("bonk!", x + 38, y + 24);
    c.restore();
  }
}
