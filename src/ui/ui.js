import { toggleFullscreen } from "../systems/FullscreenManager.js";

export const COLORS = {
  ink: 0x2f2335,
  cream: 0xfff7df,
  yellow: 0xffcc4d,
  orange: 0xf77f4a,
  coral: 0xec5966,
  teal: 0x41b9ad,
  blue: 0x3f77c8,
  purple: 0x6f4c89,
  muted: 0x8d8091
};

export function textStyle(size = 28, color = "#2f2335", extra = {}) {
  return {
    fontFamily: '"Baloo 2", "Arial Rounded MT Bold", sans-serif',
    fontSize: `${size}px`,
    fontStyle: "bold",
    color,
    ...extra
  };
}

export function pill(scene, x, y, width, height, label, options = {}) {
  const fill = options.fill ?? COLORS.cream;
  const deepShadow = scene.add.rectangle(0, 10, width + 4, height + 2, 0x1d1422, 0.2).setOrigin(0.5);
  const shadow = scene.add.rectangle(0, 6, width, height, 0x2f2335, 0.28).setOrigin(0.5);
  const bg = scene.add.rectangle(0, 0, width, height, fill, 1).setOrigin(0.5);
  bg.setStrokeStyle(options.strokeWidth ?? 4, options.stroke ?? COLORS.ink, 1);
  const gloss = scene.add.rectangle(0, -height * 0.25, width - 12, Math.max(4, height * 0.18), 0xffffff, 0.16).setOrigin(0.5);
  const labelText = scene.add.text(0, 1, label, textStyle(options.size ?? 26, options.color ?? "#2f2335"))
    .setOrigin(0.5);
  const container = scene.add.container(x, y, [deepShadow, shadow, bg, gloss, labelText]);
  container.setSize(width, height).setInteractive({ useHandCursor: true });
  container.on("pointerover", () => {
    scene.tweens.add({ targets: container, scaleX: 1.04, scaleY: 1.04, duration: 100 });
    bg.setFillStyle(options.hover ?? 0xffffff);
  });
  container.on("pointerout", () => {
    scene.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
    bg.setFillStyle(fill);
  });
  container.on("pointerdown", () => {
    scene.tweens.add({ targets: container, scaleX: 0.96, scaleY: 0.96, yoyo: true, duration: 80 });
  });
  container.bg = bg;
  container.label = labelText;
  return container;
}

export function iconButton(scene, x, y, icon, label, fill, action) {
  const button = pill(scene, x, y, 210, 78, "", { fill, hover: 0xffffff });
  const iconText = scene.add.text(-70, 0, icon, textStyle(34)).setOrigin(0.5);
  const labelText = scene.add.text(20, 1, label, textStyle(24)).setOrigin(0.5);
  button.add([iconText, labelText]);
  button.on("pointerup", action);
  return button;
}

export function topBar(scene, title, onBack) {
  const shadow = scene.add.rectangle(0, 88, 1280, 12, COLORS.ink, 0.2).setOrigin(0);
  const panel = scene.add.rectangle(0, 0, 1280, 92, COLORS.cream, 0.94).setOrigin(0);
  const highlight = scene.add.rectangle(0, 0, 1280, 5, 0xffffff, 0.7).setOrigin(0);
  panel.setStrokeStyle(0);
  const elements = [shadow, panel, highlight];
  if (onBack) {
    const back = pill(scene, 58, 46, 76, 58, "←", { fill: COLORS.yellow, size: 34 });
    back.on("pointerup", onBack);
    elements.push(back);
  }
  const fullscreen = pill(scene, 1035, 46, 66, 54, "⛶", { fill: COLORS.yellow, size: 25 });
  fullscreen.on("pointerup", () => toggleFullscreen(scene));
  elements.push(fullscreen);
  elements.push(scene.add.text(onBack ? 110 : 48, 49, title, textStyle(34)).setOrigin(0, 0.5));
  return elements;
}

export function coinBadge(scene, x = 1160, y = 46) {
  const shadow = scene.add.rectangle(x, y + 6, 174, 58, 0x130e18, 0.28).setOrigin(0.5);
  const bg = scene.add.rectangle(x, y, 170, 56, COLORS.ink, 0.92).setOrigin(0.5);
  bg.setStrokeStyle(3, COLORS.cream);
  scene.add.rectangle(x, y - 20, 158, 5, 0xffffff, 0.12).setOrigin(0.5);
  const coin = scene.add.image(x - 53, y, "coin").setScale(0.52);
  const label = scene.add.text(x + 18, y + 1, "0", textStyle(26, "#fff7df")).setOrigin(0.5);
  const setValue = (value) => label.setText(String(value));
  return { shadow, bg, coin, label, setValue };
}

export function addPaperTexture(scene) {
  const graphics = scene.add.graphics().setDepth(58).setScrollFactor(0);
  graphics.fillStyle(0xffffff, 0.022);
  for (let i = 0; i < 115; i += 1) {
    graphics.fillCircle(Phaser.Math.Between(0, 1280), Phaser.Math.Between(0, 720), Phaser.Math.Between(1, 2));
  }
  graphics.lineStyle(1, 0xffffff, 0.014);
  for (let y = 12; y < 720; y += 19) graphics.beginPath().moveTo(0, y).lineTo(1280, y + 4).strokePath();
  graphics.fillStyle(0x1f1527, 0.045).fillRect(0, 0, 1280, 9).fillRect(0, 711, 1280, 9)
    .fillRect(0, 0, 9, 720).fillRect(1271, 0, 9, 720);
  return graphics;
}

export function sound(scene, kind = "coin") {
  if (!scene.registry.get("save")?.sound) return;
  const context = scene.sound?.context;
  if (!context) return;
  if (context.state === "suspended") context.resume();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;
  const map = {
    coin: [880, 0.08, "sine"],
    jump: [330, 0.12, "triangle"],
    cane: [520, 0.11, "square"],
    crash: [120, 0.18, "sawtooth"],
    treat: [660, 0.25, "sine"],
    win: [740, 0.4, "triangle"],
    buy: [460, 0.2, "sine"],
    meow: [470, 0.34, "sawtooth"],
    purr: [92, 0.42, "square"],
    boss: [330, 0.55, "triangle"],
    land: [145, 0.12, "triangle"],
    skate: [230, 0.06, "square"]
  };
  const [frequency, duration, type] = map[kind] || map.coin;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  if (kind === "jump") oscillator.frequency.exponentialRampToValueAtTime(520, now + duration);
  if (kind === "win") oscillator.frequency.exponentialRampToValueAtTime(1100, now + duration);
  if (kind === "meow") {
    oscillator.frequency.linearRampToValueAtTime(720, now + duration * 0.45);
    oscillator.frequency.exponentialRampToValueAtTime(360, now + duration);
  }
  if (kind === "boss") oscillator.frequency.exponentialRampToValueAtTime(880, now + duration);
  gain.gain.setValueAtTime(kind === "purr" ? 0.018 : 0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}
