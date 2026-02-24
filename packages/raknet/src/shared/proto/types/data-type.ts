import { BinaryStream } from "@serenityjs/binarystream";

export abstract class DataType {
   public abstract write(stream: BinaryStream): void;

   public static read(_stream: BinaryStream): DataType {
      throw new Error(`${this.name}.read is not implemented!`);
   }
}