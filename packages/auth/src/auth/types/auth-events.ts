import type { DeviceCodeResponse, AuthResult } from "./auth-tokens";

export type AuthEvents = {
   login: [result: AuthResult];
   logout: [];
   error: [error: Error];
   deviceCode: [response: DeviceCodeResponse];
};
