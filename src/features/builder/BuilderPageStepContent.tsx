/** @format */

import type { FC } from 'react';

import type { BuilderPageStepContentProps } from './BuilderPageStepContentSupport';
import { BuilderPageStepContentOutlet } from './BuilderPageStepContentSupport';

/** Renders the active builder step and footer actions. */
export const BuilderPageStepContent: FC<BuilderPageStepContentProps> = (props) => (
    <section className="builder-workspace builder-workspace--single">
        <BuilderPageStepContentOutlet {...props} />
    </section>
);
