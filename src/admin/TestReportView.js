import { COLORS, textStyle } from "../ui/ui.js";

export class TestReportView {
  constructor(scene) {
    this.scene = scene;
  }

  render(report, x = 640, y = 390, width = 980, height = 330) {
    const scene = this.scene;
    const parts = [];
    const panel = scene.add.rectangle(x, y, width, height, 0xffffff, 0.55).setStrokeStyle(4, COLORS.ink, 0.45);
    parts.push(panel);
    if (!report) {
      parts.push(scene.add.text(x, y, "No test report yet.", textStyle(22, "#725f72")).setOrigin(0.5));
      return parts;
    }
    const color = report.summary === "failed" ? "#ec5966" : report.summary === "warning" ? "#b7831f" : "#29997d";
    parts.push(scene.add.text(x - width / 2 + 28, y - height / 2 + 22, `REPORT · ${report.summary.toUpperCase()} · ${report.levelCount} LEVELS`, textStyle(22, color)).setOrigin(0));
    const columns = [
      ["Critical Issues", report.critical.slice(0, 4), "#ec5966", x - 348],
      ["Warnings", report.warnings.slice(0, 4), "#b7831f", x - 65],
      ["Passed Checks", report.passed.slice(0, 4), "#29997d", x + 218]
    ];
    columns.forEach(([title, list, textColor, colX]) => {
      parts.push(scene.add.text(colX, y - 104, title, textStyle(16, textColor)).setOrigin(0));
      const lines = list.length ? list.map((item) => this.line(item)) : ["None"];
      parts.push(scene.add.text(colX, y - 76, lines.join("\n"), textStyle(11, "#443546", {
        wordWrap: { width: 255 },
        lineSpacing: 3
      })).setOrigin(0));
    });
    parts.push(scene.add.text(x - width / 2 + 28, y + height / 2 - 88, "Suggested Next Fixes", textStyle(16, "#2f2335")).setOrigin(0));
    const fixes = report.fixes.length
      ? report.fixes.map((item) => `${item.levelId ? `L${item.levelId}: ` : ""}${item.system} -> ${item.fix}`)
      : ["No next fix needed."];
    parts.push(scene.add.text(x - width / 2 + 28, y + height / 2 - 58, fixes.join("\n"), textStyle(11, "#5d4c60", {
      wordWrap: { width: width - 56 },
      lineSpacing: 3
    })).setOrigin(0));
    return parts;
  }

  line(item) {
    const level = item.levelId ? `L${item.levelId}: ` : "";
    return `${level}${item.system} - ${item.description}`;
  }
}
