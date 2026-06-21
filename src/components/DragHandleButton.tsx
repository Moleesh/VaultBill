/** @format */

import type { ButtonHTMLAttributes, FC, ReactNode } from 'react';

type DragHandleButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
    readonly icon: ReactNode;
};

/** Shared drag handle button used by reorderable list rows. */
export const DragHandleButton: FC<DragHandleButtonProps> = ({
    className,
    icon,
    type = 'button',
    ...buttonProps
}) => (
    <button
        {...buttonProps}
        className={['builder-field-handle', className].filter(Boolean).join(' ')}
        type={type}
    >
        {icon}
    </button>
);
