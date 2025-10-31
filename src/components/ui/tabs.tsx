
import React, { useState } from 'react'
export function Tabs({ defaultValue, children }:{ defaultValue: string, children: React.ReactNode }){
  const [value, setValue] = useState(defaultValue)
  return <div data-tabs value={value} onChange={()=>{}}>{React.Children.map(children, (child:any)=> React.cloneElement(child, { value, setValue }))}</div>
}
export function TabsList({ children }:{ children: React.ReactNode }){
  return <div className="flex gap-2">{children}</div>
}
export function TabsTrigger({ children, tab, value, setValue }:{ children:React.ReactNode, tab?:string, value?:string, setValue?:(v:string)=>void }){
  const active = value===tab
  return <button onClick={()=>setValue && setValue(tab!)} className={'px-3 py-2 rounded-xl text-sm '+(active?'bg-slate-900 text-white':'bg-slate-100')}>{children}</button>
}
export function TabsContent({ children, when, value }:{ children:React.ReactNode, when?:string, value?:string }){
  if(value!==when) return null
  return <div>{children}</div>
}
