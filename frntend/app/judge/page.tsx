"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { JudgePanel } from "@/components/judge-panel";
import { PageLayout } from "@/components/layout/PageLayout";
import { DuelLoader } from "@/components/layout/DualLoader";
import { ShieldCheck, ShieldOff, Wifi, WifiOff } from "lucide-react";
import CompareFinal from '../../Compare'



export default function JudgePage() {
  const [matchId, setMatchId] = React.useState("");
  
  const [status, setStatus] = React.useState<{ 
    user1: { ready: boolean; result: any | null }; 
    user2: { ready: boolean; result: any | null } 
  }>({
    user1: { ready: false, result: null },
    user2: { ready: false, result: null },
  });

  const [isComparing, setIsComparing] = React.useState(false);
  const [result, setResult] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);
  const socket = React.useRef<WebSocket | null>(null);

  React.useEffect(() => {
    if (!isConnected || !matchId) {
      socket.current?.close();
      return;
    }
    socket.current = new WebSocket('ws://localhost:8080');
    socket.current.onopen = () => socket.current?.send(JSON.stringify({ type: 'join', matchId }));
    socket.current.onclose = () => setIsConnected(false);
    socket.current.onerror = (error) => console.error('WebSocket error:', error);
    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'statusUpdate') {
        console.log('Received status update:', data);
        // The server sends the full objects for user1 and user2, which we store directly
        setStatus({ user1: data.user1, user2: data.user2 });
      }
    };
    return () => socket.current?.close();
  }, [isConnected, matchId]);
  
  React.useEffect(() => {
    // The trigger condition is now based on the 'ready' flag for both users
    if (status.user1.ready && status.user2.ready && !isComparing) {
      const comp = async () => {
        await CompareFinal(status.user1.result, status.user2.result).then(()=>{setResult(true)}).catch(()=>{console.log("TRANSACTION FAILED")});

      }
      comp();
    }
  }, [status, isComparing]);


  if (result) {
    return <JudgePanel data1={status.user1.result} data2={status.user2.result}/>;
  }


  const connect = () => { if (matchId.trim()) setIsConnected(true); };
  const disconnect = () => setIsConnected(false);

  return (
    <PageLayout
      title="Judge"
      description="Enter the Match ID to connect and monitor the duel in real-time."
    >
      <DuelLoader 
        user1Ready={status.user1.ready} // Drive the loader with the 'ready' flag
        user2Ready={status.user2.ready} 
        isComparing={isComparing} 
      />
      <Card className="max-w-xl mx-auto bg-white/5 border-white/10">
        <CardHeader><CardTitle>Match Status</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
             <div className="flex items-end gap-2">
              <div className="flex-grow">
                <Label htmlFor="match-id" className="text-gray-400">Match ID</Label>
                <Input id="match-id" placeholder="e.g., epic-duel-42" value={matchId} onChange={(e) => setMatchId(e.target.value)} className="bg-gray-900/50 border-white/20"/>
              </div>
              <Button onClick={connect} disabled={!matchId.trim()} className="bg-blue-600 hover:bg-blue-700"><Wifi className="mr-2 h-4 w-4"/>Connect</Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-md">
              <p className="font-mono text-green-400">Connected to: {matchId}</p>
              <Button onClick={disconnect} variant="destructive" size="sm" className="bg-red-700 hover:bg-red-600"><WifiOff className="mr-2 h-4 w-4"/>Disconnect</Button>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
               {status.user1.ready ? <ShieldCheck className="h-6 w-6 text-green-400"/> : <ShieldOff className="h-6 w-6 text-gray-500"/>}
              <div>
                <div className="font-medium text-white">Player 1</div>
                <div className={status.user1.ready ? "text-green-400" : "text-gray-400"}>
                  {status.user1.ready ? "Analysis Received" : "Waiting for Submission"}
                </div>
              </div>
            </div>
             <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
               {status.user2.ready ? <ShieldCheck className="h-6 w-6 text-green-400"/> : <ShieldOff className="h-6 w-6 text-gray-500"/>}
              <div>
                <div className="font-medium text-white">Player 2</div>
                <div className={status.user2.ready ? "text-green-400" : "text-gray-400"}>
                  {status.user2.ready ? "Analysis Received" : "Waiting for Submission"}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
