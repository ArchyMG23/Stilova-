import React, { useEffect, useRef, useState } from "react";
import { Play, Square, Volume2, Music, Wind } from "lucide-react";

interface AudioSynthesizerProps {
  genre: string;
  tempo?: "slow" | "medium" | "fast";
  isPlaying: boolean;
  onTogglePlay: (isPlaying: boolean) => void;
}

export default function AudioSynthesizer({ genre, tempo = "slow", isPlaying, onTogglePlay }: AudioSynthesizerProps) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const windVolumeRef = useRef<GainNode | null>(null);
  const oscVolumeRef = useRef<GainNode | null>(null);
  const drumIntervalRef = useRef<any>(null);

  const [vol, setVol] = useState(0.4);

  useEffect(() => {
    // If state is requested as playing, bootstrap audio context
    if (isPlaying) {
      startSynth();
    } else {
      stopSynth();
    }
    return () => {
      stopSynth();
    };
  }, [isPlaying, genre, tempo]);

  const startSynth = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // 1. Procedural Wind/Breeze generator (Brown Noise + LFO filters)
      // Custom Node to generate brown noise
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brown noise filter formula
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // Gain compensation
      }

      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;
      noiseNode.loop = true;

      const windFilter = ctx.createBiquadFilter();
      windFilter.type = "lowpass";
      windFilter.frequency.value = 400;
      windFilter.Q.value = 3.0;

      const windGain = ctx.createGain();
      windGain.gain.setValueAtTime(0.01, ctx.currentTime);
      windVolumeRef.current = windGain;

      // Connecting wind channel
      noiseNode.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(ctx.destination);
      noiseNode.start();

      // Wind LFO modulator (organic sweeping breeze)
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.15; // Slow sweep (0.15 Hz)
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 250; // Sweeping range
      lfo.connect(lfoGain);
      lfoGain.connect(windFilter.frequency);
      lfo.start();

      // Adjust volume based on genre
      if (genre === "afrofuturism") {
        // Sci-fi low frequency drone (detuned Sawtooth)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = "sawtooth";
        osc2.type = "sawtooth";
        osc1.frequency.value = 55; // A1 note
        osc2.frequency.value = 55.4; // Slightly detuned

        const droneFilter = ctx.createBiquadFilter();
        droneFilter.type = "lowpass";
        droneFilter.frequency.value = 120; // Soft warm low bass

        const droneGain = ctx.createGain();
        droneGain.gain.setValueAtTime(0.02, ctx.currentTime);
        oscVolumeRef.current = droneGain;

        osc1.connect(droneFilter);
        osc2.connect(droneFilter);
        droneFilter.connect(droneGain);
        droneGain.connect(ctx.destination);

        osc1.start();
        osc2.start();
      } else if (genre === "mythology" || genre === "historical") {
        // Ancient Ritual click drum beats procedurally
        let intervalMs = 1200; // slow
        if (tempo === "medium") intervalMs = 700;
        if (tempo === "fast") intervalMs = 400;

        drumIntervalRef.current = setInterval(() => {
          triggerProceduralDrum(ctx);
        }, intervalMs);
      }

      setMasterVolume(vol);
    } catch (e) {
      console.warn("Web Audio Synthesizer init failed:", e);
    }
  };

  const triggerProceduralDrum = (ctx: AudioContext) => {
    try {
      // Create a drum sound using oscillator with fast pitch decay
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(80, ctx.currentTime); // Low drum pitch
      osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3); // Pitch bend

      gain.gain.setValueAtTime(vol * 0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35); // Fast decay

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (_) {}
  };

  const stopSynth = () => {
    if (drumIntervalRef.current) {
      clearInterval(drumIntervalRef.current);
      drumIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    windVolumeRef.current = null;
    oscVolumeRef.current = null;
  };

  const setMasterVolume = (newValue: number) => {
    setVol(newValue);
    if (windVolumeRef.current) {
      windVolumeRef.current.gain.setValueAtTime(newValue * 0.08, audioCtxRef.current?.currentTime || 0);
    }
    if (oscVolumeRef.current) {
      oscVolumeRef.current.gain.setValueAtTime(newValue * 0.04, audioCtxRef.current?.currentTime || 0);
    }
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/60 p-4 rounded-2xl flex flex-col items-center gap-3 w-full sm:w-80">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-amber-500 animate-pulse" />
          <span className="font-sans font-semibold text-sm text-slate-100">Synthé d'Ambiance Africaine</span>
        </div>
        <div className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 capitalize">
          {genre}
        </div>
      </div>

      <div className="flex gap-4 items-center justify-center py-2 w-full">
        <button
          onClick={() => onTogglePlay(!isPlaying)}
          className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
            isPlaying 
              ? "bg-red-500/20 border border-red-500 text-red-400 hover:bg-red-500/30 shadow-lg" 
              : "bg-amber-500 text-slate-950 hover:bg-amber-400 font-medium scale-105"
          }`}
          title={isPlaying ? "Désactiver la musique" : "Lancer l'ambiance sonore"}
        >
          {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>

        <div className="flex-1 flex flex-col gap-1">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1"><Wind className="w-3 h-3" /> Volume Ambiance</span>
            <span>{Math.round(vol * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={vol}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
            className="w-full accent-amber-500 h-1 rounded bg-slate-700 outline-none cursor-pointer"
          />
        </div>
      </div>

      <div className="text-[10px] text-slate-400 text-center italic bg-slate-800/40 p-2 rounded-lg w-full border border-slate-700/30">
        {isPlaying 
          ? genre === "afrofuturism" 
            ? "Drone basson néo-Dakarois généré par synthèse de fréquences..."
            : `Impulsions de percussions rituelles cadencées tempo ${tempo}.`
          : "Ambiance locale en attente de lancement."}
      </div>
    </div>
  );
}
