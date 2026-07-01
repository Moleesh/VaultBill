/** @format */

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { Button } from './Button';
import type { ButtonVariant } from './Button';

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
