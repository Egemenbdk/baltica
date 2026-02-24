import { CompressionMethod, Framer } from "@serenityjs/protocol";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import type { PacketEncryptor } from "./packet-encryptor";

export class PacketCompressor {
   public compressionMethod: CompressionMethod | null = null;
   public compressionThreshold = 1;
   private encryptor: PacketEncryptor | null = null;

   setEncryptor(encryptor: PacketEncryptor): void {
      this.encryptor = encryptor;
   }

   get encryptionEnabled(): boolean {
      return this.encryptor !== null;
   }

   decompress(buffer: Buffer): Buffer[] {
      if (buffer[0] !== 0xfe) throw new Error("Invalid packet");
      let packet = buffer.subarray(1);

      if (this.encryptor) {
         packet = this.encryptor.decryptPacket(packet);
      }

      const method = this.getMethod(packet[0]!);
      if (method !== CompressionMethod.NotPresent) {
         packet = packet.subarray(1);
      }

      return Framer.unframe(this.inflate(packet, method));
   }

   compress(buffer: Buffer | Buffer[], method?: CompressionMethod): Buffer {
      const framed = Array.isArray(buffer)
         ? Framer.frame(...buffer)
         : Framer.frame(buffer);
      const effectiveMethod = method ?? this.compressionMethod;

      let result: Buffer;

      if (effectiveMethod !== null && effectiveMethod !== undefined) {
         const shouldDeflate =
            this.compressionThreshold === 1 ||
            (this.compressionThreshold > 1 && framed.byteLength > this.compressionThreshold);

         if (shouldDeflate) {
            const deflated = this.deflate(framed, effectiveMethod);
            result = Buffer.allocUnsafe(2 + deflated.length);
            result[0] = 0xfe;
            result[1] = effectiveMethod;
            deflated.copy(result, 2);
         } else {
            result = Buffer.allocUnsafe(2 + framed.length);
            result[0] = 0xfe;
            result[1] = CompressionMethod.None;
            framed.copy(result, 2);
         }
      } else {
         result = Buffer.allocUnsafe(1 + framed.length);
         result[0] = 0xfe;
         framed.copy(result, 1);
      }

      if (this.encryptor) {
         return this.encryptor.encryptPacket(result.subarray(1));
      }

      return result;
   }

   private inflate(buffer: Buffer, method: CompressionMethod): Buffer {
      switch (method) {
         case CompressionMethod.Zlib:
            return inflateRawSync(buffer);
         case CompressionMethod.Snappy:
            throw new Error("Snappy compression is not supported");
         default:
            return buffer;
      }
   }

   private deflate(buffer: Buffer, method: CompressionMethod): Buffer {
      switch (method) {
         case CompressionMethod.Zlib:
            return deflateRawSync(buffer);
         case CompressionMethod.Snappy:
            throw new Error("Snappy compression is not supported");
         default:
            return buffer;
      }
   }

   private getMethod(header: number): CompressionMethod {
      return header in CompressionMethod
         ? (header as CompressionMethod)
         : CompressionMethod.NotPresent;
   }
}
