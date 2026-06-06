module.exports = {
  appId: 'com.vaultbill.app',
  productName: 'VaultBill',
  asar: true,
  artifactName: `vaultbill-\${version}-\${os}-\${arch}.\${ext}`,
  directories: {
    output: 'release',
  },
  files: ['dist/**/*', 'dist-electron/**/*', 'package.json'],
  extraMetadata: {
    main: 'dist-electron/Main.js',
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
  mac: {
    icon: 'build/icon.png',
    target: ['dmg'],
  },
  linux: {
    icon: 'build/icon.png',
    target: ['AppImage'],
    category: 'Office',
  },
};
