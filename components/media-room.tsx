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
import { io as ClientIO, Socket } from "socket.io-client"; // Import Socket type
import { LiveTranscript } from "./live-transcript";

// Define TranscriptEntry and MediaRoomProps interfaces...
interface TranscriptEntry {
  name: string;
  text: string;
  timestamp: string;
}

interface MediaRoomProps {
  chatId: string;
  video: boolean;
  audio: boolean;
}


// Inner component for LiveKit context logic
const MediaRoomContent = ({ chatId, socket }: { chatId: string, socket: Socket }) => {
  const { user } = useUser();
  const { localParticipant } = useLocalParticipant();
  const audioTrack = localParticipant.getTrackPublication(
    Track.Source.Microphone
  )?.track;
  const mediaStreamTrack = audioTrack?.mediaStreamTrack;

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionHistory, setTranscriptionHistory] = useState<
    TranscriptEntry[]
  >([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioProcessorRef = useRef<AudioWorkletNode | null>(null);

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
      const audioContext = new ((window as any).AudioContext ||
        (window as any).webkitAudioContext)({
        sampleRate: 44100,
        latencyHint: "interactive",
      });
      audioContextRef.current = audioContext;

      await audioContext.audioWorklet.addModule("/audio-processor.js");
      const workletNode = new AudioWorkletNode(
        audioContext,
        "audio-processor"
      );
      audioProcessorRef.current = workletNode;

      const source = audioContext.createMediaStreamSource(
        new MediaStream([mediaStreamTrack])
      );
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 2.0;
      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      const highPassFilter = audioContext.createBiquadFilter();
      highPassFilter.type = "highpass";
      highPassFilter.frequency.value = 80;
      const lowPassFilter = audioContext.createBiquadFilter();
      lowPassFilter.type = "lowpass";
      lowPassFilter.frequency.value = 8000;

      source
        .connect(highPassFilter)
        .connect(lowPassFilter)
        .connect(compressor)
        .connect(gainNode)
        .connect(workletNode)
        .connect(audioContext.destination);

      workletNode.port.onmessage = (event) => {
        const pcmData = event.data;
        const userName = user?.firstName || "Anonymous";
        socket.emit("audio-chunk", {
          data: Array.from(pcmData),
          room: chatId,
          sampleRate: 16000,
          timestamp: Date.now(),
          user_name: userName,
        });
      };
    };

    setupAudioProcessor();
  }, [mediaStreamTrack, socket, chatId, isTranscribing, user?.firstName]);

  useEffect(() => {
    if (!socket) return;
    const handleTranscription = (data: {
      user_name: string;
      transcription: string;
      session_id: string;
    }) => {
      if (data.session_id === socket.id) return;
      const newEntry: TranscriptEntry = {
        name: data.user_name,
        text: data.transcription,
        timestamp: new Date().toLocaleTimeString(),
      };
      setTranscriptionHistory((prev) => [...prev, newEntry]);
    };
    socket.on("room-transcription", handleTranscription);
    return () => {
      socket.off("room-transcription", handleTranscription);
    };
  }, [socket]);

  return (
    <>
      <VideoConference />
      {isTranscribing && <LiveTranscript transcripts={transcriptionHistory} />}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <button
          onClick={() => setIsTranscribing(!isTranscribing)}
          className="px-4 py-2 rounded-full bg-indigo-500 hover:bg-indigo-600 transition text-white"
          disabled={!socket}
        >
          {isTranscribing ? "Stop Transcription" : "Start Transcription"}
        </button>
      </div>
    </>
  );
};

// The main MediaRoom component now manages its own socket connection
export const MediaRoom = ({
  chatId,
  video,
  audio,
}: MediaRoomProps) => {
  const { user } = useUser();
  const [token, setToken] = useState("");
  // State to hold the dedicated socket for this component
  const [socket, setSocket] = useState<Socket | null>(null);

  // This useEffect establishes the connection to the Python backend
  useEffect(() => {
    // Connect to the Python server on port 5000
    const socketInstance = ClientIO("http://localhost:5000", {
      // default path is /socket.io; include both transports so engine.io can
      // fallback to polling if the server doesn't support websocket upgrades.
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      // optional short timeouts during dev:
      timeout: 20000,
    });

    socketInstance.on("connect", () => {
        console.log("✅ Successfully connected to Python Socket.IO server");
        setSocket(socketInstance);
    });

    socketInstance.on("disconnect", () => {
        console.log("❌ Disconnected from Python Socket.IO server");
        setSocket(null);
    });

    socketInstance.on("connect_error", (err: any) => {
      console.error("Socket connect_error:", err);
    });

    socketInstance.on("connect_timeout", (timeout: any) => {
      console.warn("Socket connect_timeout:", timeout);
    });

    return () => {
        socketInstance.disconnect();
    }
  }, []);

  // This useEffect handles joining the room once the socket is connected
  useEffect(() => {
    if (!socket || !token) return;

    const userName = user?.firstName || "Anonymous";
    
    socket.emit('join', {
        room: chatId,
        user_name: userName
    });

    return () => {
        socket.emit('leave', { room: chatId });
    }
  }, [socket, token, chatId, user?.firstName]);

  // This useEffect handles fetching the LiveKit token
  useEffect(() => {
    if (!user?.firstName) return;
    const name = `${user.firstName} ${user.lastName || ""}`;
    (async () => {
      try {
        const resp = await fetch(
          `/api/livekit?room=${chatId}&username=${name}`
        );
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.log("MEDIA ROOM ERROR", e);
      }
    })();
  }, [user?.firstName, user?.lastName, chatId]);

  if (token === "" || !socket) { // Also wait for the socket to be ready
    return (
      <div className="flex flex-col flex-1 justify-center items-center">
        <Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {token ? "Connecting to services..." : "Loading..."}
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
      {/* Pass the dedicated socket down to the child component */}
      <MediaRoomContent chatId={chatId} socket={socket} />
    </LiveKitRoom>
  );
};