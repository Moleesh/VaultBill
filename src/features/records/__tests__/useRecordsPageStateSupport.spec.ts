/** @format */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchSecretsSettings } from '../../../query/RuntimeQueries';
import { HostedApiError } from '../../../runtime/HostedApi';

vi.mock('../../../runtime/HostedApi', async () => {
    const actual = await vi.importActual('../../../runtime/HostedApi');
    return {
        ...actual,
        requestHostedApi: vi.fn(),
    };
});

describe('useRecordsPageStateSupport', () => {
    afterEach(() => {
        delete (window as Partial<Window> & { vaultBillDesktop?: unknown }).vaultBillDesktop;
        vi.resetAllMocks();
    });

    it('returns empty secret values when hosted secret settings are forbidden', async () => {
        const { requestHostedApi } = await import('../../../runtime/HostedApi');
        vi.mocked(requestHostedApi).mockRejectedValueOnce(
            new HostedApiError(403, 'Only the System Administrator can perform this operation.'),
        );

        await expect(
            fetchSecretsSettings({ capabilities: { isHostedWeb: true } }),
        ).resolves.toEqual(expect.objectContaining({ secrets: [] }));
    });
});
