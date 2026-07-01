/** @format */
/* eslint-disable max-lines */

/** First-run setup flow for business identity, initial security, and starter configuration. */
import { useEffect, useRef, useState } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';

import { shouldRenderDesktopChrome } from '../../capability/CapabilityRegistry';
import { useCapabilities } from '../../capability/CapabilityContext';
import { requestHostedApi } from '../../runtime/HostedApi';
import type { ThemeId } from '../../types/AppTypes';
import type { OperatorAccount } from '../auth/AccountTypes';
import {
    applyTheme,
    getStoredTheme,
    isThemeId,
    loadResolvedTheme,
} from '../../runtime/WorkspaceTheme';
import { SetupAdminUserStep } from './SetupAdminUserStep';
import { SetupPageActions } from './SetupPageActions';
import { SetupBusinessProfileStep } from './SetupBusinessProfileStep';
import { SetupPageChrome } from './SetupPageChrome';
import { SetupPageProvider } from './SetupPageContext';
import { SetupPageHeader } from './SetupPageHeader';
import { SetupPageMessageModal } from './SetupPageMessageModal';
import {
    getAdminAccessValidationMessage,
    getBusinessProfileValidationMessage,
    localHostedOrigins,
    setupErrorMessage,
    setupSteps,
} from './SetupPageSupport';
import { SetupWelcomeStep } from './SetupWelcomeStep';
import { useSetupForm } from './useSetupForm';

type SetupPageProps = {
    readonly onComplete?: () => void;
};

