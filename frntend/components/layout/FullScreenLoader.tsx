"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { Check } from "lucide-react";

type FullScreenLoaderProps = {
  direction: "ltr" | "rtl";
  active: boolean;
  durationMs?: number;
  checkpointsReached: number;
};

const checkpoints = [
  { percent: 25, label: "Initiating Upload" },
  { percent: 50, label: "Analyzing Code" },
  { percent: 75, label: "Finalizing Submission" },
];

export function FullScreenLoader({
  direction,
  active,
  durationMs = 8000,
  checkpointsReached,
}: FullScreenLoaderProps) {
  const [isAnimating, setIsAnimating] = React.useState(false);
  const currentMessage = checkpoints[checkpointsReached - 1]?.label;

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (active) {
      timer = setTimeout(() => {
        setIsAnimating(true);
      }, 50);
    } else {
      setIsAnimating(false);
    }
    return () => clearTimeout(timer);
  }, [active]);

  if (!active) return null;

  return (
    <>
      {/* Progress bar and checkpoints */}
      <div className="fixed left-0 w-full z-50 pointer-events-none p-4 pt-8">
        <div className="relative w-full h-1.5">
          {/* Background of the bar */}
          <div className="absolute top-0 left-0 w-full h-full bg-white/10 rounded-full" />

          {/* The moving bar */}
          <div
            className={cn(
              "h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-transform ease-linear rounded-full",
              direction === "ltr" ? "origin-left" : "origin-right"
            )}
            style={{
              transform: isAnimating ? "scaleX(1)" : "scaleX(0)",
              transitionDuration: `${durationMs}ms`,
            }}
          />

          {/* Checkpoint markers */}
          <div className="absolute top-1/2 left-0 w-full h-full">
            {checkpoints.map((cp, index) => {
              const isReached = index + 1 <= checkpointsReached;
              return (
                <div
                  key={cp.percent}
                  className="absolute top-1/2 -translate-y-1/2"
                  style={{
                    [direction === "ltr" ? "left" : "right"]: `${cp.percent}%`,
                  }}
                >
                  <div className="relative flex flex-col items-center -translate-x-1/2">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 transition-all duration-300 flex items-center justify-center",
                        isReached
                          ? "bg-purple-500 border-purple-400 scale-110"
                          : "bg-gray-800 border-gray-600"
                      )}
                    >
                      {isReached && (
                        <Check className="w-3 h-3 text-white transition-opacity delay-200 duration-300" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Centralized Checkpoint Message */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
        <div className="relative h-8 w-64 text-center">
            {currentMessage && (
              <div
                key={currentMessage} // This key change will re-trigger the animation
                className="absolute inset-0 flex items-center justify-center animate-in fade-in"
              >
                <span className="px-4 py-2 text-sm font-semibold text-white bg-black/30 rounded-lg backdrop-blur-sm border border-white/10 shadow-lg">
                  {currentMessage}
                </span>
              </div>
            )}
        </div>
      </div>
    </>
  );
}

