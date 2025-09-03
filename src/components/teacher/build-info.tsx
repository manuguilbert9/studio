
'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bot } from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export function BuildInfo() {
  const buildTimestamp = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP;

  if (!buildTimestamp) {
    return null;
  }

  const buildDate = new Date(buildTimestamp);
  const formattedDate = format(buildDate, "d MMMM yyyy 'à' HH:mm 'UTC'", { locale: fr });

  return (
     <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Bot className="h-4 w-4" />
                    <span>Build {format(buildDate, "d MMM, HH:mm", { locale: fr })}</span>
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>Déployé le {formattedDate}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
  );
}
