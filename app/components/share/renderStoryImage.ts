export type StoryRenderInput = {
    width?: number; // default 1080
    height?: number; // default 1920
  
    teamColor: string; // background color
    winnerName: string;
    winnerSlug: string; // used for cutout path
    top1PctText: string; // "95% of fans..."
    ranking: { rank: number; name: string }[]; // ranks 2-11
  
    brandText?: string; // default "rankf1.com"
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
  
  export async function renderStoryImage(input: StoryRenderInput): Promise<Blob> {
    const W = input.width ?? 1080;
    const H = input.height ?? 1920;
  
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unsupported");
  
    const bg = input.teamColor;
    const brandText = input.brandText ?? "rankf1.com";
  
    // Base background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
  
    // Subtle swirl-ish texture using a few translucent radial gradients
    const swirls = [
      { x: W * 0.25, y: H * 0.18, r: W * 0.55, a: 0.22 },
      { x: W * 0.85, y: H * 0.35, r: W * 0.65, a: 0.14 },
      { x: W * 0.50, y: H * 0.65, r: W * 0.75, a: 0.10 },
    ];
    for (const s of swirls) {
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
      g.addColorStop(0, rgba("#ffffff", s.a));
      g.addColorStop(1, rgba("#000000", 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
  
    // Dark vignette for contrast
    const vignette = ctx.createRadialGradient(W * 0.5, H * 0.35, W * 0.2, W * 0.5, H * 0.35, W * 0.95);
    vignette.addColorStop(0, rgba("#000000", 0));
    vignette.addColorStop(1, rgba("#000000", 0.55));
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
  
    // Header
    const padX = 80;
    const topY = 120;
  
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "800 92px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.textBaseline = "top";
    ctx.fillText(`#1 ${input.winnerName}`, padX, topY);
  
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.font = "600 44px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText("My F1 Livery Rankings", padX, topY + 108);
  
    // Winner cutout image
    const cutoutSrc = `/images/cutouts/${input.winnerSlug}.png`;
    const cutout = await loadImage(cutoutSrc);
  
    // Draw cutout centered with nice sizing
    const cutoutBoxTop = 340;
    const cutoutBoxH = 880;
    const cutoutBoxW = W - padX * 2;
  
    // Scale to fit box
    const scale = Math.min(cutoutBoxW / cutout.width, cutoutBoxH / cutout.height);
    const dw = cutout.width * scale;
    const dh = cutout.height * scale;
  
    const dx = (W - dw) / 2;
    const dy = cutoutBoxTop + (cutoutBoxH - dh) / 2;
  
    // Shadow behind cutout
    ctx.save();
    ctx.filter = "blur(18px)";
    ctx.globalAlpha = 0.35;
    ctx.drawImage(cutout, dx + 10, dy + 18, dw, dh);
    ctx.restore();
  
    // Main cutout
    ctx.globalAlpha = 1;
    ctx.drawImage(cutout, dx, dy, dw, dh);
  
    // Agree line
    const agreeY = 1250;
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.font = "700 44px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText(input.top1PctText, padX, agreeY);
  
    // Rankings (2–11) stacked card
    const listTop = 1340;
    const listH = 430;
    const listW = W - padX * 2;
  
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    roundedRect(ctx, padX, listTop, listW, listH, 28);
    ctx.fill();
    ctx.restore();
  
    // List text
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "650 36px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  
    const rowGap = 40;
    const startY = listTop + 34;
    const leftColX = padX + 28;
    const rightColX = padX + listW / 2 + 14;
  
    const rows = input.ranking.slice(0, 10); // 2-11 = 10 rows
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const colX = i < 5 ? leftColX : rightColX;
      const rowY = startY + (i % 5) * rowGap;
  
      ctx.fillStyle = "rgba(255,255,255,0.78)";
      ctx.font = "700 34px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText(String(r.rank).padStart(2, " "), colX, rowY);
  
      ctx.fillStyle = "rgba(255,255,255,0.94)";
      ctx.font = "650 36px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText(r.name, colX + 46, rowY - 2);
    }
  
    // Footer brand
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "700 44px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.textAlign = "center";
    ctx.fillText(brandText, W / 2, H - 120);
  
    // Export to PNG blob
    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => {
        if (!b) return reject(new Error("Failed to export image"));
        resolve(b);
      }, "image/png");
    });
  
    return blob;
  }