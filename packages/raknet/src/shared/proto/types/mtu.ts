import type { BinaryStream } from "@serenityjs/binarystream";

export class MTU {
   public static write(stream: BinaryStream, mtu: number): void {
      stream.write(Buffer.alloc(mtu - stream.getBuffer().length));
   }

   public static read(stream: BinaryStream): number {
      return stream.buffer.byteLength;
   }
}
