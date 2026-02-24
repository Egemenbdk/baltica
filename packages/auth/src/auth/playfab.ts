import type { XstsToken } from "./types";
import { Endpoint } from "./constants";

export async function loginWithPlayFab(xsts: XstsToken): Promise<import("./types").PlayFabToken> {
   const response = await fetch(Endpoint.PlayFabLogin, {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
      },
      body: JSON.stringify({
         CreateAccount: true,
         TitleId: "20CA2",
         XboxToken: `XBL3.0 x=${xsts.userHash};${xsts.token}`,
      }),
   });

   if (!response.ok) {
      const text = await response.text();
      throw new Error(`PlayFab login failed: ${response.status} - ${text}`);
   }

   const data = await response.json() as {
      data: {
         SessionTicket: string;
         EntityToken: { EntityToken: string; TokenExpiration: string };
      };
   };

   return {
      sessionTicket: data.data.SessionTicket,
      entityToken: data.data.EntityToken.EntityToken,
      expiresAt: new Date(data.data.EntityToken.TokenExpiration).getTime(),
   };
}
