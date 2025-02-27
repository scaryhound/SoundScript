"use client"

import { useState, FormEvent } from "react";
import { Snippet } from "@nextui-org/snippet";
import { Input } from "@nextui-org/input";
import { title, subtitle } from "@/components/primitives";
import { Button } from "@nextui-org/button";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import React from "react";
import { CircularProgress } from "@nextui-org/progress";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [transcriptionId, setTranscriptionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setTranscription(null);
    setError(null);

    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
        headers: {
          "Accept": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const { fullTranscription, transcriptionId } = await res.json();
      setTranscription(fullTranscription);
      setTranscriptionId(transcriptionId);  // Save the transcription ID
    } catch (e: unknown) {
      console.error(e);
      setError("An error occurred while uploading the file.");
    } finally {
      setLoading(false);
    }
  };

  const onSave = async () => {
    if (!file || !transcription) {
      console.error("File or transcription is missing");
      return;
    }
  
    const body = {
      file_name: file.name,
      transcript: transcription,
    };
  
    try {
      // Save the transcription first
      const response = await fetch("/api/save-transcription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
  
      const data = await response.json();
      if (!response.ok) {
        throw new Error("Error saving transcription");
      }
  
      // Store transcription ID for later use in saving summary
      setTranscriptionId(data.id);
  
      toast.success("Transcription saved successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
  
      // Generate insight after transcription save
      const insightResponse = await fetch("/api/generate-insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcription }),
      });
  
      const insightData = await insightResponse.json();
      if (!insightResponse.ok) {
        throw new Error("Error generating insight");
      }
  
      // Save summary and keywords with transcription ID
      const summaryBody = {
        transcriptionId: data.id,  // Use the returned transcription ID here
        summary: insightData.summary,
        keywords: insightData.keywords,
      };
  
      const summaryResponse = await fetch("/api/save-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(summaryBody),
      });
  
      if (!summaryResponse.ok) {
        throw new Error("Error saving summary");
      }
  
      toast.success("Summary and insights saved successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
  
    } catch (error) {
      console.error("Error making the request:", error);
      toast.error("An error occurred while saving the insights.");
    }
  };
  
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <ToastContainer />
      <div className="inline-block max-w-xl text-center justify-center">
        <h1 className={title({ color: "violet" })}>SoundScript&nbsp;</h1>
        <h1 className={title()}>Summarize Audio Effortlessly</h1>
        <h2 className={subtitle({ class: "mt-4" })}>
          Accurate and intelligent.
        </h2>
      </div>

      <div className="mt-8">
        <form onSubmit={onSubmit}>
          <Snippet hideCopyButton hideSymbol variant="bordered" className="m-1">
            <span className={subtitle({ class: "mt-1" })}>
              <Input
                type="file"
                name="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="max-w-xs"
              />
            </span>
            <span className={subtitle({ class: "mt-3" })}>
              <Input type="submit" value="Upload" />
            </span>
          </Snippet>
        </form>
      </div>

      {loading && (
        <div className="m-6 p-4">
          <CircularProgress aria-label="Loading..." size="lg" color="secondary" />
        </div>
      )}

      {transcription && (
        <>
          <div className="m-6 p-4 border border-slate-700 rounded-lg">
            <h2>Transcription:</h2>
            <p className="text-base">{transcription}</p>
          </div>
          <Button onClick={onSave}>Save Transcription</Button>
        </>
      )}

      {error && <p className="text-red-500">{error}</p>}
    </section>
  );
}
