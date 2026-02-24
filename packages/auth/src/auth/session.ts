import { Endpoint } from "./constants";
import type { McServicesToken, MultiplayerSessionToken } from "./types";

export interface BedrockChainResult {
   chain: string[];
}

export async function getBedrockChain(
   xstsToken: string,
   userHash: string,
   clientPublicKey: string,
): Promise<BedrockChainResult> {
   const response = await fetch(Endpoint.BedrockAuthenticate, {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
         "User-Agent": "MCPE/UWP",
         Authorization: `XBL3.0 x=${userHash};${xstsToken}`,
      },
      body: JSON.stringify({ identityPublicKey: clientPublicKey }),
   });

   if (!response.ok) {
      const text = await response.text();
      throw new Error(`Bedrock authentication failed: ${response.status} ${response.statusText} - ${text}`);
   }

   const data = await response.json() as { chain: string[] };
   return { chain: data.chain };
}

export async function getMinecraftServicesToken(
   sessionTicket: string,
): Promise<McServicesToken> {
   const response = await fetch(Endpoint.BedrockServicesSessionStart, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
         device: {
            applicationType: "MinecraftPE",
            gameVersion: "1.21.130",
            id: "c1681ad3-415e-30cd-abd3-3b8f51e771d1",
            memory: String(8 * (1024 * 1024 * 1024)),
            platform: "Windows10",
            playFabTitleId: "20CA2",
            storePlatform: "uwp.store",
            type: "Windows10",
         },
         user: {
            token: sessionTicket,
            tokenType: "PlayFab",
         },
      }),
   });

   if (!response.ok) {
      const text = await response.text();
      throw new Error(`MC services token failed: ${response.status} ${response.statusText} - ${text}`);
   }

   const data = await response.json() as { result: { authorizationHeader: string } };
   return {
      authorizationHeader: data.result.authorizationHeader,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
   };
}

export async function getMultiplayerSessionToken(
   mcServicesAuth: string,
   clientPublicKey: string,
): Promise<MultiplayerSessionToken> {
   const response = await fetch(
      Endpoint.BedrockMultiplayerSessionStart,
      {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            Authorization: mcServicesAuth,
            "Accept-Encoding": "identity",
         },
         body: JSON.stringify({ publicKey: clientPublicKey }),
      },
   );

   if (!response.ok) {
      const text = await response.text();
      throw new Error(`Multiplayer session start failed: ${response.status} ${response.statusText} - ${text}`);
   }

   const data = await response.json() as { result: { signedToken: string } };
   return {
      signedToken: data.result.signedToken,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
   };
}
