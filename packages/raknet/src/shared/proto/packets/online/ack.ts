import { Packet } from "../../enums/packet";
import { Acknowledgement } from "./acknowledgement";

export class Ack extends Acknowledgement {
   public static override ID = Packet.Ack;
}
