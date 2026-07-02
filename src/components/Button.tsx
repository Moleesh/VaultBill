/** @format */

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

export type ButtonVariant = 'default' | 'primary' | 'secondary' | 'danger';
export type ButtonLayout = 'default' | 'icon' | 'icon-only';

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
    readonly children?: ReactNode;
    readonly className?: string | undefined;
    readonly icon?: ReactNode;
    readonly layout?: ButtonLayout;
    readonly labelClassName?: string | undefined;
    readonly variant?: ButtonVariant;
};

export const buttonVariantClassName = (variant: ButtonVariant = 'default'): string =>
    variant === 'primary'
        ? 'button-primary'
        : variant === 'secondary'
          ? 'button-secondary'
          : variant === 'danger'
            ? 'button-danger'
            : '';

const buttonLayoutClassName = (layout: ButtonLayout): string =>
    layout === 'icon' ? 'icon-button' : layout === 'icon-only' ? 'icon-only-button' : '';

export const buttonClassName = ({
    className,
    layout = 'default',
    variant = 'default',
}: {
    readonly className?: string | undefined;
    readonly layout?: ButtonLayout;
    readonly variant?: ButtonVariant;
}): string =>
    [buttonVariantClassName(variant), buttonLayoutClassName(layout), className]
        .filter(Boolean)
        .join(' ');

/** Shared button primitive for standard, icon, and icon-only actions. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            children,
            className,
            icon,
            labelClassName,
            layout = 'default',
            type = 'button',
            variant = 'default',
            ...buttonProps
        },
        ref,
    ) => (
        <button
            {...buttonProps}
            className={buttonClassName({ className, layout, variant })}
            ref={ref}
            type={type}
        >
            {icon ?? null}
            {layout !== 'icon-only' && children ? (
                icon ? (
                    <span className={labelClassName}>{children}</span>
                ) : (
                    children
                )
            ) : null}
        </button>
    ),
);

Button.displayName = 'Button';
