import { useState } from 'react';

import { ActionBar } from './components/ActionBar';
import { AppShell } from './components/AppShell';
import { CardGrid } from './components/CardGrid';
import { FeedbackStates } from './components/FeedbackStates';
import { FormatSelector } from './components/FormatSelector';
import { RecordPreview } from './components/RecordPreview';
import { StatusRail } from './components/StatusRail';
import {
  defaultRuntimeBranding,
  phaseOneCards,
  shellSections,
} from './constants/PhaseOneSeed';
import {
  documentFormatSummaries,
  phaseFourStoredFormats,
} from './constants/PhaseFourFormats';
import { applyNavigationPermissions } from './engines/permissionEngine/PermissionEngine';
import { resolveDocumentFormatSelection } from './engines/schemaEngine/DocumentFormatResolver';
import {
  bootstrapOperatorAccounts,
  createOperatorContext,
} from './features/auth/AccountBootstrap';
import type { OperatorAccount } from './features/auth/AccountTypes';
import { useThemeController } from './hooks/useThemeController';
import type { DocumentFormatSummary } from './types/AppTypes';

const requireFallbackAccount = (): OperatorAccount => {
  const account = bootstrapOperatorAccounts[0];

  if (!account) {
    throw new Error('VaultBill requires at least one operator account.');
  }

  return account;
};

export const App = () => {
  const themeController = useThemeController('teal-flow');
  const [activeAccountId, setActiveAccountId] = useState(
    bootstrapOperatorAccounts[0]?.userId ?? 'sysadmin_1',
  );
  const [activeFormatId, setActiveFormatId] = useState(
    documentFormatSummaries[0]?.formatId ?? 'TaxInvoice',
  );

  const activeAccount =
    bootstrapOperatorAccounts.find((account) => account.userId === activeAccountId) ??
    requireFallbackAccount();
  const operatorContext = createOperatorContext(activeAccount);
  const permittedSections = applyNavigationPermissions(
    operatorContext.role,
    shellSections,
  );

  const selectedFormatSummary = documentFormatSummaries.find(
    (format) => format.formatId === activeFormatId,
  );
  const selectedFormat = selectedFormatSummary
    ? { formatId: activeFormatId, formatName: selectedFormatSummary.formatName }
    : { formatId: activeFormatId };
  const formatResolution = resolveDocumentFormatSelection(
    selectedFormat,
    phaseFourStoredFormats,
  );
  const activeFormat: DocumentFormatSummary = {
    formatId: formatResolution.format.formatId,
    formatName: formatResolution.format.formatName,
    description: formatResolution.format.config.Description ?? '',
    isDefault: formatResolution.format.isDefault,
  };

  const handleFormatChange = (format: DocumentFormatSummary) => {
    setActiveFormatId(format.formatId);
  };

  return (
    <AppShell
      appName={defaultRuntimeBranding.applicationName}
      tagline={defaultRuntimeBranding.tagline}
      sections={permittedSections}
      themeController={themeController}
      accounts={bootstrapOperatorAccounts}
      operatorContext={operatorContext}
      onOperatorChange={(account) => {
        setActiveAccountId(account.userId);
      }}
    >
      <section className="hero-panel" aria-labelledby="page-title">
        <div className="hero-panel__copy">
          <p className="eyebrow">Phase 3 operator-aware foundation</p>
          <h1 id="page-title">Configure once. Bill, print, and report anywhere.</h1>
          <p className="hero-panel__summary">
            VaultBill starts as a single-page shell with the right seams: JSON-led
            formats, operator-aware permissions, responsive panels, and a desktop bridge
            ready for the engines that follow.
          </p>
        </div>
        <FormatSelector
          activeFormatId={activeFormatId}
          formats={documentFormatSummaries}
          onChange={handleFormatChange}
        />
        {formatResolution.warning ? (
          <p className="format-warning" role="status">
            {formatResolution.warning}
          </p>
        ) : null}
      </section>

      <StatusRail activeFormat={activeFormat} operatorContext={operatorContext} />

      <div className="workspace-grid">
        <RecordPreview activeFormat={activeFormat} operatorContext={operatorContext} />
        <CardGrid cards={phaseOneCards} />
      </div>

      <FeedbackStates />

      <ActionBar role={operatorContext.role} />
    </AppShell>
  );
};
