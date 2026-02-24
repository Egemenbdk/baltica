import { Packet } from "../../enums/packet";
import { DataPacket } from "../data-packet";
import { Magic } from "../../types/magic";

export class UnconnectedPing extends DataPacket {
   public static override ID = Packet.UnconnectedPing;

   public timestamp!: bigint;
   public guid!: bigint;

   public override serialize(): Buffer {
      this.writeUint8(UnconnectedPing.ID);
      this.writeInt64(this.timestamp);
      new Magic().write(this);
      this.writeUint64(this.guid);
      return this.getBuffer();
   }

   public override deserialize(): this {
      this.timestamp = this.readInt64();
      Magic.read(this);
      this.guid = this.readUint64();
      return this;
   }
}
