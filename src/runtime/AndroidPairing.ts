/** @format */

export type AndroidPairingSettings = {
    readonly enabled: boolean;
    readonly hostTarget: string;
    readonly connectionStatus: 'connected' | 'disconnected' | 'unknown';
    readonly discoveredHosts: readonly string[];
};

/** Shared local-storage key for Android pairing mode, host target, and scan results. */
export const androidPairingStorageKey = 'vaultbill.android.pairing';

/** Baseline Android pairing state before a host has ever been chosen. */
export const defaultAndroidPairingSettings: AndroidPairingSettings = {
    enabled: false,
    hostTarget: '',
    connectionStatus: 'unknown',
    discoveredHosts: [],
};

const normalizePairingHost = (hostTarget: string): string => {
    const trimmedHost = hostTarget.trim();
    if (!trimmedHost) return '';
    const withProtocol = /^https?:\/\//i.test(trimmedHost) ? trimmedHost : `http://${trimmedHost}`;
    return withProtocol.endsWith('/VaultBill/')
        ? withProtocol
        : `${withProtocol.replace(/\/+$/, '')}/VaultBill/`;
};

export const normalizeAndroidPairingHost = (hostTarget: string): string =>
    normalizePairingHost(hostTarget);

/** Reads the persisted Android pairing target and connection metadata. */
export const readAndroidPairingSettings = (): AndroidPairingSettings => {
    try {
        const rawSettings = window.localStorage.getItem(androidPairingStorageKey);
        if (!rawSettings) return defaultAndroidPairingSettings;
        const parsed = JSON.parse(rawSettings) as Partial<AndroidPairingSettings>;
        return {
            enabled: parsed.enabled === true,
            hostTarget:
                typeof parsed.hostTarget === 'string'
                    ? normalizePairingHost(parsed.hostTarget)
                    : '',
            connectionStatus:
                parsed.connectionStatus === 'connected' ||
                parsed.connectionStatus === 'disconnected' ||
                parsed.connectionStatus === 'unknown'
                    ? parsed.connectionStatus
                    : 'unknown',
            discoveredHosts: Array.isArray(parsed.discoveredHosts)
                ? parsed.discoveredHosts.filter((host): host is string => typeof host === 'string')
                : [],
        };
    } catch {
        return defaultAndroidPairingSettings;
    }
};

/** Persists the Android pairing target, normalized for hosted VaultBill URLs. */
export const saveAndroidPairingSettings = (settings: AndroidPairingSettings): void => {
    window.localStorage.setItem(
        androidPairingStorageKey,
        JSON.stringify({
            ...settings,
            hostTarget: normalizePairingHost(settings.hostTarget),
        }),
    );
};

/** Probes one candidate host and returns the normalized VaultBill base URL when it responds. */
const probePairingHost = async (hostTarget: string): Promise<string | undefined> => {
    const normalizedHost = normalizePairingHost(hostTarget);
    if (!normalizedHost) return undefined;
    const controller = new AbortController();
    window.setTimeout(() => {
        controller.abort();
    }, 1000);
    try {
        const healthUrl = new URL('/health', normalizedHost).href;
        const response = await fetch(healthUrl, { signal: controller.signal });
        return response.ok ? normalizedHost : undefined;
    } catch {
        return undefined;
    }
};

/** Tests a manually entered host and returns the normalized desktop URL when reachable. */
export const testAndroidPairingHost = async (hostTarget: string): Promise<string | undefined> =>
    probePairingHost(hostTarget);

/** Builds the small LAN candidate set used by the manual pairing scanner. */
/** Builds the small LAN probe set used by Android pairing discovery. */
const buildLanCandidates = (hostTarget: string): readonly string[] => {
    const candidates = new Set<string>();
    const normalizedHost = normalizePairingHost(hostTarget);
    if (normalizedHost) candidates.add(normalizedHost);
    const { hostname } = window.location;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        const prefix = hostname.split('.').slice(0, 3).join('.');
        for (const suffix of [1, 10, 20, 50, 80, 100, 200, 254]) {
            candidates.add(`http://${prefix}.${String(suffix)}:80/VaultBill/`);
        }
    }
    return [...candidates];
};

/** Probes likely LAN hosts and returns the VaultBill Desktop URLs that respond. */
export const scanAndroidPairingHosts = async (hostTarget: string): Promise<readonly string[]> => {
    const candidates = buildLanCandidates(hostTarget);
    const results = await Promise.all(candidates.map((candidate) => probePairingHost(candidate)));
    return results.filter((host): host is string => Boolean(host));
};
