/** @format */

/** Small brand mark used in login, setup, and shell chrome. */

import type { FC } from 'react';

type AppBrandIconProps = {
    readonly size?: 'small' | 'medium' | 'large';
};

export const AppBrandIcon: FC<AppBrandIconProps> = ({ size = 'medium' }) => (
    <svg
        aria-label="VaultBill"
        className={`app-brand-icon app-brand-icon--${size}`}
        role="img"
        viewBox="0 0 120 120"
    >
        <rect className="app-brand-icon__vault" x="15" y="15" width="90" height="90" rx="25" />
        <path className="app-brand-icon__paper" d="M43 34h27l14 14v39H43z" />
        <path className="app-brand-icon__fold" d="M70 34v16h14" />
        <path
            className="app-brand-icon__monogram"
            d="M51 58l8 20 8-20m2 0h8c8 0 8 10 1 11 8 1 8 11-1 11h-8z"
        />
        <path className="app-brand-icon__spark" d="M88 22v10m-5-5h10" />
    </svg>
);
