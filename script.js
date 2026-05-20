const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");

const dom = {
  tabs: [...document.querySelectorAll(".tab-button")],
  panels: [...document.querySelectorAll(".tab-panel")],
  titleInput: document.getElementById("titleInput"),
  subtitleInput: document.getElementById("subtitleInput"),
  buttonLabelInput: document.getElementById("buttonLabelInput"),
  hubLabelInput: document.getElementById("hubLabelInput"),
  itemsInput: document.getElementById("itemsInput"),
  quickItemInput: document.getElementById("quickItemInput"),
  addItemButton: document.getElementById("addItemButton"),
  loadSampleButton: document.getElementById("loadSampleButton"),
  clearItemsButton: document.getElementById("clearItemsButton"),
  bgStartInput: document.getElementById("bgStartInput"),
  bgEndInput: document.getElementById("bgEndInput"),
  surfaceInput: document.getElementById("surfaceInput"),
  textColorInput: document.getElementById("textColorInput"),
  rimColorInput: document.getElementById("rimColorInput"),
  pointerColorInput: document.getElementById("pointerColorInput"),
  hubColorInput: document.getElementById("hubColorInput"),
  accentColorInput: document.getElementById("accentColorInput"),
  patternSelect: document.getElementById("patternSelect"),
  paletteModeSelect: document.getElementById("paletteModeSelect"),
  paletteInput: document.getElementById("paletteInput"),
  randomizePaletteButton: document.getElementById("randomizePaletteButton"),
  spinDurationInput: document.getElementById("spinDurationInput"),
  wheelSizeInput: document.getElementById("wheelSizeInput"),
  textSizeInput: document.getElementById("textSizeInput"),
  rimWidthInput: document.getElementById("rimWidthInput"),
  pointerSizeInput: document.getElementById("pointerSizeInput"),
  panelRadiusInput: document.getElementById("panelRadiusInput"),
  spinDurationValue: document.getElementById("spinDurationValue"),
  wheelSizeValue: document.getElementById("wheelSizeValue"),
  textSizeValue: document.getElementById("textSizeValue"),
  rimWidthValue: document.getElementById("rimWidthValue"),
  pointerSizeValue: document.getElementById("pointerSizeValue"),
  panelRadiusValue: document.getElementById("panelRadiusValue"),
  previewTitle: document.getElementById("previewTitle"),
  previewSubtitle: document.getElementById("previewSubtitle"),
  spinButton: document.getElementById("spinButton"),
  hubButton: document.getElementById("hubButton"),
  resultValue: document.getElementById("resultValue"),
  resultMeta: document.getElementById("resultMeta"),
  entryCount: document.getElementById("entryCount"),
  itemsPreview: document.getElementById("itemsPreview"),
  swatchRow: document.getElementById("swatchRow"),
  themeSummary: document.getElementById("themeSummary"),
  summaryDuration: document.getElementById("summaryDuration"),
  summaryPattern: document.getElementById("summaryPattern"),
  summarySegments: document.getElementById("summarySegments"),
  summaryWheelSize: document.getElementById("summaryWheelSize"),
};

const state = {
  rotation: 0,
  isSpinning: false,
  selectedLabel: "",
  spinConfig: null,
  frameId: null,
};

const defaultItems = [
  "Study",
  "Play Game",
  "Watch Youtube",
  "Go Outside",
  "Call a Friend",
  "Relax",
];

const defaultPalette = [
  "#ff6b6b",
  "#ffd93d",
  "#6bcb77",
  "#4d96ff",
  "#845ec2",
  "#ff9671",
];

const inputSelectors = [
  "titleInput",
  "subtitleInput",
  "buttonLabelInput",
  "hubLabelInput",
  "itemsInput",
  "bgStartInput",
  "bgEndInput",
  "surfaceInput",
  "textColorInput",
  "rimColorInput",
  "pointerColorInput",
  "hubColorInput",
  "accentColorInput",
  "patternSelect",
  "paletteModeSelect",
  "paletteInput",
  "spinDurationInput",
  "wheelSizeInput",
  "textSizeInput",
  "rimWidthInput",
  "pointerSizeInput",
  "panelRadiusInput",
];

function parseItems(raw) {
  return raw
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePalette(raw) {
  const matches = raw
    .split(/[\n,]+/)
    .map((color) => color.trim())
    .filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));

  return matches.length ? matches : [...defaultPalette];
}

