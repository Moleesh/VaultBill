/** @format */

import type { FC } from 'react';

/** Introduces the three-step first-run setup flow. */
export const SetupWelcomeStep: FC = () => (
    <div className="setup-intro">
        <p>Three short steps prepare your local billing workspace.</p>
        <ul>
            <li>Add the business identity shown on documents.</li>
            <li>Create the first Admin account for the team.</li>
            <li>Manage operators, themes, backups, and secrets later in Settings.</li>
        </ul>
    </div>
);
