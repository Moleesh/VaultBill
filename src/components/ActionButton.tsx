/** @format */

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { Button } from './Button';
import type { ButtonVariant } from './Button';

type ActionButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
    readonly children: ReactNode;
    readonly variant?: ButtonVariant;
};

/** Shared action button that keeps button variants and dialog actions consistent. */
export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
    ({ children, className, type = 'button', variant = 'default', ...buttonProps }, ref) => (
        <Button {...buttonProps} className={className} ref={ref} type={type} variant={variant}>
            {children}
        </Button>
    ),
);

ActionButton.displayName = 'ActionButton';
