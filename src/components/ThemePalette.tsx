/** @format */

/** Theme palette selector that previews and applies application color schemes. */

import { Check } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FC } from 'react';

import { ActionButton } from './ActionButton';
import { IconOnlyButton } from './IconOnlyButton';
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

const swatchBackground = (themeId: ThemeId) =>
    `linear-gradient(135deg, ${swatches[themeId][0]} 50%, ${swatches[themeId][1]} 50%)`;

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
            <IconOnlyButton
                aria-expanded={isOpen}
                aria-label="Choose theme"
                className="icon-button theme-palette-trigger"
                icon={
                    <span
                        aria-hidden="true"
                        className="theme-palette-swatch theme-palette-trigger-swatch"
                        style={{ background: swatchBackground(controller.themeId) }}
                    />
                }
                ref={triggerRef}
                onClick={() => {
                    savedTheme.current = controller.themeId;
                    setIsOpen((current) => !current);
                }}
            />
            {isOpen ? (
                <div className="theme-palette-popover" role="dialog" aria-label="Theme palette">
                    {controller.availableThemes.map((theme) => (
                        <ActionButton
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
                        >
                            <span
                                className="theme-palette-swatch"
                                style={{
                                    background: swatchBackground(theme.id),
                                }}
                            />
                            <span>{theme.label}</span>
                            {theme.id === controller.themeId ? (
                                <Check aria-hidden="true" size={16} />
                            ) : null}
                        </ActionButton>
                    ))}
                </div>
            ) : null}
        </div>
    );
};
