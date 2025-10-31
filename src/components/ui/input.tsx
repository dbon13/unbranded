
import React from 'react'
import { cn } from '@/lib/utils'
export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('h-10 px-3 rounded-xl border w-full outline-none focus:ring-2 ring-slate-300', className)} {...props} />
}
