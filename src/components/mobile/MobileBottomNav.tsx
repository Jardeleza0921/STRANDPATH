import React from 'react';
import { CompassIcon, HomeIcon, LayersIcon, UserIcon } from 'lucide-react';
import { MobileScreen } from './nav';

const items: {id: MobileScreen;label: string;icon: typeof HomeIcon;}[] = [
{ id: 'home', label: 'Home', icon: HomeIcon },
{ id: 'results', label: 'Results', icon: CompassIcon },
{ id: 'strand', label: 'Explore', icon: LayersIcon },
{ id: 'profile', label: 'Profile', icon: UserIcon }];


interface Props {
  active: MobileScreen;
  go: (screen: MobileScreen) => void;
}

export function MobileBottomNav({ active, go }: Props) {
  return (
    <nav className="shrink-0 border-t border-line bg-surface px-2 pb-1 pt-2" aria-label="Mobile">
      <ul className="flex">
        {items.map(({ id, label, icon: Icon }) => {
          const selected = active === id;
          return (
            <li key={id} className="flex-1">
              <button
                type="button"
                onClick={() => go(id)}
                aria-current={selected ? 'page' : undefined}
                className="flex w-full flex-col items-center gap-1 rounded-md py-2 transition-colors duration-150 ease-out">
                
                <Icon
                  className={`h-[22px] w-[22px] ${selected ? 'text-brand' : 'text-faint'}`}
                  strokeWidth={selected ? 2.2 : 1.8}
                  aria-hidden="true" />
                
                <span className={`text-[11px] ${selected ? 'font-medium text-brand' : 'text-faint'}`}>{label}</span>
              </button>
            </li>);

        })}
      </ul>
    </nav>);

}