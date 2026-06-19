/** @format */

import type { FC, PropsWithChildren, RefObject, UIEvent } from 'react';

type AppShellContentFrameProps = PropsWithChildren<{
    readonly contentRef: RefObject<HTMLElement | null>;
    readonly onScroll: (event: UIEvent<HTMLElement>) => void;
    readonly scrollProgress: number;
}>;

export const AppShellContentFrame: FC<AppShellContentFrameProps> = ({
    children,
    contentRef,
    onScroll,
    scrollProgress,
}) => (
    <div className="app-shell-content-frame">
        <main className="app-shell-content" id="main-content" onScroll={onScroll} ref={contentRef}>
            {children}
        </main>
        <div className="app-shell-scroll-rail" aria-hidden="true">
            <span style={{ height: `${String(scrollProgress)}%` }} />
        </div>
    </div>
);
