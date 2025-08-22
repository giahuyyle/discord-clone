// components/live-transcript.tsx

"use client";

import React, { useEffect, useRef } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Define a type for a single transcription entry
interface TranscriptEntry {
    name: string;
    text: string;
    timestamp: string;
}

interface LiveTranscriptProps {
    transcripts: TranscriptEntry[];
}

export const LiveTranscript = ({ transcripts }: LiveTranscriptProps) => {
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Automatically scroll to the bottom when new transcripts are added
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [transcripts]);

    return (
        // The styling here is updated to fill the parent container
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-800 p-4">
            <h3 className="text-lg font-semibold mb-4 text-center text-gray-800 dark:text-white">Live Transcript</h3>
            <ScrollArea className="flex-grow w-full rounded-md border bg-white dark:bg-black bg-opacity-70 dark:bg-opacity-50 p-4" ref={scrollAreaRef}>
                <div className="flex flex-col gap-2">
                    {transcripts.map((entry, index) => (
                        <div key={index} className="flex items-start text-sm">
                            <span className="font-semibold text-indigo-500 dark:text-indigo-400 mr-2">{entry.name}:</span>
                            <p className="text-gray-800 dark:text-white">{entry.text}</p>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};