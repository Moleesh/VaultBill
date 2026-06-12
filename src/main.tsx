/** @format */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { App } from './App';
import { restoreGithubPagesRoute } from './runtime/githubPagesRedirect';
import { getRouterBaseName } from './runtime/routerBase';
import './styles/Reset.scss';
import './styles/Tokens.scss';
import './styles/Typography.scss';
import './styles/Print.scss';
import './styles/Themes/TealFlow.scss';
import './styles/Themes/MidnightInk.scss';
import './styles/Themes/SlatePro.scss';
import './styles/Themes/SandstoneLedger.scss';
import './styles/Themes/IndigoMint.scss';

import './styles/Components/ActionBar.scss';
import './styles/Components/FeedbackStates.scss';
import './styles/Components/FormPreview.scss';
import './styles/Components/ProductUi.scss';
import './styles/Components/ProductShell.scss';

restoreGithubPagesRoute();

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error('VaultBill root element was not found.');
}

createRoot(rootElement).render(
    <StrictMode>
        <BrowserRouter basename={getRouterBaseName()}>
            <App />
        </BrowserRouter>
    </StrictMode>,
);
