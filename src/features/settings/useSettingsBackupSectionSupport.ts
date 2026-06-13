/** @format */

import {
    createHostedBackup,
    requestHostedApi,
    restoreHostedBackup,
} from '../../runtime/HostedApi';
import type { BackupResult } from './SettingsBackupTypes';

type BackupDesktopApi = {
    readonly setBackupPassword: (password: string) => Promise<{
        readonly sysAdminUsesDefaultPassword: boolean;
        readonly backupUsesDefaultPassword: boolean;
    }>;
    readonly createBackup: (options: { readonly encrypted: boolean }) => Promise<{
        readonly cancelled: boolean;
        readonly filePath?: string;
        readonly recoveryKey?: string;
    }>;
    readonly restoreBackup: (options: {
        readonly password?: string;
        readonly recoveryKey?: string;
    }) => Promise<{
        readonly cancelled: boolean;
        readonly restarting?: boolean;
    }>;
    readonly resetApplicationData: (options: {
        readonly password: string;
        readonly confirmation: string;
    }) => Promise<{
        readonly restarting: boolean;
    }>;
};

type BackupEnvironment = {
    readonly isLanBrowser: boolean;
    readonly desktopApi: BackupDesktopApi | undefined;
};

export const buildBackupPasswordUpdateTask = (
    environment: BackupEnvironment,
    backupPassword: string,
    remoteAuthorizationPassword: string,
): Promise<void> =>
    environment.desktopApi
        ? environment.desktopApi.setBackupPassword(backupPassword).then(() => undefined)
        : environment.isLanBrowser
          ? requestHostedApi('/credentials/backup-password', 'POST', {
                currentPassword: remoteAuthorizationPassword,
                backupPassword,
            })
          : Promise.resolve();

export const buildBackupCreationTask = (
    environment: BackupEnvironment,
    encryptBackup: boolean,
    remoteAuthorizationPassword: string,
): Promise<BackupResult> =>
    environment.desktopApi
        ? environment.desktopApi.createBackup({ encrypted: encryptBackup }).then((result) => {
              if (result.cancelled) {
                  return { success: false, warning: 'Backup creation cancelled.' };
              }
              return {
                  success: true,
                  ...(result.filePath ? { filePath: result.filePath } : {}),
                  ...(result.recoveryKey ? { recoveryKey: result.recoveryKey } : {}),
              };
          })
        : createHostedBackup(encryptBackup, remoteAuthorizationPassword).then((result) => {
              const url = window.URL.createObjectURL(result.blob);
              const anchor = document.createElement('a');
              anchor.href = url;
              anchor.download = result.fileName;
              anchor.click();
              window.URL.revokeObjectURL(url);
              return {
                  success: true,
                  filePath: result.fileName,
                  ...(result.recoveryKey ? { recoveryKey: result.recoveryKey } : {}),
              };
          });

export const buildRestoreTask = (
    environment: BackupEnvironment,
    restoreFile: File,
    restorePassword: string,
    restoreRecoveryKey: string,
    remoteAuthorizationPassword: string,
): Promise<void> =>
    environment.desktopApi
        ? environment.desktopApi.restoreBackup({
              ...(restorePassword ? { password: restorePassword } : {}),
              ...(restoreRecoveryKey ? { recoveryKey: restoreRecoveryKey } : {}),
          }).then(() => undefined)
        : restoreHostedBackup(restoreFile, {
              ...(restorePassword ? { backupPassword: restorePassword } : {}),
              ...(restoreRecoveryKey ? { recoveryKey: restoreRecoveryKey } : {}),
              sysAdminPassword: remoteAuthorizationPassword,
          });

export const buildResetTask = (
    environment: BackupEnvironment,
    resetSysAdminPassword: string,
    resetConfirmation: string,
): Promise<void> =>
    environment.desktopApi
        ? environment.desktopApi.resetApplicationData({
              password: resetSysAdminPassword,
              confirmation: resetConfirmation,
          }).then(() => undefined)
        : requestHostedApi('/application/reset', 'POST', {
              currentPassword: resetSysAdminPassword,
              confirmation: resetConfirmation,
          });
