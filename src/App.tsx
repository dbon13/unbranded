
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Download, ImageIcon, RefreshCw, QrCode, Upload, Eraser, Maximize2 } from "lucide-react";
import QRCode from "qrcode";

/**
 * Unbranded Kiosk – v1.2
 * - Sfondi eleganti (temi)
 * - Selettore flacone/tappo
 * - Etichetta ancorata al flacone con offset fini
 * - Immagini applicate sul corpo flacone (clip alla silhouette)
 */
export default function App() {
  const defaultState = {
    productName: "Il mio flacone",
    tagline: "Personalizzato in fiera",
    font: "Inter",
    bottleColor: "#f5f5f5",
    capColor: "#222222",
    labelBg: "#ffffff",
    textColor: "#111111",
    accentColor: "#5b9cf3",
    pattern: "none",
    qrValue: "",
    labelWidthMM: 90,
    labelHeightMM: 60,
    dpi: 300,
    bleedMM: 0,
    cropMarks: true,
    theme: "linen", // nuovo sfondo
    bottleShape: "cyl", // cyl | square | rounded
    capShape: "flat",   // flat | pump | flip
    // offset fini dell'etichetta rispetto all'area standard della forma (in mm)
    labelOffsetXMM: 0,
    labelOffsetYMM: 0,
    // immagine sul flacone
    bodyImageUrl: null as string | null,
    bodyImageScale: 1,
    bodyImageX: 0,
    bodyImageY: 0,
    bodyImageOpacity: 1,
  };

  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem("unbranded-kiosk-state-v12");
      return saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState;
    } catch { return defaultState; }
  });
  const set = (patch: Partial<typeof state>) => setState((s)=> ({...s, ...patch}));

  const {
    productName, tagline, font, bottleColor, capColor, labelBg, textColor,
    accentColor, pattern, qrValue, labelWidthMM, labelHeightMM, dpi,
    bleedMM, cropMarks, theme, bottleShape, capShape, labelOffsetXMM, labelOffsetYMM,
    bodyImageUrl, bodyImageScale, bodyImageX, bodyImageY, bodyImageOpacity
  } = state;

  useEffect(()=>{ try{ localStorage.setItem("unbranded-kiosk-state-v12", JSON.stringify(state)); }catch{} }, [state]);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const pxPerMM = useMemo(() => dpi / 25.4, [dpi]);
  const fonts = [
    { name: "Inter", css: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto' },
    { name: "Poppins", css: 'Poppins, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto' },
    { name: "Montserrat", css: 'Montserrat, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto' },
    { name: "Playfair Display", css: '"Playfair Display", ui-serif, Georgia, Cambria' },
  ];

  const themes = {
    linen: "radial-gradient(40% 60% at 20% 10%, #ffffff 0%, #eef2ff 60%, #e5e7eb 100%), repeating-linear-gradient(0deg, rgba(255,255,255,.4) 0, rgba(255,255,255,.4) 2px, rgba(0,0,0,.015) 2px, rgba(0,0,0,.015) 3px)",
    gradient: "linear-gradient(135deg, #fafafa 0%, #eef2ff 40%, #e9d5ff 100%)",
    carbon: "repeating-linear-gradient(45deg, #f8fafc, #f8fafc 10px, #f1f5f9 10px, #f1f5f9 20px)",
  } as const;

  // Specifiche forme (in unità SVG)
  const bottleSpecs = {
    cyl:   { viewBox: "0 0 280 520", labelRect: { x: 50, y: 230, w: 180, h: 120 } },
    square:{ viewBox: "0 0 300 520", labelRect: { x: 40, y: 220, w: 220, h: 140 } },
    rounded:{ viewBox: "0 0 280 520", labelRect: { x: 40, y: 240, w: 200, h: 130 } },
  } as const;

  // Logo upload
  const onLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) { alert("Formato non supportato (usa PNG/JPG/WEBP)."); return; }
    if (file.size > 5 * 1024 * 1024) { alert("File troppo grande (max 5MB)."); return; }
    const reader = new FileReader();
    reader.onload = () => set({ logoDataUrl: reader.result as string });
    reader.readAsDataURL(file);
  };
  const clearLogo = () => set({ logoDataUrl: null });

  // Body image upload
  const onBodyImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { alert("Usa PNG/JPG/WEBP."); return; }
    if (file.size > 6 * 1024 * 1024) { alert("Max 6MB."); return; }
    const reader = new FileReader();
    reader.onload = () => set({ bodyImageUrl: reader.result as string });
    reader.readAsDataURL(file);
  };
  const clearBodyImage = () => set({ bodyImageUrl: null });

  function paintPattern(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (pattern === "none") return;
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = accentColor;

    if (pattern === "stripes") {
      const stripeW = Math.max(6, Math.floor(w / 20));
      for (let x = -h; x < w + h; x += stripeW * 2) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + stripeW, 0);
        ctx.lineTo(x + stripeW - h, h);
        ctx.lineTo(x - h, h);
        ctx.closePath();
        ctx.fill();
      }
    }
    if (pattern === "dots") {
      const step = Math.max(10, Math.floor(Math.min(w, h) / 12));
      for (let y = step / 2; y < h; y += step) {
        for (let x = step / 2; x < w; x += step) {
          ctx.beginPath();
          ctx.arc(x, y, step / 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    if (pattern === "waves") {
      const amplitude = h / 12;
      const period = w / 6;
      ctx.beginPath();
      for (let x = 0; x <= w; x++) {
        const y = h / 2 + Math.sin((x / period) * Math.PI * 2) * amplitude;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineWidth = Math.max(2, h / 120);
      ctx.strokeStyle = accentColor;
      ctx.stroke();
    }
    ctx.restore();
  }

  async function drawLabel(ctx: CanvasRenderingContext2D, pxW: number, pxH: number) {
    const pad = Math.floor(pxH * 0.08);
    const innerW = pxW - pad * 2;
    const innerH = pxH - pad * 2;

    ctx.save();
    ctx.fillStyle = labelBg;
    ctx.fillRect(0, 0, pxW, pxH);
    paintPattern(ctx, pxW, pxH);

    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const titleFontSize = Math.floor(innerH * 0.22);
    ctx.font = `700 ${titleFontSize}px ${font}`;
    const titleY = pad;
    ctx.fillText(truncateToWidth(ctx, productName, innerW), pxW / 2, titleY);

    const taglineSize = Math.floor(innerH * 0.12);
    ctx.font = `500 ${taglineSize}px ${font}`;
    ctx.textBaseline = "top";
    ctx.fillText(truncateToWidth(ctx, tagline, innerW), pxW / 2, titleY + titleFontSize + Math.floor(innerH * 0.05));
    ctx.restore();

    ctx.fillStyle = accentColor;
    const dividerH = Math.max(4, Math.floor(pxH * 0.01));
    ctx.fillRect(pad, pad + Math.floor(innerH * 0.45), innerW, dividerH);

    if (state.logoDataUrl) {
      const img = await loadImage(state.logoDataUrl);
      const maxLogoW = innerW * 0.3;
      const maxLogoH = innerH * 0.28;
      const { drawW, drawH } = fitContain(img.width, img.height, maxLogoW, maxLogoH);
      ctx.drawImage(img, pad, pxH - pad - drawH, drawW, drawH);
    }

    if (qrValue.trim()) {
      const qrSize = Math.floor(Math.min(innerW, innerH) * 0.32);
      const qrUrl = await QRCode.toDataURL(qrValue, { margin: 0, width: qrSize });
      const qri = await loadImage(qrUrl);
      ctx.drawImage(qri, pxW - pad - qrSize, pxH - pad - qrSize, qrSize, qrSize);
    }
  }

  function truncateToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let ell = text;
    while (ctx.measureText(ell + "…").width > maxWidth && ell.length > 0) {
      ell = ell.slice(0, -1);
    }
    return ell + "…";
  }
  function fitContain(sw: number, sh: number, dw: number, dh: number) {
    const sr = sw / sh;
    const dr = dw / dh;
    if (sr > dr) return { drawW: dw, drawH: dw / sr };
    return { drawW: dh * sr, drawH: dh };
  }
  function loadImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  // Anteprima canvas della sola etichetta (ridotta)
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const pxW = Math.max(1, Math.floor(labelWidthMM * pxPerMM));
    const pxH = Math.max(1, Math.floor(labelHeightMM * pxPerMM));
    // scalata per preview (max 300px)
    const scale = Math.min(300/pxW, 300/pxH, 1);
    canvas.width = Math.floor(pxW * scale);
    canvas.height = Math.floor(pxH * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(scale, scale);
    drawLabel(ctx, pxW, pxH);
  }, [state, labelWidthMM, labelHeightMM, pxPerMM]);

  async function exportLabelPNG() {
    const pxW = Math.floor(labelWidthMM * pxPerMM);
    const pxH = Math.floor(labelHeightMM * pxPerMM);
    const bleedPx = Math.floor(bleedMM * pxPerMM);
    const canvas = document.createElement("canvas");
    canvas.width = pxW + bleedPx*2;
    canvas.height = pxH + bleedPx*2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // fondo fino al bleed
    ctx.fillStyle = labelBg;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.translate(bleedPx, bleedPx);
    await drawLabel(ctx, pxW, pxH);
    // crocini
    if (cropMarks) {
      ctx.resetTransform();
      ctx.strokeStyle = "#000"; ctx.lineWidth = 1;
      const L = 18;
      const m = bleedPx;
      line(ctx, m-L, m, m-2, m); line(ctx, m, m-L, m, m-2);
      line(ctx, m+pxW+2, m, m+pxW+L, m); line(ctx, m+pxW, m-L, m+pxW, m-2);
      line(ctx, m-L, m+pxH, m-2, m+pxH); line(ctx, m, m+pxH+2, m, m+pxH+L);
      line(ctx, m+pxW+2, m+pxH, m+pxW+L, m+pxH); line(ctx, m+pxW, m+pxH+2, m+pxW, m+pxH+L);
    }
    triggerDownload(canvas.toDataURL("image/png"), makeFileName("png"));
  }
  function line(ctx: CanvasRenderingContext2D, x1:number,y1:number,x2:number,y2:number){ ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); }
  function makeFileName(ext: string) {
    const safe = productName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const bleed = bleedMM ? `-bleed${bleedMM}mm` : "";
    return `etichetta-${safe || "flacone"}-${labelWidthMM}x${labelHeightMM}mm-${dpi}dpi${bleed}.${ext}`;
  }
  function triggerDownload(dataUrl: string, fileName: string) {
    const a = document.createElement("a"); a.href = dataUrl; a.download = fileName; document.body.appendChild(a); a.click(); a.remove();
  }
  function randomize() {
    const palette = ["#111111", "#ffffff", "#ef4444", "#10b981", "#3b82f6", "#f59e0b", "#a855f7", "#0ea5e9", "#64748b"];
    const pick = () => palette[Math.floor(Math.random() * palette.length)];
    set({ bottleColor: pick(), capColor: pick(), labelBg: pick(), textColor: pick(), accentColor: pick(), pattern: ["none","stripes","dots","waves"][Math.floor(Math.random()*4)] as any });
  }
  function resetAll() {
    try { localStorage.removeItem("unbranded-kiosk-state-v12"); } catch {}
    window.location.reload();
  }
  async function goFullscreen() {
    const el = document.documentElement; if (el.requestFullscreen) await el.requestFullscreen();
  }

  return (
    <div className="min-h-screen w-full p-6" style={{ backgroundImage: themes[theme as keyof typeof themes] }}>
      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-2xl">Anteprima</CardTitle>
            <Button onClick={goFullscreen} variant="secondary" className="gap-2"><Maximize2 className="h-4 w-4"/> Kiosk</Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <BottleStage theme={theme}>
                <BottleMockup
                  bottleShape={bottleShape}
                  capShape={capShape}
                  bottleColor={bottleColor}
                  capColor={capColor}
                  labelRectOverrides={{ offsetXmm: labelOffsetXMM, offsetYmm: labelOffsetYMM, labelWmm: labelWidthMM, labelHmm: labelHeightMM, pxPerMM }}
                  bodyImage={{ url: bodyImageUrl || undefined, scale: bodyImageScale, x: bodyImageX, y: bodyImageY, opacity: bodyImageOpacity }}
                >
                  {/* Etichetta canvas (preview ridotta) */}
                  <canvas ref={previewCanvasRef} style={{ imageRendering: "crisp-edges" }} />
                </BottleMockup>
              </BottleStage>

              <div className="text-sm text-slate-700 flex flex-wrap gap-3">
                <span>Forma: <strong>{bottleShape}</strong> / Tappo: <strong>{capShape}</strong></span>
                <span>Etichetta: <strong>{labelWidthMM}×{labelHeightMM} mm</strong> @ <strong>{dpi} DPI</strong></span>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={exportLabelPNG} className="gap-2"><Download className="h-4 w-4"/>Scarica PNG</Button>
                <Button variant="secondary" onClick={randomize} className="gap-2"><RefreshCw className="h-4 w-4"/>Sorprendimi</Button>
                <Button variant="ghost" onClick={resetAll} className="gap-2"><Eraser className="h-4 w-4"/>Reset</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Personalizza</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {/* Tema e forme */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Sfondo</Label>
                  <select value={theme} onChange={(e)=>set({ theme: e.target.value })} className="h-10 px-3 rounded-xl border w-full">
                    <option value="linen">Linen elegante</option>
                    <option value="gradient">Gradiente morbido</option>
                    <option value="carbon">Trama carbon</option>
                  </select>
                </div>
                <div>
                  <Label>Flacone</Label>
                  <select value={bottleShape} onChange={(e)=>set({ bottleShape: e.target.value as any })} className="h-10 px-3 rounded-xl border w-full">
                    <option value="cyl">Cilindrico</option>
                    <option value="square">Squadrato</option>
                    <option value="rounded">Panciuto</option>
                  </select>
                </div>
                <div>
                  <Label>Tappo</Label>
                  <select value={capShape} onChange={(e)=>set({ capShape: e.target.value as any })} className="h-10 px-3 rounded-xl border w-full">
                    <option value="flat">Piatto</option>
                    <option value="pump">Dosatore</option>
                    <option value="flip">Flip-top</option>
                  </select>
                </div>
              </div>

              {/* Testi e font */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Nome prodotto</Label>
                  <Input value={productName} onChange={(e) => set({ productName: e.target.value })} maxLength={32} />
                </div>
                <div>
                  <Label>Tagline</Label>
                  <Input value={tagline} onChange={(e) => set({ tagline: e.target.value })} maxLength={48} />
                </div>
                <div>
                  <Label>Font</Label>
                  <select value={font} onChange={(e)=>set({ font: e.target.value })} className="h-10 px-3 rounded-xl border w-full">
                    {fonts.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Colori */}
              <div className="grid grid-cols-2 gap-4">
                <ColorInput label="Colore flacone" value={bottleColor} onChange={(v)=>set({ bottleColor:v })} />
                <ColorInput label="Colore tappo" value={capColor} onChange={(v)=>set({ capColor:v })} />
                <ColorInput label="Sfondo etichetta" value={labelBg} onChange={(v)=>set({ labelBg:v })} />
                <ColorInput label="Colore testo" value={textColor} onChange={(v)=>set({ textColor:v })} />
                <ColorInput label="Colore accento" value={accentColor} onChange={(v)=>set({ accentColor:v })} />
              </div>

              {/* Etichetta misure/offset */}
              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <Label>Larghezza etichetta (mm)</Label>
                  <Slider value={[labelWidthMM]} min={30} max={120} step={1} onChange={(v)=>set({ labelWidthMM: v[0] })} />
                  <div className="text-xs text-slate-500">{labelWidthMM} mm</div>
                </div>
                <div>
                  <Label>Altezza etichetta (mm)</Label>
                  <Slider value={[labelHeightMM]} min={30} max={140} step={1} onChange={(v)=>set({ labelHeightMM: v[0] })} />
                  <div className="text-xs text-slate-500">{labelHeightMM} mm</div>
                </div>
                <div>
                  <Label>Offset X etichetta (mm)</Label>
                  <Slider value={[labelOffsetXMM]} min={-20} max={20} step={0.5} onChange={(v)=>set({ labelOffsetXMM: v[0] })} />
                  <div className="text-xs text-slate-500">{labelOffsetXMM} mm</div>
                </div>
                <div>
                  <Label>Offset Y etichetta (mm)</Label>
                  <Slider value={[labelOffsetYMM]} min={-20} max={20} step={0.5} onChange={(v)=>set({ labelOffsetYMM: v[0] })} />
                  <div className="text-xs text-slate-500">{labelOffsetYMM} mm</div>
                </div>
              </div>

              {/* DPI / Bleed */}
              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <Label>DPI esportazione</Label>
                  <Slider value={[dpi]} min={150} max={600} step={25} onChange={(v)=>set({ dpi: v[0] })} />
                  <div className="text-xs text-slate-500">{dpi} DPI</div>
                </div>
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <Label>Bleed (mm)</Label>
                    <Slider value={[bleedMM]} min={0} max={5} step={0.5} onChange={(v)=>set({ bleedMM: v[0] })} />
                    <div className="text-xs text-slate-500">{bleedMM} mm</div>
                  </div>
                  <label className="flex gap-2 items-center mt-6">
                    <input type="checkbox" checked={cropMarks} onChange={(e)=>set({ cropMarks: e.target.checked })} />
                    <span className="text-sm text-slate-700">Crocini stampa</span>
                  </label>
                </div>
              </div>

              {/* Logo & QR */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Logo (PNG/JPG/WEBP)</Label>
                  <div className="flex items-center gap-3">
                    <Input type="file" accept="image/*" onChange={onLogoUpload} />
                    <Button type="button" variant="secondary" onClick={clearLogo} className="gap-2"><ImageIcon className="h-4 w-4"/>Rimuovi</Button>
                  </div>
                </div>
                <div>
                  <Label>QR (URL o testo)</Label>
                  <div className="flex gap-2">
                    <Input value={qrValue} onChange={(e) => set({ qrValue: e.target.value })} placeholder="https://..." />
                    <div className="inline-flex items-center gap-1 text-slate-500 text-sm"><QrCode className="h-4 w-4"/> opzionale</div>
                  </div>
                </div>
              </div>

              {/* Immagine sul corpo flacone */}
              <div className="space-y-2">
                <Label>Immagine sul flacone (clippata alla silhouette)</Label>
                <div className="flex items-center gap-3">
                  <Input type="file" accept="image/*" onChange={onBodyImageUpload} />
                  <Button type="button" variant="secondary" onClick={clearBodyImage} className="gap-2"><ImageIcon className="h-4 w-4"/>Rimuovi</Button>
                </div>
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div>
                    <Label>Scala</Label>
                    <Slider value={[bodyImageScale]} min={0.2} max={2} step={0.05} onChange={(v)=>set({ bodyImageScale: v[0] })} />
                    <div className="text-xs text-slate-500">{bodyImageScale.toFixed(2)}×</div>
                  </div>
                  <div>
                    <Label>X</Label>
                    <Slider value={[bodyImageX]} min={-100} max={100} step={1} onChange={(v)=>set({ bodyImageX: v[0] })} />
                    <div className="text-xs text-slate-500">{bodyImageX} px</div>
                  </div>
                  <div>
                    <Label>Y</Label>
                    <Slider value={[bodyImageY]} min={-100} max={100} step={1} onChange={(v)=>set({ bodyImageY: v[0] })} />
                    <div className="text-xs text-slate-500">{bodyImageY} px</div>
                  </div>
                </div>
                <div>
                  <Label>Opacità</Label>
                  <Slider value={[bodyImageOpacity]} min={0.1} max={1} step={0.05} onChange={(v)=>set({ bodyImageOpacity: v[0] })} />
                  <div className="text-xs text-slate-500">{Math.round(bodyImageOpacity*100)}%</div>
                </div>
              </div>

              <Hint>
                Sfondi: scegli un tema elegante dal menu. L'immagine caricata viene **ritagliata** sulla sagoma del flacone: usa scala/posizione per centrarla.
              </Hint>
            </div>
          </CardContent>
        </Card>
      </div>

      <style>{`
        body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; }
      `}</style>
    </div>
  );
}

/** Contenitore con cornice e riflessi leggeri */
function BottleStage({ children, theme }:{ children: React.ReactNode, theme:string }){
  return (
    <div className="w-full flex items-center justify-center">
      <div className="rounded-3xl p-5 w-full max-w-md bg-white/70 backdrop-blur border shadow-sm">
        {children}
      </div>
    </div>
  )
}

function BottleMockup({
  bottleShape, capShape, bottleColor, capColor,
  labelRectOverrides,
  children,
  bodyImage
}: {
  bottleShape: 'cyl'|'square'|'rounded',
  capShape: 'flat'|'pump'|'flip',
  bottleColor: string,
  capColor: string,
  labelRectOverrides: { offsetXmm: number, offsetYmm: number, labelWmm: number, labelHmm: number, pxPerMM: number },
  children?: React.ReactNode,
  bodyImage?: { url?: string, scale: number, x: number, y: number, opacity: number }
}) {

  const specs:any = {
    cyl:   { vb: "0 0 280 520", label:{ x:50, y:230, w:180, h:120 }, bodyPath:"M90 50 h100 v35 c0 10 -10 18 -22 22 v20 c0 10 6 18 6 28 v260 c0 60 -34 92 -84 92s-84 -32 -84 -92V155c0-10 6-18 6-28v-20c-12-4-22-12-22-22V50h100z" },
    square:{ vb: "0 0 300 520", label:{ x:40, y:220, w:220, h:140 }, bodyPath:"M80 60 h140 v40 c0 12 -10 20 -20 22 v18 c0 10 6 20 6 34 v250 c0 70 -46 100 -106 100s-106 -30 -106 -100V174c0-14 6-24 6-34v-18c-10-2-20-10-20-22V60h140z" },
    rounded:{ vb: "0 0 280 520", label:{ x:40, y:240, w:200, h:130 }, bodyPath:"M95 60 h90 v30 c0 12 -10 20 -22 24 v18 c0 10 8 22 8 38 v240 c0 80 -38 110 -88 110s-88 -30 -88 -110V170c0-16 8-28 8-38v-18c-12-4-22-12-22-24V60h104z" },
  };
  const s = specs[bottleShape];
  const label = s.label;

  // Applichiamo offset e misure in mm → px su svg 1:1 (usiamo px come unità SVG)
  const dx = labelRectOverrides.offsetXmm * labelRectOverrides.pxPerMM;
  const dy = labelRectOverrides.offsetYmm * labelRectOverrides.pxPerMM;
  const lw = labelRectOverrides.labelWmm * labelRectOverrides.pxPerMM * 0.2; // scale to fit svg (rough mapping)
  const lh = labelRectOverrides.labelHmm * labelRectOverrides.pxPerMM * 0.2;

  // Cap shapes
  function renderCap(){
    if(capShape==='pump'){
      return (<g>
        <rect x="110" y="10" width="60" height="14" rx="3" fill="#00000020" />
        <rect x="105" y="20" width="70" height="38" rx="8" fill={capColor} />
        <rect x="160" y="5" width="50" height="10" rx="5" fill={capColor} />
        <circle cx="210" cy="10" r="5" fill={capColor} />
      </g>);
    }
    if(capShape==='flip'){
      return (<g>
        <rect x="110" y="20" width="60" height="40" rx="6" fill={capColor} />
        <rect x="105" y="10" width="70" height="14" rx="4" fill="#00000020" />
        <rect x="135" y="8" width="10" height="8" rx="2" fill="#00000030" />
      </g>);
    }
    return (<g>
      <rect x="110" y="20" width="60" height="40" rx="6" fill={capColor} />
      <rect x="110" y="15" width="60" height="10" rx="3" fill="#00000020" />
    </g>);
  }

  return (
    <div className="relative w-full flex items-center justify-center">
      <svg viewBox={s.vb} className="w-72 drop-shadow-xl">
        <defs>
          <linearGradient id="shine" x1="0" x2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35"/>
            <stop offset="30%" stopColor="#ffffff" stopOpacity="0.05"/>
            <stop offset="100%" stopColor="#000000" stopOpacity="0.06"/>
          </linearGradient>
          <clipPath id="bottleClip">
            <path d={s.bodyPath} />
          </clipPath>
        </defs>

        {/* Ombra */}
        <ellipse cx="140" cy="505" rx="80" ry="8" fill="#000" opacity="0.08" />

        {/* Corpo bottiglia */}
        <path d={s.bodyPath} fill={bottleColor} stroke="#00000010" strokeWidth="2" />

        {/* Immagine sul corpo (clippata) */}
        {bodyImage?.url && (
          <image
            href={bodyImage.url}
            x={(s.label.x) + bodyImage.x}
            y={(s.label.y) + bodyImage.y}
            width={s.label.w * bodyImage.scale}
            height={s.label.h * bodyImage.scale}
            opacity={bodyImage.opacity}
            clipPath="url(#bottleClip)"
            preserveAspectRatio="xMidYMid slice"
          />
        )}

        {/* Riflesso */}
        <path d="M100 90 c0 0 0 0 0 0 v330 c0 40 18 60 44 60" fill="none" stroke="url(#shine)" strokeWidth="10" />

        {/* Tappo */}
        {renderCap()}

        {/* Area etichetta — foreignObject */}
        <g>
          <rect x={label.x + dx} y={label.y + dy} width={lw || label.w} height={lh || label.h} rx="12" fill="#ffffff90" stroke="#00000010" />
          <foreignObject x={label.x + 10 + dx} y={label.y + 10 + dy} width={(lw || label.w) - 20} height={(lh || label.h) - 20}>
            <div className="w-full h-full flex items-center justify-center overflow-hidden">
              {children}
            </div>
          </foreignObject>
        </g>
      </svg>
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm text-slate-700">{label}</div>
      <div className="flex items-center gap-2">
        <input type="color" className="h-9 w-16 rounded-lg overflow-hidden border" value={value} onChange={(e) => onChange(e.target.value)} />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="w-28" />
      </div>
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs text-slate-600 bg-slate-50 border rounded-xl p-3 flex items-start gap-2">
      <Upload className="h-4 w-4 mt-0.5"/>
      <p>{children}</p>
    </div>
  );
}
