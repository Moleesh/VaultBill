import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { FC } from 'react';

import { useCapabilities } from '../capability/CapabilityContext';
import { defaultRuntimeBranding, shellSections } from '../constants/PhaseOneSeed';
import { useSession } from '../features/auth/SessionContext';
import { useRecordStore } from '../features/records/RecordStoreContext';
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
  const capabilities = useCapabilities();
  const { logout, operatorContext } = useSession();
  const { resetDemoData } = useRecordStore();
  const location = useLocation();
  const navigate = useNavigate();
  const themeController = useThemeController('teal-flow');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(
    () => window.localStorage.getItem('vaultbill.sidebar.expanded') === 'true',
  );

  if (!operatorContext) {
    return null;
  }

  const allowedSectionIds = capabilities.isDemoMode
    ? new Set(['records', 'reports'])
    : operatorContext.role === 'SysAdmin'
      ? new Set(['dashboard', 'records', 'reports', 'builder', 'settings'])
      : operatorContext.role === 'Admin'
        ? new Set(['dashboard', 'records', 'reports', 'settings'])
        : new Set(['records', 'reports']);
  const sections = shellSections.filter((section) => allowedSectionIds.has(section.id));
  const pageId = getPageId(location.pathname);
  const landingRoute =
    capabilities.isDemoMode || operatorContext.role === 'User' ? '/app/records' : '/app/dashboard';
  const themeOptions = themeController.availableThemes.map((theme) => ({
    value: theme.id,
    label: theme.label,
  }));

  const handleThemeChange = (value: string) => {
    themeController.setThemeId(value as ThemeId);
  };

  return (
    <div className={`app-shell${isExpanded ? ' is-sidebar-expanded' : ''}`}>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <aside className="app-shell__sidebar">
        <NavLink className="app-shell__brand" to={landingRoute}>
          <AppBrandIcon size="small" />
          <span>
            <strong>{defaultRuntimeBranding.applicationName}</strong>
            <small>{defaultRuntimeBranding.tagline}</small>
          </span>
        </NavLink>
        <button
          aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          className="app-shell__sidebar-toggle"
          onClick={() => {
            setIsExpanded((current) => {
              const next = !current;
              window.localStorage.setItem('vaultbill.sidebar.expanded', String(next));
              return next;
            });
          }}
          type="button"
        >
          <span aria-hidden="true">{isExpanded ? '‹' : '›'}</span>
          <span className="app-shell__nav-label">{isExpanded ? 'Collapse' : 'Expand'}</span>
        </button>
        <nav aria-label="Primary" className="app-shell__nav">
          {sections.map((section) => (
            <NavLink
              aria-label={section.label}
              className={({ isActive }) => `app-shell__nav-item${isActive ? ' is-active' : ''}`}
              key={section.id}
              title={isExpanded ? undefined : section.label}
              to={`/app/${section.id}`}
            >
              <span aria-hidden="true" className="app-shell__nav-icon">
                {section.label.slice(0, 1)}
              </span>
              <span className="app-shell__nav-label">
                <strong>{section.label}</strong>
                <small>{section.description}</small>
              </span>
            </NavLink>
          ))}
        </nav>
        <div className="app-shell__operator">
          <span className="app-shell__nav-label">{operatorContext.account.displayName}</span>
          <small className="app-shell__nav-label">
            {capabilities.isDemoMode ? 'Demo mode' : operatorContext.role}
          </small>
          {capabilities.isDemoMode ? (
            <button
              onClick={() => {
                resetDemoData();
                void navigate('/app/records');
              }}
              type="button"
            >
              Reset demo
            </button>
          ) : null}
          <button
            className="app-shell__logout"
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
            <strong>{capabilities.isDemoMode ? 'Demo workspace' : 'GST Invoice'}</strong>
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
          {sections.map((section) => (
            <NavLink key={section.id} to={`/app/${section.id}`}>
              {section.label}
            </NavLink>
          ))}
          <button
            onClick={() => {
              setIsHelpOpen(true);
            }}
            type="button"
          >
            Help
          </button>
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
