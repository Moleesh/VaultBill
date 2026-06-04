import { asBufferSource } from './BackupEncoding';
import type { BackupChecksums, BackupFileName } from './BackupTypes';

export const buildBackupChecksums = async (
  files: Readonly<Record<BackupFileName, Uint8Array | undefined>>,
): Promise<BackupChecksums> => {
  const checksums: Record<string, string> = {};

  for (const [fileName, bytes] of Object.entries(files)) {
    if (bytes && fileName !== 'checksums.json') {
      checksums[fileName] = await sha256Hex(bytes);
    }
  }

  return checksums;
};

export const sha256Hex = async (bytes: Uint8Array): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', asBufferSource(bytes));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};
