import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Settings, RotateCcw } from 'lucide-react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';

interface AdvancedControlsProps {
  className?: string;
}

export function AdvancedControls({ className }: AdvancedControlsProps) {
  const {
    playbackRate,
    setPlaybackRate,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    resetAudioSettings,
  } = useAudioPlayer();

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Advanced Controls</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetAudioSettings}
          className="h-8 px-2 text-xs"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>

      {/* Playback Speed */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Playback Speed</Label>
          <Select
            value={playbackRate.toString()}
            onValueChange={(value) => setPlaybackRate(parseFloat(value))}
          >
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {playbackRates.map((rate) => (
                <SelectItem key={rate} value={rate.toString()}>
                  {rate}x
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Slider
          value={[playbackRate]}
          min={0.5}
          max={2}
          step={0.05}
          onValueChange={(value) => setPlaybackRate(value[0])}
          className="w-full"
        />
      </div>

      {/* Volume Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Volume</Label>
          <span className="text-xs text-muted-foreground">
            {isMuted ? 'Muted' : `${Math.round(volume * 100)}%`}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Slider
            value={[isMuted ? 0 : volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(value) => setVolume(value[0])}
            disabled={isMuted}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            className="h-8 w-8 p-0"
          >
            {isMuted ? '🔇' : '🔊'}
          </Button>
        </div>
      </div>
    </div>
  );
}