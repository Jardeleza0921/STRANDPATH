import React from 'react';
import { ChevronLeftIcon, XIcon } from 'lucide-react';

interface Props {
  title: string;
  onBack?: () => void;
  onClose?: () => void;
}

export function MobileHeader({ title, onBack, onClose }: Props) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface px-3">
      {onBack ?
      <button
        type="button"
        onClick={onBack}
        aria-label="Go back"
        className="flex h-10 w-10 items-center justify-center rounded-md text-ink transition-colors duration-150 ease-out hover:bg-canvas">
        
          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
        </button> :

      <span className="h-10 w-10" />
      }

      <h1 className="flex-1 truncate text-center text-[15px] font-semibold tracking-[-0.01em] text-ink">{title}</h1>

      {onClose ?
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="flex h-10 w-10 items-center justify-center rounded-md text-muted transition-colors duration-150 ease-out hover:bg-canvas">
        
          <XIcon className="h-5 w-5" aria-hidden="true" />
        </button> :

      <span className="h-10 w-10" />
      }
    </header>);

}