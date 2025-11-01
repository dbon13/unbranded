
import * as React from 'react'
import { clsx } from 'clsx'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'secondary' | 'ghost' }
export const Button = React.forwardRef<HTMLButtonElement, Props>(function B({ className, variant='default', ...props }, ref){
  const base = 'inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium transition border'
  const styles = variant==='secondary'
    ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-900'
    : variant==='ghost'
    ? 'bg-transparent border-transparent hover:bg-slate-100 text-slate-700'
    : 'bg-slate-900 border-slate-900 text-white hover:bg-black'
  return <button ref={ref} className={clsx(base, styles, className)} {...props}/>
})
export default Button
