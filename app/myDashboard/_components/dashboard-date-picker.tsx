"use client"

import { CalendarDays } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const dateFormatter = new Intl.DateTimeFormat("de-CH", {
  dateStyle: "medium",
})

export function DashboardDatePicker({
  ariaLabel,
  className,
  id,
  name,
  onChange,
  value,
}: {
  ariaLabel?: string
  className?: string
  id: string
  name: string
  onChange: (value: string) => void
  value: string
}) {
  const selectedDate = dateFromInputValue(value)

  return (
    <>
      <input id={id} name={name} type="hidden" value={value} />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            aria-label={ariaLabel}
            className={cn("w-full justify-start text-left font-normal", className)}
            type="button"
            variant="outline"
          >
            <CalendarDays data-icon="inline-start" />
            {formatDashboardDate(value)}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto border-white/10 bg-black p-3 text-white">
          <Calendar
            mode="single"
            defaultMonth={selectedDate}
            selected={selectedDate}
            onSelect={(nextDate) => {
              if (nextDate) onChange(toDateInputValue(nextDate))
            }}
          />
        </PopoverContent>
      </Popover>
    </>
  )
}

export function todayInputValue() {
  return toDateInputValue(new Date())
}

export function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function dateFromInputValue(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function formatDashboardDate(value: string) {
  return dateFormatter.format(dateFromInputValue(value))
}
