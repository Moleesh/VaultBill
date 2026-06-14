/** @format */

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
    beforeEach(() => {
        window.localStorage.clear();
        window.localStorage.setItem('vaultbill.setup.complete', 'true');
        window.localStorage.setItem(
            'vaultbill.accounts',
            JSON.stringify([
                {
                    userId: 'admin_1',
                    username: 'admin',
                    displayName: 'Operations Admin',
                    role: 'Admin',
                    isActive: true,
                },
            ]),
        );
        const portalRoot = document.createElement('div');
        portalRoot.id = 'portal-root';
        document.body.append(portalRoot);
    });

    it('starts at login and enters the configured workspace', async () => {
        render(
            <MemoryRouter initialEntries={['/login']}>
                <App />
            </MemoryRouter>,
        );

        expect(screen.getByRole('heading', { name: 'VaultBill' })).toBeVisible();

        if (import.meta.env.VITE_DEMO_MODE === 'true') {
            expect(screen.getByText('Demo User')).toBeVisible();
            fireEvent.click(screen.getByRole('button', { name: 'Start demo' }));

            expect(
                await screen.findByRole('heading', { name: /Welcome back, Demo User/u }),
            ).toBeVisible();
        } else {
            fireEvent.click(screen.getByRole('button', { name: /Operator account/u }));
            fireEvent.click(screen.getByRole('option', { name: /Operations Admin/u }));
            const passwordInput = screen.queryByLabelText('Password');
            if (passwordInput) {
                fireEvent.change(passwordInput, {
                    target: { value: '147085aA' },
                });
            }
            fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

            expect(await screen.findByText('Business workspace')).toBeVisible();
            expect(await screen.findByText(/Welcome back, Operations Admin\./u)).toBeVisible();
        }

        expect(screen.queryByText(/Phase \d/u)).not.toBeInTheDocument();
    });
});
