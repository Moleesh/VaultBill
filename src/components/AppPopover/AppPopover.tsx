import type { FC, PropsWithChildren } from 'react';

import { PopupBase } from '../PopupBase';

type AppPopoverProps = PropsWithChildren<{
  readonly isOpen: boolean;
  readonly label: string;
  readonly onClose: () => void;
}>;

export const AppPopover: FC<AppPopoverProps> = ({ children, isOpen, label, onClose }) => (
  <PopupBase className="app-popover" isOpen={isOpen} label={label} onClose={onClose}>
    <div className="popup-content">{children}</div>
  </PopupBase>
);
