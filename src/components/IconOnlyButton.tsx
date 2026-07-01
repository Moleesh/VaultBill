/** @format */

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { Button } from './Button';

type IconOnlyButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
    readonly icon: ReactNode;
};

/** Shared icon-only action button used by compact toolbar and row actions. */
export const IconOnlyButton = forwardRef<HTMLButtonElement, IconOnlyButtonProps>(
    ({ className, icon, type = 'button', ...buttonProps }, ref) => (
        <Button
            {...buttonProps}
            className={className}
            icon={icon}
            layout="icon-only"
            ref={ref}
            type={type}
        />
    ),
);

IconOnlyButton.displayName = 'IconOnlyButton';
