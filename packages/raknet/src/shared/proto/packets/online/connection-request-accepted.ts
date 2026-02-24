import { Packet } from "../../enums/packet";
import { DataPacket } from "../data-packet";
import { Address } from "../../types/address";

export class ConnectionRequestAccepted extends DataPacket {
   public static override ID = Packet.ConnectionRequestAccepted;

   public address!: Address;
   public systemIndex!: number;
   public addresses!: Array<Address>;
   public requestTimestamp!: bigint;
   public timestamp!: bigint;

   public override serialize(): Buffer {
      this.writeUint8(ConnectionRequestAccepted.ID);
      Address.write(this, this.address);
      this.writeUint16(this.systemIndex);
      for (let i = 0; i < this.addresses.length; i++) {
         Address.write(this, this.addresses[i]!);
      }
      this.writeInt64(this.requestTimestamp);
      this.writeInt64(this.timestamp);
      return this.getBuffer();
   }

   public override deserialize(): this {
      this.address = Address.read(this);
      this.systemIndex = this.readUint16();
      this.addresses = [];
      const remaining = this.buffer.byteLength - this.offset;
      const timestampsSize = 16;
      let addressBytes = remaining - timestampsSize;
      const startOffset = this.offset;
      while (this.offset - startOffset < addressBytes) {
         this.addresses.push(Address.read(this));
      }
      this.requestTimestamp = this.readInt64();
      this.timestamp = this.readInt64();
      return this;
   }
}
