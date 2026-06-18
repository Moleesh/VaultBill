/** @format */

/** Theme palette selector that previews and applies application color schemes. */

import { Check, Palette } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
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
    const triggerRef = useRef<HTMLButtonElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);

    const closePalette = useCallback(
        (restoreTheme: boolean) => {
            if (restoreTheme) {
                controller.setThemeId(savedTheme.current);
            }
            setIsOpen(false);
            triggerRef.current?.focus();
        },
        [controller],
    );

    useEffect(() => {
        if (!isOpen) return undefined;
        const close = (event: MouseEvent) => {
            if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
                closePalette(true);
            }
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closePalette(true);
            }
        };
        document.addEventListener('mousedown', close);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', close);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [closePalette, isOpen]);

    return (
        <div className="theme-palette" ref={rootRef}>
            <button
                aria-expanded={isOpen}
                aria-label="Choose theme"
                className="icon-button"
                ref={triggerRef}
                onClick={() => {
                    savedTheme.current = controller.themeId;
                    setIsOpen((current) => !current);
                }}
                type="button"
            >
                <Palette aria-hidden="true" size={20} />
            </button>
            {isOpen ? (
                <div className="theme-palette-popover" role="dialog" aria-label="Theme palette">
                    {controller.availableThemes.map((theme) => (
                        <button
                            aria-label={theme.label}
                            className={theme.id === controller.themeId ? 'is-selected' : ''}
                            key={theme.id}
                            onClick={() => {
                                savedTheme.current = theme.id;
                                controller.setThemeId(theme.id);
                                closePalette(false);
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
                                className="theme-palette-swatch"
                                style={{
                                    background: `linear-gradient(135deg, ${swatches[theme.id][0]} 50%, ${swatches[theme.id][1]} 50%)`,
                                }}
                            />
                            <span>{theme.label}</span>
                            {theme.id === savedTheme.current ? (
                                <Check aria-hidden="true" size={16} />
                            ) : null}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
};
