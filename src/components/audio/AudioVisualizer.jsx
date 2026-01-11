import React, { useRef, useEffect } from 'react';
import { useAudioPlayer } from './AudioPlayerContext.jsx';

export default function AudioVisualizer({ width = 200, height = 60, barCount = 40 }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const { getAnalyser, isPlaying } = useAudioPlayer();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const analyser = getAnalyser();
    
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isPlaying) {
        // Draw flat line when paused
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(186, 150, 80, 0.15)'; // Gold muted
        for (let i = 0; i < barCount; i++) {
          const barWidth = width / barCount;
          const x = i * barWidth;
          ctx.fillRect(x, height / 2, barWidth - 2, 2);
        }
        return;
      }

      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, width, height);

      const barWidth = width / barCount;
      const step = Math.floor(bufferLength / barCount);

      for (let i = 0; i < barCount; i++) {
        const index = i * step;
        const value = dataArray[index];
        const barHeight = (value / 255) * height * 0.8;
        
        const x = i * barWidth;
        const y = (height - barHeight) / 2;

        // Create gradient - Gold/purple theme
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, 'rgba(186, 150, 80, 0.85)'); // Gold
        gradient.addColorStop(1, 'rgba(186, 150, 80, 0.35)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth - 2, barHeight);
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [getAnalyser, isPlaying, width, height, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-lg"
    />
  );
}