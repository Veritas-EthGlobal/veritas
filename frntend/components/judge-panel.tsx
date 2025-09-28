
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLayout } from "@/components/layout/PageLayout";
import { JudgeData } from "@/global";
import { useEffect, useState } from "react";
import React from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { completeZKHammingWorkflow } from "@/Compare";

// --- Props Definition from your original code ---
type JudgePanelProps = {
  data1: JudgeData;
  data2: JudgeData;
};

// --- SimilarityGauge UI Component ---
interface SimilarityGaugeProps {
  score: number;
}

const SimilarityGauge: React.FC<SimilarityGaugeProps> = ({ score }) => {
  const radius = 80;
  const stroke = 15;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const scoreColor =
    score > 75 ? "text-red-500" :
    score > 40 ? "text-yellow-500" :
    "text-green-500";

  return (
    <div className="relative flex items-center justify-center w-52 h-52 my-4">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90">
        <circle
          stroke="rgba(255, 255, 255, 0.1)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className={`transition-all duration-1000 ease-in-out ${scoreColor}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={`text-5xl font-bold tracking-tighter ${scoreColor}`}>
          {score.toFixed(1)}%
        </span>
        <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Similarity</span>
      </div>
    </div>
  );
};


// --- Main JudgePanel Component (Combined Logic and UI) ---
export function JudgePanel({ data1, data2 }: JudgePanelProps) {
  const [similarity, setSimilarity] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getSimilarity = async () => {
      setIsLoading(true);
      setError(null);
      const payload = {
        "hashes_a": data1.hashes2,
        "hashes_b": data2.hashes2,
        "code_chunks_a": data1.code_chunks,
        "code_chunks_b": data2.code_chunks
      };

      try {
        const res = await fetch("http://100.86.219.107:7995/compare-hashes/", {
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(`API Error: ${res.statusText}`);
        }

        const data = await res.json();
        setSimilarity(Number(data.similarity_score));
      } catch (e: any) {
        console.error("Failed to fetch similarity score:", e);
        setError(e.message || "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    getSimilarity();
  }, [data1, data2]);

  const getScoreDescription = (score: number): string => {
    if (score > 75) return "A high degree of similarity was detected, suggesting significant code overlap or shared logic.";
    if (score > 40) return "A moderate level of similarity was found, indicating some common structures or algorithms.";
    return "The codebases are largely distinct, with a low level of detected similarity.";
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-10 text-gray-400">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="font-semibold text-lg">Calculating Score...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-10 text-red-400">
          <AlertCircle className="w-10 h-10" />
          <p className="font-semibold text-lg">Calculation Failed</p>
          <p className="text-sm text-gray-500 max-w-xs">{error}</p>
        </div>
      );
    }
    
    if (similarity !== null) {
      return <SimilarityGauge score={similarity} />;
    }
    
    return null;
  };
  
  return (
    <PageLayout
      title="Analysis Complete"
      description="The similarity analysis has finished. See the results below."
    >
      <div className="flex justify-center items-center w-full">
        <Card className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-sm text-center">
          <CardHeader>
            <CardTitle className="text-3xl">Similarity Score</CardTitle>
            {similarity !== null && !isLoading && (
              <CardDescription className="pt-2">
                {getScoreDescription(similarity)}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-8">
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}