
import React from 'react'
export function RadioGroup({ value, onValueChange, className, children }:{ value:string, onValueChange:(v:string)=>void, className?:string, children:React.ReactNode }){
  return <div className={className}>{React.Children.map(children, (child:any)=> React.cloneElement(child, { current:value, onSelect:(v:string)=>onValueChange(v) }))}</div>
}
export function RadioGroupItem({ id, value, current, onSelect }:{ id:string, value:string, current?:string, onSelect?:(v:string)=>void }){
  const checked = current===value
  return <input id={id} type="radio" checked={checked} onChange={()=>onSelect && onSelect(value)} />
}
