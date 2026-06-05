import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { FC } from 'react';

import { defaultRuntimeBranding, shellSections } from '../constants/PhaseOneSeed';
import { applyNavigationPermissions } from '../engines/permissionEngine/PermissionEngine';
import { useSession } from '../features/auth/SessionContext';
import { useThemeController } from '../hooks/useThemeController';
import type { AppRouteId, ThemeId } from '../types/AppTypes';
import { AppBrandIcon } from './AppBrandIcon/AppBrandIcon';
import { ContextualHelp } from './ContextualHelp';
import { SearchableDropdown } from './SearchableDropdown/SearchableDropdown';

const getPageId = (pathname: string): AppRouteId => {
  const routeId = pathname.split('/').filter(Boolean)[1];
  const knownRoute = shellSections.find((section) => section.id === routeId);
  return (knownRoute?.id as AppRouteId | undefined) ?? 'dashboard';
};

export const AppShell: FC = () => {
  const { logout, operatorContext } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const themeController = useThemeController('teal-flow');
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  if (!operatorContext) {
    return null;
  }

  const sections = applyNavigationPermissions(operatorContext.role, shellSections);
  const pageId = getPageId(location.pathname);
  const themeOptions = themeController.availableThemes.map((theme) => ({
    value: theme.id,
    label: theme.label,
  }));

  const handleThemeChange = (value: string) => {
    themeController.setThemeId(value as ThemeId);
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <aside className="app-shell__sidebar">
        <NavLink className="app-shell__brand" to="/app/dashboard">
          <AppBrandIcon size="small" />
          <span>
            <strong>{defaultRuntimeBranding.applicationName}</strong>
            <small>{defaultRuntimeBranding.tagline}</small>
          </span>
        </NavLink>
        <nav aria-label="Primary" className="app-shell__nav">
          {sections.map((section) =>
            section.isEnabled ? (
              <NavLink
                className={({ isActive }) => `app-shell__nav-item${isActive ? ' is-active' : ''}`}
                key={section.id}
                to={`/app/${section.id}`}
              >
                <span>{section.label}</span>
                <small>{section.description}</small>
              </NavLink>
            ) : (
              <span
                aria-disabled="true"
                className="app-shell__nav-item is-disabled"
                key={section.id}
                title={section.permissionDecision.reason}
              >
                <span>{section.label}</span>
                <small>Access restricted</small>
              </span>
            ),
          )}
        </nav>
        <div className="app-shell__operator">
          <span>{operatorContext.account.displayName}</span>
          <small>{operatorContext.role}</small>
          <button
            onClick={() => {
              logout();
              void navigate('/login');
            }}
            type="button"
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="app-shell__body">
        <header className="app-shell__topbar">
          <div>
            <p className="eyebrow">{pageId}</p>
            <strong>GST Invoice</strong>
          </div>
          <div className="app-shell__topbar-actions">
            <SearchableDropdown
              label="Theme"
              onChange={handleThemeChange}
              options={themeOptions}
              value={themeController.themeId}
            />
            <button
              onClick={() => {
                setIsHelpOpen(true);
              }}
              type="button"
            >
              Help
            </button>
          </div>
        </header>
        <main className="app-shell__content" id="main-content">
          <Outlet />
        </main>
        <nav aria-label="Mobile primary" className="app-shell__mobile-nav">
          {sections
            .filter((section) => section.isEnabled)
            .map((section) => (
              <NavLink key={section.id} to={`/app/${section.id}`}>
                {section.label}
              </NavLink>
            ))}
        </nav>
      </div>
      <ContextualHelp
        isOpen={isHelpOpen}
        onClose={() => {
          setIsHelpOpen(false);
        }}
        onOpen={() => {
          setIsHelpOpen(true);
        }}
        page={pageId}
        role={operatorContext.role}
      />
    </div>
  );
};
