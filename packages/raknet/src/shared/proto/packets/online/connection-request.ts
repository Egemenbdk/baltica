import { Packet } from "../../enums/packet";
import { DataPacket } from "../data-packet";

export class ConnectionRequest extends DataPacket {
   public static override ID = Packet.ConnectionRequest;

   public guid!: bigint;
   public timestamp!: bigint;
   public useSecurity!: boolean;

   public override serialize(): Buffer {
      this.writeUint8(ConnectionRequest.ID);
      this.writeUint64(this.guid);
      this.writeInt64(this.timestamp);
      this.writeBool(this.useSecurity);
      return this.getBuffer();
   }

   public override deserialize(): this {
      this.guid = this.readUint64();
      this.timestamp = this.readInt64();
      this.useSecurity = this.readBool();
      return this;
   }
}
