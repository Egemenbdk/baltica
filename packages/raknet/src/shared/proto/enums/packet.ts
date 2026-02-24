export enum Packet {
  UnconnectedPing = 0x01,
  UnconnectedPingOpenConnections = 0x02,
  UnconnectedPong = 0x1c,
  ConnectedPing = 0x00,
  ConnectedPong = 0x03,

  OpenConnectionRequest1 = 0x05,
  OpenConnectionReply1 = 0x06,
  OpenConnectionRequest2 = 0x07,
  OpenConnectionReply2 = 0x08,

  ConnectionRequest = 0x09,
  ConnectionRequestAccepted = 0x10,
  NewIncomingConnection = 0x13,
  DisconnectionNotification = 0x15,

  IncompatibleProtocolVersion = 0x19,
  AlreadyConnected = 0x12,

  Ack = 0xc0,
  Nack = 0xa0,

  FrameSetMin = 0x80,
  FrameSetMax = 0x8d,
}
