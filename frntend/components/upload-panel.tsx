"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface UploadPanelProps {
  title: string;
  // Changed to accept a FileList for multiple files
  onFileChange: (files: FileList | null) => void; 
  disabled?: boolean;
  side?: "left" | "right";
}

export function UploadPanel({
  title,
  onFileChange,
  disabled,
  side = "left",
}: UploadPanelProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <Card
      className={cn(
        "bg-white/5 border border-white/10 backdrop-blur-sm",
        side === "right" ? "md:order-3" : "md:order-1"
      )}
    >
      <CardHeader>
        <CardTitle className="text-balance text-white">{title}'s Code</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${title}-file`} className="text-sm text-gray-300">
            Upload codebase (you can select multiple files)
          </Label>
          <Input
            id={`${title}-file`}
            ref={fileInputRef}
            type="file"
            // Allow multiple file extensions
            accept=".zip,.txt,.js,.ts,.tsx,.json,.py,.java,.cs" 
            // The key change: pass the entire FileList, not just the first item
            onChange={(e) => onFileChange(e.target.files)} 
            disabled={disabled}
            className="bg-gray-900/50 border-white/20 file:text-purple-300 file:font-semibold hover:file:bg-purple-500/10"
            // The most important addition: allows selecting multiple files
            multiple 
          />
        </div>
      </CardContent>
    </Card>
  );
}