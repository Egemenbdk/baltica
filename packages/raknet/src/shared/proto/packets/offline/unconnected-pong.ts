import { Packet } from "../../enums/packet";
import { DataPacket } from "../data-packet";
import { Magic } from "../../types/magic";

export class UnconnectedPong extends DataPacket {
   public static override ID = Packet.UnconnectedPong;

   public timestamp!: bigint;
   public guid!: bigint;
   public message!: string;

   public override serialize(): Buffer {
      this.writeUint8(UnconnectedPong.ID);
      this.writeInt64(this.timestamp);
      this.writeUint64(this.guid);
      new Magic().write(this);
      this.writeString16(this.message);
      return this.getBuffer();
   }

   public override deserialize(): this {
      this.timestamp = this.readInt64();
      this.guid = this.readUint64();
      Magic.read(this);
      this.message = this.readString16();
      return this;
   }
}
