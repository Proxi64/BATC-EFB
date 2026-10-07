import { createContext } from "preact";
import { useContext } from "preact/hooks";
import type { BatcController } from "../core/controller";

export const ControllerContext = createContext<BatcController | null>(null);

export function useCtl(): BatcController {
  const c = useContext(ControllerContext);
  if (!c) throw new Error("ControllerContext missing");
  return c;
}
