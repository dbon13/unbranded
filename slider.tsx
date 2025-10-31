
import React from 'react'
export function Slider({ value, onChange, min=0, max=100, step=1 }:{value:number[], onChange:(v:number[])=>void, min?:number, max?:number, step?:number}) {
  return (
    <input type="range" min={min} max={max} step={step}
      value={value[0]}
      onChange={(e)=>onChange([Number(e.target.value)])}
      className="w-full"
    />
  )
}
