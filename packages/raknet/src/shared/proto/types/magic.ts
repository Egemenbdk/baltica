import { DataType } from "./data-type";
import { BinaryStream } from "@serenityjs/binarystream";

const MAGIC: Buffer = Buffer.from("00ffff00fefefefefdfdfdfd12345678", "hex");

export class Magic extends DataType {
   public buffer: Buffer = MAGIC;

   public write(stream: BinaryStream): void {
      stream.write(MAGIC);
   }

   public static override read(stream: BinaryStream): Magic {
      const magic = new Magic();
      magic.buffer = stream.read(16);
      return magic;
   }
}
