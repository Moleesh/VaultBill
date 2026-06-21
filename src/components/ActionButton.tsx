/** @format */

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    readonly children: ReactNode;
    readonly variant?: 'default' | 'primary' | 'secondary' | 'danger';
};

const actionButtonClassName = (
    variant: ActionButtonProps['variant'],
    className: string | undefined,
): string => {
    const variantClassName =
        variant === 'primary'
            ? 'button-primary'
            : variant === 'secondary'
              ? 'button-secondary'
              : variant === 'danger'
                ? 'button-danger'
                : '';
    return [variantClassName, className].filter(Boolean).join(' ');
};

/** Shared action button that keeps button variants and dialog actions consistent. */
export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
    ({ children, className, type = 'button', variant = 'default', ...buttonProps }, ref) => (
        <button
            {...buttonProps}
            className={actionButtonClassName(variant, className)}
            ref={ref}
            type={type}
        >
            {children}
        </button>
    ),
);

ActionButton.displayName = 'ActionButton';
