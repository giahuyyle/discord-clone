"use client";

import { useEffect, useState, useRef } from "react";
import { LiveKitRoom, VideoConference, useLocalParticipant } from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { useSocket } from "@/components/providers/socket-provider";


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

    // --- State Management for Transcription ---
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcription, setTranscription] = useState("");

    // 1. Get the local participant from the LiveKit room
    const { localParticipant } = useLocalParticipant();

    // 2. Find the microphone track from the participant's publications
    const audioTrack = localParticipant.getTrackPublication(Track.Source.Microphone)?.track;
    
    // 3. Get the raw MediaStreamTrack, which we will use in the next step
    const mediaStreamTrack = audioTrack?.mediaStreamTrack;

    // refs to hold audio processing objects
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioProcessorRef = useRef<AudioWorkletNode | null>(null);

    useEffect(() => {
        if (!mediaStreamTrack || !socket) return;

        const setupAudioProcessor = async () => {
            const audioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 44100,
                latencyHint: 'interactive'
            });
            audioContextRef.current = audioContext;

            // Load the AudioWorklet module
            await audioContext.audioWorklet.addModule('/audio-processor.js');
            
            // Create an instance of the AudioWorkletNode
            const workletNode = new AudioWorkletNode(audioContext, 'audio-processor');
            audioProcessorRef.current = workletNode;

            // --- Set up the enhancement chain ---
            const source = audioContext.createMediaStreamSource(new MediaStream([mediaStreamTrack]));
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 2.0;
            const compressor = audioContext.createDynamicsCompressor();
            compressor.threshold.value = -24;
            // ... (rest of compressor, high-pass, low-pass setup is the same)
            const highPassFilter = audioContext.createBiquadFilter();
            highPassFilter.type = 'highpass';
            highPassFilter.frequency.value = 80;
            const lowPassFilter = audioContext.createBiquadFilter();
            lowPassFilter.type = 'lowpass';
            lowPassFilter.frequency.value = 8000;

            // --- Connect the nodes ---
            source.connect(highPassFilter);
            highPassFilter.connect(lowPassFilter);
            lowPassFilter.connect(compressor);
            compressor.connect(gainNode);
            // Connect the processing chain to our worklet
            gainNode.connect(workletNode);
            // Connect the worklet to the destination to keep it processing
            workletNode.connect(audioContext.destination);

            // Listen for messages (processed audio chunks) from the worklet
            workletNode.port.onmessage = (event) => {
                const pcmData = event.data;
                // Send the audio data to the server
                socket.emit("audio-chunk", {
                    data: Array.from(pcmData),
                    room: chatId,
                    sampleRate: 16000,
                    timestamp: Date.now()
                });
            };

            return { source, gainNode, compressor, highPassFilter, lowPassFilter, workletNode, audioContext };
        };

        let processorComponents: any;
        setupAudioProcessor().then(components => {
            processorComponents = components;
        });

        // Cleanup function
        return () => {
            console.log("Cleaning up audio context");
            if (processorComponents) {
                const { source, gainNode, compressor, highPassFilter, lowPassFilter, workletNode, audioContext } = processorComponents;
                workletNode.port.onmessage = null;
                workletNode.disconnect();
                gainNode.disconnect();
                compressor.disconnect();
                lowPassFilter.disconnect();
                highPassFilter.disconnect();
                source.disconnect();
                audioContext.close();
            }
        };

    }, [mediaStreamTrack, socket, chatId]); // Rerun effect if these change
    
    /*
    MEDIA STREAM TRACK:
    - a standard web API object that represents a SINGLE media track (audio/video) within a stream
    - it is live and continuous -> can be used for audio transcription
    */

    useEffect(() => {
        if (!user?.firstName || !user?.lastName) return;

        const name = `${user.firstName} ${user.lastName}`;

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
            className="flex flex-col w-full"
        >
            <VideoConference className="" />
        </LiveKitRoom>
       
    );
};