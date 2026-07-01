/** @format */
/* eslint-disable max-lines */

/** First-run setup flow for business identity, initial security, and starter configuration. */
import { useEffect, useRef, useState } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { shouldRenderDesktopChrome } from '../../capability/CapabilityRegistry';
import { useCapabilities } from '../../capability/CapabilityContext';
import { requestHostedApi } from '../../runtime/HostedApi';
import type { ThemeId } from '../../types/AppTypes';
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
import { useSetupForm, type SetupFormValues } from './useSetupForm';
import { getRuntimeQueryScope, queryKeys } from '../../query/QueryKeys';
import { fetchSetupDefaults } from '../../query/RuntimeQueries';

type SetupPageProps = {
    readonly onComplete?: () => void;
};

/** Runs the first-launch setup wizard for business identity and admin access. */
export const SetupPage: FC<SetupPageProps> = ({ onComplete }) => {
    const capabilities = useCapabilities();
    const showDesktopChrome = shouldRenderDesktopChrome(capabilities);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
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
    const runtimeScope = getRuntimeQueryScope(capabilities);
    const setupDefaultsQuery = useQuery({
        queryKey: queryKeys.setupDefaults(runtimeScope),
        queryFn: () =>
            fetchSetupDefaults({
                capabilities,
                canUseHostedSetupApi,
            }),
        staleTime: Number.POSITIVE_INFINITY,
    });
    const completeSetupMutation = useMutation({
        mutationFn: async (value: SetupFormValues) => {
            if (window.vaultBillDesktop) {
                await window.vaultBillDesktop.completeSetup({
                    companyName: value.companyName.trim(),
                    address: value.address.trim(),
                    theme: selectedThemeRef.current,
                    adminUsername: value.adminUsername.trim(),
                    adminDisplayName: value.adminDisplayName.trim(),
                    adminPassword: value.adminPassword.trim(),
                    clearAdminPassword: value.clearAdminPassword,
                });
                return;
            }
            if (capabilities.isHostedWeb || canUseHostedSetupApi) {
                await requestHostedApi('/setup/complete', 'POST', {
                    companyName: value.companyName.trim(),
                    address: value.address.trim(),
                    theme: selectedThemeRef.current,
                    adminUsername: value.adminUsername.trim(),
                    adminDisplayName: value.adminDisplayName.trim(),
                    adminPassword: value.adminPassword.trim(),
                    clearAdminPassword: value.clearAdminPassword,
                });
                return;
            }
            throw new Error('Setup is only available through VaultBill Desktop.');
        },
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: queryKeys.setupStatus(runtimeScope),
                }),
                queryClient.invalidateQueries({
                    queryKey: queryKeys.setupDefaults(runtimeScope),
                }),
                queryClient.invalidateQueries({
                    queryKey: queryKeys.session(runtimeScope),
                }),
                queryClient.invalidateQueries({
                    queryKey: queryKeys.workspaceSettings(runtimeScope),
                }),
            ]);
            onComplete?.();
            await navigate('/login', { replace: true });
        },
    });
    const form = useSetupForm({
        defaultTheme: initialTheme,
        onSubmit: async (value) => {
            await completeSetupMutation.mutateAsync(value);
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
        if (!setupDefaultsQuery.data) return;
        hydratedSetupDefaultsRef.current = true;

        const activeAdmin = setupDefaultsQuery.data.accounts.find(
            (account) => account.role === 'Admin' && account.isActive,
        );
        const nextBusiness = setupDefaultsQuery.data.business;

        form.setFieldValue('companyName', nextBusiness.companyName);
        form.setFieldValue('address', nextBusiness.address);
        const hydratedTheme = isThemeId(nextBusiness.theme)
            ? nextBusiness.theme
            : selectedThemeRef.current;
        if (selectedThemeRef.current === initialTheme) {
            setSelectedTheme(hydratedTheme);
            applyTheme(hydratedTheme);
        }
        form.setFieldValue('adminDisplayName', activeAdmin?.displayName ?? '');
        form.setFieldValue('adminUsername', activeAdmin?.username ?? '');
        form.setFieldValue('adminPassword', '');
        form.setFieldValue('clearAdminPassword', false);
        setHasExistingAdminPassword(
            Boolean(activeAdmin?.passwordConfigured ?? activeAdmin?.passwordHash),
        );
    }, [form, initialTheme, setupDefaultsQuery.data]);

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
