import { createECDH } from "node:crypto";
import type { CachedKeyPair } from "./types";

export function generateKeyPair(): CachedKeyPair {
   const ecdh = createECDH("secp384r1");
   ecdh.generateKeys();

   const publicKey = ecdh.getPublicKey("base64");
   const privateKey = ecdh.getPrivateKey("base64");

   return { privateKey, publicKey };
}
