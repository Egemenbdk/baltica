import { Packet } from "../../enums/packet";
import { DataPacket } from "../data-packet";
import { Magic } from "../../types/magic";
import { MTU } from "../../types/mtu";

export class OpenConnectionRequestOne extends DataPacket {
   public static override ID = Packet.OpenConnectionRequest1;

   public protocol!: number;
   public mtu!: number;

   public override serialize(): Buffer {
      this.writeUint8(OpenConnectionRequestOne.ID);
      new Magic().write(this);
      this.writeUint8(this.protocol);
      MTU.write(this, this.mtu);
      return this.getBuffer();
   }

   public override deserialize(): this {
      Magic.read(this);
      this.protocol = this.readUint8();
      this.mtu = MTU.read(this);
      return this;
   }
}
