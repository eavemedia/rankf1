export type StoryRenderInput = {
    width?: number; // default 1080
    height?: number; // default 1920
  
    teamColor: string; // background color
    winnerName: string;
    winnerSlug: string; // used for cutout path
    top1PctText: string; // "95% of Fans Agree"
    ranking: { rank: number; name: string }[]; // ranks 2-11
  
    brandText?: string; // default "RANKF1.com"
  };
  
  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }
  
  function hexToRgb(hex: string) {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return { r, g, b };
  }
  
  function rgba(hex: string, a: number) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  
  function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }
  
  function drawStreakBackground(ctx: CanvasRenderingContext2D, W: number, H: number, teamColor: string) {
    // base
    ctx.fillStyle = teamColor;
    ctx.fillRect(0, 0, W, H);
  
    // diagonal streaks (Ferrari-like motion)
    ctx.save();
    ctx.translate(W * 0.05, H * -0.08);
    ctx.rotate((-12 * Math.PI) / 180);
  
    const g1 = ctx.createLinearGradient(0, 0, W, 0);
    g1.addColorStop(0.0, rgba("#ffffff", 0.00));
    g1.addColorStop(0.15, rgba("#ffffff", 0.12));
    g1.addColorStop(0.35, rgba("#ffffff", 0.00));
    g1.addColorStop(0.55, rgba("#ffffff", 0.10));
    g1.addColorStop(0.75, rgba("#ffffff", 0.00));
    g1.addColorStop(0.92, rgba("#000000", 0.10));
  
    ctx.fillStyle = g1;
    ctx.globalAlpha = 1;
  
    for (let i = 0; i < 10; i++) {
      const y = i * (H / 8);
      ctx.fillRect(-W, y, W * 3, 90);
    }
  
    ctx.restore();
  
    // vignette for contrast
    const vignette = ctx.createRadialGradient(W * 0.5, H * 0.35, W * 0.25, W * 0.5, H * 0.35, W * 1.05);
    vignette.addColorStop(0, rgba("#000000", 0));
    vignette.addColorStop(1, rgba("#000000", 0.55));
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
  }
  
  function drawTwoToneHeadline(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    leftText: string,
    rightText: string
  ) {
    // #1 in white with a soft shadow, TEAM in yellow
    ctx.save();
    ctx.textBaseline = "top";
  
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;
  
    ctx.font = "900 108px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fillText(leftText, x, y);
  
    const wLeft = ctx.measureText(leftText).width;
  
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#F2C14E"; // warm yellow like sample
    ctx.fillText(rightText, x + wLeft + 26, y);
    ctx.restore();
  }
  
  function drawSubtitle(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save();
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(255,255,255,0.86)";
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
    ctx.font = "700 italic 48px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText("My F1 Livery Rankings", x, y);
    ctx.restore();
  }
  
  function drawAgree(ctx: CanvasRenderingContext2D, W: number, y: number, text: string) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = "900 74px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillStyle = "#F2C14E";
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 8;
    ctx.fillText(text, W / 2, y);
    ctx.restore();
  }
  
  function drawRankingPanel(ctx: CanvasRenderingContext2D, W: number, y: number, rows: { rank: number; name: string }[]) {
    const padX = 120;
    const panelW = W - padX * 2;
    const panelH = 560;
  
    // panel background (light top, dark bottom)
    ctx.save();
    const g = ctx.createLinearGradient(0, y, 0, y + panelH);
    g.addColorStop(0, "rgba(255,255,255,0.82)");
    g.addColorStop(0.18, "rgba(255,255,255,0.70)");
    g.addColorStop(1, "rgba(30,30,30,0.88)");
  
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 10;
  
    roundedRect(ctx, padX, y, panelW, panelH, 16);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
  
    // row text
    const leftX = padX + 54;
    const startY = y + 40;
    const rowH = 52;
  
    ctx.save();
    ctx.textBaseline = "middle";
    ctx.font = "800 44px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const yy = startY + i * rowH;
  
      // separator line
      if (i > 0) {
        ctx.strokeStyle = "rgba(0,0,0,0.18)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padX + 18, yy - rowH / 2);
        ctx.lineTo(padX + panelW - 18, yy - rowH / 2);
        ctx.stroke();
      }
  
      // text color: darker at top, lighter at bottom
      const t = i / Math.max(1, rows.length - 1);
      const isTopHalf = t < 0.45;
  
      ctx.fillStyle = isTopHalf ? "rgba(0,0,0,0.78)" : "rgba(255,255,255,0.92)";
      ctx.fillText(`${r.rank}.  ${r.name}`, leftX, yy);
    }
  
    ctx.restore();
  }
  
  function drawBrand(ctx: CanvasRenderingContext2D, W: number, H: number) {
    // Black pill with RANK + red F1 + .com
    const pillW = 520;
    const pillH = 120;
    const x = (W - pillW) / 2;
    const y = H - 170;
  
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 10;
  
    roundedRect(ctx, x, y, pillW, pillH, 18);
    ctx.fillStyle = "rgba(0,0,0,0.78)";
    ctx.fill();
    ctx.restore();
  
    ctx.save();
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.font = "900 72px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  
    const baseY = y + pillH / 2;
    const startX = x + 58;
  
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fillText("RANK", startX, baseY);
  
    const wRank = ctx.measureText("RANK").width;
  
    ctx.fillStyle = "#E8002D";
    ctx.fillText("F1", startX + wRank + 6, baseY);
  
    const wAll = ctx.measureText("RANKF1").width;
  
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = "900 56px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText(".com", startX + wAll + 14, baseY + 2);
  
    ctx.restore();
  }
  
  export async function renderStoryImage(input: StoryRenderInput): Promise<Blob> {
    const W = input.width ?? 1080;
    const H = input.height ?? 1920;
  
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
  
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unsupported");
  
    drawStreakBackground(ctx, W, H, input.teamColor);
  
    const padX = 90;
  
    // Headline
    drawTwoToneHeadline(ctx, padX, 120, "#1", input.winnerName.toUpperCase());
    drawSubtitle(ctx, padX + 140, 250);
  
    // Winner cutout
    const cutoutSrc = `/images/cutouts/${input.winnerSlug}.png`;
    const cutout = await loadImage(cutoutSrc);
  
    // Big center placement, like the sample
    const boxTop = 300;
    const boxH = 900;
    const boxW = W - padX * 2;
  
    const scale = Math.min(boxW / cutout.width, boxH / cutout.height) * 1.04;
    const dw = cutout.width * scale;
    const dh = cutout.height * scale;
  
    const dx = (W - dw) / 2;
    const dy = boxTop + (boxH - dh) / 2 + 16;
  
    // soft shadow
    ctx.save();
    ctx.globalAlpha = 0.30;
    ctx.filter = "blur(18px)";
    ctx.drawImage(cutout, dx + 12, dy + 22, dw, dh);
    ctx.restore();
  
    // cutout
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.drawImage(cutout, dx, dy, dw, dh);
    ctx.restore();
  
    // Agree line
    drawAgree(ctx, W, 1220, input.top1PctText);
  
    // Rankings panel (2–11)
    drawRankingPanel(ctx, W, 1330, input.ranking.slice(0, 10));
  
    // Brand
    drawBrand(ctx, W, H);
  
    // export
    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => {
        if (!b) return reject(new Error("Failed to export image"));
        resolve(b);
      }, "image/png");
    });
  
    return blob;
  }