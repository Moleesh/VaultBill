/** @format */

/** First-run setup flow for business identity, initial security, and starter configuration. */
import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';

import { shouldRenderDesktopChrome } from '../../capability/CapabilityRegistry';
import { useCapabilities } from '../../capability/CapabilityContext';
import { requestHostedApi } from '../../runtime/HostedApi';
import { SetupAdminUserStep } from './SetupAdminUserStep';
import { SetupPageActions } from './SetupPageActions';
import { SetupBusinessProfileStep } from './SetupBusinessProfileStep';
import { SetupPageChrome } from './SetupPageChrome';
import { SetupPageHeader } from './SetupPageHeader';
import { SetupPageMessageModal } from './SetupPageMessageModal';
import {
    getAdminAccessValidationMessage,
    getBusinessProfileValidationMessage,
    isThemeId,
    localHostedOrigins,
    setupErrorMessage,
    setupSteps,
    themeStorageKey,
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
    const [initialTheme] = useState(() => {
        const savedTheme = window.localStorage.getItem(themeStorageKey) ?? 'teal-flow';
        return isThemeId(savedTheme) ? savedTheme : 'teal-flow';
    });
    const [message, setMessage] = useState('');
    const [hasAttemptedBusinessProfileContinue, setHasAttemptedBusinessProfileContinue] =
        useState(false);
    const [hasAttemptedAdminUserFinish, setHasAttemptedAdminUserFinish] = useState(false);
    const activeStep = setupSteps[stepIndex]?.label ?? 'Welcome';
    const canUseHostedSetupApi = localHostedOrigins.has(window.location.hostname);
    const form = useSetupForm({
        defaultTheme: initialTheme,
        onSubmit: async (value) => {
            if (window.vaultBillDesktop) {
                await window.vaultBillDesktop.completeSetup({
                    companyName: value.companyName.trim(),
                    address: value.address.trim(),
                    theme: value.theme,
                    adminUsername: value.adminUsername.trim(),
                    adminDisplayName: value.adminDisplayName.trim(),
                    adminPassword: value.adminPassword.trim(),
                });
            } else if (capabilities.isHostedWeb || canUseHostedSetupApi) {
                await requestHostedApi('/setup/complete', 'POST', {
                    companyName: value.companyName.trim(),
                    address: value.address.trim(),
                    theme: value.theme,
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

    const isBusinessProfileInvalid = companyName.trim().length === 0 || address.trim().length === 0;
    const isAdminUserInvalid =
        adminUsername.trim().length === 0 || adminDisplayName.trim().length === 0;
    const isFinalStep = stepIndex === setupSteps.length - 1;

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
        form.setFieldValue('theme', value);
        window.localStorage.setItem(themeStorageKey, value);
        document.documentElement.dataset.theme = value;
    };

    return (
        <main className="setup-page">
            {showDesktopChrome ? <SetupPageChrome /> : null}
            <section className="setup-card">
                <SetupPageHeader
                    onStepSelect={(index) => {
                        setStepIndex(index);
                        setMessage('');
                    }}
                    stepIndex={stepIndex}
                />
                <section className="setup-card-content" aria-labelledby="setup-step-title">
                    <div>
                        <p className="eyebrow">
                            Step {stepIndex + 1} of {setupSteps.length}
                        </p>
                        <h2 id="setup-step-title">{activeStep}</h2>
                    </div>
                    {activeStep === 'Welcome' ? <SetupWelcomeStep /> : null}
                    {activeStep === 'Workspace Details' ? (
                        <SetupBusinessProfileStep
                            form={form}
                            onThemeChange={handleThemeChange}
                            onFieldTouched={() => {
                                setHasAttemptedBusinessProfileContinue(true);
                            }}
                            showValidation={hasAttemptedBusinessProfileContinue}
                        />
                    ) : null}
                    {activeStep === 'Admin Access' ? (
                        <SetupAdminUserStep
                            form={form}
                            onFieldTouched={() => {
                                setHasAttemptedAdminUserFinish(true);
                            }}
                            showValidation={hasAttemptedAdminUserFinish}
                        />
                    ) : null}
                </section>
                <SetupPageActions
                    isAdminUserInvalid={isAdminUserInvalid}
                    isBusinessProfileInvalid={stepIndex === 1 && isBusinessProfileInvalid}
                    isFinalStep={isFinalStep}
                    onBack={() => {
                        setStepIndex((current) => Math.max(0, current - 1));
                    }}
                    onContinue={() => {
                        if (stepIndex === 1 && isBusinessProfileInvalid) {
                            setHasAttemptedBusinessProfileContinue(true);
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
                        setStepIndex((current) => Math.min(setupSteps.length - 1, current + 1));
                    }}
                    onFinish={() => {
                        if (isAdminUserInvalid) {
                            setHasAttemptedAdminUserFinish(true);
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
                        void form.handleSubmit().catch((reason: unknown) => {
                            setMessage(setupErrorMessage(reason));
                        });
                    }}
                    showBack={stepIndex > 0}
                />
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
