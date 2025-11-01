
import * as React from 'react'
export function Slider({ value, min=0, max=100, step=1, onChange }:{ value:number[]; min?:number; max?:number; step?:number; onChange:(v:number[])=>void }){
  return <input type="range" min={min} max={max} step={step} value={value[0]} onChange={(e)=>onChange([Number(e.target.value)])} className="w-full" />
}
export default Slider
