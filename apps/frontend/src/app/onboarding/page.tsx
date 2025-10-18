"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassInput } from "@/components/ui/glass-input";
import { Button } from "@/components/ui/button";
import { Loader2, UploadCloud, Globe, FileText, CheckCircle } from "lucide-react";

type DataSourceType = "file" | "url" | "text";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);

  // Step 1
  const [dataSource, setDataSource] = useState<DataSourceType>("file");
  const [fileName, setFileName] = useState<string>("");
  const [siteUrl, setSiteUrl] = useState<string>("");
  const [rawText, setRawText] = useState<string>("");

  // Step 2
  const [botName, setBotName] = useState<string>("");

  // Step 3
  const [botGoal, setBotGoal] = useState<string>("");

  // Step 4
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [done, setDone] = useState<boolean>(false);

  // Navigation helpers
  const canGoNext = (): boolean => {
    if (step === 1) {
      if (dataSource === "file") return !!fileName;
      if (dataSource === "url") return !!siteUrl;
      if (dataSource === "text") return rawText.trim().length > 0;
    }
    if (step === 2) return botName.trim().length > 0;
    if (step === 3) return botGoal.trim().length > 0;
    if (step === 4) return done;
    return true;
  };

  const next = (): void => {
    if (step === 4) return;
    setStep((s) => s + 1);
  };
  const back = (): void => setStep((s) => Math.max(1, s - 1));

  useEffect((): void | (() => void) => {
    if (step === 4 && !isTraining) {
      setIsTraining(true);
      setProgress(0);
      const id = setInterval(() => {
        setProgress((p) => {
          const np = Math.min(100, p + 10);
          if (np >= 100) {
            clearInterval(id);
            setDone(true);
            // Mark onboarding finished locally
            try {
              localStorage.setItem("has-onboarded", "true");
            } catch {}
          }
          return np;
        });
      }, 300);
      return () => clearInterval(id);
    }
    return undefined;
  }, [step, isTraining]);

  const finish = (): void => {
    // Redirect to Admin (existing app area)
    router.push("/admin");
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-6">
      <GlassCard className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Onboarding</h1>
          <p className="text-sm text-muted-foreground">Step {step} of 4</p>
        </div>

        {/* Stepper */}
        <div className="grid grid-cols-4 gap-2 mb-8">
          {[1,2,3,4].map((n) => (
            <div key={n} className={`h-2 rounded-full ${step >= n ? "bg-electric-cyan" : "bg-border"}`} />
          ))}
        </div>

        {/* Content */}
        {step === 1 && (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="space-y-4">
            <h2 className="text-xl font-medium">Select Data Source</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button type="button" onClick={() => setDataSource("file")} className={`flex flex-col items-center rounded-lg border p-4 transition ${dataSource === "file" ? "border-electric-cyan bg-electric-cyan/10" : "border-border"}`}>
                <UploadCloud className="h-6 w-6 mb-2" />
                <span className="text-sm">Upload File</span>
              </button>
              <button type="button" onClick={() => setDataSource("url")} className={`flex flex-col items-center rounded-lg border p-4 transition ${dataSource === "url" ? "border-electric-cyan bg-electric-cyan/10" : "border-border"}`}>
                <Globe className="h-6 w-6 mb-2" />
                <span className="text-sm">Add Website URL</span>
              </button>
              <button type="button" onClick={() => setDataSource("text")} className={`flex flex-col items-center rounded-lg border p-4 transition ${dataSource === "text" ? "border-electric-cyan bg-electric-cyan/10" : "border-border"}`}>
                <FileText className="h-6 w-6 mb-2" />
                <span className="text-sm">Paste Text</span>
              </button>
            </div>

            {dataSource === "file" && (
              <div className="mt-4">
                <label className="block text-sm mb-1">Select a document</label>
                <input
                  type="file"
                  className="w-full rounded-lg border border-border bg-background p-2"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setFileName(file ? file.name : "");
                  }}
                />
                {fileName && <p className="mt-2 text-xs text-muted-foreground">Selected: {fileName}</p>}
              </div>
            )}
            {dataSource === "url" && (
              <div className="mt-4">
                <label className="block text-sm mb-1">Website URL</label>
                <GlassInput type="url" placeholder="https://example.com/docs" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} />
              </div>
            )}
            {dataSource === "text" && (
              <div className="mt-4">
                <label className="block text-sm mb-1">Paste content</label>
                <textarea
                  rows={5}
                  className="w-full rounded-lg border border-border bg-background p-2"
                  placeholder="Paste reference text here..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                />
              </div>
            )}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="space-y-4">
            <h2 className="text-xl font-medium">Name Your Chatbot</h2>
            <GlassInput type="text" placeholder="e.g., TekAssist Helper" value={botName} onChange={(e) => setBotName(e.target.value)} />
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="space-y-4">
            <h2 className="text-xl font-medium">Choose Bot Goal</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {["Answer support questions","Generate leads","Drive sales","Educate users"].map((goal) => (
                <label key={goal} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer ${botGoal === goal ? "border-electric-cyan bg-electric-cyan/10" : "border-border"}`}>
                  <input type="radio" name="bot-goal" className="accent-electric-cyan" checked={botGoal === goal} onChange={() => setBotGoal(goal)} />
                  <span className="text-sm">{goal}</span>
                </label>
              ))}
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="space-y-4">
            <h2 className="text-xl font-medium">Start Training</h2>
            {!done ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-electric-cyan" />
                <p className="mt-4 text-sm text-muted-foreground">Training your chatbot… {progress}%</p>
                <div className="mt-4 w-full h-2 bg-border rounded-full">
                  <div className="h-2 rounded-full bg-electric-cyan" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 py-10">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <p className="text-sm">Training complete! Your assistant is ready.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between">
          <Button variant="outline" onClick={back} disabled={step === 1}>Back</Button>
          {step < 4 && (
            <Button onClick={next} disabled={!canGoNext()}>Next</Button>
          )}
          {step === 4 && (
            <Button onClick={finish} disabled={!done}>Go to Admin</Button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}