/** Runs the first-launch setup wizard for business identity and admin access. */
export const SetupPage: FC<SetupPageProps> = ({ onComplete }) => {
    const capabilities = useCapabilities();
    const showDesktopChrome = shouldRenderDesktopChrome(capabilities);
    const navigate = useNavigate();
    const [stepIndex, setStepIndex] = useState(0);
    const [initialTheme] = useState<ThemeId>(() => getStoredTheme() ?? 'teal-flow');
    const [selectedTheme, setSelectedTheme] = useState<ThemeId>(initialTheme);
    const [message, setMessage] = useState('');
    const [hasAttemptedBusinessProfileContinue, setHasAttemptedBusinessProfileContinue] =
        useState(false);
    const [hasAttemptedAdminUserFinish, setHasAttemptedAdminUserFinish] = useState(false);
    const [hasExistingAdminPassword, setHasExistingAdminPassword] = useState(false);
    const hydratedSetupDefaultsRef = useRef(false);
    const selectedThemeRef = useRef(initialTheme);
    const activeStep = setupSteps[stepIndex]?.label ?? 'Welcome';
    const canUseHostedSetupApi = localHostedOrigins.has(window.location.hostname);
    const form = useSetupForm({
        defaultTheme: initialTheme,
        onSubmit: async (value) => {
            if (window.vaultBillDesktop) {
                await window.vaultBillDesktop.completeSetup({
                    companyName: value.companyName.trim(),
                    address: value.address.trim(),
                    theme: selectedTheme,
                    adminUsername: value.adminUsername.trim(),
                    adminDisplayName: value.adminDisplayName.trim(),
                    adminPassword: value.adminPassword.trim(),
                });
            } else if (capabilities.isHostedWeb || canUseHostedSetupApi) {
                await requestHostedApi('/setup/complete', 'POST', {
                    companyName: value.companyName.trim(),
                    address: value.address.trim(),
                    theme: selectedTheme,
                    adminUsername: value.adminUsername.trim(),
                    adminDisplayName: value.adminDisplayName.trim(),
                    adminPassword: value.adminPassword.trim(),
                });
            } else {
                throw new Error('Setup is only available through VaultBill Desktop.');
            }
            onComplete?.();
            await navigate('/login', { replace: true });
        },
    });
    const { address, adminDisplayName, adminUsername, companyName } = form.state.values;

    const getCurrentBusinessProfileState = () => {
        const currentCompanyName = form.state.values.companyName;
        const currentAddress = form.state.values.address;
        return {
            companyName: currentCompanyName,
            address: currentAddress,
            isInvalid: currentCompanyName.trim().length === 0 || currentAddress.trim().length === 0,
        };
    };
    const getCurrentAdminAccessState = () => {
        const currentAdminUsername = form.state.values.adminUsername;
        const currentAdminDisplayName = form.state.values.adminDisplayName;
        return {
            adminUsername: currentAdminUsername,
            adminDisplayName: currentAdminDisplayName,
            isInvalid:
                currentAdminUsername.trim().length === 0 ||
                currentAdminDisplayName.trim().length === 0,
        };
    };

    const isBusinessProfileInvalid = getCurrentBusinessProfileState().isInvalid;
    const isAdminUserInvalid = getCurrentAdminAccessState().isInvalid;
    const isFinalStep = stepIndex === setupSteps.length - 1;

    useEffect(() => {
        selectedThemeRef.current = selectedTheme;
    }, [selectedTheme]);

    useEffect(() => {
        form.setFieldValue('theme', selectedTheme);
    }, [form, selectedTheme]);

    useEffect(() => {
        void loadResolvedTheme(capabilities.isHostedWeb)
            .then((resolvedTheme) => {
                if (selectedThemeRef.current !== initialTheme) return;
                setSelectedTheme(resolvedTheme);
                applyTheme(resolvedTheme);
            })
            .catch(() => {
                applyTheme(selectedThemeRef.current);
            });
    }, [capabilities.isHostedWeb, initialTheme]);

    useEffect(() => {
        if (hydratedSetupDefaultsRef.current) return;
        hydratedSetupDefaultsRef.current = true;

        const hydrateSetupDefaults = async () => {
            const fallbackBusiness = {
                companyName: '',
                address: '',
                theme: form.state.values.theme,
            };
            const fallbackAccounts: readonly OperatorAccount[] = [];

            const [business, accounts] = window.vaultBillDesktop
                ? await Promise.all([
                      window.vaultBillDesktop.getBusinessSettings(),
                      window.vaultBillDesktop.listAccounts(),
                  ])
                : capabilities.isHostedWeb || canUseHostedSetupApi
                  ? await Promise.all([
                        requestHostedApi('/workspace/settings').catch(() => fallbackBusiness),
                        requestHostedApi<readonly OperatorAccount[]>('/auth/accounts').catch(
                            () => fallbackAccounts,
                        ),
                    ])
                  : [fallbackBusiness, fallbackAccounts];

            const nextBusiness =
                typeof business === 'object' && business !== null
                    ? (business as {
                          readonly companyName?: unknown;
                          readonly address?: unknown;
                          readonly theme?: unknown;
                      })
                    : {};
            const activeAdmin = accounts.find(
                (account) => account.role === 'Admin' && account.isActive,
            );

            form.setFieldValue(
                'companyName',
                typeof nextBusiness.companyName === 'string' ? nextBusiness.companyName : '',
            );
            form.setFieldValue(
                'address',
                typeof nextBusiness.address === 'string' ? nextBusiness.address : '',
            );
            const hydratedTheme =
                typeof nextBusiness.theme === 'string' && isThemeId(nextBusiness.theme)
                    ? nextBusiness.theme
                    : selectedThemeRef.current;
            if (selectedThemeRef.current === initialTheme) {
                setSelectedTheme(hydratedTheme);
                applyTheme(hydratedTheme);
            }
            form.setFieldValue('adminDisplayName', activeAdmin?.displayName ?? '');
            form.setFieldValue('adminUsername', activeAdmin?.username ?? '');
            form.setFieldValue('adminPassword', '');
            setHasExistingAdminPassword(
                Boolean(activeAdmin?.passwordConfigured ?? activeAdmin?.passwordHash),
            );
        };

        void hydrateSetupDefaults().catch(() => undefined);
    }, [canUseHostedSetupApi, capabilities.isHostedWeb, form, initialTheme]);

    useEffect(() => {
        if (!hasAttemptedBusinessProfileContinue) return;

        if (isBusinessProfileInvalid) {
            setMessage(
                getBusinessProfileValidationMessage({
                    companyName,
                    address,
                }),
            );
            return;
        }

        setHasAttemptedBusinessProfileContinue(false);
        setMessage('');
    }, [address, companyName, hasAttemptedBusinessProfileContinue, isBusinessProfileInvalid]);

    useEffect(() => {
        if (!hasAttemptedAdminUserFinish) return;

        if (isAdminUserInvalid) {
            setMessage(
                getAdminAccessValidationMessage({
                    adminDisplayName,
                    adminUsername,
                }),
            );
            return;
        }

        setHasAttemptedAdminUserFinish(false);
        setMessage('');
    }, [adminDisplayName, adminUsername, hasAttemptedAdminUserFinish, isAdminUserInvalid]);

    const handleThemeChange = (value: string) => {
        if (!isThemeId(value)) return;
        setSelectedTheme(value);
        applyTheme(value);
    };

    const handleContinue = () => {
        if (stepIndex === 1) {
            const currentBusinessProfile = getCurrentBusinessProfileState();
            if (!currentBusinessProfile.isInvalid) {
                setHasAttemptedBusinessProfileContinue(false);
                setMessage('');
                setStepIndex((current) => Math.min(setupSteps.length - 1, current + 1));
                return;
            }

            setHasAttemptedBusinessProfileContinue(true);
            setMessage(
                getBusinessProfileValidationMessage({
                    companyName: currentBusinessProfile.companyName,
                    address: currentBusinessProfile.address,
                }),
            );
            return;
        }
        setHasAttemptedBusinessProfileContinue(false);
        setMessage('');
        setStepIndex((current) => Math.min(setupSteps.length - 1, current + 1));
    };

    const handleFinish = () => {
        const currentAdminAccess = getCurrentAdminAccessState();
        if (currentAdminAccess.isInvalid) {
            setHasAttemptedAdminUserFinish(true);
            setMessage(
                getAdminAccessValidationMessage({
                    adminDisplayName: currentAdminAccess.adminDisplayName,
                    adminUsername: currentAdminAccess.adminUsername,
                }),
            );
            return;
        }
        setHasAttemptedAdminUserFinish(false);
        setMessage('');
        void form.handleSubmit().catch((reason: unknown) => {
            setMessage(setupErrorMessage(reason));
        });
    };

    return (
        <main className="setup-page">
            {showDesktopChrome ? <SetupPageChrome /> : null}
            <section className="setup-card">
                <SetupPageProvider
                    value={{
                        clearMessage: () => {
                            setMessage('');
                        },
                        form,
                        handleThemeChange,
                        isAdminUserInvalid,
                        isBusinessProfileInvalid,
                        onContinue: handleContinue,
                        onFinish: handleFinish,
                        setShowAdminUserValidation: setHasAttemptedAdminUserFinish,
                        setShowBusinessProfileValidation: setHasAttemptedBusinessProfileContinue,
                        setStepIndex,
                        showAdminUserValidation: hasAttemptedAdminUserFinish,
                        showBusinessProfileValidation: hasAttemptedBusinessProfileContinue,
                        stepIndex,
                    }}
                >
                    <SetupPageHeader />
                    <section className="setup-card-content" aria-labelledby="setup-step-title">
                        <div>
                            <p className="eyebrow">
                                Step {stepIndex + 1} of {setupSteps.length}
                            </p>
                            <h2 id="setup-step-title">{activeStep}</h2>
                        </div>
                        {activeStep === 'Welcome' ? <SetupWelcomeStep /> : null}
                        {activeStep === 'Workspace Details' ? <SetupBusinessProfileStep /> : null}
                        {activeStep === 'Admin Access' ? (
                            <SetupAdminUserStep
                                hasExistingAdminPassword={hasExistingAdminPassword}
                                selectedTheme={selectedTheme}
                            />
                        ) : null}
                    </section>
                    <SetupPageActions isFinalStep={isFinalStep} showBack={stepIndex > 0} />
                </SetupPageProvider>
            </section>
            <SetupPageMessageModal
                message={message}
                onClose={() => {
                    setMessage('');
                }}
            />
        </main>
    );
};
