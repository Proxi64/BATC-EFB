import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BatcConnection, type ConnectionStatus } from "../src/web/core/connection";

class FakeSocket {
  static all: FakeSocket[] = [];
  readyState = 0;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public url: string) { FakeSocket.all.push(this); }
  send(t: string) { this.sent.push(t); }
  close() { this.readyState = 3; this.onclose?.(); }
  // test helpers
  open() { this.readyState = 1; this.onopen?.(); }
  receive(t: string) { this.onmessage?.({ data: t }); }
  drop() { this.readyState = 3; this.onclose?.(); }
}

function make() {
  const statuses: ConnectionStatus[] = [];
  const frames: string[] = [];
  let opened = 0;
  const c = new BatcConnection({
    url: () => "ws://pc:41716",
    onFrame: f => frames.push(f),
    onStatus: s => statuses.push(s),
    onOpen: () => opened++,
    createSocket: url => new FakeSocket(url) as unknown as WebSocket,
    random: () => 0
  });
  return { c, statuses, frames, opened: () => opened };
}

beforeEach(() => { vi.useFakeTimers(); FakeSocket.all = []; });
afterEach(() => { vi.useRealTimers(); });

describe("connection", () => {
  it("connects, receives, sends", () => {
    const { c, frames, opened } = make();
    c.start();
    FakeSocket.all[0]!.open();
    expect(opened()).toBe(1);
    FakeSocket.all[0]!.receive("Facility: X|1");
    expect(frames).toEqual(["Facility: X|1"]);
    expect(c.send("atc_log")).toBe(true);
    expect(FakeSocket.all[0]!.sent).toEqual(["atc_log"]);
  });

  it("reconnects with increasing delays, then resets after success", () => {
    const { c } = make();
    c.start();
    FakeSocket.all[0]!.drop();                  // attempt 1 failed → 1 s
    vi.advanceTimersByTime(999); expect(FakeSocket.all).toHaveLength(1);
    vi.advanceTimersByTime(1);   expect(FakeSocket.all).toHaveLength(2);
    FakeSocket.all[1]!.drop();                  // → 2 s
    vi.advanceTimersByTime(2000); expect(FakeSocket.all).toHaveLength(3);
    FakeSocket.all[2]!.open();
    FakeSocket.all[2]!.drop();                  // after success → 1 s again
    vi.advanceTimersByTime(1000); expect(FakeSocket.all).toHaveLength(4);
  });

  it("gives up an opening stuck for more than 8 s", () => {
    const { c } = make();
    c.start();
    vi.advanceTimersByTime(8000);
    expect(FakeSocket.all[0]!.readyState).toBe(3);
    vi.advanceTimersByTime(1000);
    expect(FakeSocket.all).toHaveLength(2);
  });

  it("pings every 15 s and restarts a silent connection", () => {
    const { c } = make();
    c.start();
    const s = FakeSocket.all[0]!;
    s.open();
    vi.advanceTimersByTime(15000);
    expect(s.sent).toContain("ping");
    // no message for more than 45 s → reconnection (detected at the next check, ≤ 60 s)
    vi.advanceTimersByTime(46000);
    expect(FakeSocket.all.length).toBeGreaterThan(1);
  });

  it("ignores the events of an old socket", () => {
    const { c, frames } = make();
    c.start();
    const old = FakeSocket.all[0]!;
    c.reconnectNow();
    const fresh = FakeSocket.all[1]!;
    fresh.open();
    old.receive("ATC: stale");
    expect(frames).toEqual([]);
  });

  it("stop() stops everything", () => {
    const { c } = make();
    c.start();
    c.stop();
    vi.advanceTimersByTime(60000);
    expect(FakeSocket.all).toHaveLength(1);
  });
});
