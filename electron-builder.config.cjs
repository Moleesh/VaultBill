/** @format */

const { createHash } = require('node:crypto');

const licenseVerifier = process.env.VAULTBILL_LICENSE_KEY
    ? createHash('sha256').update(process.env.VAULTBILL_LICENSE_KEY).digest('hex')
    : '';

module.exports = {
    appId: 'com.vaultbill.app',
    productName: 'VaultBill',
    asar: true,
    artifactName: `vaultbill-\${version}-\${os}-\${arch}.\${ext}`,
    directories: {
        output: 'release',
    },
    files: ['dist/**/*', 'dist-electron/**/*', 'build/icon.png', 'package.json'],
    extraMetadata: {
        main: 'dist-electron/Main.js',
        vaultBillLicenseVerifier: licenseVerifier,
    },
    win: {
        icon: 'build/icon.png',
        signAndEditExecutable: false,
        target: [
            {
                target: 'nsis',
                arch: ['x64'],
            },
        ],
    },
    nsis: {
        oneClick: false,
        perMachine: false,
        allowElevation: true,
        allowToChangeInstallationDirectory: true,
    },
    linux: {
        icon: 'build/icon.png',
        target: ['AppImage'],
        category: 'Office',
    },
};
