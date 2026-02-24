export type ServerOptions = {
   address: string;
   port: number;
   family: "udp4" | "udp6";
   mtu: number;
   maxConnections: number;
   message: string;
   guid: bigint;
};

export const defaultServerOptions: Omit<ServerOptions, "guid"> = {
   address: "0.0.0.0",
   port: 19132,
   family: "udp4",
   mtu: 1028,
   maxConnections: 20,
   message: "MCPE;Baltica;0;0.0.0;0;0;0;Baltica;Survival;1;19132;19133;0;",
};
