import { Packet } from "../../enums/packet";
import { DataPacket } from "../data-packet";
import { Address } from "../../types/address";

export class NewIncomingConnection extends DataPacket {
   public static override ID = Packet.NewIncomingConnection;

   public address!: Address;
   public internalAddress!: Address;
   public incomingTimestamp!: bigint;
   public serverTimestamp!: bigint;

   public override serialize(): Buffer {
      this.writeUint8(NewIncomingConnection.ID);
      Address.write(this, this.address);
      for (let i = 0; i < 10; i++) {
         Address.write(this, this.internalAddress);
      }
      this.writeInt64(this.incomingTimestamp);
      this.writeInt64(this.serverTimestamp);
      return this.getBuffer();
   }

   public override deserialize(): this {
      this.address = Address.read(this);
      for (let i = 0; i < 10; i++) {
         this.internalAddress = Address.read(this);
      }
      this.incomingTimestamp = this.readInt64();
      this.serverTimestamp = this.readInt64();
      return this;
   }
}
