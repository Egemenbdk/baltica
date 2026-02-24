import type { Socks5Options } from "../../shared";

export type ClientOptions = {
   mtu: number,
   timeout: number,
   maxRetransmit: number
   address: string,
   port: number,
   family: "udp4" | "udp6";
   guid: bigint;
   proxy?: Socks5Options;
}

export const defaultClientOptions: Omit<ClientOptions, "guid"> = {
   address: "127.0.0.1",
   family: "udp4", // IPV4/udp4 is used by default in most of the things
   maxRetransmit: 3,
   mtu: 1028, // The most stable from what i can see
   port: 19132,
   timeout: 5000,
}