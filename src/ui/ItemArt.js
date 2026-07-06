const INK = 0x34283a;
const CREAM = 0xfff4d6;
const GOLD = 0xf5c34d;

export function addItemArt(scene, id, x, y, scale = 1) {
  const g = scene.add.graphics();
  g.fillStyle(0x2c2232, 0.18).fillEllipse(0, 36, 92, 18);
  drawItem(g, id);
  const art = scene.add.container(x, y, [g]).setScale(scale);
  art.setSize(110, 110);
  return art;
}

function outline(g, width = 4, color = INK) {
  return g.lineStyle(width, color, 1);
}

function drawItem(g, id) {
  if (id === "partyHat") {
    g.fillStyle(0xec5966).fillTriangle(0, -47, -32, 28, 32, 28);
    outline(g).strokeTriangle(0, -47, -32, 28, 32, 28);
    g.fillStyle(GOLD).fillCircle(0, -49, 8);
    g.lineStyle(6, 0xffe26f).beginPath().moveTo(-20, 12).lineTo(16, -29).strokePath();
    g.fillStyle(0x65c7ba).fillCircle(-17, 5, 5).fillCircle(13, 14, 5).fillCircle(5, -15, 5);
  } else if (id === "crown") {
    g.fillStyle(GOLD).fillRect(-34, -8, 68, 37);
    g.fillTriangle(-34, -8, -29, -43, -10, -8).fillTriangle(-12, -8, 0, -51, 14, -8)
      .fillTriangle(12, -8, 31, -43, 34, -8);
    outline(g).strokeRect(-34, -8, 68, 37);
    g.fillStyle(0xf8e47f).fillRect(-28, 18, 56, 5);
    g.fillStyle(0xec5966).fillCircle(0, 8, 7);
    g.fillStyle(0x51b5c2).fillCircle(-20, 7, 5).fillCircle(20, 7, 5);
  } else if (id === "cowboy") {
    g.fillStyle(0x9b633d).fillEllipse(0, 22, 100, 25);
    g.fillRoundedRect(-30, -34, 60, 61, 18);
    outline(g).strokeEllipse(0, 22, 100, 25).strokeRoundedRect(-30, -34, 60, 61, 18);
    g.fillStyle(0xe5a35a).fillRect(-30, 5, 60, 10);
    g.fillStyle(0xffd66b).fillCircle(0, 10, 5);
  } else if (id === "beanie") {
    g.fillStyle(0x4b86c5).fillRoundedRect(-37, -24, 74, 59, 27);
    outline(g).strokeRoundedRect(-37, -24, 74, 59, 27);
    g.fillStyle(0x76b2e5).fillRoundedRect(-40, 15, 80, 21, 8);
    g.fillStyle(0xec5966).fillCircle(0, -35, 13);
    g.lineStyle(3, 0xcbe4f7, 0.55).beginPath().moveTo(-17, -18).lineTo(-17, 14)
      .moveTo(0, -23).lineTo(0, 14).moveTo(17, -18).lineTo(17, 14).strokePath();
  } else if (id === "witchHat") {
    g.fillStyle(0x60427f).fillTriangle(8, -55, -29, 20, 35, 20);
    g.fillEllipse(0, 25, 102, 24);
    outline(g).strokeTriangle(8, -55, -29, 20, 35, 20).strokeEllipse(0, 25, 102, 24);
    g.fillStyle(0xecb94d).fillRect(-21, 5, 53, 10);
    g.fillStyle(0xffef9c).fillCircle(13, -22, 5).fillCircle(-5, -2, 3);
  } else if (id === "vikingHat") {
    g.fillStyle(0x8293a0).fillRoundedRect(-36, -23, 72, 56, 25);
    outline(g).strokeRoundedRect(-36, -23, 72, 56, 25);
    g.fillStyle(0xe9dfc4).fillTriangle(-31, -8, -62, -38, -47, 7)
      .fillTriangle(31, -8, 62, -38, 47, 7);
    outline(g, 3).strokeTriangle(-31, -8, -62, -38, -47, 7)
      .strokeTriangle(31, -8, 62, -38, 47, 7);
    g.fillStyle(GOLD).fillCircle(0, 6, 8);
  } else if (id === "bowHat") {
    g.fillStyle(0xd9576d).fillEllipse(-25, 0, 51, 45).fillEllipse(25, 0, 51, 45);
    outline(g).strokeEllipse(-25, 0, 51, 45).strokeEllipse(25, 0, 51, 45);
    g.fillStyle(0xf48b99).fillCircle(0, 0, 15);
    g.fillTriangle(-6, 9, -24, 42, 2, 20).fillTriangle(6, 9, 24, 42, -2, 20);
  } else if (id === "sunHat") {
    g.fillStyle(0xf2c44f).fillEllipse(0, 20, 112, 32);
    g.fillRoundedRect(-34, -31, 68, 58, 29);
    outline(g).strokeEllipse(0, 20, 112, 32).strokeRoundedRect(-34, -31, 68, 58, 29);
    g.fillStyle(0xec5966).fillRect(-35, 2, 70, 10).fillCircle(28, 7, 10);
  } else if (id === "scratcher") {
    g.fillStyle(0x9a6542).fillRoundedRect(-45, 25, 90, 16, 7).fillRoundedRect(-38, -43, 76, 15, 7);
    g.fillStyle(0xc59a6c).fillRect(-8, -31, 16, 57);
    for (let y = -27; y < 24; y += 8) g.lineStyle(2, 0x866040).beginPath().moveTo(-8, y).lineTo(8, y + 4).strokePath();
    outline(g).strokeRoundedRect(-45, 25, 90, 16, 7).strokeRoundedRect(-38, -43, 76, 15, 7);
  } else if (id === "catbed") {
    g.fillStyle(0x8dcfd4).fillEllipse(0, 18, 100, 42);
    g.fillStyle(CREAM).fillCircle(-28, 5, 22).fillCircle(0, -4, 29).fillCircle(30, 6, 21);
    outline(g).strokeEllipse(0, 18, 100, 42);
    g.lineStyle(3, 0xb6e4e5).strokeCircle(0, -4, 19);
  } else if (id === "yarnbasket") {
    g.fillStyle(0x9d6747).fillRoundedRect(-44, -4, 88, 45, 11);
    outline(g).strokeRoundedRect(-44, -4, 88, 45, 11);
    [[-24, -16, 0x7d4b8a], [4, -22, 0xec6670], [28, -10, 0x55a7b6]].forEach(([x, y, color]) => {
      g.fillStyle(color).fillCircle(x, y, 19);
      g.lineStyle(2, CREAM, 0.55).beginPath().arc(x, y, 12, 0.2, 5.8).strokePath();
    });
    g.lineStyle(4, 0x76503b).beginPath().arc(0, 0, 36, Math.PI, 0).strokePath();
  } else if (id === "aquarium") {
    g.fillStyle(0x5bc0cf, 0.9).fillRoundedRect(-48, -36, 96, 71, 9);
    outline(g).strokeRoundedRect(-48, -36, 96, 71, 9);
    g.fillStyle(0xf2b84b).fillEllipse(2, -1, 31, 16).fillTriangle(-13, -1, -28, -12, -28, 10);
    g.fillStyle(0x3f8e62).fillTriangle(22, 31, 35, -3, 42, 31);
    g.fillStyle(0xffffff, 0.72).fillCircle(24, -20, 5).fillCircle(34, -31, 3);
  } else if (id === "windowseat") {
    g.fillStyle(0x9fd7df).fillRect(-40, -42, 80, 66);
    outline(g).strokeRect(-40, -42, 80, 66);
    g.lineStyle(4, CREAM).beginPath().moveTo(0, -42).lineTo(0, 24).moveTo(-40, -9).lineTo(40, -9).strokePath();
    g.fillStyle(0x6f96b5).fillRoundedRect(-52, 19, 104, 24, 10);
    outline(g).strokeRoundedRect(-52, 19, 104, 24, 10);
  } else if (id === "catbridge") {
    g.fillStyle(0xa66f45).fillRoundedRect(-53, 18, 42, 13, 5).fillRoundedRect(-20, -4, 42, 13, 5)
      .fillRoundedRect(12, -26, 42, 13, 5);
    g.lineStyle(4, 0x704832).beginPath().moveTo(-48, 18).lineTo(-15, -4).lineTo(18, -26)
      .moveTo(-13, 31).lineTo(20, 9).lineTo(52, -13).strokePath();
  } else if (id === "velvetsofa") {
    g.fillStyle(0x744a7f).fillRoundedRect(-50, -15, 100, 54, 15);
    g.fillStyle(0x93659b).fillRoundedRect(-43, 2, 41, 28, 8).fillRoundedRect(2, 2, 41, 28, 8);
    outline(g).strokeRoundedRect(-50, -15, 100, 54, 15);
    g.fillStyle(GOLD).fillCircle(-34, 3, 3).fillCircle(34, 3, 3);
  } else if (id === "wallpaper") {
    g.fillStyle(0xe9a4a8).fillRoundedRect(-38, -46, 76, 82, 8);
    outline(g).strokeRoundedRect(-38, -46, 76, 82, 8);
    for (let x = -22; x <= 22; x += 22) for (let y = -28; y <= 20; y += 24) {
      g.fillStyle(0xffe4cf, 0.8).fillCircle(x, y + 5, 6).fillCircle(x - 6, y, 3).fillCircle(x + 6, y, 3);
    }
    g.fillStyle(0xc4777f).fillEllipse(38, -3, 20, 81);
  } else {
    drawGear(g, id);
  }
}

