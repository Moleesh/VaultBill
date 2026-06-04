import type { FC, PropsWithChildren } from 'react';

import { AccountSwitcher } from './AccountSwitcher';
import { buildTimeAppName } from '../constants/AppIdentity';
import type { OperatorAccount, OperatorContext } from '../features/auth/AccountTypes';
import type { ShellSection, ThemeController } from '../types/AppTypes';

type AppShellProps = PropsWithChildren<{
  readonly appName: string;
  readonly tagline: string;
  readonly sections: readonly ShellSection[];
  readonly themeController: ThemeController;
  readonly accounts: readonly OperatorAccount[];
  readonly operatorContext: OperatorContext;
  readonly onOperatorChange: (account: OperatorAccount) => void;
}>;

export const AppShell: FC<AppShellProps> = ({
  accounts,
  appName,
  children,
  onOperatorChange,
  operatorContext,
  sections,
  tagline,
  themeController,
}) => {
  const handleThemeChange = (value: string) => {
    const selectedTheme = themeController.availableThemes.find(
      (theme) => theme.id === value,
    );

    if (selectedTheme) {
      themeController.setThemeId(selectedTheme.id);
    }
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <aside className="app-shell__sidebar" aria-label="Primary">
        <div className="brand-mark" aria-hidden="true">
          VB
        </div>
        <div>
          <p className="app-shell__runtime-name">{appName}</p>
          <p className="app-shell__build-name">Build: {buildTimeAppName}</p>
        </div>
        <nav className="app-shell__nav">
          {sections.map((section) => (
            <button
              className="app-shell__nav-item"
              disabled={!section.isEnabled}
              key={section.id}
              type="button"
            >
              <span>{section.label}</span>
              <small>{section.description}</small>
              {!section.isEnabled ? <small>Access restricted</small> : null}
            </button>
          ))}
        </nav>
      </aside>

      <div className="app-shell__body">
        <header className="app-shell__topbar">
          <p>{tagline}</p>
          <div className="app-shell__switchers">
            <AccountSwitcher
              accounts={accounts}
              operatorContext={operatorContext}
              onChange={onOperatorChange}
            />
            <label className="theme-switcher">
              <span>Theme</span>
              <select
                aria-label="Select theme"
                value={themeController.themeId}
                onChange={(event) => {
                  handleThemeChange(event.currentTarget.value);
                }}
              >
                {themeController.availableThemes.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>

        <main className="app-shell__content" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};
