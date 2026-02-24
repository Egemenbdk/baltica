import type { XblToken, XstsToken } from "./types";
import { Endpoint, XboxErrors } from "./constants";

export async function authenticateXbl(msAccessToken: string): Promise<XblToken> {
   const response = await fetch(Endpoint.XblUserAuth, {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
         Accept: "application/json",
         "x-xbl-contract-version": "1",
      },
      body: JSON.stringify({
         RelyingParty: Endpoint.XblAuthRelyingParty,
         TokenType: "JWT",
         Properties: {
            AuthMethod: "RPS",
            SiteName: "user.auth.xboxlive.com",
            RpsTicket: msAccessToken,
         },
      }),
   });

   if (!response.ok) {
      const text = await response.text();
      throw new Error(`XBL authentication failed: ${response.status} - ${text}`);
   }

   const data = await response.json() as {
      Token: string;
      DisplayClaims: { xui: Array<{ uhs: string }> };
      NotAfter: string;
   };

   return {
      token: data.Token,
      userHash: data.DisplayClaims.xui[0]!.uhs,
      expiresAt: new Date(data.NotAfter).getTime(),
   };
}

export async function authenticateXsts(xblToken: string, relyingParty?: string): Promise<XstsToken> {
   const response = await fetch(Endpoint.XstsAuthorize, {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
         Accept: "application/json",
      },
      body: JSON.stringify({
         RelyingParty: relyingParty ?? Endpoint.BedrockXSTSRelyingParty,
         TokenType: "JWT",
         Properties: {
            SandboxId: "RETAIL",
            UserTokens: [xblToken],
         },
      }),
   });

   if (!response.ok) {
      const data = await response.json().catch(() => null) as { XErr?: number } | null;
      if (data?.XErr && XboxErrors[data.XErr]) {
         throw new Error(XboxErrors[data.XErr]);
      }
      const text = await response.text().catch(() => "");
      throw new Error(`XSTS authentication failed: ${response.status} - ${text}`);
   }

   const data = await response.json() as {
      Token: string;
      DisplayClaims: { xui: Array<{ uhs: string; gtg?: string; xid?: string }> };
      NotAfter: string;
   };

   const xui = data.DisplayClaims.xui[0]!;
   return {
      token: data.Token,
      userHash: xui.uhs,
      gamertag: xui.gtg ?? "",
      xuid: xui.xid ?? "",
      expiresAt: new Date(data.NotAfter).getTime(),
   };
}
