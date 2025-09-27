"use client"
import * as React from "react";
import JSZip from 'jszip'; // <--- 1. Import JSZip
import { UploadPanel } from "@/components/upload-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageLayout } from "@/components/layout/PageLayout";
import { FullScreenLoader } from "@/components/layout/FullScreenLoader";
import { CheckCircle2, FileCode } from "lucide-react";

interface BackendHighlightData {
  fileName: string;
  ranges: [number, number][]; 
}



// This is a helper function to send a one-off message.
const notifyServer = (matchId: string, role: string, payload: any) => {
  const socket = new WebSocket('ws://localhost:8080');
  
  socket.onopen = () => {
    console.log('Connected to WS to send submission result');
    socket.send(JSON.stringify({
      type: 'submissionResult', 
      matchId,
      role,
      payload
    }));
    
  };

  socket.onerror = (error) => {
    console.error("Could not connect to WebSocket to notify server:", error);
  };
};

interface FileContent {
  name: string;
  content: string;
}

export default function User2Page() {
  const [matchId, setMatchId] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);
  const [filesContent, setFilesContent] = React.useState<FileContent[]>([]);
  const [activeFileIndex, setActiveFileIndex] = React.useState(0);
  const [submissionStatus, setSubmissionStatus] = React.useState<"idle" | "uploading" | "done">("idle");
  const [checkpoints, setCheckpoints] = React.useState(0);
  const [highlightedLines, setHighlightedLines] = React.useState<Record<string, number[]>>({});

  const canSubmit = !!matchId && files.length > 0;
  const isUploading = submissionStatus === 'uploading';

  // --- MODIFIED EFFECT HOOK FOR ZIP EXTRACTION ---
  React.useEffect(() => {
    if (files.length === 0) {
      setFilesContent([]);
      return;
    }

    const readZipFile = async (zipFile: File) => {
      try {
        const jszip = new JSZip();
        const zip = await jszip.loadAsync(zipFile); // Load the zip file
        const filePromises: Promise<FileContent>[] = [];

        // Iterate over each file in the zip
        zip.forEach((relativePath, zipEntry) => {
          // Ignore directories
          if (!zipEntry.dir) {
            const filePromise = zipEntry.async('string').then(content => ({
              name: zipEntry.name,
              content: content,
            }));
            filePromises.push(filePromise);
          }
        });
        
        const contents = await Promise.all(filePromises);
        setFilesContent(contents);
        setActiveFileIndex(0); // Reset to the first file
      } catch (error) {
        console.error("Failed to read zip file:", error);
        alert("Error: Could not read the zip file. Please ensure it's a valid .zip archive.");
        setFiles([]); // Clear the invalid file
      }
    };
    
    // We only process the first file, assuming it's the zip file.
    readZipFile(files[0]);

  }, [files]);

  const submit = async () => {
    if (!canSubmit) return;
    setSubmissionStatus("uploading");
    setCheckpoints(0);

    const timeouts = [
      setTimeout(() => setCheckpoints(1), 1000),
      setTimeout(() => setCheckpoints(2), 3000),
      setTimeout(() => setCheckpoints(3), 5000)
    ];

    try {
      const fd = new FormData();
      fd.append("matchId", matchId);
      fd.append("role", "user2");
      // IMPORTANT: We still send the original zip file to the server
      if (files.length > 0) {
        fd.append("zip_file", files[0], files[0].name);
      }
      
      // --- DUMMY API CALL TO GET ANALYSIS RESULT ---
      console.log("Making API call ...");
      const res = await fetch("http://100.86.219.107:7999/analyze-zip/", {method:"POST", body: fd, headers: {
      // Add this header to skip the Ngrok browser warning
      // "ngrok-skip-browser-warning": "true" 
    }});
      const data = await res.json();
      // Simulating the API call and its JSON response
      await new Promise(resolve => setTimeout(resolve, 4000)); 
      const analysisResult = {
          hash: `hash1`,
          hash_length: 4,
          side: "left",
          wallet: "000x34"
      };
      const answer = data;
      console.log("Dummy API call finished, received result:", answer);
      // --- END OF DUMMY API CALL ---
// Check if data.boundaries_json is a valid array
if (data.boundaries_json && Array.isArray(data.boundaries_json)) {
    const newHighlights: Record<string, number[]> = {};

    // 1. Loop over the correct array: data.boundaries_json
    for (const fileData of data.boundaries_json) {
        // 2. Destructure the correct property names: 'filename' and 'boundaries'
        const { filename, boundaries } = fileData;
        const linesToHighlight: number[] = [];

        // "Unroll" each range into individual line numbers
        if (filename && boundaries) {
            // 3. Loop over the 'boundaries' array
            for (const [start, end] of boundaries) {
                for (let i = start; i <= end; i++) {
                    linesToHighlight.push(i);
                }
            }
        }
        // Use the correct 'filename' property for the key
        newHighlights[filename] = linesToHighlight;
    }
    
    // Update the component's state with the processed highlights
    setHighlightedLines(newHighlights);
}







      // Notify the WebSocket server WITH the result payload
      notifyServer(matchId, 'user2', answer);

      await new Promise(resolve => setTimeout(resolve, 3000));
      setSubmissionStatus("done");
    } catch (e: any) {
      console.error("Submission failed:", e.message);
      alert(`Submission Failed: ${e.message}`);
      setSubmissionStatus("idle");
    } finally {
      timeouts.forEach(clearTimeout);
    }
  };

  const activeFile = filesContent[activeFileIndex];

  return (
    <PageLayout
      title="User 2"
      description="Enter the Match ID, submit your codebase, and await the duel."
    >
      {/* This loader will now appear on top of the UI, keeping the code visible behind it */}
      <FullScreenLoader direction="rtl" active={isUploading} checkpointsReached={checkpoints}/>
      
      <div className="flex w-full gap-6">
        {/* --- Code Viewer (Left Side) --- */}
        {/* This part is now always visible as long as there are files */}
        {filesContent.length > 0 && (
          <div className="w-1/2">
            <Card className="bg-black/20 border-white/10 h-full">
              <CardHeader>
                <div className="flex flex-wrap gap-2">
                  {filesContent.map((file, index) => (
                    <Button 
                      key={file.name} 
                      variant={index === activeFileIndex ? "secondary" : "ghost"}
                      onClick={() => setActiveFileIndex(index)}
                      className="h-8 px-3"
                    >
                      <FileCode className="w-4 h-4 mr-2"/>
                      {file.name}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {activeFile && (
                  <pre className="text-sm text-gray-200 bg-gray-900/50 p-4 rounded-md max-h-[450px] overflow-auto">
                    <code>{activeFile.content}</code>
                  </pre>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* --- Controls & Status (Right Side) --- */}
        <div className={filesContent.length > 0 ? "w-1/2" : "w-full"}>
          {submissionStatus === 'done' ? (
            // If submission is done, show the success message in the right panel
            <div className="text-center flex flex-col items-center justify-center h-full bg-white/5 rounded-2xl border border-white/10 p-6">
              <CheckCircle2 className="w-16 h-16 text-green-400 mb-4" />
              <h3 className="text-2xl font-bold">Submission Received!</h3>
              <p className="text-gray-400 mt-2">Waiting for Player 1 and the Judge...</p>
            </div>
          ) : (
            // Otherwise, show the regular controls
            <div className="space-y-6">
              <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Match ID</CardTitle>
                </CardHeader>
                <CardContent>
                  <Label htmlFor="match1" className="text-gray-400 mb-2 block">
                    Share this ID with Player 1 and the Judge
                  </Label>
                  <Input
                    id="match1"
                    placeholder="e.g. epic-duel-42"
                    value={matchId}
                    onChange={(e) => setMatchId(e.target.value)}
                    className="bg-gray-900/50 border-white/20 focus:ring-purple-500"
                  />
                </CardContent>
              </Card>

              <UploadPanel
                title="Player 2"
                onFileChange={(fileList) => {
                  setFiles(fileList ? Array.from(fileList) : []);
                }}
                disabled={isUploading} // Disable while uploading
                side="right"
              />

              <div className="mt-6 flex justify-center">
                <Button
                  onClick={submit}
                  disabled={!canSubmit || isUploading} // Disable while uploading
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg px-8 py-6 disabled:bg-gray-600"
                >
                  {isUploading ? 'Submitting...' : 'Submit Codebase'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}