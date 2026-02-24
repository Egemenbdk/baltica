import type { Connection } from "../connection";

export type ServerEvents = {
   connect: [connection: Connection];
   disconnect: [connection: Connection];
   encapsulated: [payload: Buffer, connection: Connection];
};
