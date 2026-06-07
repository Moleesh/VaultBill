import { Check, Palette } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FC } from 'react';

import type { ThemeController, ThemeId } from '../types/AppTypes';

type ThemePaletteProps = {
  readonly controller: ThemeController;
};

const swatches: Readonly<Record<ThemeId, readonly [string, string]>> = {
  'teal-flow': ['#0f766e', '#d9f0ea'],
  'slate-pro': ['#334155', '#dbe4ee'],
  'midnight-ink': ['#101827', '#60a5fa'],
  'sandstone-ledger': ['#8a5b32', '#efe1cb'],
  'indigo-mint': ['#4338ca', '#c7f4e5'],
};

export const ThemePalette: FC<ThemePaletteProps> = ({ controller }) => {
  const [isOpen, setIsOpen] = useState(false);
  const savedTheme = useRef(controller.themeId);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const close = (event: MouseEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        controller.setThemeId(savedTheme.current);
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => {
      document.removeEventListener('mousedown', close);
    };
  }, [controller, isOpen]);

  return (
    <div className="theme-palette" ref={rootRef}>
      <button
        aria-expanded={isOpen}
        aria-label="Choose theme"
        className="icon-button"
        onClick={() => {
          savedTheme.current = controller.themeId;
          setIsOpen((current) => !current);
        }}
        type="button"
      >
        <Palette aria-hidden="true" size={20} />
      </button>
      {isOpen ? (
        <div
          className="theme-palette__popover"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              controller.setThemeId(savedTheme.current);
              setIsOpen(false);
            }
          }}
          role="dialog"
          aria-label="Theme palette"
        >
          {controller.availableThemes.map((theme) => (
            <button
              aria-label={theme.label}
              className={theme.id === controller.themeId ? 'is-selected' : ''}
              key={theme.id}
              onBlur={() => {
                controller.setThemeId(savedTheme.current);
              }}
              onClick={() => {
                savedTheme.current = theme.id;
                controller.setThemeId(theme.id);
                setIsOpen(false);
              }}
              onFocus={() => {
                controller.setThemeId(theme.id);
              }}
              onMouseEnter={() => {
                controller.setThemeId(theme.id);
              }}
              type="button"
            >
              <span
                className="theme-palette__swatch"
                style={{
                  background: `linear-gradient(135deg, ${swatches[theme.id][0]} 50%, ${swatches[theme.id][1]} 50%)`,
                }}
              />
              <span>{theme.label}</span>
              {theme.id === savedTheme.current ? <Check aria-hidden="true" size={16} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
