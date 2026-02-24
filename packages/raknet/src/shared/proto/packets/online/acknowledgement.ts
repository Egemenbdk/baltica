import { BinaryStream, Endianness } from "@serenityjs/binarystream";
import { DataPacket } from "../data-packet";

export class Acknowledgement extends DataPacket {
   public sequences: Array<number> = [];

   public override serialize(): Buffer {
      this.writeUint8((this.constructor as typeof Acknowledgement).ID);

      const stream = new BinaryStream();
      this.sequences.sort((a, b) => a - b);
      const count = this.sequences.length;
      let records = 0;

      if (count > 0) {
         let cursor = 1;
         let start = this.sequences[0] as number;
         let last = this.sequences[0] as number;

         while (cursor < count) {
            const current = this.sequences[cursor++] as number;
            const diff = current - last;

            if (diff === 1) {
               last = current;
            } else if (diff > 1) {
               if (start === last) {
                  stream.writeBool(true);
                  stream.writeUint24(start, Endianness.Little);
               } else {
                  stream.writeBool(false);
                  stream.writeUint24(start, Endianness.Little);
                  stream.writeUint24(last, Endianness.Little);
               }
               start = last = current;
               ++records;
            }
         }

         if (start === last) {
            stream.writeBool(true);
            stream.writeUint24(start, Endianness.Little);
         } else {
            stream.writeBool(false);
            stream.writeUint24(start, Endianness.Little);
            stream.writeUint24(last, Endianness.Little);
         }
         ++records;
      }

      this.writeUint16(records);
      this.write(stream.getBuffer());
      return this.getBuffer();
   }

   public override deserialize(): this {
      this.sequences = [];
      const recordCount = this.readUint16();

      for (let i = 0; i < recordCount; i++) {
         const single = this.readBool();

         if (single) {
            this.sequences.push(this.readUint24(Endianness.Little));
         } else {
            const start = this.readUint24(Endianness.Little);
            const end = this.readUint24(Endianness.Little);
            for (let j = start; j <= end; j++) {
               this.sequences.push(j);
            }
         }
      }

      return this;
   }
}
