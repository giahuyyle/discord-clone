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
        <div className="absolute bottom-20 left-0 right-0 p-4 max-h-48">
            <ScrollArea className="h-full w-full rounded-md border p-4 bg-black bg-opacity-70" ref={scrollAreaRef}>
                <div className="flex flex-col gap-2">
                    {transcripts.map((entry, index) => (
                        <div key={index} className="flex items-start text-sm">
                            <span className="font-semibold text-indigo-400 mr-2">{entry.name}:</span>
                            <p className="text-white">{entry.text}</p>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};