/** @format */

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type IconOnlyButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
    readonly icon: ReactNode;
};

/** Shared icon-only action button used by compact toolbar and row actions. */
export const IconOnlyButton = forwardRef<HTMLButtonElement, IconOnlyButtonProps>(
    ({ className, icon, type = 'button', ...buttonProps }, ref) => (
        <button
            {...buttonProps}
            className={['icon-only-button', className].filter(Boolean).join(' ')}
            ref={ref}
            type={type}
        >
            {icon}
        </button>
    ),
);

IconOnlyButton.displayName = 'IconOnlyButton';
