/** @format */

import type { CapabilityRegistry } from '../capability/Capability.types';
import { canUseLocalHostedApi } from './HostedApi';

type RuntimeCapabilityFlags = Pick<CapabilityRegistry, 'isDemoMode' | 'isDesktop' | 'isHostedWeb'>;

/** True only for the static browser build that runs without a desktop-backed DB host. */
export const isStaticHostedBrowserBuild = (capabilities: RuntimeCapabilityFlags): boolean =>
    capabilities.isDemoMode &&
    !capabilities.isDesktop &&
    !capabilities.isHostedWeb &&
    window.vaultBillDesktop === undefined &&
    (import.meta.env.MODE === 'test' || !canUseLocalHostedApi());

/** True whenever the current runtime can reach the DB-backed desktop host. */
export const canUseDbBackedRuntime = (
    capabilities: Pick<CapabilityRegistry, 'isDesktop' | 'isHostedWeb'>,
): boolean =>
    capabilities.isDesktop ||
    capabilities.isHostedWeb ||
    window.vaultBillDesktop !== undefined ||
    canUseLocalHostedApi();
