import { Endianness } from "@serenityjs/binarystream";
import { Packet } from "../../enums/packet";
import { DataPacket } from "../data-packet";
import { Frame } from "../../types/frame";

export class FrameSet extends DataPacket {
   public static override ID = Packet.FrameSetMin;

   public sequence!: number;
   public frames: Array<Frame> = [];

   public override serialize(): Buffer {
      this.writeUint8(FrameSet.ID);
      this.writeUint24(this.sequence, Endianness.Little);
      Frame.write(this, this.frames);
      return this.getBuffer();
   }

   public override deserialize(): this {
      this.sequence = this.readUint24(Endianness.Little);
      this.frames = Frame.read(this);
      return this;
   }
}
