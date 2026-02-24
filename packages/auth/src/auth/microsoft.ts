import type { MicrosoftTokens, DeviceCodeResponse } from "./types";
import { Endpoint } from "./constants";

export async function requestDeviceCode(clientId: string): Promise<DeviceCodeResponse> {
   const response = await fetch(Endpoint.LiveDeviceCode, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
         client_id: clientId,
         scope: "service::user.auth.xboxlive.com::MBI_SSL",
         response_type: "device_code",
      }),
   });

   if (!response.ok) {
      const text = await response.text();
      throw new Error(`Device code request failed: ${response.status} - ${text}`);
   }

   const data = await response.json() as Record<string, unknown>;

   return {
      deviceCode: data.device_code as string,
      userCode: data.user_code as string,
      verificationUri: (data.verification_uri as string) ?? "https://www.microsoft.com/link",
      expiresIn: data.expires_in as number,
      interval: (data.interval as number) ?? 5,
   };
}

export async function pollDeviceCode(
   clientId: string,
   deviceCode: string,
   interval: number,
   expiresIn: number,
): Promise<MicrosoftTokens> {
   const deadline = Date.now() + expiresIn * 1000;

   while (Date.now() < deadline) {
      await sleep(interval * 1000);

      const response = await fetch(Endpoint.LiveToken, {
         method: "POST",
         headers: { "Content-Type": "application/x-www-form-urlencoded" },
         body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:device_code",
            client_id: clientId,
            device_code: deviceCode,
         }),
      });

      const data = await response.json() as Record<string, unknown>;

      if (response.ok && data.access_token) {
         return {
            accessToken: data.access_token as string,
            refreshToken: data.refresh_token as string,
            expiresAt: Date.now() + (data.expires_in as number) * 1000,
         };
      }

      const error = data.error as string;
      if (error === "authorization_pending") continue;
      if (error === "slow_down") {
         interval += 5;
         continue;
      }

      throw new Error(`Device code poll failed: ${error} - ${data.error_description}`);
   }

   throw new Error("Device code flow timed out");
}

export async function refreshMicrosoftToken(
   clientId: string,
   refreshToken: string,
): Promise<MicrosoftTokens> {
   const response = await fetch(Endpoint.LiveToken, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
         grant_type: "refresh_token",
         client_id: clientId,
         refresh_token: refreshToken,
         scope: "service::user.auth.xboxlive.com::MBI_SSL",
      }),
   });

   if (!response.ok) {
      const text = await response.text();
      throw new Error(`Token refresh failed: ${response.status} - ${text}`);
   }

   const data = await response.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
   };

   return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
   };
}

function sleep(ms: number): Promise<void> {
   return new Promise((resolve) => setTimeout(resolve, ms));
}
