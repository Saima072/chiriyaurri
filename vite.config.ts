import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Content-Security-Policy for PRODUCTION builds (web + the Capacitor
// webviews). Injected only at build time: the dev server needs inline
// scripts for hot reload that a CSP would block.
//
// - 'unsafe-inline' styles: React writes inline style attributes for the
//   clouds/birds/countdown animation timings.
// - connect-src lists the public PeerJS broker; if you self-host a
//   PeerServer (VITE_PEER_HOST), add its origin here too. localhost is
//   allowed so local end-to-end tests can run against a local broker.
// - WebRTC data channels themselves are not governed by connect-src.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://0.peerjs.com wss://0.peerjs.com ws://localhost:* ws://127.0.0.1:* http://localhost:* http://127.0.0.1:*",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ')

function cspPlugin(): Plugin {
  return {
    name: 'inject-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<meta charset="UTF-8" />',
        `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cspPlugin()],
})
