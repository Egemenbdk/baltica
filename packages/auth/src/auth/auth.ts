import { Emitter } from "@baltica/utils";
import type { AuthEvents, AuthOptions, AuthResult, CachedKeyPair, MicrosoftTokens, TokenCache } from "./types";
import { defaultAuthOptions } from "./types";
import { requestDeviceCode, pollDeviceCode, refreshMicrosoftToken } from "./microsoft";
import { authenticateXbl, authenticateXsts } from "./xbox";
import { loginWithPlayFab } from "./playfab";
import { getBedrockChain, getMinecraftServicesToken, getMultiplayerSessionToken } from "./session";
import { AuthCache, isTokenValid } from "./cache";
import { generateKeyPair } from "./keypair";

export class Auth extends Emitter<AuthEvents> {
   public options: AuthOptions;
   private cache: AuthCache;

   constructor(options: Partial<AuthOptions> = {}) {
      super();
      this.options = { ...defaultAuthOptions, ...options };
      this.cache = new AuthCache(this.options.cacheDir, this.options.username);
   }

   public async login(): Promise<AuthResult> {
      if (!this.options.clientId) {
         throw new Error(
            "Missing clientId. Register an Azure app at https://portal.azure.com and pass the Application (client) ID.",
         );
      }

      try {
         const cached = this.cache.load();
         const keypair = cached.keypair ?? generateKeyPair();

         const cachedResult = await this.tryUseCached(cached, keypair);
         if (cachedResult) {
            this.emit("login", cachedResult);
            return cachedResult;
         }

         let msTokens: MicrosoftTokens;
         if (cached.microsoft?.refreshToken) {
            try {
               msTokens = await refreshMicrosoftToken(
                  this.options.clientId,
                  cached.microsoft.refreshToken,
               );
            } catch {
               msTokens = await this.doDeviceCodeFlow();
            }
         } else {
            msTokens = await this.doDeviceCodeFlow();
         }

         const result = await this.authenticateChain(msTokens, keypair);

         this.cache.save({
            microsoft: msTokens,
            xbl: result.xbl,
            xsts: result.xsts,
            playFab: result.playFab,
            mcServices: result.mcServices,
            keypair,
         });

         this.emit("login", result);
         return result;
      } catch (error) {
         const err = error instanceof Error ? error : new Error(String(error));
         this.emit("error", err);
         throw err;
      }
   }

   public async logout(): Promise<void> {
      const cached = this.cache.load();
      this.cache.save({
         microsoft: cached.microsoft,
         keypair: cached.keypair,
      });
      this.emit("logout");
   }

   private async tryUseCached(cached: TokenCache, keypair: CachedKeyPair): Promise<AuthResult | null> {
      if (
         cached.xbl && isTokenValid(cached.xbl.expiresAt) &&
         cached.xsts && isTokenValid(cached.xsts.expiresAt) &&
         cached.playFab && isTokenValid(cached.playFab.expiresAt) &&
         cached.mcServices && isTokenValid(cached.mcServices.expiresAt)
      ) {
         const clientPublicKey = this.options.clientPublicKey ?? "";
         const bedrock = await getBedrockChain(cached.xsts.token, cached.xsts.userHash, clientPublicKey);
         let multiplayerSession = { signedToken: "", expiresAt: 0 };
         if (clientPublicKey) {
            multiplayerSession = await getMultiplayerSessionToken(
               cached.mcServices.authorizationHeader,
               clientPublicKey,
            );
         }
         return {
            xbl: cached.xbl,
            xsts: cached.xsts,
            playFab: cached.playFab,
            mcServices: cached.mcServices,
            multiplayerSession,
            bedrockChain: bedrock.chain,
            keypair,
         };
      }
      return null;
   }

   private async doDeviceCodeFlow(): Promise<MicrosoftTokens> {
      const deviceCode = await requestDeviceCode(this.options.clientId);
      this.emit("deviceCode", deviceCode);
      return pollDeviceCode(
         this.options.clientId,
         deviceCode.deviceCode,
         deviceCode.interval,
         deviceCode.expiresIn,
      );
   }

   private async authenticateChain(
      msTokens: MicrosoftTokens,
      keypair: CachedKeyPair,
   ): Promise<AuthResult> {
      const xbl = await authenticateXbl(msTokens.accessToken);
      const xsts = await authenticateXsts(xbl.token);

      const { Endpoint } = await import("./constants");
      const xstsPlayFab = await authenticateXsts(xbl.token, Endpoint.PlayFabRelyingParty);
      const playFab = await loginWithPlayFab(xstsPlayFab);
      const mcServices = await getMinecraftServicesToken(playFab.sessionTicket);

      const clientPublicKey = this.options.clientPublicKey ?? "";

      const bedrock = await getBedrockChain(xsts.token, xsts.userHash, clientPublicKey);

      let multiplayerSession = { signedToken: "", expiresAt: 0 };
      if (clientPublicKey) {
         multiplayerSession = await getMultiplayerSessionToken(
            mcServices.authorizationHeader,
            clientPublicKey,
         );
      }

      return { xbl, xsts, playFab, mcServices, multiplayerSession, bedrockChain: bedrock.chain, keypair };
   }
}
