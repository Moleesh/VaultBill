/** @format */

import type { FC } from 'react';

/** Introduces the three-step first-run setup flow. */
export const SetupWelcomeStep: FC = () => (
    <div className="setup-intro">
        <p>A few quick choices get the workspace ready before the first sign-in.</p>
        <ul>
            <li>Add the business details the team should work with.</li>
            <li>Choose the opening theme for the app.</li>
            <li>Create the first Admin account with the right access.</li>
        </ul>
    </div>
);
