"use client"

import type React from "react"

import { Input } from "@/components/ui/input"

interface TimeInputProps {
  id: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function TimeInput({ id, value, onChange, disabled = false }: TimeInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return <Input id={id} type="time" value={value} onChange={handleChange} disabled={disabled} />
}
