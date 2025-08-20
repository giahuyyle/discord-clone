"use client";

import { useEffect, useState, useRef } from "react";
import { 
    LiveKitRoom, 
    VideoConference,
    useLocalParticipant,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { Track } from "livekit-client";
import { useSocket } from "@/components/providers/socket-provider";
import { LiveTranscript } from "./live-transcript"; // Make sure you have created this component

// Define the type for a transcript entry
interface TranscriptEntry {
    name: string;
    text: string;
    timestamp: string;
}

interface MediaRoomProps {
    chatId: string;
    video: boolean;
    audio: boolean;
};

export const MediaRoom = ({
    chatId,
    video,
    audio
}: MediaRoomProps) => {
    const { user } = useUser();
    const [token, setToken] = useState("");
    const { socket } = useSocket();

    const { localParticipant } = useLocalParticipant();
    const audioTrack = localParticipant.getTrackPublication(Track.Source.Microphone)?.track;
    const mediaStreamTrack = audioTrack?.mediaStreamTrack;

    // State Management for Transcription
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptEntry[]>([]);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioProcessorRef = useRef<AudioWorkletNode | null>(null);

    // Effect to handle joining/leaving the socket room for transcription
    useEffect(() => {
        if (!socket || !token) return;

        const userName = user?.firstName || "Anonymous";
        
        socket.emit('join', {
            room: chatId,
            user_name: userName
        });
        console.log(`Socket: Emitted 'join' for room ${chatId}`);

        return () => {
            socket.emit('leave', { room: chatId });
            console.log(`Socket: Emitted 'leave' for room ${chatId}`);
        }
    }, [socket, token, chatId, user?.firstName]);

    // Effect to handle the audio processing pipeline
    useEffect(() => {
        if (!mediaStreamTrack || !socket || !isTranscribing) {
            if (audioContextRef.current) {
                audioContextRef.current.close().then(() => {
                    audioContextRef.current = null;
                    audioProcessorRef.current = null;
                });
            }
            return;
        }

        const setupAudioProcessor = async () => {
            if (audioContextRef.current) return;

            const audioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 44100,
                latencyHint: 'interactive'
            });
            audioContextRef.current = audioContext;

            await audioContext.audioWorklet.addModule('/audio-processor.js');
            const workletNode = new AudioWorkletNode(audioContext, 'audio-processor');
            audioProcessorRef.current = workletNode;

            const source = audioContext.createMediaStreamSource(new MediaStream([mediaStreamTrack]));
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 2.0;
            const compressor = audioContext.createDynamicsCompressor();
            compressor.threshold.value = -24;
            compressor.knee.value = 30;
            compressor.ratio.value = 12;
            compressor.attack.value = 0.003;
            compressor.release.value = 0.25;
            const highPassFilter = audioContext.createBiquadFilter();
            highPassFilter.type = 'highpass';
            highPassFilter.frequency.value = 80;
            const lowPassFilter = audioContext.createBiquadFilter();
            lowPassFilter.type = 'lowpass';
            lowPassFilter.frequency.value = 8000;

            source.connect(highPassFilter).connect(lowPassFilter).connect(compressor).connect(gainNode).connect(workletNode).connect(audioContext.destination);

            workletNode.port.onmessage = (event) => {
                const pcmData = event.data;
                const userName = user?.firstName || "Anonymous";
                socket.emit("audio-chunk", {
                    data: Array.from(pcmData),
                    room: chatId,
                    sampleRate: 16000,
                    timestamp: Date.now(),
                    user_name: userName // Include the user's name
                });
            };
        };

        setupAudioProcessor();

    }, [mediaStreamTrack, socket, chatId, isTranscribing, user?.firstName]);

    // Effect to listen for transcription results from the server
    useEffect(() => {
        if (!socket) return;

        const handleTranscription = (data: { user_name: string, transcription: string, session_id: string }) => {
            // Optional: You can filter out your own transcriptions if the server broadcasts them back to you
            if (data.session_id === socket.id) return;

            const newEntry: TranscriptEntry = {
                name: data.user_name,
                text: data.transcription,
                timestamp: new Date().toLocaleTimeString()
            };
            setTranscriptionHistory(prev => [...prev, newEntry]);
        };

        socket.on('room-transcription', handleTranscription);

        return () => {
            socket.off('room-transcription', handleTranscription);
        };
    }, [socket]);

    // Effect to get the LiveKit token
    useEffect(() => {
        if (!user?.firstName) return;
        const name = `${user.firstName} ${user.lastName || ''}`;
        (async () => {
            try {
                const resp = await fetch(`/api/livekit?room=${chatId}&username=${name}`);
                const data = await resp.json();
                setToken(data.token);
            } catch (e) {
                console.log("MEDIA ROOM ERROR", e);
            }
        })();
    }, [user?.firstName, user?.lastName, chatId]);

    if (token === "") {
        return (
            <div className="flex flex-col flex-1 justify-center items-center">
                <Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Loading...
                </p>
            </div>
        );
    }

    return (
        <LiveKitRoom
            data-lk-theme="default"
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
            token={token}
            connect={true}
            video={video}
            audio={audio}
        >
            <VideoConference />
            {isTranscribing && <LiveTranscript transcripts={transcriptionHistory} />}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <button
                    onClick={() => setIsTranscribing(!isTranscribing)}
                    className="px-4 py-2 rounded-full bg-indigo-500 hover:bg-indigo-600 transition text-white"
                    disabled={!socket} // Disable button until socket is connected
                >
                    {isTranscribing ? "Stop Transcription" : "Start Transcription"}
                </button>
            </div>
        </LiveKitRoom>
    );
};