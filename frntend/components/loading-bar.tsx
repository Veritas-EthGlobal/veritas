"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type Direction = "ltr" | "rtl"

interface LoadingBarProps {
  direction: Direction
  active: boolean
  durationMs?: number
  checkpointsReached: number // 0..3
  className?: string
}

export function LoadingBar({ direction, active, durationMs = 3500, checkpointsReached, className }: LoadingBarProps) {
  const [animate, setAnimate] = React.useState(false)

  React.useEffect(() => {
    if (active) {
      // trigger width transition from 0% -> 100%
      const id = setTimeout(() => setAnimate(true), 50)
      return () => clearTimeout(id)
    }
    setAnimate(false)
  }, [active])

  return (
    <div className={cn("w-full space-y-3", className)}>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div
          className={cn(
            "absolute top-0 h-2 rounded-full bg-primary transition-[width] ease-linear",
            direction === "ltr" ? "left-0" : "right-0",
          )}
          style={{
            width: animate ? "100%" : "0%",
            transitionDuration: `${durationMs}ms`,
          }}
        />
      </div>

      <div className="flex items-center justify-between" aria-label="Loading checkpoints">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex flex-col items-center">
            <span
              className={cn("h-3 w-3 rounded-full", n <= checkpointsReached ? "bg-primary" : "bg-muted-foreground/30")}
            />
            <span className="mt-1 text-xs text-muted-foreground">{`Stage ${n}`}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
