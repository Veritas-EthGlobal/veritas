import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JudgeData } from "@/global";
import { Trophy, Code, Zap, Star } from "lucide-react";
import { useEffect, useState } from "react";
import React from "react";

type JudgePanelProps = {
  data1: JudgeData;
  data2: JudgeData;
};

export function JudgePanel({ data1, data2 }: JudgePanelProps) {
  const payload = {"hashes_a":data1.hashes2, "hashes_b": data2.hashes2, "code_chunks_a":data1.code_chunks, "code_chunks_b":data2.code_chunks};
  const [similarity, setSimilarity] = React.useState<Number>(0);
  console.log(payload);
  useEffect(()=>{
    const getSimilarity = async ()=>{
      const res = await fetch("http://100.86.219.107:7999/compare-hashes/", {
      method:"POST", 
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSimilarity(Number(data.similarity_score));
    }
    getSimilarity();
    
  }, []);
    


  return (
  <>
  <h1>Here are the results :</h1>
  <h2>Similarity score : </h2>
  {similarity}
  </>)
}