import type { FC, PropsWithChildren } from 'react';

import { PopupBase } from '../PopupBase';

type AppModalProps = PropsWithChildren<{
  readonly isOpen: boolean;
  readonly title: string;
  readonly onClose: () => void;
}>;

export const AppModal: FC<AppModalProps> = ({ children, isOpen, onClose, title }) => (
  <PopupBase className="app-modal" isOpen={isOpen} label={title} onClose={onClose}>
    <header className="popup-header">
      <h2>{title}</h2>
      <button aria-label="Close dialog" onClick={onClose} type="button">
        Close
      </button>
    </header>
    <div className="popup-content">{children}</div>
  </PopupBase>
);
