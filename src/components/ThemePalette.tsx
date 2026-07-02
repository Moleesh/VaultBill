/** @format */

/** Theme palette selector that previews and applies application color schemes. */

import type { CSSProperties, FC } from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { Check } from 'lucide-react';

import type { ThemeController, ThemeId } from '../types/AppTypes';
import { ActionButton } from './ActionButton';
import { IconOnlyButton } from './IconOnlyButton';

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
    const [popoverStyle, setPopoverStyle] =
        useState<Pick<CSSProperties, 'left' | 'top' | 'maxHeight'>>();
    const savedTheme = useRef(controller.themeId);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const positionPopover = useCallback(() => {
        const trigger = triggerRef.current;
        const popover = popoverRef.current;
        if (!trigger || !popover) return;

        const triggerRect = trigger.getBoundingClientRect();
        const popoverRect = popover.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const gutter = 12;
        const spacing = 8;

        const preferredLeft =
            triggerRect.left + popoverRect.width <= viewportWidth - gutter
                ? triggerRect.left
                : triggerRect.right - popoverRect.width;
        const left = Math.max(
            gutter,
            Math.min(preferredLeft, viewportWidth - popoverRect.width - gutter),
        );

        const spaceBelow = viewportHeight - triggerRect.bottom - gutter;
        const spaceAbove = triggerRect.top - gutter;
        const openAbove = spaceBelow < popoverRect.height + spacing && spaceAbove > spaceBelow;
        const unclampedTop = openAbove
            ? triggerRect.top - popoverRect.height - spacing
            : triggerRect.bottom + spacing;
        const top = Math.max(
            gutter,
            Math.min(unclampedTop, viewportHeight - popoverRect.height - gutter),
        );
        const maxHeight = Math.max(
            160,
            (openAbove ? triggerRect.top : viewportHeight - triggerRect.bottom) - gutter - spacing,
        );

        setPopoverStyle({ left, top, maxHeight });
    }, []);

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
            if (!(event.target instanceof Node)) {
                return;
            }

            const clickedTrigger = rootRef.current?.contains(event.target) ?? false;
            const clickedPopover = popoverRef.current?.contains(event.target) ?? false;
            if (!clickedTrigger && !clickedPopover) {
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
        window.addEventListener('resize', positionPopover);
        window.addEventListener('scroll', positionPopover, true);
        return () => {
            document.removeEventListener('mousedown', close);
            document.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('resize', positionPopover);
            window.removeEventListener('scroll', positionPopover, true);
        };
    }, [closePalette, isOpen, positionPopover]);

    useLayoutEffect(() => {
        if (!isOpen) {
            setPopoverStyle(undefined);
            return;
        }
        positionPopover();
    }, [isOpen, positionPopover]);

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
            {isOpen
                ? createPortal(
                      <div
                          aria-label="Theme palette"
                          className="theme-palette-popover"
                          ref={popoverRef}
                          role="dialog"
                          style={
                              popoverStyle
                                  ? {
                                        left: popoverStyle.left,
                                        maxHeight: popoverStyle.maxHeight,
                                        top: popoverStyle.top,
                                    }
                                  : undefined
                          }
                      >
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
                      </div>,
                      document.body,
                  )
                : null}
        </div>
    );
};
