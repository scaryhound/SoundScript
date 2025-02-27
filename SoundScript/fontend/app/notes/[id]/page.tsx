"use client";

import { useEffect, useState } from 'react';

type Transcription = {
  id: number;
  file_name: string;
  date: string;
  transcript: string;
  summary: string;
  keywords: string;
};

export default function TranscriptionPage({ params }: { params: { id: string } }) {
  const [transcription, setTranscription] = useState<Transcription | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTranscription = async () => {
      try {
        const res = await fetch(`/api/get-transcriptions/${params.id}`);
        if (!res.ok) {
          throw new Error('Failed to fetch transcription');
        }
        const data: Transcription = await res.json();
        setTranscription(data);
      } catch (err) {
        setError("Error loading transcription.");
      }
    };

    fetchTranscription();
  }, [params.id]);

  const renderKeywords = (keywords: string) => {
    const keywordArray = keywords.split(' ').map(keyword => keyword.trim()).filter(keyword => keyword.length > 0).slice(0, 4);
    return keywordArray.map((keyword, index) => (
      <span
        key={index}
        className="inline-block bg-gray-300 text-gray-600 rounded-full py-1 px-3 m-1"
      >
        {keyword}
      </span>
    ));
  };

  if (error) {
    return <div className="text-red-500 text-center mt-5">{error}</div>;
  }

  if (!transcription) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold">{transcription.file_name}</h1>
      <p className="text-gray-500 text-sm mt-1">
        {new Date(transcription.date).toLocaleDateString()}
      </p>

      <div className="border-t border-gray-300 my-6"></div>

      <h2 className="text-lg font-semibold mb-2">Transcription</h2>
      <p className="text-gray-800 dark:text-gray-300 mb-6">{transcription.transcript}</p>

      <div className="border-t border-gray-300 my-6"></div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold">Summary</h3>
        <p className="text-gray-800 dark:text-gray-300 mb-6">{transcription.summary}</p>

        <div className="border-t border-gray-300 my-6"></div>

        <h3 className="text-lg font-semibold">Keywords</h3>
        <div className="flex flex-wrap mt-5">
          {renderKeywords(transcription.keywords)}
        </div>
      </div>
    </div>
  );
}
