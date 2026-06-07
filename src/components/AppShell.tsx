/* eslint-disable max-lines */
import {
  BarChart3,
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  FileText,
  KeyRound,
  LogOut,
  RotateCcw,
  Settings,
  SlidersHorizontal,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { FC } from 'react';

import { useCapabilities } from '../capability/CapabilityContext';
import { defaultRuntimeBranding, shellSections } from '../constants/PhaseOneSeed';
import { useSession } from '../features/auth/SessionContext';
import { useRecordStore } from '../features/records/RecordStoreContext';
import { useThemeController } from '../hooks/useThemeController';
import type { AppRouteId } from '../types/AppTypes';
import { AppBrandIcon } from './AppBrandIcon/AppBrandIcon';
import { AppConfirmDialog } from './AppConfirmDialog/AppConfirmDialog';
import { AppModal } from './AppModal/AppModal';
import { ContextualHelp } from './ContextualHelp';
import { ThemePalette } from './ThemePalette';

const icons = {
  dashboard: BarChart3,
  records: FileText,
  reports: BookOpenText,
  builder: SlidersHorizontal,
  settings: Settings,
} as const;

const getPageId = (pathname: string): AppRouteId => {
  const routeId = pathname.split('/').filter(Boolean)[1];
  return (
    shellSections.some((section) => section.id === routeId) ? routeId : 'dashboard'
  ) as AppRouteId;
};

export const AppShell: FC = () => {
  const capabilities = useCapabilities();
  const { logout, operatorContext } = useSession();
  const { resetDemoData } = useRecordStore();
  const location = useLocation();
  const navigate = useNavigate();
  const themeController = useThemeController('teal-flow');
  const contentRef = useRef<HTMLElement>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isActivationOpen, setIsActivationOpen] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [activationMessage, setActivationMessage] = useState('');
  const [trialStatus, setTrialStatus] =
    useState<Awaited<ReturnType<NonNullable<typeof window.vaultBillDesktop>['getTrialStatus']>>>();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isExpanded, setIsExpanded] = useState(
    () => window.localStorage.getItem('vaultbill.sidebar.expanded') === 'true',
  );

  useEffect(() => {
    if (typeof contentRef.current?.scrollTo === 'function') {
      contentRef.current.scrollTo({ top: 0 });
    }
    setScrollProgress(0);
  }, [location.pathname]);

  useEffect(() => {
    void window.vaultBillDesktop?.getTrialStatus().then(setTrialStatus);
  }, []);

  if (!operatorContext) return null;

  const allowedSectionIds = capabilities.isDemoMode
    ? new Set(['dashboard', 'records', 'reports'])
    : operatorContext.role === 'SysAdmin'
      ? new Set(['dashboard', 'builder', 'settings'])
      : operatorContext.role === 'Admin'
        ? new Set(['dashboard', 'records', 'reports', 'settings'])
        : new Set(['records', 'reports']);
  const sections = shellSections.filter((section) => allowedSectionIds.has(section.id));
  const pageId = getPageId(location.pathname);
  const landingRoute = operatorContext.role === 'User' ? '/app/records' : '/app/dashboard';

  return (
    <div className={`app-shell${isExpanded ? ' is-sidebar-expanded' : ''}`}>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <aside className="app-shell__sidebar">
        <NavLink className="app-shell__brand" to={landingRoute}>
          <AppBrandIcon size="small" />
          <strong className="app-shell__nav-label">{defaultRuntimeBranding.applicationName}</strong>
        </NavLink>
        <button
          aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          className="app-shell__sidebar-toggle icon-button"
          onClick={() => {
            setIsExpanded((current) => {
              const next = !current;
              window.localStorage.setItem('vaultbill.sidebar.expanded', String(next));
              return next;
            });
          }}
          type="button"
        >
          {isExpanded ? <ChevronLeft aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
        </button>
        <nav aria-label="Primary" className="app-shell__nav">
          {sections.map((section) => {
            const Icon = icons[section.id as keyof typeof icons];
            return (
              <NavLink
                aria-label={section.label}
                className={({ isActive }) => `app-shell__nav-item${isActive ? ' is-active' : ''}`}
                key={section.id}
                title={isExpanded ? undefined : section.label}
                to={`/app/${section.id}`}
              >
                <Icon aria-hidden="true" className="app-shell__nav-icon" size={21} />
                <span className="app-shell__nav-label">{section.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="app-shell__operator">
          <div className="app-shell__operator-copy app-shell__nav-label">
            <strong>{operatorContext.account.displayName}</strong>
            <small>{capabilities.isDemoMode ? 'Demo mode' : operatorContext.role}</small>
          </div>
          <div className="app-shell__operator-actions">
            <ThemePalette controller={themeController} />
            {capabilities.isDemoMode ? (
              <button
                className="icon-button"
                aria-label="Reset demo data"
                onClick={() => {
                  setIsResetOpen(true);
                }}
                type="button"
              >
                <RotateCcw aria-hidden="true" size={20} />
              </button>
            ) : null}
            <button
              className="icon-button"
              aria-label="Log out"
              onClick={() => {
                logout();
                void navigate('/login');
              }}
              type="button"
            >
              <LogOut aria-hidden="true" size={20} />
            </button>
          </div>
        </div>
      </aside>

      <div className="app-shell__body">
        <header className="app-shell__topbar">
          <div>
            <p className="eyebrow">{pageId}</p>
            <strong>{capabilities.isDemoMode ? 'VaultBill Demo' : 'Business workspace'}</strong>
          </div>
          <div className="app-shell__topbar-actions">
            {!capabilities.isDemoMode && trialStatus && !trialStatus.isFullVersion ? (
              <button
                className={trialStatus.isExpired ? 'button-danger' : ''}
                onClick={() => {
                  setIsActivationOpen(true);
                }}
                type="button"
              >
                <KeyRound aria-hidden="true" size={17} />
                {trialStatus.isExpired
                  ? 'Trial expired'
                  : `${String(Math.ceil(trialStatus.remainingSeconds / 3600))}h trial`}
              </button>
            ) : null}
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
        <main
          className="app-shell__content"
          id="main-content"
          onScroll={(event) => {
            const target = event.currentTarget;
            const maximum = target.scrollHeight - target.clientHeight;
            setScrollProgress(maximum > 0 ? (target.scrollTop / maximum) * 100 : 0);
          }}
          ref={contentRef}
        >
          <Outlet />
        </main>
        <div className="app-shell__scroll-rail" aria-hidden="true">
          <span style={{ height: `${String(scrollProgress)}%` }} />
        </div>
        <nav aria-label="Mobile primary" className="app-shell__mobile-nav">
          {sections.map((section) => {
            const Icon = icons[section.id as keyof typeof icons];
            return (
              <NavLink aria-label={section.label} key={section.id} to={`/app/${section.id}`}>
                <Icon aria-hidden="true" size={20} />
                <span>{section.label}</span>
              </NavLink>
            );
          })}
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
      <AppConfirmDialog
        confirmLabel="Reset demo"
        description="This removes records created in this browser and restores the sample workspace."
        isOpen={isResetOpen}
        onCancel={() => {
          setIsResetOpen(false);
        }}
        onConfirm={() => {
          resetDemoData();
          setIsResetOpen(false);
          void navigate('/app/dashboard');
        }}
        title="Reset demo data?"
      />
      <AppModal
        isOpen={isActivationOpen}
        onClose={() => {
          setIsActivationOpen(false);
        }}
        title="Activate VaultBill"
      >
        <p>Enter the transferable key supplied with this packaged build.</p>
        <label>
          <span>License key</span>
          <input
            value={licenseKey}
            onChange={(event) => {
              setLicenseKey(event.currentTarget.value);
            }}
          />
        </label>
        {activationMessage ? (
          <p className="feedback-info" role="status">
            {activationMessage}
          </p>
        ) : null}
        <div className="popup-actions">
          <button
            onClick={() => {
              setIsActivationOpen(false);
            }}
            type="button"
          >
            Cancel
          </button>
          <button
            className="button-primary"
            onClick={() => {
              void window.vaultBillDesktop
                ?.activateLicense(licenseKey)
                .then((status) => {
                  setTrialStatus(status);
                  setActivationMessage('VaultBill is activated.');
                  setLicenseKey('');
                })
                .catch((reason: unknown) => {
                  setActivationMessage(
                    reason instanceof Error ? reason.message : 'Activation failed.',
                  );
                });
            }}
            type="button"
          >
            Activate
          </button>
        </div>
      </AppModal>
    </div>
  );
};
