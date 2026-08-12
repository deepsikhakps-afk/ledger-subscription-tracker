// ---- chart.js: simple canvas bar chart for spend-by-category ----

const CATEGORY_COLORS = {
  Entertainment: "#ffb454",
  Productivity: "#5ee6c1",
  Fitness: "#a78bfa",
  Utilities: "#4dabf7",
  Education: "#ff8787",
  Other: "#8a8b9a"
};

function drawCategoryChart(canvas, dataByCategory) {
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const w = rect.width, h = rect.height;
  ctx.clearRect(0, 0, w, h);

  const entries = Object.entries(dataByCategory).filter(([, v]) => v > 0);
  if (!entries.length) {
    ctx.fillStyle = "#868aa0";
    ctx.font = "13px 'Space Grotesk', sans-serif";
    ctx.fillText("No spending data yet", 10, h / 2);
    return [];
  }

  const maxVal = Math.max(...entries.map(([, v]) => v));
  const barGap = 18;
  const barWidth = Math.min(60, (w - barGap * (entries.length + 1)) / entries.length);
  const chartHeight = h - 40;

  entries.forEach(([category, value], i) => {
    const barHeight = maxVal > 0 ? (value / maxVal) * chartHeight : 0;
    const x = barGap + i * (barWidth + barGap);
    const y = chartHeight - barHeight + 10;

    ctx.fillStyle = CATEGORY_COLORS[category] || "#8a8b9a";
    roundRect(ctx, x, y, barWidth, barHeight, 6);
    ctx.fill();

    ctx.fillStyle = "#e9ebf3";
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(`$${value.toFixed(0)}`, x + barWidth / 2, y - 6);
  });

  return entries;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
