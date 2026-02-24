import { Packet } from "../../enums/packet";
import { DataPacket } from "../data-packet";
import { Magic } from "../../types/magic";
import { Address } from "../../types/address";

export class OpenConnectionRequestTwo extends DataPacket {
   public static override ID = Packet.OpenConnectionRequest2;

   public address!: Address;
   public mtu!: number;
   public guid!: bigint;
   public cookie!: number | null;
   public clientSupportsecurity!: boolean;

   public override serialize(): Buffer {
      this.writeUint8(OpenConnectionRequestTwo.ID);
      new Magic().write(this);
      if (this.cookie != null) {
         this.writeUint32(this.cookie);
         this.writeBool(this.clientSupportsecurity ?? false);
      }
      Address.write(this, this.address);
      this.writeUint16(this.mtu);
      this.writeUint64(this.guid);
      return this.getBuffer();
   }

   public override deserialize(): this {
      Magic.read(this);
      const remaining = this.buffer.byteLength - this.offset;
      const minWithoutCookie = 7 + 2 + 8;
      this.cookie = null;
      this.clientSupportsecurity = false;
      if (remaining > minWithoutCookie) {
         this.cookie = this.readUint32();
         this.clientSupportsecurity = this.readBool();
      }
      this.address = Address.read(this);
      this.mtu = this.readUint16();
      this.guid = this.readUint64();
      return this;
   }
}
