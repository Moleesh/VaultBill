/** @format */

import type { FC } from 'react';

/** Introduces the three-step first-run setup flow. */
export const SetupWelcomeStep: FC = () => (
    <div className="setup-intro">
        <p>
            Let&apos;s prepare the workspace once so the first sign-in already feels settled, clear,
            and ready for work.
        </p>
        <ul>
            <li>Add the business name and address people should see throughout the workspace.</li>
            <li>Create the first Admin account that will open and manage the workspace.</li>
            <li>Choose the opening theme before anyone reaches the sign-in screen.</li>
        </ul>
    </div>
);
