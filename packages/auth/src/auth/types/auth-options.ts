export interface AuthOptions {
   clientId: string;
   deviceCode: boolean;
   username: string;
   cacheDir: string;
   clientPublicKey?: string;
}

export const defaultAuthOptions: AuthOptions = {
   clientId: "000000004C12AE6F",
   deviceCode: true,
   username: "default",
   cacheDir: ".baltica/auth",
};