function drawGear(g, id) {
  if (id === "helmetBoost") {
    g.fillStyle(GOLD).fillRoundedRect(-39, -32, 78, 62, 31);
    outline(g).strokeRoundedRect(-39, -32, 78, 62, 31);
    g.fillStyle(0xf7e78b).fillRoundedRect(-46, 20, 92, 15, 7);
    g.lineStyle(5, 0xa66c2b).beginPath().moveTo(0, -31).lineTo(0, 18).strokePath();
  } else if (id === "bananaBoost") {
    g.lineStyle(20, 0xffd34d).beginPath().arc(0, -7, 40, 0.1, 2.7).strokePath();
    g.lineStyle(4, INK).beginPath().arc(0, -7, 40, 0.1, 2.7).strokePath();
    g.fillStyle(0x6e4a2b).fillCircle(39, -5, 5).fillCircle(-36, 10, 5);
  } else if (id === "magnetBoost") {
    g.lineStyle(22, 0xe65e67).beginPath().arc(0, 1, 35, Math.PI, Math.PI * 2).strokePath();
    g.fillStyle(0xdce5e8).fillRoundedRect(-46, -2, 23, 39, 5).fillRoundedRect(23, -2, 23, 39, 5);
    outline(g).strokeRoundedRect(-46, -2, 23, 39, 5).strokeRoundedRect(23, -2, 23, 39, 5);
  } else {
    g.fillStyle(0x784a87).fillCircle(0, 0, 42);
    outline(g).strokeCircle(0, 0, 42);
    g.lineStyle(4, 0xc98ad3).beginPath().arc(0, 0, 29, 0.2, 5.9)
      .moveTo(-25, -22).lineTo(27, 25).moveTo(-35, 3).lineTo(34, -12).strokePath();
    g.fillStyle(0xffe584).fillTriangle(37, -42, 43, -28, 56, -23)
      .fillTriangle(56, -23, 43, -18, 37, -5).fillTriangle(37, -5, 32, -18, 20, -23)
      .fillTriangle(20, -23, 32, -29, 37, -42);
  }
}
