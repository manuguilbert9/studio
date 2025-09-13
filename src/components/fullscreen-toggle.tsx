
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tablet, TabletSmartphone } from 'lucide-react';
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
                    {isFullscreen ? <TabletSmartphone className="h-6 w-6" /> : <Tablet className="h-6 w-6" />}
                    <span className="sr-only">{isFullscreen ? 'Quitter le mode tablette' : 'Passer en mode tablette'}</span>
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{isFullscreen ? 'Quitter le mode tablette' : 'Mode tablette'}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
  );
}
