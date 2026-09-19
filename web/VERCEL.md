# Vercel

Import the GitHub repo. **Root Directory must be `web`.**

Framework: Next.js. Build: `npm run build`.

Environment (public, no keys):

```
NEXT_PUBLIC_CONTRACT_ADDRESS=0xE21B59E9c34E54C2BF882cc71166A301b6DA5C6D
NEXT_PUBLIC_CHAIN_ID=61997
NEXT_PUBLIC_STUDIO_RPC=https://studio-dev.genlayer.com/api
NEXT_PUBLIC_STUDIO_EXPLORER=https://explorer-studio-dev.genlayer.com/
GENLAYER_STUDIO_URL=https://studio-dev.genlayer.com/api
```

Never set studionet `61999`. Never add a private key or mnemonic.

`/api/genlayer` proxies JSON-RPC reads if CORS blocks studio-dev. Wallet signatures stay in the browser.
