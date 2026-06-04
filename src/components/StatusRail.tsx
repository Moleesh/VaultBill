import type { FC } from 'react';

import type { OperatorContext } from '../features/auth/AccountTypes';
import type { DocumentFormatSummary } from '../types/AppTypes';

type StatusRailProps = {
  readonly activeFormat: DocumentFormatSummary | undefined;
  readonly operatorContext: OperatorContext;
};

const statusItems = [
  'Operator context',
  'Draft workspace',
  'Finalize transaction',
  'Print pipeline',
] as const;

export const StatusRail: FC<StatusRailProps> = ({ activeFormat, operatorContext }) => (
  <section className="status-rail" aria-label="Implementation readiness">
    {statusItems.map((item, index) => (
      <article className="status-rail__item" key={item}>
        <span className="status-rail__step">{index + 1}</span>
        <div>
          <h2>{item}</h2>
          <p>
            {index === 0
              ? `${operatorContext.CreatedByName} is the current operator.`
              : null}
            {index === 1 && activeFormat
              ? `${activeFormat.formatName} is selected for this SPA session.`
              : null}
            {index > 1
              ? 'Phase seam is visible; engine implementation follows later.'
              : null}
          </p>
        </div>
      </article>
    ))}
  </section>
);
