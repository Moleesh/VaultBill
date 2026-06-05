import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { redirectToCanonicalBasePath } from './runtime/githubPagesRedirect';
import './styles/Reset.scss';
import './styles/Tokens.scss';
import './styles/Typography.scss';
import './styles/Print.scss';
import './styles/Themes/TealFlow.scss';
import './styles/Themes/MidnightInk.scss';
import './styles/Themes/RustStone.scss';
import './styles/Themes/SlatePro.scss';
import './styles/Themes/BlushLedger.scss';
import './styles/Components/AppShell.scss';
import './styles/Components/ActionBar.scss';
import './styles/Components/CardGrid.scss';
import './styles/Components/FeedbackStates.scss';
import './styles/Components/FormPreview.scss';
import './styles/Components/StatusRail.scss';

redirectToCanonicalBasePath();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('VaultBill root element was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
