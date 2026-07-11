import type { PeerJSOption } from 'peerjs';

/**
 * By default rooms are brokered through the free public PeerJS cloud, so the
 * game works with zero setup. Set VITE_PEER_HOST (and friends) at build time
 * to point at a self-hosted PeerServer instead.
 */
export function peerOptions(): PeerJSOption {
  const host = import.meta.env.VITE_PEER_HOST as string | undefined;
  if (!host) return {};
  return {
    host,
    port: Number(import.meta.env.VITE_PEER_PORT ?? 443),
    path: (import.meta.env.VITE_PEER_PATH as string | undefined) ?? '/',
    secure: import.meta.env.VITE_PEER_SECURE !== 'false',
  };
}
