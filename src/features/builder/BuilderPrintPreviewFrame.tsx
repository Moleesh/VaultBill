/** @format */

import type { CSSProperties, FC } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Printer } from 'lucide-react';

import { IconButton } from '../../components/IconButton';
import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';
import { renderBuilderPreview } from './BuilderPagePreviewSupport';
import type { AssetSummary, BuilderPrintConfig } from './BuilderPageSupport';

type BuilderPrintPreviewFrameProps = {
    readonly config: DocumentFormatConfig;
    readonly assets: readonly AssetSummary[];
    readonly templateHtml: string;
    readonly printSettings: BuilderPrintConfig;
};

/** Renders the paper iframe with one app-styled scroll surface. */
export const BuilderPrintPreviewFrame: FC<BuilderPrintPreviewFrameProps> = ({
    assets,
    config,
    printSettings,
    templateHtml,
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const frameRef = useRef<HTMLDivElement>(null);
    const [iframeHeight, setIframeHeight] = useState<number>();
    const [scrollProgress, setScrollProgress] = useState(0);
    const [hasScroll, setHasScroll] = useState(false);
    const paperSizeStyle = {
        '--builder-paper-width': `${String(printSettings.PageWidthCm * 2.5)}rem`,
        '--builder-paper-aspect-ratio': `${String(printSettings.PageWidthCm)} / ${String(
            printSettings.PageHeightCm,
        )}`,
    } as unknown as CSSProperties;
    const scrollRailStyle = {
        '--builder-print-scroll-progress': `${String(Math.max(8, scrollProgress * 100))}%`,
    } as unknown as CSSProperties;

    const updateScrollProgress = useCallback(() => {
        const frame = frameRef.current;

        if (!frame) return;

        const maximum = frame.scrollHeight - frame.clientHeight;
        setHasScroll(maximum > 1);
        setScrollProgress(maximum > 0 ? frame.scrollTop / maximum : 0);
    }, []);

    const updateIframeHeight = useCallback(() => {
        const iframe = iframeRef.current;

        try {
            const documentElement = iframe?.contentDocument?.documentElement;
            const body = iframe?.contentDocument?.body;
            const measuredHeight = Math.max(
                documentElement?.scrollHeight ?? 0,
                body?.scrollHeight ?? 0,
            );

            if (measuredHeight > 0) setIframeHeight(measuredHeight + 2);
        } catch {
            setIframeHeight(undefined);
        }

        requestAnimationFrame(updateScrollProgress);
    }, [updateScrollProgress]);

    useEffect(() => {
        updateIframeHeight();
        updateScrollProgress();
        const observer =
            typeof ResizeObserver === 'undefined'
                ? undefined
                : new ResizeObserver(updateScrollProgress);
        const frame = frameRef.current;

        if (frame) observer?.observe(frame);

        return () => {
            observer?.disconnect();
        };
    }, [
        printSettings.BottomSpacingMm,
        printSettings.MarginPreset,
        printSettings.Orientation,
        printSettings.PageHeightCm,
        printSettings.PageWidthCm,
        printSettings.PaperSize,
        updateIframeHeight,
        updateScrollProgress,
    ]);

    return (
        <>
            <div className="builder-print-preview-viewport" style={paperSizeStyle}>
                <div
                    className="builder-preview-card-frame builder-preview-card-frame--paper"
                    onScroll={(event) => {
                        updateScrollProgress();
                        event.stopPropagation();
                    }}
                    ref={frameRef}
                >
                    <iframe
                        className={`builder-print-paper builder-print-paper--${printSettings.PaperSize.toLowerCase()}`}
                        onLoad={updateIframeHeight}
                        ref={iframeRef}
                        sandbox="allow-modals allow-same-origin"
                        srcDoc={renderBuilderPreview(templateHtml, config, assets, printSettings)}
                        style={
                            iframeHeight === undefined
                                ? undefined
                                : { height: `${String(iframeHeight)}px` }
                        }
                        title="Print template preview"
                    />
                </div>
                {hasScroll ? (
                    <div
                        aria-hidden="true"
                        className="builder-print-scroll-rail"
                        style={scrollRailStyle}
                    >
                        <span />
                    </div>
                ) : null}
            </div>
            <IconButton
                icon={<Printer aria-hidden="true" size={18} />}
                onClick={() => {
                    const iframe = iframeRef.current;
                    iframe?.contentWindow?.focus();
                    iframe?.contentWindow?.print();
                }}
                variant="primary"
            >
                Test print
            </IconButton>
        </>
    );
};
