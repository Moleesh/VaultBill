/** @format */
/** First-run setup flow for business identity, initial security, and starter configuration. */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FC } from 'react';
import { useCapabilities } from '../../capability/CapabilityContext';
import { requestHostedApi } from '../../runtime/HostedApi';
import { SetupAdminUserStep } from './SetupAdminUserStep';
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
type SetupPageProps = {
    readonly onComplete?: () => void;
};

/** Runs the first-launch setup wizard for business identity and admin access. */
export const SetupPage: FC<SetupPageProps> = ({ onComplete }) => {
    const capabilities = useCapabilities();
    const navigate = useNavigate();
    const [stepIndex, setStepIndex] = useState(0);
    const [companyName, setCompanyName] = useState('');
    const [address, setAddress] = useState('');
    const [adminDisplayName, setAdminDisplayName] = useState('');
    const [adminUsername, setAdminUsername] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [theme, setTheme] = useState(() => {
        const savedTheme = window.localStorage.getItem(themeStorageKey) ?? 'teal-flow';
        return isThemeId(savedTheme) ? savedTheme : 'teal-flow';
    });
    const [message, setMessage] = useState('');
    const [hasAttemptedBusinessProfileContinue, setHasAttemptedBusinessProfileContinue] =
        useState(false);
    const [hasAttemptedAdminUserFinish, setHasAttemptedAdminUserFinish] = useState(false);
    const activeStep = setupSteps[stepIndex]?.label ?? 'Welcome';
    const canUseHostedSetupApi = localHostedOrigins.has(window.location.hostname);

    const isBusinessProfileInvalid = companyName.trim().length === 0 || address.trim().length === 0;
    const isAdminUserInvalid =
        adminUsername.trim().length === 0 || adminDisplayName.trim().length === 0;
    const canContinue = stepIndex !== 1 || !isBusinessProfileInvalid;

    const completeSetup = () => {
        const finish = async () => {
            if (window.vaultBillDesktop) {
                await window.vaultBillDesktop.completeSetup({
                    companyName: companyName.trim(),
                    address: address.trim(),
                    theme,
                    adminUsername: adminUsername.trim(),
                    adminDisplayName: adminDisplayName.trim(),
                    adminPassword: adminPassword.trim(),
                });
            } else if (capabilities.isHostedWeb || canUseHostedSetupApi) {
                await requestHostedApi('/setup/complete', 'POST', {
                    companyName: companyName.trim(),
                    address: address.trim(),
                    theme,
                    adminUsername: adminUsername.trim(),
                    adminDisplayName: adminDisplayName.trim(),
                    adminPassword: adminPassword.trim(),
                });
            } else {
                throw new Error('Setup is only available through VaultBill Desktop.');
            }
            onComplete?.();
            await navigate('/login', { replace: true });
        };
        void finish().catch((reason: unknown) => {
            setMessage(setupErrorMessage(reason));
        });
    };

    return (
        <main className="setup-page">
            {capabilities.isDesktop ? <SetupPageChrome /> : null}
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
                            address={address}
                            companyName={companyName}
                            onAddressChange={setAddress}
                            onCompanyNameChange={setCompanyName}
                            onThemeChange={(value) => {
                                setTheme(value);
                                window.localStorage.setItem(themeStorageKey, value);
                                document.documentElement.dataset.theme = value;
                            }}
                            showValidation={hasAttemptedBusinessProfileContinue}
                            theme={theme}
                        />
                    ) : null}
                    {activeStep === 'Admin Access' ? (
                        <SetupAdminUserStep
                            displayName={adminDisplayName}
                            onDisplayNameChange={setAdminDisplayName}
                            onPasswordChange={setAdminPassword}
                            onUsernameChange={setAdminUsername}
                            password={adminPassword}
                            showValidation={hasAttemptedAdminUserFinish}
                            username={adminUsername}
                        />
                    ) : null}
                </section>
                <footer className="setup-card-actions">
                    {stepIndex > 0 ? (
                        <button
                            onClick={() => {
                                setStepIndex((current) => Math.max(0, current - 1));
                            }}
                            type="button"
                        >
                            Back
                        </button>
                    ) : (
                        <span aria-hidden="true" />
                    )}
                    {stepIndex < setupSteps.length - 1 ? (
                        <button
                            className="button-primary"
                            onClick={() => {
                                if (!canContinue) {
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
                                setStepIndex((current) =>
                                    Math.min(setupSteps.length - 1, current + 1),
                                );
                            }}
                            type="button"
                        >
                            Continue
                        </button>
                    ) : (
                        <button
                            className="button-primary"
                            onClick={() => {
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
                                completeSetup();
                            }}
                            type="button"
                        >
                            Start using VaultBill
                        </button>
                    )}
                </footer>
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
