import { signal } from "@preact/signals";

/**
 * All user-facing texts of the app (English only).
 * Only characters present in the Roboto files shipped with the app (checked by tests/i18n.test.ts):
 * no arrows or triangles, which would show as empty boxes in the simulator.
 */
const en = {
  appName: "BATC EFB",
  tabActions: "Actions",
  tabLog: "Log",
  tabFreq: "Frequencies",
  settings: "Settings",
  cancel: "Cancel",
  confirm: "Confirm",
  ok: "OK",

  // connection
  connecting: "Connecting to BeyondATC…",
  reconnecting: "Reconnecting…",
  retryIn: (s: number) => `Retrying in ${s}s`,
  attempt: (n: number) => `attempt ${n}`,
  retryNow: "Retry now",
  notConnectedTitle: "BeyondATC unreachable",
  checklist: [
    "BeyondATC is running on this PC",
    "BeyondATC is up to date (local connection on port 41716)"
  ],
  status: { open: "connected", connecting: "connecting…", waiting: "retrying…", idle: "stopped" } as Record<string, string>,

  // header
  com1: "COM1",
  com2: "COM2",
  muted: "Muted",
  monitor: "Monitor",
  monitorShort: "MON",
  noStation: "No station",
  clearance: "Clearance",

  // radio exchange (light on the tab bar)
  commsStates: {
    ready: "Radio idle",
    sent: "Sent",
    traffic: "Traffic",
    speaking: "Transmitting",
    queued: "Queued",
    awaiting: "Awaiting response",
    processing: "Processing",
    request: "Request in progress"
  } as Record<string, string>,

  // actions
  noActions: "No actions available",
  sentShort: "Sent",
  autoRespond: "Auto respond",
  autoTune: "Auto tune",
  copilot: "Co-pilot",
  turnaroundTitle: "Turnaround available",
  turnaroundText: "Start the return flight from this airport.",
  turnaroundBtn: "Start turnaround",

  // log
  logEmpty: "No transmissions yet",
  show: "Show",
  showTraffic: "Traffic",
  showCpdlc: "CPDLC",
  newMessages: "New messages",
  /** Full names (tooltips). */
  sources: {
    atc: "ATC", atcTraffic: "ATC to traffic", player: "You", traffic: "Traffic", cpdlcAtc: "CPDLC ATC", cpdlcPilot: "CPDLC Pilot"
  } as Record<string, string>,
  /** Short names, in the tab of each log message (exchanges between ATC and other aircraft are all "TFC"). */
  speakers: {
    atc: "ATC", atcTraffic: "TFC", player: "YOU", traffic: "TFC", cpdlcAtc: "CPDLC", cpdlcPilot: "CPDLC"
  } as Record<string, string>,

  // frequencies
  freqEmpty: "No frequencies",
  tuneCom1: "Tune COM1",
  tuneCom2: "Tune COM2",
  refresh: "Refresh",
  center: "Center",
  vfr: "VFR services",
  enrouteSection: "En route",
  depShort: "DEP",
  arrShort: "ARR",
  rwyShort: "RWY",
  tuned: (f: string, com: string) => `${com} set to ${f}`,

  // lifecycle
  menuTitle: "Start a flight",
  menuLogin: "Log into BeyondATC on the PC to start a flight.",
  planSimbrief: "SimBrief plan",
  planWorldMap: "MSFS world map",
  loading: "Loading flight…",
  errorTitle: "Error",
  warningTitle: "Warning",
  quit: "Quit to main menu",
  quitConfirm: "Quit the current flight and return to the BeyondATC menu?",

  // settings
  secConnection: "Connection",
  secDisplay: "Display",
  secAudio: "Audio",
  secVoices: "Voices",
  secTraffic: "AI traffic",
  secFlight: "Flight",
  secAbout: "About",
  disclaimer: "BATC EFB is an independent community tool. It is unsupported and is not an official BeyondATC tool. Please do not contact BeyondATC support about it.",
  textSize: "Text size",
  voiceVolume: "Voice volume",
  uiSounds: "UI sounds",
  dynamicVoice: "Dynamic auto respond voice",
  dynamicGender: "Dynamic voice gender",
  manualVoice: "Auto respond voice",
  premiumChars: "Premium characters",
  controllerVoice: "Controller voice",
  trafficVoice: "Traffic voice",
  trafficOn: "Traffic on",
  parked: "Parked density",
  departures: "Departures density",
  arrivals: "Arrivals density",
  enroute: "Enroute density",
  liveTraffic: "Navigraph live traffic",
  liveTrafficLocked: "Requires a linked Navigraph Ultimate subscription",
  taxiArrows: "Show taxi arrows",
  sample: "Play",
  startError: "BATC EFB could not start",
  settingsWaiting: "Waiting for BeyondATC settings…",
  appVersion: "App version",
  protocol: "BeyondATC protocol",
  protocolMismatch: (v: string) => `BeyondATC reports version ${v}: some features may differ.`,
  unknownMsgs: "Unrecognised messages",
  efbLayout: "EFB layout",
  efbLayoutValue: (top: number, bottom: number, dock: string) => `top ${top} px · bottom ${bottom} px · dock: ${dock}`,
  none: "None"
};

export type Dict = typeof en;

/** Kept as a signal so components keep the same `dict.value` access pattern. */
export const dict = signal<Dict>(en);
