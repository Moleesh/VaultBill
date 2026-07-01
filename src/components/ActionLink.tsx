/** @format */

import type { AnchorHTMLAttributes, FC, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { LinkProps } from 'react-router-dom';

import { buttonVariantClassName } from './Button';
import type { ButtonVariant } from './Button';

type ActionLinkProps = Omit<LinkProps, 'className'> &
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
        readonly children: ReactNode;
        readonly className?: string;
        readonly variant?: ButtonVariant;
    };

const actionLinkClassName = (
    variant: ActionLinkProps['variant'],
    className: string | undefined,
): string => {
    const variantClassName = buttonVariantClassName(variant);
    return ['action-link', variantClassName, className].filter(Boolean).join(' ');
};

/** Shared route link that reuses button variants for navigation actions. */
export const ActionLink: FC<ActionLinkProps> = ({
    children,
    className,
    variant = 'default',
    ...linkProps
}) => (
    <Link {...linkProps} className={actionLinkClassName(variant, className)}>
        {children}
    </Link>
);
