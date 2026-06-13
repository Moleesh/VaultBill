/** @format */

/** First-run setup flow for business identity, initial security, and starter configuration. */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FC } from 'react';

import { AppBrandIcon } from '../../components/AppBrandIcon/AppBrandIcon';
import { HorizontalProgress } from '../../components/HorizontalProgress/HorizontalProgress';
import { VENDOR } from '../../constants/Vendor';
import { SetupAdministratorStep } from './SetupAdministratorStep';
import { SetupBusinessProfileStep } from './SetupBusinessProfileStep';
import { SetupWelcomeStep } from './SetupWelcomeStep';

const steps = ['Welcome', 'Business Profile', 'System Administrator'] as const;
const defaultPasswordHash = '5e800c5e134b84a0d73bd6f0d0f65b768f8a3afeba9c26ce3fe9b8d58fd027f1';

export const setupCompleteStorageKey = 'vaultbill.setup.complete';

export const isFirstRunSetupRequired = (isDemoMode: boolean, isLanBrowser = false): boolean =>
    !isDemoMode && !isLanBrowser && window.localStorage.getItem(setupCompleteStorageKey) !== 'true';

type SetupPageProps = {
    readonly onComplete?: () => void;
};

export const SetupPage: FC<SetupPageProps> = ({ onComplete }) => {
    const navigate = useNavigate();
    const [stepIndex, setStepIndex] = useState(0);
    const [companyName, setCompanyName] = useState('');
    const [address, setAddress] = useState('');
    const [sysAdminName, setSysAdminName] = useState('System Administrator');
    const [message, setMessage] = useState('');
    const activeStep = steps[stepIndex] ?? 'Welcome';

    const canContinue =
        activeStep !== 'Business Profile' ||
        (companyName.trim().length > 0 && address.trim().length > 0);

    const completeSetup = () => {
        const normalizedName = sysAdminName.trim() || 'System Administrator';
        const finish = async () => {
            if (window.vaultBillDesktop) {
                await window.vaultBillDesktop.completeSetup({
                    companyName: companyName.trim(),
                    address: address.trim(),
                    sysAdminName: normalizedName,
                });
            } else {
                window.localStorage.setItem(
                    'vaultbill.accounts',
                    JSON.stringify([
                        {
                            userId: 'sysadmin_1',
                            username: 'sysadmin',
                            displayName: normalizedName,
                            role: 'SysAdmin',
                            isActive: true,
                            passwordHash: defaultPasswordHash,
                            usesDefaultPassword: true,
                        },
                    ]),
                );
            }
            window.localStorage.setItem(
                'vaultbill.business-profile',
                JSON.stringify({ companyName: companyName.trim(), address: address.trim() }),
            );
            window.localStorage.setItem('vaultbill.backup-password-configured', 'true');
            window.localStorage.setItem('vaultbill.default-credentials-active', 'true');
            window.localStorage.setItem(setupCompleteStorageKey, 'true');
            onComplete?.();
            await navigate('/login', { replace: true });
        };
        void finish().catch((reason: unknown) => {
            setMessage(reason instanceof Error ? reason.message : 'Setup could not be completed.');
        });
    };

    return (
        <main className="setup-page">
            <section className="setup-card">
                <header className="setup-card__header">
                    <AppBrandIcon size="medium" />
                    <div>
                        <p className="eyebrow">First-run setup</p>
                        <h1>Prepare VaultBill for your business</h1>
                    </div>
                </header>
                <HorizontalProgress className="setup-steps" label="Setup steps">
                    {steps.map((step, index) => (
                        <button
                            aria-current={index === stepIndex ? 'step' : undefined}
                            disabled={index > stepIndex}
                            key={step}
                            onClick={() => {
                                setStepIndex(index);
                                setMessage('');
                            }}
                            type="button"
                        >
                            <small>{index + 1}</small>
                            {step}
                        </button>
                    ))}
                </HorizontalProgress>
                <section className="setup-card__content" aria-labelledby="setup-step-title">
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
                        />
                    ) : null}
                    {activeStep === 'System Administrator' ? (
                        <SetupAdministratorStep
                            onSysAdminNameChange={setSysAdminName}
                            sysAdminName={sysAdminName}
                        />
                    ) : null}
                    {message ? <p className="feedback-error">{message}</p> : null}
                </section>
                <footer className="setup-card__actions">
                    <button
                        disabled={stepIndex === 0}
                        onClick={() => {
                            setStepIndex((current) => Math.max(0, current - 1));
                        }}
                        type="button"
                    >
                        Back
                    </button>
                    {stepIndex < steps.length - 1 ? (
                        <button
                            className="button-primary"
                            onClick={() => {
                                if (!canContinue) {
                                    setMessage('Business name and address are required.');
                                    return;
                                }
                                setMessage('');
                                setStepIndex((current) => Math.min(steps.length - 1, current + 1));
                            }}
                            type="button"
                        >
                            Continue
                        </button>
                    ) : (
                        <button className="button-primary" onClick={completeSetup} type="button">
                            Start using VaultBill
                        </button>
                    )}
                </footer>
                <p className="setup-card__version">Version {VENDOR.version}</p>
            </section>
        </main>
    );
};
