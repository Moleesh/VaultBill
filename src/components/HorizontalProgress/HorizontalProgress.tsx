import { useEffect, useRef, useState } from 'react';
import type { FC, PropsWithChildren, UIEvent, WheelEvent } from 'react';

type HorizontalProgressProps = PropsWithChildren<{
  readonly label: string;
  readonly className?: string;
}>;

export const HorizontalProgress: FC<HorizontalProgressProps> = ({
  children,
  className = '',
  label,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(0);
  const [hasOverflow, setHasOverflow] = useState(false);

  const updateProgress = () => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const maximum = track.scrollWidth - track.clientWidth;
    track.parentElement?.style.setProperty(
      '--scroll-progress',
      `${String(maximum > 0 ? (track.scrollLeft / maximum) * 100 : 0)}%`,
    );
    setHasOverflow(maximum > 1);
    setPosition(maximum > 0 ? track.scrollLeft / maximum : 0);
  };

  useEffect(() => {
    updateProgress();
    const observer =
      typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(updateProgress);
    const track = trackRef.current;

    if (track) {
      observer?.observe(track);
    }

    return () => {
      observer?.disconnect();
    };
  }, []);

  const scrollByPage = (direction: -1 | 1) => {
    const track = trackRef.current;
    track?.scrollBy({ behavior: 'smooth', left: direction * track.clientWidth * 0.72 });
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      trackRef.current?.scrollBy({ left: event.deltaY });
    }
  };

  return (
    <section className={`horizontal-progress ${className}`} aria-label={label}>
      <div
        className="horizontal-progress__track"
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') scrollByPage(-1);
          if (event.key === 'ArrowRight') scrollByPage(1);
          if (event.key === 'Home') trackRef.current?.scrollTo({ left: 0 });
          if (event.key === 'End') trackRef.current?.scrollTo({ left: 100000 });
        }}
        onScroll={(event: UIEvent<HTMLDivElement>) => {
          updateProgress();
          event.stopPropagation();
        }}
        onWheel={handleWheel}
        ref={trackRef}
        role="region"
        tabIndex={0}
      >
        {children}
      </div>
      {hasOverflow ? (
        <div className="horizontal-progress__controls">
          <button
            aria-label={`Previous ${label}`}
            onClick={() => {
              scrollByPage(-1);
            }}
            type="button"
          >
            ←
          </button>
          <div
            aria-label={`${String(Math.round(position * 100))} percent scrolled`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={Math.round(position * 100)}
            className="horizontal-progress__bar"
            role="progressbar"
          >
            <span />
          </div>
          <button
            aria-label={`Next ${label}`}
            onClick={() => {
              scrollByPage(1);
            }}
            type="button"
          >
            →
          </button>
        </div>
      ) : null}
    </section>
  );
};
