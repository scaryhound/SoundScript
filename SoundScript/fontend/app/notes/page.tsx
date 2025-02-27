"use client";

import { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider
} from "@nextui-org/react";
import { Button } from "@nextui-org/react";
import Image from 'next/image';
import Link from 'next/link';
import meetingLogo from '@/public/logos/meeting-logo.webp';
import studyLogo from '@/public/logos/study-logo.webp';
import generalLogo from '@/public/logos/general-logo.png';
import { title } from "@/components/primitives";

type Transcription = {
  id: number;
  file_name: string;
  date: string;
  keywords: string; // Added keywords property
};

export default function NotePage() {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTranscriptions = async () => {
      try {
        const res = await fetch('/api/get-transcriptions');
        if (!res.ok) {
          throw new Error('Failed to fetch transcriptions');
        }
        const data: Transcription[] = await res.json();
        setTranscriptions(data);
      } catch (err) {
        console.error(err);
        setError("Error loading transcriptions.");
      }
    };

    fetchTranscriptions();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch('/api/delete-transcription', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        throw new Error('Failed to delete transcription');
      }

      setTranscriptions((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
      setError("Error deleting transcription.");
    }
  };

  const getLogo = (fileName: string) => {
    if (fileName.toLowerCase().includes('meeting')) return meetingLogo;
    if (fileName.toLowerCase().includes('study')) return studyLogo;
    return generalLogo;
  };

  const renderKeywords = (keywords: string | undefined) => {
    if (!keywords) {
      return <p className="text-gray-500 italic">No keywords available</p>;
    }
  
    const keywordArray = keywords
      .split(' ')
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword.length > 0)
      .slice(0, 4);
  
    return (
      <div className="flex flex-wrap mt-2">
        {keywordArray.map((keyword, index) => (
          <span
            key={index}
            className="inline-block bg-gray-200 text-gray-600 rounded-full py-1 px-3 m-1 text-sm"
          >
            {keyword}
          </span>
        ))}
      </div>
    );
  };
  return (
    <div>
      <h1 className={title()}>Saved Notes</h1>
      {error && <p className="text-red-500">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {transcriptions.map((transcription) => (
          <Card key={transcription.id} css={{ p: "$6", mw: "400px" }}>
            <CardHeader>
              <Image
                src={getLogo(transcription.file_name)}
                alt="logo"
                width={40}
                height={40}
                style={{ objectFit: "cover", borderRadius: "50%" }}
              />
              <div className="ml-4">
                <h4 className="text-lg font-semibold">{transcription.file_name}</h4>
                <p className="text-gray-500 text-sm">
                  {new Date(transcription.date).toLocaleDateString()}
                </p>
              </div>
            </CardHeader>

            <Divider />

            <CardBody>
              <h3 className="text-gray-600 font-medium mb-2">Keywords</h3>
              {renderKeywords(transcription.keywords)}
            </CardBody>

            <Divider />

            <CardFooter className="flex justify-between">
              <Button
                auto
                flat
                onClick={() => handleDelete(transcription.id)}
              >
                Delete
              </Button>
              <Link href={`/notes/${transcription.id}`} className="text-blue-500 hover:underline">
                View Details
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
