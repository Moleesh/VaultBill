import type { FC } from 'react';

const states = [
  {
    label: 'Loading',
    message:
      'Slow records, reports, imports, print, backup, and restore tasks show progress.',
  },
  {
    label: 'Empty',
    message:
      'No matching rows or records gets a calm empty state instead of a blank panel.',
  },
  {
    label: 'Error',
    message:
      'Validation and adapter failures surface in summaries with field follow-up.',
  },
  {
    label: 'Success',
    message:
      'Completed save, print, export, backup, and restore actions announce success.',
  },
] as const;

export const FeedbackStates: FC = () => (
  <section className="feedback-states" aria-labelledby="feedback-states-title">
    <div>
      <p className="eyebrow">Interaction states</p>
      <h2 id="feedback-states-title">Every slow or empty path gets a voice.</h2>
    </div>
    <div className="feedback-states__grid">
      {states.map((state) => (
        <article className="feedback-state" key={state.label}>
          <span aria-hidden="true" className="feedback-state__dot" />
          <h3>{state.label}</h3>
          <p>{state.message}</p>
        </article>
      ))}
    </div>
  </section>
);
