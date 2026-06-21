/** @format */

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
    readonly children: ReactNode;
    readonly icon?: ReactNode;
    readonly variant?: 'default' | 'primary' | 'secondary';
};

const iconButtonClassName = (
    variant: IconButtonProps['variant'],
    className: string | undefined,
): string => {
    const variantClassName =
        variant === 'primary'
            ? 'button-primary'
            : variant === 'secondary'
              ? 'button-secondary'
              : '';
    return [variantClassName, 'icon-button', className].filter(Boolean).join(' ');
};

/** Shared button for the common icon-plus-label action pattern. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ children, className, icon, type = 'button', variant = 'default', ...buttonProps }, ref) => (
        <button
            {...buttonProps}
            className={iconButtonClassName(variant, className)}
            ref={ref}
            type={type}
        >
            {icon ?? null}
            <span>{children}</span>
        </button>
    ),
);

IconButton.displayName = 'IconButton';
