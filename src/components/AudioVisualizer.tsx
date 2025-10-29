import React, { useEffect, useRef, useState } from 'react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { cn } from '@/lib/utils';

interface AudioVisualizerProps {
  type?: 'bars' | 'waveform' | 'circular';
  className?: string;
  barCount?: number;
  height?: number;
  color?: string;
}

// Bars Visualizer
function BarsVisualizer({
  barCount = 32,
  height = 60,
  color = '#ffffff'
}: {
  barCount?: number;
  height?: number;
  color?: string;
}) {
  const { currentTrack, isPlaying } = useAudioPlayer();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get audio manager frequency data (this would need to be exposed from context)
    const updateVisualization = () => {
      if (!isPlaying || !currentTrack) {
        // Draw idle animation
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = canvas.width / barCount;

        for (let i = 0; i < barCount; i++) {
          const barHeight = Math.sin(Date.now() * 0.005 + i * 0.5) * height * 0.3 + height * 0.2;
          const x = i * barWidth;
          const y = canvas.height - barHeight;

          ctx.fillStyle = color;
          ctx.fillRect(x, y, barWidth - 2, barHeight);
        }
      } else {
        // Draw frequency bars
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = canvas.width / barCount;

        // Mock frequency data - in real implementation, get from AudioManager
        for (let i = 0; i < barCount; i++) {
          const frequency = Math.random() * 255;
          const barHeight = (frequency / 255) * height;
          const x = i * barWidth;
          const y = canvas.height - barHeight;

          ctx.fillStyle = color;
          ctx.fillRect(x, y, barWidth - 2, barHeight);
        }
      }

      animationRef.current = requestAnimationFrame(updateVisualization);
    };

    updateVisualization();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, currentTrack, barCount, height, color]);

  return (
    <canvas
      ref={canvasRef}
      width={barCount * 8}
      height={height}
      className="w-full h-full"
    />
  );
}

// Waveform Visualizer
function WaveformVisualizer({
  height = 60,
  color = '#ffffff'
}: {
  height?: number;
  color?: string;
}) {
  const { currentTrack, isPlaying } = useAudioPlayer();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateVisualization = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      const centerY = canvas.height / 2;
      const amplitude = isPlaying ? height * 0.4 : height * 0.1;

      for (let x = 0; x < canvas.width; x++) {
        const y = centerY + Math.sin((x * 0.05) + Date.now() * 0.005) * amplitude;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
      animationRef.current = requestAnimationFrame(updateVisualization);
    };

    updateVisualization();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, height, color]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={height}
      className="w-full h-full"
    />
  );
}

// Circular Visualizer
function CircularVisualizer({
  size = 100,
  color = '#ffffff'
}: {
  size?: number;
  color?: string;
}) {
  const { currentTrack, isPlaying } = useAudioPlayer();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    const updateVisualization = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw outer ring
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw frequency bars around the circle
      const barCount = 32;
      const angleStep = (Math.PI * 2) / barCount;

      for (let i = 0; i < barCount; i++) {
        const angle = i * angleStep;
        const frequency = isPlaying ? Math.random() * 0.8 + 0.2 : 0.3;
        const barLength = frequency * 20;

        const startX = centerX + Math.cos(angle) * radius;
        const startY = centerY + Math.sin(angle) * radius;
        const endX = centerX + Math.cos(angle) * (radius + barLength);
        const endY = centerY + Math.sin(angle) * (radius + barLength);

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(updateVisualization);
    };

    updateVisualization();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, size, color]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="w-full h-full"
    />
  );
}

// Main AudioVisualizer Component
export function AudioVisualizer({
  type = 'bars',
  className,
  barCount = 32,
  height = 60,
  color = '#ffffff'
}: AudioVisualizerProps) {
  const { currentTrack } = useAudioPlayer();

  if (!currentTrack) return null;

  return (
    <div className={cn('audio-visualizer', className)}>
      {type === 'bars' && (
        <BarsVisualizer barCount={barCount} height={height} color={color} />
      )}
      {type === 'waveform' && (
        <WaveformVisualizer height={height} color={color} />
      )}
      {type === 'circular' && (
        <CircularVisualizer size={height} color={color} />
      )}
    </div>
  );
}

export default AudioVisualizer;