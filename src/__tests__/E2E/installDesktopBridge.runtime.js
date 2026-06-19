/** @format */
/* global window */

(() => {
    const initKey = '__vaultbillInitCleared';
    const accountsKey = '__vaultbill_e2e_desktop_accounts__';
    const businessKey = '__vaultbill_e2e_desktop_business__';
    const recordsKey = '__vaultbill_e2e_desktop_records__';
    const sequenceKey = '__vaultbill_e2e_desktop_sequence__';
    const trialStatus = {
        isFullVersion: true,
        isExpired: false,
        accumulatedSeconds: 0,
        remainingSeconds: 0,
    };
    const resolve = (value) => Promise.resolve(value);
    const read = (key, fallback) => {
        const raw = window.localStorage.getItem(key);
        if (!raw) return fallback;
        try {
            return JSON.parse(raw);
        } catch {
            return fallback;
        }
    };
    const write = (key, value) => {
        window.localStorage.setItem(key, JSON.stringify(value));
    };
    const sortLatestFirst = (records) =>
        [...records].sort((left, right) =>
            (right.updatedAt ?? '').localeCompare(left.updatedAt ?? ''),
        );
    const asText = (value, fallback = '') => (typeof value === 'string' ? value : fallback);
    const nextDocumentNumber = () => {
        const next = Number.parseInt(window.localStorage.getItem(sequenceKey) ?? '1', 10);
        window.localStorage.setItem(sequenceKey, String(next + 1));
        return `GST-${String(next).padStart(6, '0')}`;
    };
    const saveRecord = (request, status) => {
        const records = read(recordsKey, []);
        const existing = records.find((record) => record.recordId === request.record.recordId);
        const now = new Date().toISOString();
        const saved = {
            ...request.record,
            documentNumber:
                status === 'Finalized'
                    ? asText(existing?.documentNumber, nextDocumentNumber())
                    : null,
            status,
            createdAt: asText(existing?.createdAt, now),
            updatedAt: now,
            createdBy: asText(existing?.createdBy, request.operatorContext.CreatedBy),
            createdByName: asText(existing?.createdByName, request.operatorContext.CreatedByName),
            lastActionAt: now,
            lastActionBy: request.operatorContext.LastActionBy,
            lastActionByName: request.operatorContext.LastActionByName,
        };
        write(
            recordsKey,
            sortLatestFirst([
                saved,
                ...records.filter((record) => record.recordId !== saved.recordId),
            ]),
        );
        return saved;
    };
    const upsertAccount = (account) => {
        const accounts = read(accountsKey, []);
        const saved = {
            ...account,
            passwordConfigured: account.passwordConfigured ?? true,
            usesDefaultPassword: account.usesDefaultPassword ?? false,
        };
        write(
            accountsKey,
            accounts.some((candidate) => candidate.userId === account.userId)
                ? accounts.map((candidate) =>
                      candidate.userId === account.userId ? saved : candidate,
                  )
                : [...accounts, saved],
        );
        return saved;
    };

    if (!window.sessionStorage.getItem(initKey)) {
        window.localStorage.clear();
        window.sessionStorage.clear();
        write(accountsKey, [
            {
                userId: 'sysadmin_1',
                username: 'sysadmin',
                displayName: 'System Administrator',
                role: 'SysAdmin',
                isActive: true,
                passwordConfigured: true,
                usesDefaultPassword: true,
            },
            {
                userId: 'admin_1',
                username: 'admin',
                displayName: 'Operations Admin',
                role: 'Admin',
                isActive: true,
                passwordConfigured: true,
                usesDefaultPassword: false,
            },
        ]);
        write(businessKey, {
            companyName: 'VaultBill',
            address: 'Chennai',
            gstin: '',
            theme: 'teal-flow',
            outputTarget: 'PreviewOnly',
            preferredPrinterName: '',
            includeDraftsInReports: false,
        });
        write(recordsKey, []);
        window.localStorage.setItem(sequenceKey, '1');
        window.sessionStorage.setItem(initKey, 'true');
    }

    Object.defineProperty(window, 'vaultBillRuntime', { configurable: true, value: 'desktop' });
    Object.defineProperty(window, 'vaultBillDesktop', {
        configurable: true,
        value: {
            activateLicense: () => resolve(trialStatus),
            archiveAccount: (userId) => {
                write(
                    accountsKey,
                    read(accountsKey, []).map((account) =>
                        account.userId === userId ? { ...account, isActive: false } : account,
                    ),
                );
                return resolve(undefined);
            },
            cancelOutput: () => resolve(true),
            cancelRecord: (request) =>
                resolve(
                    read(recordsKey, []).find((record) => record.recordId === request.recordId) ?? {
                        recordId: request.recordId,
                        cancellationReason: request.reason.trim(),
                    },
                ),
            closeWindow: () => resolve(undefined),
            completeSetup: (request) => {
                write(businessKey, {
                    ...read(businessKey, {}),
                    companyName: request.companyName,
                    address: request.address,
                });
                return resolve(
                    upsertAccount({
                        userId: 'admin_1',
                        username: request.adminUsername,
                        displayName: request.adminDisplayName,
                        role: 'Admin',
                        isActive: true,
                    }),
                );
            },
            configureLocalApi: () => resolve({}),
            configureSysAdmin: () => resolve(undefined),
            createBackup: () => resolve({ cancelled: true }),
            downloadPdf: (request) => resolve({ success: true, fileName: request.fileName }),
            finalizeRecord: (request) => resolve(saveRecord(request, 'Finalized')),
            getAppIdentity: () => resolve({ appName: 'VaultBill', appSlug: 'vaultbill' }),
            getBackupStatus: () => resolve({ lastBackupAt: null }),
            getBusinessSettings: () => resolve(read(businessKey, {})),
            getCredentialStatus: () =>
                resolve({ sysAdminUsesDefaultPassword: false, backupUsesDefaultPassword: false }),
            getHostedWebSettings: () =>
                resolve({ lanEnabled: false, passwordRequired: false, port: 80 }),
            getHostedWebUrl: () => resolve('http://localhost'),
            getIntegrationSettings: () => resolve({}),
            getSecretsSettings: () => resolve({ secrets: [] }),
            getTrialStatus: () => resolve(trialStatus),
            listAccounts: () => resolve(read(accountsKey, [])),
            listBuilderInventory: () =>
                resolve([
                    {
                        formatId: 'GSTInvoice',
                        formatName: 'GST Invoice',
                        isDefault: true,
                        updatedAt: '2026-01-01T00:00:00.000Z',
                        assetCount: 0,
                        isValid: true,
                    },
                ]),
            listPrinters: () => resolve([]),
            listRecords: () => resolve(read(recordsKey, [])),
            loadBuilderPackage: () => resolve(undefined),
            loginAccount: (userId) => {
                const account = read(accountsKey, []).find(
                    (candidate) => candidate.userId === userId && candidate.isActive,
                );
                return account ? resolve(account) : Promise.reject(new Error('Unknown account.'));
            },
            minimizeWindow: () => resolve(undefined),
            openHostedWeb: () => resolve(undefined),
            platform: 'win32',
            printHtml: () => resolve({ success: true }),
            queryReport: () => resolve({ rows: [], total: 0 }),
            resetApplicationData: () => resolve({ restarting: false }),
            resetPassword: (userId) =>
                resolve(
                    upsertAccount({
                        ...(read(accountsKey, []).find((account) => account.userId === userId) ??
                            {}),
                        userId,
                        passwordConfigured: true,
                        usesDefaultPassword: false,
                    }),
                ),
            restoreBackup: () => resolve({ cancelled: true }),
            saveAccount: (account) => resolve(upsertAccount(account)),
            saveBuilderPackage: (builderPackage) => resolve(builderPackage),
            saveBusinessSettings: (settings) => {
                const nextSettings = { ...read(businessKey, {}), ...settings };
                write(businessKey, nextSettings);
                return resolve(nextSettings);
            },
            saveDraft: (request) => resolve(saveRecord(request, 'Draft')),
            saveIntegrationSettings: (settings) => resolve(settings),
            saveSecretsSettings: (settings) => resolve(settings),
            setBackupPassword: () =>
                resolve({ sysAdminUsesDefaultPassword: false, backupUsesDefaultPassword: false }),
        },
    });
})();
