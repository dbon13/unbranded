
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RefreshCw, Upload, Eraser, Maximize2, Plus, Trash2, Type, Crop } from "lucide-react";

type TextLayer = {
  id: string;
  text: string;
  font: string;
  size: number;
  weight: number;
  color: string;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  tracking: number;
};

export default function App() {
  const defaultState = {
    theme: "linen",
    bottleShape: "rectshoulder",
    bottleColor: "#f3f4f6",
    bodyImageUrl: null as string | null,
    bodyImageScale: 1,
    bodyImageX: 0,
    bodyImageY: 0,
    bodyImageOpacity: 1,
    bodyImageFit: "contain" as "contain" | "cover",
    textLayers: [] as TextLayer[],
    activeTextId: "" as string,
    font: "Inter",
  };

  const [state, setState] = useState(() => {
    try { const s = localStorage.getItem("unbranded-kiosk-v14"); return s ? JSON.parse(s) : defaultState; } catch { return defaultState; }
  });
  const set = (patch: Partial<typeof state>) => setState((s:any)=> ({...s, ...patch}));
  useEffect(()=>{ try{ localStorage.setItem("unbranded-kiosk-v14", JSON.stringify(state)); }catch{} }, [state]);

  const { theme, bottleShape, bottleColor, bodyImageUrl, bodyImageScale, bodyImageX, bodyImageY, bodyImageOpacity, bodyImageFit, textLayers, activeTextId, font } = state;

  const shapes:any = {
    rectshoulder: { vb: "0 0 320 560", bodyPath: "M70 80h180c26 0 48 22 48 48v36c18 8 30 24 30 42v258c0 92-64 128-128 128S92 556 92 464V206c0-18 12-34 30-42v-36c0-26 22-48 48-48z", printableRect: { x: 70, y: 200, w: 180, h: 220 }, },
    bricksquare: { vb: "0 0 320 560", bodyPath: "M64 76h192c24 0 44 20 44 44v24c18 8 28 22 28 38v286c0 100-84 132-156 132S8 568 8 468V182c0-16 10-30 28-38v-24c0-24 20-44 44-44z", printableRect: { x: 58, y: 210, w: 204, h: 230 }, },
    ovalsquare: { vb: "0 0 320 560", bodyPath: "M160 60c72 0 120 36 120 92v300c0 90-64 124-120 124S40 542 40 452V152c0-56 48-92 120-92z", printableRect: { x: 70, y: 220, w: 180, h: 210 }, },
    airless: { vb: "0 0 320 560", bodyPath: "M120 60h80c20 0 36 16 36 36v368c0 90-52 120-76 120h-0c-24 0-76-30-76-120V96c0-20 16-36 36-36z", printableRect: { x: 90, y: 140, w: 140, h: 280 }, },
    roundjar: { vb: "0 0 320 560", bodyPath: "M80 140h160c42 0 76 34 76 76v170c0 88-66 132-156 132S4 474 4 386V216c0-42 34-76 76-76z", printableRect: { x: 60, y: 210, w: 200, h: 180 }, },
  };
  const themes:any = {
    linen: "radial-gradient(40% 60% at 20% 10%, #ffffff 0%, #eef2ff 60%, #e5e7eb 100%), repeating-linear-gradient(0deg, rgba(255,255,255,.35) 0, rgba(255,255,255,.35) 2px, rgba(0,0,0,.012) 2px, rgba(0,0,0,.012) 3px)",
    gradient: "linear-gradient(135deg, #fafafa 0%, #eef2ff 40%, #e9d5ff 100%)",
    carbon: "repeating-linear-gradient(45deg, #f8fafc, #f8fafc 10px, #f1f5f9 10px, #f1f5f9 20px)",
  };
  const s = shapes[bottleShape];

  function addTextLayer(){
    const id = String(Date.now());
    const base = s.printableRect;
    const nl:TextLayer = { id, text: "Tuo testo", font, size: 36, weight: 700, color: "#111111", x: base.x+base.w/2, y: base.y+base.h/2, rotation: 0, opacity: 1, tracking: 0 };
    set({ textLayers: [...textLayers, nl], activeTextId: id });
  }

  return (
    <div className="min-h-screen w-full p-6" style={{ backgroundImage: themes[theme] }}>
      <div className="max-w-6xl mx-auto mb-4 flex justify-center">
        <img src="/logo-unbranded.png" alt="Unbranded" className="h-8 object-contain" />
      </div>

      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-2xl">Anteprima</CardTitle>
            <Button onClick={()=>document.documentElement.requestFullscreen?.()} variant="secondary" className="gap-2"><Maximize2 className="h-4 w-4"/>Kiosk</Button>
          </CardHeader>
          <CardContent>
            <div className="w-full flex items-center justify-center">
              <svg viewBox={s.vb} className="w-80 drop-shadow-xl">
                <defs>
                  <linearGradient id="shine" x1="0" x2="1">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35"/>
                    <stop offset="30%" stopColor="#ffffff" stopOpacity="0.05"/>
                    <stop offset="100%" stopColor="#000000" stopOpacity="0.06"/>
                  </linearGradient>
                  <clipPath id="bottleClip"><path d={s.bodyPath} /></clipPath>
                </defs>
                <ellipse cx="160" cy="540" rx="95" ry="10" fill="#000" opacity="0.08" />
                <path d={s.bodyPath} fill={bottleColor} stroke="#00000010" strokeWidth="2" />
                {bodyImageUrl && (
                  bodyImageFit === "cover" ? (
                    <image href={bodyImageUrl} x={-80 + bodyImageX} y={-80 + bodyImageY} width={480 * bodyImageScale} height={720 * bodyImageScale} opacity={bodyImageOpacity} clipPath="url(#bottleClip)" preserveAspectRatio="xMidYMid slice" />
                  ) : (
                    <image href={bodyImageUrl} x={s.printableRect.x + bodyImageX} y={s.printableRect.y + bodyImageY} width={s.printableRect.w * bodyImageScale} height={s.printableRect.h * bodyImageScale} opacity={bodyImageOpacity} clipPath="url(#bottleClip)" preserveAspectRatio="xMidYMid meet" />
                  )
                )}
                <path d="M110 120 v300 c0 40 18 60 44 60" fill="none" stroke="url(#shine)" strokeWidth="10" />
                {textLayers.map(t => (
                  <g key={t.id} transform={`rotate(${t.rotation}, ${t.x}, ${t.y})`} opacity={t.opacity} clipPath="url(#bottleClip)">
                    <text x={t.x} y={t.y} textAnchor="middle" fontFamily={t.font} fontWeight={t.weight} fontSize={t.size} fill={t.color} style={{letterSpacing: `${t.tracking}px`}}>{t.text}</text>
                  </g>
                ))}
              </svg>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader><CardTitle className="text-2xl">Personalizza</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Sfondo</Label>
                  <select value={theme} onChange={(e)=>set({ theme: e.target.value })} className="h-10 px-3 rounded-xl border w-full">
                    <option value="linen">Linen</option>
                    <option value="gradient">Gradiente</option>
                    <option value="carbon">Carbon</option>
                  </select>
                </div>
                <div>
                  <Label>Forma</Label>
                  <select value={bottleShape} onChange={(e)=>set({ bottleShape: e.target.value })} className="h-10 px-3 rounded-xl border w-full">
                    <option value="rectshoulder">Spalle squadrate</option>
                    <option value="bricksquare">Squadrato</option>
                    <option value="ovalsquare">Ovale/square</option>
                    <option value="airless">Airless cilindrico</option>
                    <option value="roundjar">Panciuta</option>
                  </select>
                </div>
                <div>
                  <Label>Colore flacone</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={bottleColor} onChange={(e)=>set({ bottleColor: e.target.value })} className="h-10 w-16 rounded-lg border"/>
                    <Input value={bottleColor} onChange={(e)=>set({ bottleColor: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Immagine */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2"><Crop className="h-4 w-4"/> Immagine sul flacone</Label>
                  <div className="flex gap-2">
                    <Button variant={bodyImageFit==='contain'?'default':'secondary'} onClick={()=>set({ bodyImageFit:'contain' })}>Contain</Button>
                    <Button variant={bodyImageFit==='cover'?'default':'secondary'} onClick={()=>set({ bodyImageFit:'cover' })}>Cover</Button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Input type="file" accept="image/*" onChange={(e:any)=>{
                    const file = e.target.files?.[0]; if (!file) return;
                    if (!/^image\\/(png|jpeg|webp)$/.test(file.type)) { alert("Usa PNG/JPG/WEBP."); return; }
                    if (file.size > 12 * 1024 * 1024) { alert("Max 12MB."); return; }
                    const reader = new FileReader();
                    reader.onload = () => set({ bodyImageUrl: reader.result as string });
                    reader.readAsDataURL(file);
                  }} />
                  <Button type="button" variant="secondary" onClick={()=>set({ bodyImageUrl: null })}>Rimuovi</Button>
                </div>
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div><Label>Scala</Label><Slider value={[bodyImageScale]} min={0.1} max={6} step={0.05} onChange={(v:any)=>set({ bodyImageScale: v[0] })} /><div className="text-xs text-slate-500">{bodyImageScale.toFixed(2)}×</div></div>
                  <div><Label>X</Label><Slider value={[bodyImageX]} min={-400} max={400} step={1} onChange={(v:any)=>set({ bodyImageX: v[0] })} /><div className="text-xs text-slate-500">{bodyImageX}px</div></div>
                  <div><Label>Y</Label><Slider value={[bodyImageY]} min={-400} max={400} step={1} onChange={(v:any)=>set({ bodyImageY: v[0] })} /><div className="text-xs text-slate-500">{bodyImageY}px</div></div>
                </div>
                <div><Label>Opacità</Label><Slider value={[bodyImageOpacity]} min={0.1} max={1} step={0.05} onChange={(v:any)=>set({ bodyImageOpacity: v[0] })} /><div className="text-xs text-slate-500">{Math.round(bodyImageOpacity*100)}%</div></div>
              </div>

              {/* Testi */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-slate-700 flex items-center gap-2"><Type className="h-4 w-4" /> Testi</div>
                  <Button onClick={addTextLayer} className="gap-2"><Plus className="h-4 w-4" />Aggiungi testo</Button>
                </div>
                {textLayers.length === 0 && <div className="text-sm text-slate-500">Nessun testo: usa “Aggiungi testo”.</div>}
                {textLayers.map(t => (
                  <div key={t.id} className={"rounded-xl border p-3 "+(t.id===activeTextId?"border-slate-800":"")}>
                    <div className="flex items-center justify-between">
                      <button className="text-sm font-semibold" onClick={()=>set({ activeTextId: t.id })}>{t.text || "Testo"}</button>
                      <Button variant="ghost" onClick={()=>set({ textLayers: textLayers.filter(x=>x.id!==t.id), activeTextId: textLayers.filter(x=>x.id!==t.id)[0]?.id || "" })} className="text-red-600"> <Trash2 className="h-4 w-4"/> Rimuovi</Button>
                    </div>
                    {activeTextId===t.id && (
                      <div className="mt-3 grid grid-cols-2 gap-4">
                        <div>
                          <Label>Font</Label>
                          <select value={t.font} onChange={(e)=>set({ textLayers: textLayers.map(x=>x.id===t.id?{...x, font:e.target.value}:x) })} className="h-10 px-3 rounded-xl border w-full">
                            {["Inter","Poppins","Montserrat","Playfair Display","Bebas Neue","Roboto Condensed"].map(f=> <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                        <div>
                          <Label>Colore</Label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={t.color} onChange={(e)=>set({ textLayers: textLayers.map(x=>x.id===t.id?{...x, color:e.target.value}:x) })} className="h-10 w-16 rounded-lg border" />
                            <Input value={t.color} onChange={(e)=>set({ textLayers: textLayers.map(x=>x.id===t.id?{...x, color:e.target.value}:x) })} />
                          </div>
                        </div>
                        <div><Label>Dimensione</Label><Slider value={[t.size]} min={12} max={120} step={1} onChange={(v:any)=>set({ textLayers: textLayers.map(x=>x.id===t.id?{...x, size:v[0]}:x) })} /></div>
                        <div><Label>Peso</Label><Slider value={[t.weight]} min={300} max={900} step={100} onChange={(v:any)=>set({ textLayers: textLayers.map(x=>x.id===t.id?{...x, weight:v[0]}:x) })} /></div>
                        <div className="col-span-2 grid grid-cols-3 gap-4">
                          <div><Label>X</Label><Slider value={[t.x]} min={0} max={320} step={1} onChange={(v:any)=>set({ textLayers: textLayers.map(x=>x.id===t.id?{...x, x:v[0]}:x) })} /></div>
                          <div><Label>Y</Label><Slider value={[t.y]} min={0} max={560} step={1} onChange={(v:any)=>set({ textLayers: textLayers.map(x=>x.id===t.id?{...x, y:v[0]}:x) })} /></div>
                          <div><Label>Rotazione</Label><Slider value={[t.rotation]} min={-90} max={90} step={1} onChange={(v:any)=>set({ textLayers: textLayers.map(x=>x.id===t.id?{...x, rotation:v[0]}:x) })} /></div>
                        </div>
                        <div><Label>Tracking</Label><Slider value={[t.tracking]} min={-2} max={8} step={0.1} onChange={(v:any)=>set({ textLayers: textLayers.map(x=>x.id===t.id?{...x, tracking:v[0]}:x) })} /></div>
                        <div><Label>Opacità</Label><Slider value={[t.opacity]} min={0.1} max={1} step={0.05} onChange={(v:any)=>set({ textLayers: textLayers.map(x=>x.id===t.id?{...x, opacity:v[0]}:x) })} /></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={()=>{
                  const palette = ["#111111","#ffffff","#ef4444","#10b981","#3b82f6","#f59e0b","#a855f7","#0ea5e9","#64748b"];
                  const pick = ()=>palette[Math.floor(Math.random()*palette.length)];
                  set({ bottleColor: pick() });
                }} className="gap-2"><RefreshCw className="h-4 w-4"/>Sorprendimi</Button>
                <Button variant="ghost" onClick={()=>{ try{ localStorage.removeItem('unbranded-kiosk-v14'); }catch{}; location.reload(); }} className="gap-2"><Eraser className="h-4 w-4"/>Reset</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&family=Poppins:wght@400;700&family=Montserrat:wght@400;700&family=Playfair+Display:wght@500;700&family=Bebas+Neue&family=Roboto+Condensed:wght@400;700&display=swap');
        body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; }
      `}</style>
    </div>
  )
}
