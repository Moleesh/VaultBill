/** @format */

import type { FC } from 'react';

/** Introduces the three-step first-run setup flow. */
export const SetupWelcomeStep: FC = () => (
    <div className="setup-intro">
        <p>A few quick choices get everything ready before the first sign-in.</p>
        <ul>
            <li>Add the business details the team will use every day.</li>
            <li>Choose the theme for the sign-in screen and workspace.</li>
            <li>Create the first Admin account for day-to-day access.</li>
        </ul>
    </div>
);
