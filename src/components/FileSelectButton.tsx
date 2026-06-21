/** @format */

import type { ChangeEventHandler, FC, ReactNode } from 'react';

type FileSelectButtonProps = {
    readonly accept?: string;
    readonly children: ReactNode;
    readonly className?: string;
    readonly multiple?: boolean;
    readonly onChange: ChangeEventHandler<HTMLInputElement>;
};

/** Shared styled file-picker trigger used by builder and settings upload actions. */
export const FileSelectButton: FC<FileSelectButtonProps> = ({
    accept,
    children,
    className,
    multiple = false,
    onChange,
}) => (
    <label className={className ? `button-file ${className}` : 'button-file'}>
        {children}
        <input
            accept={accept}
            multiple={multiple}
            onChange={onChange}
            onClick={(event) => {
                event.currentTarget.value = '';
            }}
            type="file"
        />
    </label>
);
