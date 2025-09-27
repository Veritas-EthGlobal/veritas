"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// This loader is specifically for the Judge's view.
interface DuelLoaderProps {
  // These props will be controlled by the Judge page's state.
  user1Ready: boolean;
  user2Ready: boolean;
  isComparing: boolean; // This triggers the final central spinner
}

const messages = [
  "Comparing submissions...",
  "Running static analysis...",
  "Finalizing results...",
  "Calculating verdict...",
];

export function DuelLoader({ user1Ready, user2Ready, isComparing }: DuelLoaderProps) {
  const [currentMessage, setCurrentMessage] = React.useState(messages[0]);

  // This effect cycles through the messages when the final comparison is active.
  React.useEffect(() => {
    if (isComparing) {
      const intervalId = setInterval(() => {
        setCurrentMessage(
          (prev) => messages[(messages.indexOf(prev) + 1) % messages.length]
        );
      }, 2000); // Change message every 2 seconds
      return () => clearInterval(intervalId);
    }
  }, [isComparing]);
  
  // The loader is always "in" the DOM when active, but its visual elements
  // are controlled by the props.
  const isActive = user1Ready || user2Ready || isComparing;
  if (!isActive) return null;

  return (
    // The main container overlays the entire screen but doesn't block clicks
    // until the final comparison phase.
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center",
      isComparing ? "bg-black/80 backdrop-blur-sm" : "pointer-events-none"
    )}>
      
      {/* Player 1's Progress Bar (from left) */}
      <div
        className={cn(
          "absolute top-0 left-0 h-2 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000 ease-out",
          user1Ready ? "w-1/2" : "w-0" // Animate width from 0 to 50%
        )}
      />
      
      {/* Player 2's Progress Bar (from right) */}
      <div
        className={cn(
          "absolute top-0 right-0 h-2 bg-gradient-to-l from-cyan-500 to-blue-500 transition-all duration-1000 ease-out",
          user2Ready ? "w-1/2" : "w-0" // Animate width from 0 to 50%
        )}
      />
      
      {/* Central Spinner and Message (only when both are ready and comparing) */}
      {isComparing && (
        <div className="flex flex-col items-center animate-in fade-in duration-500">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
            <div className="absolute inset-0 border-t-4 border-purple-500 rounded-full animate-spin"></div>
          </div>
          <div className="relative h-8 w-64 text-center mt-4">
             <div
              key={currentMessage} // Key change re-triggers animation
              className="absolute inset-0 flex items-center justify-center animate-in fade-in"
            >
              <span className="text-lg font-semibold text-white">
                {currentMessage}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
