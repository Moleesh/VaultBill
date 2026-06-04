import type { FC } from 'react';

import type { PhaseCard } from '../types/AppTypes';

type CardGridProps = {
  readonly cards: readonly PhaseCard[];
};

export const CardGrid: FC<CardGridProps> = ({ cards }) => (
  <section className="card-grid" aria-label="Phase one foundations">
    {cards.map((card) => (
      <article className="phase-card" data-state={card.state} key={card.title}>
        <span>{card.state}</span>
        <h2>{card.title}</h2>
        <p>{card.summary}</p>
      </article>
    ))}
  </section>
);
