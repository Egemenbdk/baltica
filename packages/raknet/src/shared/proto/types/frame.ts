import type { BinaryStream } from "@serenityjs/binarystream";
import { Endianness } from "@serenityjs/binarystream";
import { Reliability } from "../enums/reliability";

export const SplitFlag = 0x10;

export class Frame {
   public reliability!: Reliability;
   public reliableFrameIndex!: number;
   public sequenceFrameIndex!: number;
   public orderedFrameIndex!: number;
   public orderChannel!: number;
   public splitFrameIndex!: number;
   public splitSize!: number;
   public splitId!: number;
   public payload!: Buffer;

   public static write(stream: BinaryStream, frames: Array<Frame>): void {
      for (const frame of frames) {
         const isReliable = frame.isReliable();
         const isSequenced = frame.isSequenced();
         const isOrdered = frame.isOrdered();
         const isSplit = frame.isSplit();

         const header = (frame.reliability << 5) | (isSplit ? SplitFlag : 0);
         stream.writeUint8(header);
         stream.writeUint16(frame.payload.byteLength << 3);

         if (isReliable) stream.writeUint24(frame.reliableFrameIndex, Endianness.Little);
         if (isSequenced) stream.writeUint24(frame.sequenceFrameIndex, Endianness.Little);
         if (isOrdered) {
            stream.writeUint24(frame.orderedFrameIndex, Endianness.Little);
            stream.writeUint8(frame.orderChannel);
         }
         if (isSplit) {
            stream.writeUint32(frame.splitSize);
            stream.writeUint16(frame.splitId);
            stream.writeUint32(frame.splitFrameIndex);
         }

         stream.write(frame.payload);
      }
   }

   public static read(stream: BinaryStream): Array<Frame> {
      const frames: Array<Frame> = [];

      while (!stream.feof()) {
         const frame = new Frame();
         const header = stream.readUint8();
         const reliability = (header & 0xe0) >> 5;
         const split = (header & SplitFlag) !== 0;
         const length = Math.ceil(stream.readUint16() / 8);

         frame.reliability = reliability as Reliability;

         const isReliable = frame.isReliable();
         const isSequenced = frame.isSequenced();
         const isOrdered = frame.isOrdered();

         if (isReliable) frame.reliableFrameIndex = stream.readUint24(Endianness.Little);
         if (isSequenced) frame.sequenceFrameIndex = stream.readUint24(Endianness.Little);
         if (isOrdered) {
            frame.orderedFrameIndex = stream.readUint24(Endianness.Little);
            frame.orderChannel = stream.readUint8();
         }
         if (split) {
            frame.splitSize = stream.readUint32();
            frame.splitId = stream.readUint16();
            frame.splitFrameIndex = stream.readUint32();
         }

         frame.payload = stream.read(length);
         frames.push(frame);
      }

      return frames;
   }

   public isSplit(): boolean {
      return this.splitSize > 0;
   }

   public isReliable(): boolean {
      return [
         Reliability.Reliable,
         Reliability.ReliableOrdered,
         Reliability.ReliableSequenced,
         Reliability.ReliableWithAckReceipt,
         Reliability.ReliableOrderedWithAckReceipt,
      ].includes(this.reliability);
   }

   public isSequenced(): boolean {
      return [
         Reliability.ReliableSequenced,
         Reliability.UnreliableSequenced,
      ].includes(this.reliability);
   }

   public isOrdered(): boolean {
      return [
         Reliability.UnreliableSequenced,
         Reliability.ReliableOrdered,
         Reliability.ReliableSequenced,
         Reliability.ReliableOrderedWithAckReceipt,
      ].includes(this.reliability);
   }

   public isOrderExclusive(): boolean {
      return [
         Reliability.ReliableOrdered,
         Reliability.ReliableOrderedWithAckReceipt,
      ].includes(this.reliability);
   }

   public getByteLength(): number {
      return (
         3 +
         this.payload.byteLength +
         (this.isReliable() ? 3 : 0) +
         (this.isSequenced() ? 3 : 0) +
         (this.isOrdered() ? 4 : 0) +
         (this.isSplit() ? 10 : 0)
      );
   }
}
