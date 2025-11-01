
import * as React from 'react'
import { clsx } from 'clsx'
export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>){
  return <input className={clsx('h-10 rounded-xl border px-3 text-sm', className)} {...props} />
}
export default Input
