"use client";

interface LiveTranscriptProps {

    className?: string;

}

export const LiveTranscript = (
    { className }: LiveTranscriptProps
) => {
    return (
        <div className="bg-indigo-500 h-[100%]">
            Live Transcript
        </div>
    )
};