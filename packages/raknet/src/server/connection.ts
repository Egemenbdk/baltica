import { Emitter } from "@baltica/utils";
import { NetworkSession, Address, Priority } from "../shared";

export type ConnectionEvents = {
   connect: [];
   disconnect: [];
   encapsulated: [payload: Buffer];
};

export class Connection extends Emitter<ConnectionEvents> {
   public readonly network: NetworkSession;
   public readonly address: Address;
   public readonly guid: bigint;

   constructor(network: NetworkSession) {
      super();
      this.network = network;
      this.address = network.address;
      this.guid = network.remoteGuid;

      network.on("connect", () => this.emit("connect"));
      network.on("disconnect", () => this.emit("disconnect"));
      network.on("encapsulated", (payload) => this.emit("encapsulated", payload));
   }

   send(data: Buffer, priority: Priority = Priority.Medium): void {
      this.network.frameAndSend(data, priority);
   }

   disconnect(): void {
      this.network.status = 3;
      this.network.emit("disconnect");
   }

   get identifier(): string {
      return `${this.address.address}:${this.address.port}`;
   }
}
