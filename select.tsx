
import React, { useState } from 'react'
export function Select({ value, onValueChange, children }:{ value:string, onValueChange:(v:string)=>void, children:React.ReactNode }){
  return <div className="relative">{children}</div>
}
export function SelectTrigger({ children }:{ children:React.ReactNode }){
  return <div className="h-10 px-3 flex items-center rounded-xl border bg-white">{children}</div>
}
export function SelectValue({ placeholder }:{ placeholder?:string }){
  return <span className="text-sm text-slate-600">{placeholder}</span>
}
export function SelectContent({ children }:{ children:React.ReactNode }){ return <div className="hidden">{children}</div> }
export function SelectItem({ value, onSelect, children }:{ value:string, onSelect?:(v:string)=>void, children:React.ReactNode }){
  return <button type="button" className="hidden" onClick={()=>onSelect && onSelect(value)}>{children}</button>
}
