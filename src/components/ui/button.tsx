
import React from 'react'
import { cn } from '@/lib/utils'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default'|'secondary'|'ghost' }
export function Button({ className, variant='default', ...props }: Props) {
  const base = 'px-4 py-2 rounded-2xl shadow-sm text-sm font-medium transition active:scale-[.98]'
  const variants = {
    default: 'bg-slate-900 text-white hover:bg-slate-800',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
    ghost: 'bg-transparent hover:bg-slate-100'
  } as const
  return <button className={cn(base, variants[variant], className)} {...props} />
}
