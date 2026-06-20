/** @format */

import type { SignaturePadSettings } from '../../../db/startup/ConfigSchemas';

export type SignatureRuntime = 'Desktop' | 'HostedWeb' | 'WebDemo';

export type SignatureDevice = {
    readonly VendorId: string;
    readonly ProductId: string;
    readonly DisplayName: string;
};

export type SignatureAvailability = {
    readonly available: boolean;
    readonly userMessage: string;
};

const svgPathPattern = /^[MmZzLlHhVvCcSsQqTtAa0-9,.\s-]+$/u;

export const getSignatureAvailability = (
    settings: SignaturePadSettings,
    runtime: SignatureRuntime,
    requestedDevice?: SignatureDevice,
): SignatureAvailability => {
    if (!settings.SignaturePad.Enabled) {
        return {
            available: false,
            userMessage: 'Signature pad is disabled in settings.',
        };
    }

    if (settings.SignaturePad.Mode === 'Screen') {
        return {
            available: true,
            userMessage: 'Screen signature mode supports mouse and touch drawing.',
        };
    }

    if (runtime !== 'Desktop') {
        return {
            available: false,
            userMessage: 'USB signature pads are supported only in tested desktop mode.',
        };
    }

    if (!requestedDevice || !isTestedDevice(settings, requestedDevice)) {
        return {
            available: false,
            userMessage: 'USB signature pad is not in the tested device list.',
        };
    }

    return {
        available: true,
        userMessage: 'Tested USB signature pad is available in desktop mode.',
    };
};

export const validateSignatureSvgPath = (pathData: string): SignatureAvailability => {
    const normalizedPath = pathData.trim();

    if (!normalizedPath) {
        return { available: false, userMessage: 'Signature path is empty.' };
    }

    if (normalizedPath.length > 10_000) {
        return { available: false, userMessage: 'Signature path is too large.' };
    }

    if (!svgPathPattern.test(normalizedPath)) {
        return {
            available: false,
            userMessage: 'Signature must be stored as SVG path data only.',
        };
    }

    return { available: true, userMessage: 'Signature path is valid.' };
};

const isTestedDevice = (settings: SignaturePadSettings, device: SignatureDevice): boolean =>
    settings.SignaturePad.TestedUsbDevices.some(
        (testedDevice) =>
            testedDevice.VendorId === device.VendorId &&
            testedDevice.ProductId === device.ProductId,
    );
