import { createSocket, Socket } from "node:dgram";
import { randomBytes } from "node:crypto";
import { lookup } from "node:dns/promises";
import { Emitter } from "@baltica/utils";
import { NetworkSession, UnconnectedPing, OpenConnectionRequestOne, Address, Priority, Status, Disconnect, createSocks5Relay, Socks5Relay } from "../shared";
import { ClientEvents, ClientOptions, defaultClientOptions } from "./types";

export class Client extends Emitter<ClientEvents> {
   private socket!: Socket;
   private network: NetworkSession;
   private relay?: Socks5Relay;
   public options: ClientOptions;
   private closed = false;

   constructor(options: Partial<ClientOptions> = {}) {
      super();
      this.options = { ...defaultClientOptions, guid: randomBytes(8).readBigUInt64BE(), ...options };
      this.network = new NetworkSession(this.options.mtu, true);
      this.network.guid = this.options.guid;
      this.network.maxRetransmit = this.options.maxRetransmit;

      this.network.on("connect", () => this.emit("connect"));
      // Server-initiated disconnects (DisconnectionNotification, AlreadyConnected,
      // stale timeout in tick()) and protocol/connect-timeout errors used to
      // leak the dgram socket + NetworkSession's recursive keepalive timer
      // because close() was only ever called from the user-invoked disconnect()
      // method. Auto-close here so any failure path releases native resources.
      this.network.on("disconnect", () => {
         this.emit("disconnect");
         this.close();
      });
      this.network.on("encapsulated", (buf) => this.emit("encapsulated", buf));
      this.network.on("error", (err) => {
         this.emit("error", err);
         this.close();
      });
   }

   private bindPromise: Promise<void> | null = null;

   private ensureBound(): Promise<void> {
      if (this.bindPromise) return this.bindPromise;
      // If init() rejects (DNS failure, SOCKS5 handshake failure, dgram bind
      // failure, etc.) any partially-allocated resources — the relay's TCP
      // socket and udp socket, the dgram socket if initDirect got far enough —
      // need to be released. Without this, every failed connect leaks them
      // plus the NetworkSession keepalive timer that started in the constructor.
      this.bindPromise = this.init().catch((err) => {
         this.close();
         throw err;
      });
      return this.bindPromise;
   }

   private async init(): Promise<void> {
      const family = this.options.family === "udp4" ? 4 : 6;
      const resolved = await lookup(this.options.address, family);
      this.network.address = new Address(resolved.address, this.options.port, family);
      if (this.options.proxy) return this.initProxy();
      return this.initDirect();
   }

   private async initProxy(): Promise<void> {
      this.relay = await createSocks5Relay(this.options.proxy!, this.options.family);
      this.socket = this.relay.socket;
      const targetAddress = this.network.address.address;
      const targetPort = this.network.address.port;
      this.network.send = (data) => this.relay!.send(data, targetAddress, targetPort);
      this.relay.onMessage((data) => this.network.receive(data));
   }

   private initDirect(): Promise<void> {
      this.socket = createSocket(this.options.family);
      this.socket.ref();
      this.network.send = (data) => this.socket.send(data, this.options.port, this.options.address);
      return new Promise((resolve) => {
         try {
            this.socket.address();
            this.socket.on("message", (buf) => this.network.receive(buf));
            resolve();
         } catch {
            this.socket.bind();
            this.socket.on("listening", () => {
               this.socket.on("message", (buf) => this.network.receive(buf));
               resolve();
            });
         }
      });
   }

   public async ping(
      address?: string,
      port?: number
   ): Promise<string> {
      await this.ensureBound();
      const targetAddress = address ?? this.network.address.address;
      const targetPort = port ?? this.network.address.port;
      return new Promise((resolve) => {
         this.network.once("pong", resolve);
         const ping = new UnconnectedPing();
         ping.guid = this.options.guid;
         ping.timestamp = BigInt(Date.now());
         const data = ping.serialize();
         if (this.relay) this.relay.send(data, targetAddress, targetPort);
         else this.socket.send(data, targetPort, targetAddress);
      });
   }

   public async connect(): Promise<void> {
      await this.ensureBound();
      return new Promise((resolve, reject) => {
         const cleanup = () => {
            this.network.off("connect", onConnect);
            this.network.off("error", onError);
            clearTimeout(timer);
         };
         const onConnect = () => { cleanup(); resolve(); };
         const onError = (err: Error) => {
            cleanup();
            // network "error" already triggered close() via the constructor
            // listener; safe to just reject here. Belt-and-braces close() in
            // case ordering ever changes — close() is idempotent.
            this.close();
            reject(err);
         };
         const timer = setTimeout(() => {
            cleanup();
            this.network.status = Status.Disconnected;
            // On timeout we have a bound socket + active NetworkSession with a
            // recursive keepalive timer. Without close() these stay alive in
            // libuv (socket.ref()) even after the caller drops the Client ref.
            this.close();
            reject(new Error("Connection timed out"));
         }, this.options.timeout);

         this.network.once("connect", onConnect);
         this.network.once("error", onError);

         const req = new OpenConnectionRequestOne();
         req.protocol = 11;
         req.mtu = this.options.mtu;
         this.network.sendOfflineWithRetry(req.serialize());
      });
   }

   public sendReliable(data: Buffer, priority: Priority = Priority.Medium): void {
      this.network.frameAndSend(data, priority);
   }

   public close(): void {
      // Idempotent: callable from any failure path (network "disconnect",
      // network "error", connect() timeout, init() failure, user disconnect())
      // without double-destroy. Without this guard, the auto-close listeners
      // wired in the constructor would re-enter when we set status=Disconnected
      // below, since destroy() removes all network listeners but the synchronous
      // emit path can still be in flight on some Emitter implementations.
      if (this.closed) return;
      this.closed = true;
      this.network.destroy();
      this.network.status = Status.Disconnected;
      this.network.send = () => {};
      this.network.removeAllListeners();
      try {
         if (this.relay) { this.relay.close(); this.relay = undefined; }
         else if (this.socket) { this.socket.close(); (this as any).socket = undefined; }
      } catch {}
   }

   public disconnect(): void {
      const packet = new Disconnect();
      try { this.sendReliable(packet.serialize(), Priority.High); } catch {}
      // Give UDP time to actually send the packet before closing
      setTimeout(() => {
         this.close();
         this.emit("disconnect");
      }, 150);
   }
}
