# Changelog

All notable changes to BATC EFB. Versions follow `package_version` in `package/manifest.json`.

## [Unreleased]

## [0.3.3] - 2026-10-07

### Changed
- Log: the time and the speaker sit on one line in a tab joined to the left side of each message ("21:00 ATC"),
  in 11 px type instead of the tiny two-line label. The tab has the colour of the message, is as tall as a
  one-line message and has the same width on every line, so the messages stay aligned.
- Log: exchanges between ATC and other aircraft are labelled "TFC" (was "ATC›TFC"), like the other traffic.

## 0.3.2 - 2026-10-07

### Changed
- Log: the time and the speaker form a small square label. The time is slightly smaller, the speaker
  slightly larger, and its letters are spread over the width of the time (longer names such as CPDLC
  keep their natural width).

## 0.3.1 - 2026-10-07

### Fixed
- Settings: the drop-down lists showed an empty box instead of their arrow (the "▾" character is not in
  the Roboto files shipped with the app); the arrows are now drawn. A test checks that every text of the
  app only uses characters of these fonts (the "set to" message of the frequencies used a missing arrow too).

### Changed
- Log: time and speaker form a smaller, centred two-line label, exactly as tall as a one-line message and
  centred on longer ones.

## 0.3.0 - 2026-10-07

### Changed
- Compact layout for the tablet: the header, the radio panel and the tabs took 46 % of the app,
  they now take 146 px out of 620. All the actions and all the frequencies of an airport fit on the screen.
  - One compact header: callsign, Auto respond and Auto tune switches (moved from the Actions tab),
    COM1, COM2 with the flight progress, and the clearance on one line with short labels.
  - Text tabs, with a radio exchange light on their left (off when quiet, blue when a request is sent,
    amber while it is awaited, green while transmitting) instead of the radio exchange banner.
  - Actions as a plain list; short answers (Affirm, Negative, FL060…) four per line.
  - Log as a transcript: time and speaker on the left, each message in a thin frame coloured by speaker
    (ATC amber, you blue, traffic grey, CPDLC violet).
  - Frequencies as a table with COM1 and COM2 buttons on every line.
  - Settings on one line each; compact disconnected, menu, loading screens and dialogs.
  - Text columns grow with the text size setting.
- Removed unused icons and texts; code comments inherited from the Android app now describe the EFB.
- Release notes filled in `package/manifest.json`; this changelog added.

### Fixed
- The EFB dock was drawn over the bottom of the app: the dock is now found whatever its markup,
  and the app is placed above it. Settings > About shows where the app was placed ("EFB layout").

## 0.2.4 - 2026-10-07

### Fixed
- The app icon no longer carries ~7.7 KB of C2PA metadata; `layout.json` and
  `total_package_size` match the files of the package again.

### Removed
- `Roboto-Regular.ttf`, no longer used since 0.2.3.

### Added
- `tools/strip-svg-metadata.mjs`, also used by the build to clean the SVG assets.

## 0.2.3 - 2026-10-07

### Changed
- Sharper text and icons: the page is scaled with a CSS variable (`--s`, 480 px reference
  width) instead of a CSS transform.
- Roboto Medium replaces Roboto Regular.

## 0.2.2 - 2026-10-07

### Changed
- New app icon (tablet with radio waves).

## 0.2.1 - 2026-10-07

### Changed
- New app icon.

## 0.2.0 - 2026-10-07

### Added
- The full BATC Remote interface (Preact) in a frame of the EFB app: Actions, Log,
  Frequencies, Settings, BeyondATC questions and errors, "Start a flight" menu, loading screens.
- Roboto fonts shipped with the app.

## 0.1.1 - 2026-10-07

### Changed
- Layout scaled to the width of the tablet; content placed under the EFB status bar.

## 0.1.0 - 2026-10-07

### Added
- First version: native EFB app connected to BeyondATC.

[Unreleased]: https://github.com/Proxi64/BATC-EFB/compare/v0.3.3...HEAD
[0.3.3]: https://github.com/Proxi64/BATC-EFB/releases/tag/v0.3.3
