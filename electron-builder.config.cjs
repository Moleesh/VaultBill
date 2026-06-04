const appName = process.env.APP_NAME?.trim() || 'VaultBill';
const generatedSlug = appName
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');
const appSlug = generatedSlug || 'vaultbill';
const identifierSlug = appSlug.replace(/-/g, '.');

module.exports = {
  appId: `com.vaultbill.${identifierSlug}`,
  productName: appName,
  asar: true,
  artifactName: `${appSlug}-\${version}-\${os}-\${arch}.\${ext}`,
  directories: {
    output: 'release',
  },
  files: ['dist/**/*', 'dist-electron/**/*', 'package.json'],
  extraMetadata: {
    main: 'dist-electron/Main.js',
  },
  win: {
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
  mac: {
    target: ['dmg'],
  },
  linux: {
    target: ['AppImage'],
    category: 'Office',
  },
};
