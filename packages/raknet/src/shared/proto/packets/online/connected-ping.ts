import { Packet } from "../../enums/packet";
import { DataPacket } from "../data-packet";

export class ConnectedPing extends DataPacket {
   public static override ID = Packet.ConnectedPing;

   public timestamp!: bigint;

   public override serialize(): Buffer {
      this.writeUint8(ConnectedPing.ID);
      this.writeInt64(this.timestamp);
      return this.getBuffer();
   }

   public override deserialize(): this {
      this.timestamp = this.readInt64();
      return this;
   }
}
