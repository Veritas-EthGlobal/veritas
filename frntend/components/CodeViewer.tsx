// components/CodeViewer.tsx
import React from 'react';

interface CodeViewerProps {
  content: string;
  linesToHighlight?: number[]; // An array of line numbers to highlight
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ content, linesToHighlight = [] }) => {
  // Split the raw code string into an array of individual lines
  const lines = content.split('\n');

  return (
    // This is the main container, styled like your old <pre> tag
    <div className="text-sm text-gray-200 bg-gray-900/50 p-4 rounded-md max-h-[450px] overflow-auto font-mono">
      {lines.map((line, index) => {
        const lineNumber = index + 1;
        // Check if the current line number is in our list of lines to highlight
        const isHighlighted = linesToHighlight.includes(lineNumber);

        return (
          // Each line is a flex container
          <div
            key={lineNumber}
            // Apply a background color ONLY if isHighlighted is true
            className={`flex items-start ${isHighlighted ? 'bg-purple-900/60' : ''}`}
          >
            {/* 1. The Line Number */}
            <span className="text-right text-gray-500 pr-4 select-none w-12">
              {lineNumber}
            </span>
            {/* 2. The Code on that line */}
            <span className="flex-1 whitespace-pre-wrap">
              {line}
            </span>
          </div>
        );
      })}
    </div>
  );
};