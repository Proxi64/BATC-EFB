import { describe, expect, it } from "vitest";
import { commsIndicator } from "../src/web/core/comms";

describe("radio exchange light", () => {
  it("is off when the frequency is quiet", () => {
    expect(commsIndicator("ready", "", null)).toEqual({ light: "idle", key: "ready", detail: "" });
  });

  it("shows an action sent from the app until BeyondATC reacts", () => {
    expect(commsIndicator("ready", "", "Request Taxi to Runway")).toEqual({ light: "sent", key: "sent", detail: "Request Taxi to Runway" });
  });

  it("is lit green while transmitting", () => {
    expect(commsIndicator("speaking", "Speaking", null).light).toBe("transmitting");
  });

  it("is amber while a request is queued, awaited or processed", () => {
    for (const mode of ["queued", "awaiting", "processing", "request", "some-new-mode"]) {
      expect(commsIndicator(mode, "", null).light, mode).toBe("waiting");
    }
    expect(commsIndicator("request", "Request Departure", null).detail).toBe("Request Departure");
    expect(commsIndicator("queued", "Request Queued", null).detail).toBe("");
  });

  it("pulses for traffic, with the traffic message as detail", () => {
    expect(commsIndicator("traffic", "Ryanair 32KG, climb FL370", null)).toEqual({ light: "traffic", key: "traffic", detail: "Ryanair 32KG, climb FL370" });
  });
});
