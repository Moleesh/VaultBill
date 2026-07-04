/** @format */

import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppIndexRedirect } from '../AppRoutesSupport';
import type { OperatorAccount } from '../features/auth/AccountTypes';
import { SessionContext } from '../features/auth/SessionContext';
import type { SessionContextValue } from '../features/auth/SessionTypes';

const buildSessionValue = (account: OperatorAccount): SessionContextValue => ({
    accounts: [account],
    archiveAccount: vi.fn(),
    hostedConnectionState: 'connected',
    login: vi.fn(),
    logout: vi.fn(),
    operatorContext: {
        account,
        CreatedBy: account.userId,
        CreatedByName: account.displayName,
        LastActionBy: account.userId,
        LastActionByName: account.displayName,
        role: account.role,
    },
    resetPassword: vi.fn(),
    saveAccount: vi.fn(),
});

describe('AppIndexRedirect', () => {
    it('lands users on the first tab available to their role', async () => {
        const userAccount: OperatorAccount = {
            displayName: 'Front Desk',
            isActive: true,
            role: 'User',
            userId: 'user_1',
            username: 'frontdesk',
        };

        render(
            <SessionContext.Provider value={buildSessionValue(userAccount)}>
                <MemoryRouter initialEntries={['/app']}>
                    <Routes>
                        <Route path="/app" element={<AppIndexRedirect />} />
                        <Route path="/app/records" element={<h1>Records</h1>} />
                        <Route path="/app/dashboard" element={<h1>Dashboard</h1>} />
                    </Routes>
                </MemoryRouter>
            </SessionContext.Provider>,
        );

        expect(await screen.findByRole('heading', { name: 'Records' })).toBeVisible();
        expect(screen.queryByRole('heading', { name: 'Dashboard' })).not.toBeInTheDocument();
    });
});
