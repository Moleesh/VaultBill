/** @format */

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

import type { ButtonVariant } from './Button';
import { Button } from './Button';

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
    readonly children: ReactNode;
    readonly icon?: ReactNode;
    readonly variant?: Exclude<ButtonVariant, 'danger'>;
};

/** Shared button for the common icon-plus-label action pattern. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ children, className, icon, type = 'button', variant = 'default', ...buttonProps }, ref) => (
        <Button
            {...buttonProps}
            className={className}
            icon={icon}
            layout="icon"
            ref={ref}
            type={type}
            variant={variant}
        >
            {children}
        </Button>
    ),
);

IconButton.displayName = 'IconButton';
