/** @format */

import { describe, expect, it } from 'vitest';

import { getSignatureAvailability, validateSignatureSvgPath } from '../SignaturePad';

const usbSettings = {
    SignaturePad: {
        Enabled: true,
        Mode: 'UsbHid' as const,
        TestedUsbDevices: [{ VendorId: '1234', ProductId: 'abcd', DisplayName: 'Tested Pad' }],
    },
};

describe('SignaturePad', () => {
    it('allows screen mode for mouse and touch drawing', () => {
        expect(
            getSignatureAvailability(
                {
                    SignaturePad: { Enabled: true, Mode: 'Screen', TestedUsbDevices: [] },
                },
                'WebDemo',
            ),
        ).toMatchObject({
            available: true,
            userMessage: 'Screen signature mode supports mouse and touch drawing.',
        });
    });

    it('does not claim untested USB or LAN browser USB support', () => {
        expect(getSignatureAvailability(usbSettings, 'LanBrowser')).toMatchObject({
            available: false,
            userMessage: 'USB signature pads are supported only in tested desktop mode.',
        });
        expect(getSignatureAvailability(usbSettings, 'Desktop')).toMatchObject({
            available: false,
            userMessage: 'USB signature pad is not in the tested device list.',
        });
        expect(
            getSignatureAvailability(usbSettings, 'Desktop', {
                VendorId: '1234',
                ProductId: 'abcd',
                DisplayName: 'Tested Pad',
            }),
        ).toMatchObject({ available: true });
    });

    it('stores signatures as SVG path data only', () => {
        expect(validateSignatureSvgPath('M 0 0 L 10 10')).toMatchObject({
            available: true,
        });
        expect(validateSignatureSvgPath('<svg onload="alert(1)"></svg>')).toMatchObject({
            available: false,
            userMessage: 'Signature must be stored as SVG path data only.',
        });
    });
});
