import { Packet } from "../../enums/packet";
import { DataPacket } from "../data-packet";

export class ConnectedPong extends DataPacket {
   public static override ID = Packet.ConnectedPong;

   public pingTimestamp!: bigint;
   public pongTimestamp!: bigint;

   public override serialize(): Buffer {
      this.writeUint8(ConnectedPong.ID);
      this.writeInt64(this.pingTimestamp);
      this.writeInt64(this.pongTimestamp);
      return this.getBuffer();
   }

   public override deserialize(): this {
      this.pingTimestamp = this.readInt64();
      this.pongTimestamp = this.readInt64();
      return this;
   }
}
