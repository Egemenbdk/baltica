import { Packet } from "../../enums/packet";
import { DataPacket } from "../data-packet";
import { Magic } from "../../types/magic";
import { Address } from "../../types/address";

export class OpenConnectionReplyTwo extends DataPacket {
   public static override ID = Packet.OpenConnectionReply2;

   public guid!: bigint;
   public address!: Address;
   public mtu!: number;
   public encryptionEnabled!: boolean;

   public override serialize(): Buffer {
      this.writeUint8(OpenConnectionReplyTwo.ID);
      new Magic().write(this);
      this.writeUint64(this.guid);
      Address.write(this, this.address);
      this.writeInt16(this.mtu);
      this.writeBool(this.encryptionEnabled);
      return this.getBuffer();
   }

   public override deserialize(): this {
      Magic.read(this);
      this.guid = this.readUint64();
      this.address = Address.read(this);
      this.mtu = this.readInt16();
      this.encryptionEnabled = this.readBool();
      return this;
   }
}
