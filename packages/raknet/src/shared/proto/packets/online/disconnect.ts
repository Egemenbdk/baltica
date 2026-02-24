import { Packet } from "../../enums/packet";
import { DataPacket } from "../data-packet";

export class Disconnect extends DataPacket {
   public static override ID = Packet.DisconnectionNotification;

   public override serialize(): Buffer {
      this.writeUint8(Disconnect.ID);
      return this.getBuffer();
   }

   public override deserialize(): this {
      return this;
   }
}
