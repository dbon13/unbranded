
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Download, ImageIcon, RefreshCw, QrCode, Upload, Eraser } from "lucide-react";
import QRCode from "qrcode";

/**
 * Unbranded Kiosk – Vite + React (no backend)
 */
export default function App() {
  const [productName, setProductName] = useState("Il mio flacone");
  const [tagline, setTagline] = useState("Personalizzato in fiera");
  const [font, setFont] = useState("Inter");
  const [bottleColor, setBottleColor] = useState("#f5f5f5");
  const [capColor, setCapColor] = useState("#222222");
  const [labelBg, setLabelBg] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#111111");
  const [accentColor, setAccentColor] = useState("#5b9cf3");
  const [pattern, setPattern] = useState("none"); // none | stripes | dots | waves
  const [qrValue, setQrValue] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [labelWidthMM, setLabelWidthMM] = useState(90);
  const [labelHeightMM, setLabelHeightMM] = useState(60);
  const [dpi, setDpi] = useState(300);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const pxPerMM = useMemo(() => dpi / 25.4, [dpi]);
  const previewScale = 2.5;
  const fonts = [
    { name: "Inter", css: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto' },
    { name: "Poppins", css: 'Poppins, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto' },
    { name: "Montserrat", css: 'Montserrat, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto' },
    { name: "Playfair Display", css: '"Playfair Display", ui-serif, Georgia, Cambria' },
  ];

  const onLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };
  const clearLogo = () => setLogoDataUrl(null);

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
    ctx.fillStyle = labelBg;
    ctx.fillRect(0, 0, pxW, pxH);
    paintPattern(ctx, pxW, pxH);

    const pad = Math.floor(pxH * 0.08);
    const innerW = pxW - pad * 2;
    const innerH = pxH - pad * 2;

    ctx.save();
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

    if (logoDataUrl) {
      const img = await loadImage(logoDataUrl);
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
    if (sr > dr) {
      return { drawW: dw, drawH: dw / sr };
    } else {
      return { drawW: dh * sr, drawH: dh };
    }
  }

  function loadImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const pxW = Math.max(1, Math.floor(labelWidthMM * pxPerMM / previewScale));
    const pxH = Math.max(1, Math.floor(labelHeightMM * pxPerMM / previewScale));
    canvas.width = pxW;
    canvas.height = pxH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawLabel(ctx, pxW, pxH);
  }, [productName, tagline, font, labelBg, textColor, accentColor, pattern, logoDataUrl, qrValue, labelWidthMM, labelHeightMM, pxPerMM]);

  async function exportLabelPNG() {
    const pxW = Math.floor(labelWidthMM * pxPerMM);
    const pxH = Math.floor(labelHeightMM * pxPerMM);
    const canvas = document.createElement("canvas");
    canvas.width = pxW;
    canvas.height = pxH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    await drawLabel(ctx, pxW, pxH);
    const dataUrl = canvas.toDataURL("image/png");
    triggerDownload(dataUrl, makeFileName("png"));
  }

  function makeFileName(ext: string) {
    const safe = productName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return `etichetta-${safe || "flacone"}-${labelWidthMM}x${labelHeightMM}mm-${dpi}dpi.${ext}`;
  }
  function triggerDownload(dataUrl: string, fileName: string) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  function randomize() {
    const palette = ["#111111", "#ffffff", "#ef4444", "#10b981", "#3b82f6", "#f59e0b", "#a855f7", "#0ea5e9", "#64748b"];
    const pick = () => palette[Math.floor(Math.random() * palette.length)];
    setBottleColor(pick());
    setCapColor(pick());
    setLabelBg(pick());
    setTextColor(pick());
    setAccentColor(pick());
    setPattern(["none", "stripes", "dots", "waves"][Math.floor(Math.random() * 4)] as any);
  }
  function resetAll() {
    setProductName("Il mio flacone");
    setTagline("Personalizzato in fiera");
    setFont("Inter");
    setBottleColor("#f5f5f5");
    setCapColor("#222222");
    setLabelBg("#ffffff");
    setTextColor("#111111");
    setAccentColor("#5b9cf3");
    setPattern("none");
    setQrValue("");
    setLogoDataUrl(null);
    setLabelWidthMM(90);
    setLabelHeightMM(60);
    setDpi(300);
  }

  return (
    <div className="min-h-screen w-full p-6">
      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Anteprima</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-center justify-center">
                <BottleMockup bottleColor={bottleColor} capColor={capColor}>
                  <div className="p-2 bg-white/60 rounded-xl backdrop-blur">
                    <canvas ref={previewCanvasRef} style={{ imageRendering: "crisp-edges" }} />
                  </div>
                </BottleMockup>
              </div>
              <div className="text-sm text-slate-600 flex flex-wrap gap-3">
                <span>Etichetta: <strong>{labelWidthMM}×{labelHeightMM} mm</strong> @ <strong>{dpi} DPI</strong></span>
                <span>Pixel export: <strong>{Math.floor(labelWidthMM * pxPerMM)}×{Math.floor(labelHeightMM * pxPerMM)}</strong></span>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={exportLabelPNG} className="gap-2"><Download className="h-4 w-4"/>Scarica etichetta PNG</Button>
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
            <div className="space-y-4">
              <div>
                <Label>Nome prodotto</Label>
                <Input value={productName} onChange={(e) => setProductName(e.target.value)} maxLength={32} />
              </div>
              <div>
                <Label>Messaggio / Tagline</Label>
                <Input value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={48} />
              </div>
              <div>
                <Label>Font</Label>
                <select value={font} onChange={(e)=>setFont(e.target.value)} className="h-10 px-3 rounded-xl border w-full">
                  {fonts.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <ColorInput label="Colore flacone" value={bottleColor} onChange={setBottleColor} />
                <ColorInput label="Colore tappo" value={capColor} onChange={setCapColor} />
                <ColorInput label="Sfondo etichetta" value={labelBg} onChange={setLabelBg} />
                <ColorInput label="Colore testo" value={textColor} onChange={setTextColor} />
                <ColorInput label="Colore accento" value={accentColor} onChange={setAccentColor} />
              </div>

              <div>
                <Label>Pattern</Label>
                <div className="grid grid-cols-4 gap-3 pt-2">
                  {[
                    { id: "none", label: "Nessuno" },
                    { id: "stripes", label: "Strisce" },
                    { id: "dots", label: "Pois" },
                    { id: "waves", label: "Onde" },
                  ].map(p => (
                    <label key={p.id} className="flex items-center gap-2 border rounded-xl p-2 cursor-pointer">
                      <input type="radio" name="pattern" checked={pattern===p.id} onChange={()=>setPattern(p.id)} />
                      <span>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <Label>Larghezza etichetta (mm)</Label>
                  <Slider value={[labelWidthMM]} min={30} max={120} step={1} onChange={(v)=>setLabelWidthMM(v[0])} />
                  <div className="text-xs text-slate-500">{labelWidthMM} mm</div>
                </div>
                <div>
                  <Label>Altezza etichetta (mm)</Label>
                  <Slider value={[labelHeightMM]} min={30} max={120} step={1} onChange={(v)=>setLabelHeightMM(v[0])} />
                  <div className="text-xs text-slate-500">{labelHeightMM} mm</div>
                </div>
              </div>

              <div>
                <Label>DPI esportazione</Label>
                <Slider value={[dpi]} min={150} max={600} step={25} onChange={(v)=>setDpi(v[0])} />
                <div className="text-xs text-slate-500">{dpi} DPI</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Logo (PNG/JPG con sfondo trasparente se possibile)</Label>
                  <div className="flex items-center gap-3">
                    <Input type="file" accept="image/*" onChange={onLogoUpload} />
                    <Button type="button" variant="secondary" onClick={clearLogo} className="gap-2"><ImageIcon className="h-4 w-4"/>Rimuovi</Button>
                  </div>
                </div>
                <div>
                  <Label>QR (URL o testo)</Label>
                  <div className="flex gap-2">
                    <Input value={qrValue} onChange={(e) => setQrValue(e.target.value)} placeholder="https://..." />
                    <div className="inline-flex items-center gap-1 text-slate-500 text-sm"><QrCode className="h-4 w-4"/> opzionale</div>
                  </div>
                </div>
              </div>

              <Hint>
                Suggerimento: per la stampa professionale, scarica a 300–400 DPI. Il file è già dimensionato in mm.
              </Hint>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-6xl mx-auto mt-6 text-center text-xs text-slate-500">
        Unbranded Kiosk – demo senza backend. Personalizza, anteprima, scarica l'etichetta pronta per la stampa.
      </div>

      <style>{`
        canvas { image-rendering: pixelated; width: 200px; height: 130px; }
        body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; }
      `}</style>
    </div>
  );
}

function BottleMockup({ bottleColor, capColor, children }: { bottleColor: string; capColor: string; children?: React.ReactNode }) {
  return (
    <div className="relative w-full flex items-center justify-center">
      <svg viewBox="0 0 280 520" className="w-72 drop-shadow-xl">
        <ellipse cx="140" cy="505" rx="80" ry="8" fill="#000" opacity="0.08" />
        <defs>
          <linearGradient id="shine" x1="0" x2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35"/>
            <stop offset="30%" stopColor="#ffffff" stopOpacity="0.05"/>
            <stop offset="100%" stopColor="#000000" stopOpacity="0.06"/>
          </linearGradient>
        </defs>
        <path d="M90 50 h100 v35 c0 10 -10 18 -22 22 v20 c0 10 6 18 6 28 v260 c0 60 -34 92 -84 92s-84 -32 -84 -92V155c0-10 6-18 6-28v-20c-12-4-22-12-22-22V50h100z" fill={bottleColor} stroke="#00000010" strokeWidth="2" />
        <path d="M100 90 c0 0 0 0 0 0 v330 c0 40 18 60 44 60" fill="none" stroke="url(#shine)" strokeWidth="10" />
        <rect x="110" y="20" width="60" height="40" rx="6" fill={capColor} />
        <rect x="110" y="15" width="60" height="10" rx="3" fill="#00000020" />
        <g transform="translate(50, 230)">
          <rect x="0" y="0" width="180" height="120" rx="12" fill="#ffffff90" stroke="#00000010" />
          <foreignObject x="10" y="10" width="160" height="100">
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
