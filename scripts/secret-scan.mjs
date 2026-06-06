import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split(/\r?\n/u)
  .filter(Boolean)
  .filter((file) => !file.endsWith('secret-scan.mjs'))
  .filter((file) => !/\.test\.[cm]?[jt]sx?$/u.test(file));
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
  /\bsb_service_role_[A-Za-z0-9_-]{16,}\b/u,
  /\bsk_live_[A-Za-z0-9]{16,}\b/u,
  /\bAKIA[0-9A-Z]{16}\b/u,
  /(?:api[_-]?key|client[_-]?secret)\s*[:=]\s*["'][^"']{12,}["']/iu,
];
const findings = [];

for (const file of files) {
  let content;
  try {
    content = await readFile(file, 'utf8');
  } catch {
    continue;
  }
  if (patterns.some((pattern) => pattern.test(content))) findings.push(file);
}

if (findings.length > 0) {
  console.error(`Potential secrets found in: ${findings.join(', ')}`);
  process.exitCode = 1;
} else {
  console.log(`Secret scan passed for ${String(files.length)} tracked files.`);
}
