type Listener<Args extends unknown[]> = (...args: Args) => void;

export class Emitter<Events extends Record<string, unknown[]>> {
  private listeners = new Map<keyof Events, Set<Listener<any>>>();

  public on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): this {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener);
    return this;
  }

  public once<K extends keyof Events>(event: K, listener: Listener<Events[K]>): this {
    const wrapped: Listener<Events[K]> = (...args) => {
      this.off(event, wrapped);
      listener(...args);
    };
    return this.on(event, wrapped);
  }

  public off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): this {
    this.listeners.get(event)?.delete(listener);
    return this;
  }

  public emit<K extends keyof Events>(event: K, ...args: Events[K]): boolean {
    const set = this.listeners.get(event);
    if (!set || set.size === 0) return false;
    for (const listener of set) listener(...args);
    return true;
  }

  public removeAllListeners<K extends keyof Events>(event?: K): this {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
    return this;
  }

  public listenerCount<K extends keyof Events>(event: K): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}