function normalizeAngle(angle) {
  const full = Math.PI * 2;
  return ((angle % full) + full) % full;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function hslToHex(hue, saturation, lightness) {
  const s = saturation / 100;
  const l = lightness / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (hue < 60) {
    r = c;
    g = x;
  } else if (hue < 120) {
    r = x;
    g = c;
  } else if (hue < 180) {
    g = c;
    b = x;
  } else if (hue < 240) {
    g = x;
    b = c;
  } else if (hue < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const toHex = (channel) => {
    const value = Math.round((channel + m) * 255);
    return value.toString(16).padStart(2, "0");
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function buildSegmentColors(count, palette, mode) {
  if (!count) {
    return [];
  }

  if (mode === "custom") {
    return Array.from(
      { length: count },
      (_, index) => palette[index % palette.length],
    );
  }

  if (mode === "rainbow") {
    return Array.from({ length: count }, (_, index) =>
      hslToHex((index * 360) / count, 88, 60),
    );
  }

  if (mode === "warm") {
    return Array.from({ length: count }, (_, index) =>
      hslToHex(
        12 + (index * 48) / Math.max(count - 1, 1),
        90,
        index % 2 === 0 ? 62 : 54,
      ),
    );
  }

  return Array.from({ length: count }, (_, index) =>
    hslToHex(
      188 + (index * 54) / Math.max(count - 1, 1),
      78,
      index % 2 === 0 ? 58 : 50,
    ),
  );
}

function readConfig() {
  const items = parseItems(dom.itemsInput.value);
  const displayItems = items.length ? items : ["Add items to the wheel"];
  const palette = parsePalette(dom.paletteInput.value);
  const paletteMode = dom.paletteModeSelect.value;

  return {
    items,
    displayItems,
    palette,
    segmentColors: buildSegmentColors(
      displayItems.length,
      palette,
      paletteMode,
    ),
    settings: {
      title: dom.titleInput.value.trim() || "Random Spinner Wheel",
      subtitle:
        dom.subtitleInput.value.trim() || "Spin to let chance choose for you.",
      buttonLabel: dom.buttonLabelInput.value.trim() || "Spin the wheel",
      hubLabel: dom.hubLabelInput.value.trim() || "SPIN",
      bgStart: dom.bgStartInput.value,
      bgEnd: dom.bgEndInput.value,
      surface: dom.surfaceInput.value,
      textColor: dom.textColorInput.value,
      rimColor: dom.rimColorInput.value,
      pointerColor: dom.pointerColorInput.value,
      hubColor: dom.hubColorInput.value,
      accentColor: dom.accentColorInput.value,
      pattern: dom.patternSelect.value,
      paletteMode,
      spinDuration: Number(dom.spinDurationInput.value),
      wheelSize: Number(dom.wheelSizeInput.value),
      textSize: Number(dom.textSizeInput.value),
      rimWidth: Number(dom.rimWidthInput.value),
      pointerSize: Number(dom.pointerSizeInput.value),
      panelRadius: Number(dom.panelRadiusInput.value),
    },
  };
}

function updateCssVariables(settings) {
  const root = document.documentElement;
  root.style.setProperty("--bg-start", settings.bgStart);
  root.style.setProperty("--bg-end", settings.bgEnd);
  root.style.setProperty("--surface", settings.surface);
  root.style.setProperty("--text", settings.textColor);
  root.style.setProperty("--rim", settings.rimColor);
  root.style.setProperty("--pointer", settings.pointerColor);
  root.style.setProperty("--hub", settings.hubColor);
  root.style.setProperty("--accent", settings.accentColor);
  root.style.setProperty("--wheel-size", `${settings.wheelSize}px`);
  root.style.setProperty("--pointer-size", `${settings.pointerSize}px`);
  root.style.setProperty("--panel-radius", `${settings.panelRadius}px`);
  document.body.dataset.pattern = settings.pattern;
}

function updateRangeLabels(settings) {
  dom.spinDurationValue.textContent = `${settings.spinDuration.toFixed(1)}s`;
  dom.wheelSizeValue.textContent = `${settings.wheelSize}px`;
  dom.textSizeValue.textContent = `${settings.textSize}px`;
  dom.rimWidthValue.textContent = `${settings.rimWidth}px`;
  dom.pointerSizeValue.textContent = `${settings.pointerSize}px`;
  dom.panelRadiusValue.textContent = `${settings.panelRadius}px`;
}

function renderPreviewItems(config) {
  dom.itemsPreview.innerHTML = "";
  config.displayItems.forEach((item, index) => {
    const chip = document.createElement("li");
    chip.className = "item-chip";
    chip.style.setProperty("--chip-color", config.segmentColors[index]);
    chip.textContent = item;

    if (
      state.selectedLabel &&
      item === state.selectedLabel &&
      !state.isSpinning
    ) {
      chip.classList.add("is-active");
    }

    dom.itemsPreview.appendChild(chip);
  });
}

function renderSwatches(config) {
  const swatches = [
    config.settings.bgStart,
    config.settings.bgEnd,
    config.settings.surface,
    config.settings.rimColor,
    config.settings.pointerColor,
    ...config.segmentColors.slice(0, 4),
  ];

  dom.swatchRow.innerHTML = "";
  swatches.forEach((color) => {
    const swatch = document.createElement("div");
    swatch.className = "swatch";
    swatch.style.background = color;
    dom.swatchRow.appendChild(swatch);
  });
}

function fitLabelLines(text, maxCharsPerLine = 11) {
  if (text.length <= maxCharsPerLine) {
    return [text];
  }

  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length <= maxCharsPerLine || !currentLine) {
      currentLine = nextLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  if (lines.length > 2) {
    const first = lines[0];
    const remaining = lines.slice(1).join(" ");
    const clipped =
      remaining.length > maxCharsPerLine
        ? `${remaining.slice(0, maxCharsPerLine - 1)}…`
        : remaining;
    return [first, clipped];
  }

  return lines;
}

function drawLabel(text, angle, radius, fontSize, color) {
  const lines = fitLabelLines(text, Math.max(8, Math.floor(14 - fontSize / 4)));
  const normalized = normalizeAngle(angle);
  const shouldFlip = normalized > Math.PI / 2 && normalized < (Math.PI * 3) / 2;
  const distance = radius * 0.63;

  ctx.save();
  ctx.rotate(angle);
  ctx.translate(distance, 0);
  ctx.rotate(shouldFlip ? Math.PI / 2 + Math.PI : Math.PI / 2);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${fontSize}px "Trebuchet MS", "Segoe UI", sans-serif`;

  lines.forEach((line, index) => {
    const offset = (index - (lines.length - 1) / 2) * fontSize * 1.05;
    ctx.fillText(line, 0, offset);
  });
  ctx.restore();
}

function drawWheel(config) {
  const size = canvas.width;
  const center = size / 2;
  const radius = center - 28;
  const items = config.displayItems;
  const colors = config.segmentColors;
  const slice = (Math.PI * 2) / items.length;

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(center, center);
  ctx.rotate(state.rotation);

  items.forEach((item, index) => {
    const start = -Math.PI / 2 + index * slice;
    const end = start + slice;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = colors[index];
    ctx.fill();

    ctx.lineWidth = config.settings.rimWidth;
    ctx.strokeStyle = config.settings.rimColor;
    ctx.stroke();

    drawLabel(
      item,
      start + slice / 2,
      radius,
      config.settings.textSize,
      config.settings.textColor,
    );
  });

  ctx.restore();

  ctx.beginPath();
  ctx.arc(center, center, radius + 4, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(config.settings.rimWidth, 4);
  ctx.strokeStyle = config.settings.rimColor;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(center, center, radius * 0.17, 0, Math.PI * 2);
  ctx.fillStyle = config.settings.accentColor;
  ctx.globalAlpha = 0.26;
  ctx.fill();
  ctx.globalAlpha = 1;
}

function updatePreview(config) {
  updateCssVariables(config.settings);
  updateRangeLabels(config.settings);

  dom.previewTitle.textContent = config.settings.title;
  dom.previewSubtitle.textContent = config.settings.subtitle;
  dom.spinButton.textContent = config.settings.buttonLabel;
  dom.hubButton.textContent = config.settings.hubLabel;
  dom.entryCount.textContent = `${config.items.length || 0} option${config.items.length === 1 ? "" : "s"}`;
  dom.themeSummary.textContent = `${capitalize(config.settings.paletteMode)} palette`;
  dom.summaryDuration.textContent = `${config.settings.spinDuration.toFixed(1)}s`;
  dom.summaryPattern.textContent = capitalize(config.settings.pattern);
  dom.summarySegments.textContent = String(config.items.length || 0);
  dom.summaryWheelSize.textContent = `${config.settings.wheelSize}px`;
  dom.resultMeta.textContent = `${config.items.length || 0} entr${config.items.length === 1 ? "y" : "ies"} ready`;

  renderPreviewItems(config);
  renderSwatches(config);

  const canSpin = config.items.length > 0 && !state.isSpinning;
  dom.spinButton.disabled = !canSpin;
  dom.hubButton.disabled = !canSpin;

  if (!state.selectedLabel) {
    dom.resultValue.textContent = config.items.length
      ? "Press spin to choose"
      : "Add entries to begin";
  }

  const wheelConfig =
    state.isSpinning && state.spinConfig ? state.spinConfig : config;
  drawWheel(wheelConfig);
}

function render() {
  const config = readConfig();
  if (state.selectedLabel && !config.items.includes(state.selectedLabel)) {
    state.selectedLabel = "";
    dom.resultValue.textContent = config.items.length
      ? "Press spin to choose"
      : "Add entries to begin";
  }
  updatePreview(config);
  return config;
}

function spinWheel() {
  if (state.isSpinning) {
    return;
  }

  const config = readConfig();
  if (!config.items.length) {
    dom.resultValue.textContent = "Add at least one entry";
    return;
  }

  state.isSpinning = true;
  state.spinConfig = {
    ...config,
    displayItems: [...config.items],
    segmentColors: buildSegmentColors(
      config.items.length,
      config.palette,
      config.settings.paletteMode,
    ),
  };

  const winnerIndex = Math.floor(Math.random() * config.items.length);
  const winner = config.items[winnerIndex];
  const slice = (Math.PI * 2) / config.items.length;
  const targetAngle = normalizeAngle(-(winnerIndex + 0.5) * slice);
  const currentAngle = normalizeAngle(state.rotation);
  const extraSpins = 6 + Math.floor(Math.random() * 4);
  const delta = normalizeAngle(targetAngle - currentAngle);
  const startRotation = state.rotation;
  const finalRotation = startRotation + extraSpins * Math.PI * 2 + delta;
  const duration = config.settings.spinDuration * 1000;
  const start = performance.now();

  dom.resultValue.textContent = "Spinning...";
  dom.resultMeta.textContent = `Randomizing from ${config.items.length} entries`;
  dom.spinButton.disabled = true;
  dom.hubButton.disabled = true;

  cancelAnimationFrame(state.frameId);

  function animate(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    state.rotation = startRotation + (finalRotation - startRotation) * eased;
    drawWheel(state.spinConfig);

    if (progress < 1) {
      state.frameId = requestAnimationFrame(animate);
      return;
    }

    state.rotation = finalRotation;
    state.isSpinning = false;
    state.selectedLabel = winner;
    state.spinConfig = null;
    dom.resultValue.textContent = winner;
    render();
  }

  state.frameId = requestAnimationFrame(animate);
}

function setTab(nextTab) {
  dom.tabs.forEach((tab) => {
    const active = tab.dataset.tab === nextTab;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  dom.panels.forEach((panel) => {
    const active = panel.dataset.panel === nextTab;
    panel.classList.toggle("is-active", active);
    panel.hidden = !active;
  });
}

function appendQuickItem() {
  const value = dom.quickItemInput.value.trim();
  if (!value) {
    return;
  }

  const current = parseItems(dom.itemsInput.value);
  current.push(value);
  dom.itemsInput.value = current.join("\n");
  dom.quickItemInput.value = "";
  render();
}

function randomizePalette() {
  const seed = Math.floor(Math.random() * 360);
  const colors = Array.from({ length: 8 }, (_, index) =>
    hslToHex((seed + index * 38) % 360, 84, index % 2 === 0 ? 62 : 54),
  );

  dom.paletteInput.value = colors.join("\n");
  render();
}

dom.tabs.forEach((tab) => {
  tab.addEventListener("click", () => setTab(tab.dataset.tab));
});

inputSelectors.forEach((key) => {
  dom[key].addEventListener("input", render);
});

dom.addItemButton.addEventListener("click", appendQuickItem);
dom.quickItemInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    appendQuickItem();
  }
});

dom.loadSampleButton.addEventListener("click", () => {
  dom.itemsInput.value = defaultItems.join("\n");
  render();
});

dom.clearItemsButton.addEventListener("click", () => {
  dom.itemsInput.value = "";
  state.selectedLabel = "";
  render();
});

dom.randomizePaletteButton.addEventListener("click", randomizePalette);
dom.spinButton.addEventListener("click", spinWheel);
dom.hubButton.addEventListener("click", spinWheel);

render();
