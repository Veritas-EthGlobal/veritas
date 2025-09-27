"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { Check } from "lucide-react";

type FullScreenLoaderProps = {
  active: boolean;
};

const checkpoints = [
  { percent: 25, label: "Initiating Upload" },
  { percent: 50, label: "Analyzing Code" },
  { percent: 75, label: "Finalizing Submission" },
];

const messages = [
  "Analyzing Code...",
  "Compiling results...",
  "Almost there...",
];

export function FullScreenLoader({ active }: FullScreenLoaderProps) {
  const [currentMessage, setCurrentMessage] = React.useState(messages[0]);

  React.useEffect(() => {
    if (active) {
      const intervalId = setInterval(() => {
        setCurrentMessage(
          (prevMessage) =>
            messages[(messages.indexOf(prevMessage) + 1) % messages.length]
        );
      }, 1500);
      return () => clearInterval(intervalId);
    }
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
          <div className="absolute inset-0 border-t-4 border-purple-500 rounded-full animate-spin"></div>
        </div>
        <div className="relative h-8 w-64 text-center mt-4">
          <div
            key={currentMessage}
            className="absolute inset-0 flex items-center justify-center animate-in fade-in"
          >
            <span className="text-lg font-semibold text-white">
              {currentMessage}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

