import { Packet } from "../../enums/packet";
import { Acknowledgement } from "./acknowledgement";

export class Nack extends Acknowledgement {
   public static override ID = Packet.Nack;
}
