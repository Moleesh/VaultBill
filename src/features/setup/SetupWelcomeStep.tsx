/** @format */

import type { FC } from 'react';

/** Introduces the three-step first-run setup flow. */
export const SetupWelcomeStep: FC = () => (
    <div className="setup-intro">
        <p>
            Let&apos;s shape the workspace before anyone signs in. In a minute or two, VaultBill
            will feel ready, familiar, and easy for the team to start using.
        </p>
        <ul>
            <li>Add the business details that should appear across the workspace.</li>
            <li>Pick the theme you want people to see from the very first screen.</li>
            <li>Create the first Admin account to open the workspace with the right access.</li>
        </ul>
    </div>
);
