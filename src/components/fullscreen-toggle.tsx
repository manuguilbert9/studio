'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Maximize, Minimize } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


export function FullscreenToggle() {
  const isMobile = useIsMobile();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  if (isMobile) {
    return null;
  }

  return (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                 <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                    {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                    <span className="sr-only">{isFullscreen ? 'Quitter le plein écran' : 'Passer en plein écran'}</span>
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
  );
}
