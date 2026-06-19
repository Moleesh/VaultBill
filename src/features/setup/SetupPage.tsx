/** @format */

/** First-run setup flow for business identity, initial security, and starter configuration. */

import { Building2, Check, Sparkles, UserRoundCog } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FC } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import { AppBrandIcon } from '../../components/AppBrandIcon/AppBrandIcon';
import { HorizontalProgress } from '../../components/HorizontalProgress/HorizontalProgress';
import { requestHostedApi } from '../../runtime/HostedApi';
import { SetupAdminUserStep } from './SetupAdminUserStep';
import { SetupBusinessProfileStep } from './SetupBusinessProfileStep';
import { SetupPageChrome } from './SetupPageChrome';
import { SetupPageMessageModal } from './SetupPageMessageModal';
import { SetupWelcomeStep } from './SetupWelcomeStep';

const steps = [
    { label: 'Welcome', icon: Sparkles },
    { label: 'Business Profile', icon: Building2 },
    { label: 'Admin User', icon: UserRoundCog },
] as const;

/** Removes Electron IPC framing so setup failures read clearly in the wizard. */
const setupErrorMessage = (reason: unknown): string => {
    const message = reason instanceof Error ? reason.message : 'Setup could not be completed.';
    return message
        .replace(/^Error invoking remote method '[^']+':\s*/u, '')
        .replace(/^Error:\s*/u, '');
};

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
    const [adminUsername, setAdminUsername] = useState('');
    const [adminDisplayName, setAdminDisplayName] = useState('');
    const [message, setMessage] = useState('');
    const [hasAttemptedBusinessProfileContinue, setHasAttemptedBusinessProfileContinue] =
        useState(false);
    const [hasAttemptedAdminUserFinish, setHasAttemptedAdminUserFinish] = useState(false);
    const activeStep = steps[stepIndex]?.label ?? 'Welcome';

    const isBusinessProfileInvalid = companyName.trim().length === 0 || address.trim().length === 0;
    const isAdminUserInvalid =
        adminUsername.trim().length === 0 || adminDisplayName.trim().length === 0;
    const canContinue = activeStep !== 'Business Profile' || !isBusinessProfileInvalid;

    const completeSetup = () => {
        const finish = async () => {
            if (window.vaultBillDesktop) {
                await window.vaultBillDesktop.completeSetup({
                    companyName: companyName.trim(),
                    address: address.trim(),
                    adminUsername: adminUsername.trim(),
                    adminDisplayName: adminDisplayName.trim(),
                });
            } else if (capabilities.isLanBrowser) {
                await requestHostedApi('/setup/complete', 'POST', {
                    companyName: companyName.trim(),
                    address: address.trim(),
                    adminUsername: adminUsername.trim(),
                    adminDisplayName: adminDisplayName.trim(),
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
            {window.vaultBillDesktop ? <SetupPageChrome /> : null}
            <section className="setup-card">
                <header className="setup-card-header">
                    <span className="setup-card-brand-mark">
                        <AppBrandIcon size="medium" />
                    </span>
                    <div className="setup-card-title">
                        <p className="eyebrow">First-run setup</p>
                        <h1>Prepare VaultBill for your business</h1>
                        <p>Complete these steps once, then start billing from the workspace.</p>
                    </div>
                </header>
                <HorizontalProgress
                    activeIndex={stepIndex}
                    className="setup-steps wizard-steps"
                    label="Setup steps"
                >
                    {steps.map((step, index) => {
                        const StepIcon = index < stepIndex ? Check : step.icon;

                        return (
                            <button
                                aria-current={index === stepIndex ? 'step' : undefined}
                                className={index < stepIndex ? 'is-complete' : ''}
                                disabled={index > stepIndex}
                                key={step.label}
                                onClick={() => {
                                    setStepIndex(index);
                                    setMessage('');
                                }}
                                type="button"
                            >
                                <span aria-hidden="true" className="wizard-step-icon">
                                    <StepIcon size={18} />
                                </span>
                                <strong className="wizard-step-label">{step.label}</strong>
                            </button>
                        );
                    })}
                </HorizontalProgress>
                <section className="setup-card-content" aria-labelledby="setup-step-title">
                    <div>
                        <p className="eyebrow">
                            Step {stepIndex + 1} of {steps.length}
                        </p>
                        <h2 id="setup-step-title">{activeStep}</h2>
                    </div>
                    {activeStep === 'Welcome' ? <SetupWelcomeStep /> : null}
                    {activeStep === 'Business Profile' ? (
                        <SetupBusinessProfileStep
                            address={address}
                            companyName={companyName}
                            onAddressChange={setAddress}
                            onCompanyNameChange={setCompanyName}
                            showValidation={hasAttemptedBusinessProfileContinue}
                        />
                    ) : null}
                    {activeStep === 'Admin User' ? (
                        <SetupAdminUserStep
                            displayName={adminDisplayName}
                            onDisplayNameChange={setAdminDisplayName}
                            onUsernameChange={setAdminUsername}
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
                    {stepIndex < steps.length - 1 ? (
                        <button
                            className="button-primary"
                            onClick={() => {
                                if (!canContinue) {
                                    setHasAttemptedBusinessProfileContinue(true);
                                    setMessage('Business name and address are required.');
                                    return;
                                }
                                setHasAttemptedBusinessProfileContinue(false);
                                setMessage('');
                                setStepIndex((current) => Math.min(steps.length - 1, current + 1));
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
                                    setMessage('Admin username and display name are required.');
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
