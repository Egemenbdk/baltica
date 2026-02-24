import { BinaryStream } from "@serenityjs/binarystream";
import { Packet } from "../enums/packet";

export class DataPacket extends BinaryStream {
   public static ID: Packet;

   public serialize(): Buffer {
      throw new Error(`${this.constructor.name}.serialize is not implemented!`);
   }

   public deserialize(): this {
      throw new Error(`${this.constructor.name}.deserialize is not implemented!`);
   }
}