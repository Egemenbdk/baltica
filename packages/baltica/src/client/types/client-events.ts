import type * as Protocol from "@serenityjs/protocol";
import { PacketNames } from "../../shared";

export type ClientEvents = {
   [K in PacketNames]: [packet: InstanceType<(typeof Protocol)[K]>];
} & {
   spawn: [],
   connect: [],
   disconnect: [reason: string],
};