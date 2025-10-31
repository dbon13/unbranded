
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RefreshCw, Upload, Eraser, Maximize2, Plus, Trash2, Type } from "lucide-react";

/**
 * Unbranded Kiosk – v1.3
 * - RIMOSSA etichetta: lavori direttamente sul flacone
 * - Testi liberi (multi-layer) posizionabili con slider
 * - Immagine sul flacone (pos/scala/opacità) clippata alla silhouette
 * - Tappi ridimensionati e centrati
 * - Forme flacone più realistiche (ispirate a shampoo comuni)
 */

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
    bottleShape: "oval",     // oval | softsquare | roundshoulder | slim
    capShape: "disc",        // disc | flip | pump
    bottleColor: "#f4f4f5",
    capColor: "#111827",
    bodyImageUrl: null as string | null,
    bodyImageScale: 1,
    bodyImageX: 0,
    bodyImageY: 0,
    bodyImageOpacity: 1,
    textLayers: [] as TextLayer[],
    activeTextId: "" as string,
    font: "Inter",
  };

  const [state, setState] = useState(() => {
    try { const s = localStorage.getItem("unbranded-kiosk-v13"); return s ? JSON.parse(s) : defaultState; } catch { return defaultState; }
  });
  const set = (patch: Partial<typeof state>) => setState((s:any)=> ({...s, ...patch}));
  useEffect(()=>{ try{ localStorage.setItem("unbranded-kiosk-v13", JSON.stringify(state)); }catch{} }, [state]);

  const {
    theme, bottleShape, capShape, bottleColor, capColor,
    bodyImageUrl, bodyImageScale, bodyImageX, bodyImageY, bodyImageOpacity,
    textLayers, activeTextId, font
  } = state;

  const fonts = ["Inter","Poppins","Montserrat","Playfair Display","Bebas Neue","Roboto Condensed"];

  const shapes:any = {
    oval: {
      vb: "0 0 300 560",
      bodyPath: "M150 40c30 0 54 6 70 18 10 7 21 21 21 40v36c18 8 30 22 30 40v260c0 92-59 116-121 116S29 526 29 434V174c0-18 12-32 30-40v-36c0-19 11-33 21-40 16-12 40-18 70-18z",
      neck: { x: 109, y: 40, w: 82, h: 26, r: 8 },
      printableRect: { x: 55, y: 190, w: 190, h: 180 },
      capWidth: 90
    },
    softsquare: {
      vb: "0 0 300 560",
      bodyPath: "M60 70h180c22 0 40 18 40 40v26c14 8 22 20 22 34v260c0 98-68 130-152 130S-2 528-2 432V170c0-14 8-26 22-34v-26c0-22 18-40 40-40z",
      neck: { x: 104, y: 60, w: 92, h: 28, r: 6 },
      printableRect: { x: 50, y: 200, w: 200, h: 190 },
      capWidth: 104
    },
    roundshoulder: {
      vb: "0 0 300 560",
      bodyPath: "M150 48c68 0 116 30 116 88v298c0 92-64 126-116 126S34 526 34 434V136c0-58 48-88 116-88z",
      neck: { x: 111, y: 48, w: 78, h: 26, r: 8 },
      printableRect: { x: 55, y: 210, w: 190, h: 170 },
      capWidth: 86
    },
    slim: {
      vb: "0 0 300 560",
      bodyPath: "M105 40h90c18 0 32 14 32 32v16c18 8 28 20 28 36v300c0 86-54 120-105 120S45 510 45 424V124c0-16 10-28 28-36V72c0-18 14-32 32-32z",
      neck: { x: 120, y: 40, w: 60, h: 24, r: 6 },
      printableRect: { x: 70, y: 210, w: 160, h: 200 },
      capWidth: 70
    }
  };

  const themes:any = {
    linen: "radial-gradient(40% 60% at 20% 10%, #ffffff 0%, #eef2ff 60%, #e5e7eb 100%), repeating-linear-gradient(0deg, rgba(255,255,255,.35) 0, rgba(255,255,255,.35) 2px, rgba(0,0,0,.012) 2px, rgba(0,0,0,.012) 3px)",
    gradient: "linear-gradient(135deg, #fafafa 0%, #eef2ff 40%, #e9d5ff 100%)",
    carbon: "repeating-linear-gradient(45deg, #f8fafc, #f8fafc 10px, #f1f5f9 10px, #f1f5f9 20px)",
  };

  function addTextLayer(){
    const id = String(Date.now());
    const base = shapes[bottleShape].printableRect;
    const nl:TextLayer = {
      id, text: "Tuo testo", font, size: 36, weight: 700, color: "#111111",
      x: base.x + base.w/2, y: base.y + base.h/2, rotation: 0, opacity: 1, tracking: 0
    };
    set({ textLayers: [...textLayers, nl], activeTextId: id });
  }
  function removeTextLayer(id:string){
    const rest = textLayers.filter(t=>t.id!==id);
    set({ textLayers: rest, activeTextId: rest[0]?.id || "" });
  }
  function updateActive(patch: Partial<TextLayer>){
    set({ textLayers: textLayers.map(t => t.id===activeTextId ? {...t, ...patch} : t) });
  }
  const active = textLayers.find(t=>t.id===activeTextId);

  // Uploads
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

  function randomize() {
    const palette = ["#111111", "#ffffff", "#ef4444", "#10b981", "#3b82f6", "#f59e0b", "#a855f7", "#0ea5e9", "#64748b"];
    const pick = () => palette[Math.floor(Math.random() * palette.length)];
    set({ bottleColor: pick(), capColor: pick() });
  }
  function resetAll() {
    try { localStorage.removeItem("unbranded-kiosk-v13"); } catch {}
    window.location.reload();
  }
  async function goFullscreen() {
    const el = document.documentElement; if (el.requestFullscreen) await el.requestFullscreen();
  }

  const s = shapes[bottleShape];

  return (
    <div className="min-h-screen w-full p-6" style={{ backgroundImage: themes[theme] }}>
      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-2xl">Anteprima</CardTitle>
            <Button onClick={goFullscreen} variant="secondary" className="gap-2"><Maximize2 className="h-4 w-4"/> Kiosk</Button>
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
                  <clipPath id="bottleClip">
                    <path d={s.bodyPath} />
                  </clipPath>
                </defs>
                <ellipse cx="150" cy="540" rx="90" ry="10" fill="#000" opacity="0.08" />
                <path d={s.bodyPath} fill={bottleColor} stroke="#00000010" strokeWidth="2" />
                {/* Immagine clippata */}
                {bodyImageUrl && (
                  <image
                    href={bodyImageUrl}
                    x={s.printableRect.x + bodyImageX}
                    y={s.printableRect.y + bodyImageY}
                    width={s.printableRect.w * bodyImageScale}
                    height={s.printableRect.h * bodyImageScale}
                    opacity={bodyImageOpacity}
                    clipPath="url(#bottleClip)"
                    preserveAspectRatio="xMidYMid slice"
                  />
                )}
                {/* Riflesso */}
                <path d="M110 110 v300 c0 40 18 60 44 60" fill="none" stroke="url(#shine)" strokeWidth="10" />
                {/* Tappo */}
                {capShape === "pump" ? (
                  <g>
                    <rect x={150 - s.capWidth/2} y={s.neck.y-8} width={s.capWidth} height="16" rx="4" fill="#00000020" />
                    <rect x={150 - s.capWidth/2 - 6} y={s.neck.y+8} width={s.capWidth+12} height="36" rx="8" fill={capColor} />
                    <rect x={150 + s.capWidth/2 - 6} y={s.neck.y-6} width="46" height="10" rx="5" fill={capColor} />
                    <circle cx={150 + s.capWidth/2 + 40} cy={s.neck.y-1} r="5" fill={capColor} />
                  </g>
                ) : capShape === "flip" ? (
                  <g>
                    <rect x={150 - s.capWidth/2} y={s.neck.y+6} width={s.capWidth} height="36" rx="8" fill={capColor} />
                    <rect x={150 - s.capWidth/2} y={s.neck.y-4} width={s.capWidth} height="12" rx="3" fill="#00000020" />
                    <rect x={150 - 8} y={s.neck.y-6} width="16" height="8" rx="2" fill="#00000030" />
                  </g>
                ) : (
                  <g>
                    <rect x={150 - s.capWidth/2} y={s.neck.y+6} width={s.capWidth} height="36" rx="8" fill={capColor} />
                    <rect x={150 - s.capWidth/2} y={s.neck.y} width={s.capWidth} height="10" rx="3" fill="#00000020" />
                  </g>
                )}
                {/* Testi liberi */}
                {textLayers.map(t => (
                  <g key={t.id} transform={`rotate(${t.rotation}, ${t.x}, ${t.y})`} opacity={t.opacity} clipPath="url(#bottleClip)">
                    <text x={t.x} y={t.y} textAnchor="middle"
                      fontFamily={t.font} fontWeight={t.weight} fontSize={t.size}
                      fill={t.color} style={{letterSpacing: `${t.tracking}px`}}>
                      {t.text}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Personalizza</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
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
                  <select value={bottleShape} onChange={(e)=>set({ bottleShape: e.target.value })} className="h-10 px-3 rounded-xl border w-full">
                    <option value="oval">Ovale</option>
                    <option value="softsquare">Squadrato morbido</option>
                    <option value="roundshoulder">Spalle arrotondate</option>
                    <option value="slim">Slim</option>
                  </select>
                </div>
                <div>
                  <Label>Tappo</Label>
                  <select value={capShape} onChange={(e)=>set({ capShape: e.target.value })} className="h-10 px-3 rounded-xl border w-full">
                    <option value="disc">Piatto</option>
                    <option value="flip">Flip-top</option>
                    <option value="pump">Dosatore</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <ColorInput label="Colore flacone" value={bottleColor} onChange={(v)=>set({ bottleColor:v })} />
                <ColorInput label="Colore tappo" value={capColor} onChange={(v)=>set({ capColor:v })} />
              </div>

              {/* Immagine sul corpo */}
              <div className="space-y-2">
                <Label>Immagine sul flacone</Label>
                <div className="flex items-center gap-3">
                  <Input type="file" accept="image/*" onChange={(e:any)=>{
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { alert("Usa PNG/JPG/WEBP."); return; }
                    if (file.size > 6 * 1024 * 1024) { alert("Max 6MB."); return; }
                    const reader = new FileReader();
                    reader.onload = () => set({ bodyImageUrl: reader.result as string });
                    reader.readAsDataURL(file);
                  }} />
                  <Button type="button" variant="secondary" onClick={()=>set({ bodyImageUrl: null })} className="gap-2"><Upload className="h-4 w-4"/>Rimuovi</Button>
                </div>
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div>
                    <Label>Scala</Label>
                    <Slider value={[bodyImageScale]} min={0.2} max={2} step={0.05} onChange={(v:any)=>set({ bodyImageScale: v[0] })} />
                    <div className="text-xs text-slate-500">{bodyImageScale.toFixed(2)}×</div>
                  </div>
                  <div>
                    <Label>X</Label>
                    <Slider value={[bodyImageX]} min={-120} max={120} step={1} onChange={(v:any)=>set({ bodyImageX: v[0] })} />
                    <div className="text-xs text-slate-500">{bodyImageX}px</div>
                  </div>
                  <div>
                    <Label>Y</Label>
                    <Slider value={[bodyImageY]} min={-120} max={120} step={1} onChange={(v:any)=>set({ bodyImageY: v[0] })} />
                    <div className="text-xs text-slate-500">{bodyImageY}px</div>
                  </div>
                </div>
                <div>
                  <Label>Opacità</Label>
                  <Slider value={[bodyImageOpacity]} min={0.1} max={1} step={0.05} onChange={(v:any)=>set({ bodyImageOpacity: v[0] })} />
                  <div className="text-xs text-slate-500">{Math.round(bodyImageOpacity*100)}%</div>
                </div>
              </div>

              {/* Testi liberi */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-slate-700 flex items-center gap-2"><Type className="h-4 w-4" /> Testi</div>
                  <Button onClick={addTextLayer} className="gap-2"><Plus className="h-4 w-4" />Aggiungi testo</Button>
                </div>
                {textLayers.length === 0 && <div className="text-sm text-slate-500">Nessun testo: usa “Aggiungi testo”.</div>}
                {textLayers.map(t => (
                  <div key={t.id} className={"rounded-xl border p-3 "+(t.id===activeTextId?"border-slate-800":"")}>
                    <div className="flex items-center justify-between">
                      <button className="text-sm font-semibold" onClick={()=>set({ activeTextId: t.id })}>
                        {t.text || "Testo"}
                      </button>
                      <Button variant="ghost" onClick={()=>removeTextLayer(t.id)} className="gap-2 text-red-600"><Trash2 className="h-4 w-4"/>Rimuovi</Button>
                    </div>
                  </div>
                ))}
                {active && (
                  <div className="space-y-3 rounded-xl border p-3 bg-white/60">
                    <Label>Contenuto</Label>
                    <Input value={active.text} onChange={(e)=>updateActive({ text: e.target.value })} placeholder="Scrivi qui…" />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Font</Label>
                        <select value={active.font} onChange={(e)=>updateActive({ font: e.target.value })} className="h-10 px-3 rounded-xl border w-full">
                          {fonts.map(f=> <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label>Colore</Label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={active.color} onChange={(e)=>updateActive({ color: e.target.value })} className="h-10 w-16 rounded-lg border" />
                          <Input value={active.color} onChange={(e)=>updateActive({ color: e.target.value })} />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Dimensione</Label>
                        <Slider value={[active.size]} min={12} max={96} step={1} onChange={(v:any)=>updateActive({ size: v[0] })} />
                        <div className="text-xs text-slate-500">{active.size}px</div>
                      </div>
                      <div>
                        <Label>Spessore</Label>
                        <Slider value={[active.weight]} min={300} max={900} step={100} onChange={(v:any)=>updateActive({ weight: v[0] })} />
                        <div className="text-xs text-slate-500">{active.weight}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Posizione X</Label>
                        <Slider value={[active.x]} min={s.printableRect.x-40} max={s.printableRect.x+s.printableRect.w+40} step={1} onChange={(v:any)=>updateActive({ x: v[0] })} />
                        <div className="text-xs text-slate-500">{active.x}px</div>
                      </div>
                      <div>
                        <Label>Posizione Y</Label>
                        <Slider value={[active.y]} min={s.printableRect.y-40} max={s.printableRect.y+s.printableRect.h+40} step={1} onChange={(v:any)=>updateActive({ y: v[0] })} />
                        <div className="text-xs text-slate-500">{active.y}px</div>
                      </div>
                      <div>
                        <Label>Rotazione</Label>
                        <Slider value={[active.rotation]} min={-45} max={45} step={1} onChange={(v:any)=>updateActive({ rotation: v[0] })} />
                        <div className="text-xs text-slate-500">{active.rotation}°</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Spaziatura lettere</Label>
                        <Slider value={[active.tracking]} min={-2} max={8} step={0.1} onChange={(v:any)=>updateActive({ tracking: v[0] })} />
                        <div className="text-xs text-slate-500">{active.tracking}px</div>
                      </div>
                      <div>
                        <Label>Opacità</Label>
                        <Slider value={[active.opacity]} min={0.1} max={1} step={0.05} onChange={(v:any)=>updateActive({ opacity: v[0] })} />
                        <div className="text-xs text-slate-500">{Math.round(active.opacity*100)}%</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button variant="secondary" onClick={randomize} className="gap-2"><RefreshCw className="h-4 w-4"/>Sorprendimi</Button>
                <Button variant="ghost" onClick={resetAll} className="gap-2"><Eraser className="h-4 w-4"/>Reset</Button>
              </div>

              <Hint>
                Ora lavori *direttamente* sul flacone: carica un'immagine e aggiungi testi liberi. I tappi sono stati dimensionati per aderire al collo di ciascuna forma.
              </Hint>
            </div>
          </CardContent>
        </Card>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&family=Poppins:wght@400;700&family=Montserrat:wght@400;700&family=Playfair+Display:wght@500;700&family=Bebas+Neue&family=Roboto+Condensed:wght@400;700&display=swap');
        body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; }
      `}</style>
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
