/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTRACT_ADDRESS: string;
  readonly VITE_RELAYER_URL: string;
  readonly VITE_GATEWAY_URL: string;
  readonly VITE_ACL_CONTRACT_ADDRESS: string;
  readonly VITE_KMS_CONTRACT_ADDRESS: string;
  readonly VITE_CHAIN_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
