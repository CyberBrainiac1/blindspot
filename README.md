# Blind Spot — iOS

A crowd-sourced cycling safety + accessibility map. A handlebar-mounted iPhone
captures hazards along a GPS-tracked ride; the app shows a live hazard map, ride
recaps, and a crash SOS.

> **Status: foundation milestone.** A complete, navigable, on-brand app running
> entirely on **in-memory mock data**, plus first-run onboarding. No backend,
> database, networking, ML, or live sensors yet — those drop in later behind the
> repository protocols, by swapping only what `AppEnvironment` constructs. No
> view or view-model changes required.

## Stack
- SwiftUI, Swift, **iOS 17.0+** (modern `Map` API + `@Observable`).
- MapKit (native, no API key).
- MVVM-lite: SwiftUI views + `@Observable` view models.
- **Zero third-party Swift dependencies.** The Xcode project is generated from
  `project.yml` via [XcodeGen](https://github.com/yonaskolb/XcodeGen).

---

## Quickstart

```bash
./bootstrap.sh        # installs XcodeGen if needed, generates the project, opens Xcode
```

Then in Xcode: pick a simulator or your device and press **⌘R**.

`./bootstrap.sh` runs `xcodegen generate`, which produces `BlindSpot.xcodeproj`
and `Info.plist` from `project.yml`. **Both are generated artifacts and are
git-ignored** — `project.yml` is the source of truth. Re-run it any time you add
or remove files, or edit project settings:

```bash
xcodegen generate
```

### Running on a physical device
1. The project bakes in the signing **Team** and **bundle id** (`project.yml` →
   `DEVELOPMENT_TEAM`, `PRODUCT_BUNDLE_IDENTIFIER`). Change these for your own
   Apple ID if you fork.
2. Plug in the iPhone, enable **Developer Mode** (Settings → Privacy & Security),
   select it in Xcode, press **⌘R**.
3. First launch is blocked until you trust the developer: Settings → General →
   VPN & Device Management → your Apple ID → Trust.

> **Note:** `project.yml` sets `ENABLE_DEBUG_DYLIB: NO`. Xcode 16+ defaults Debug
> builds to a "debug dylib" (the main executable becomes a stub that loads a
> separate `.debug.dylib` at launch). With generated projects this can fail to
> load on a physical device and the OS **SIGKILLs the app in `dyld` before
> `main()`** (black screen → crash). Disabling it makes a self-contained binary
> that launches reliably. Do not remove this setting.

---

## Design system

Dark-mode-first, editorial "instrument panel" look.

- **Color:** coral `#EE5634` primary (`bsPrimary`), near-black surfaces, warm
  off-white ink. Semantic colors (`bsSevere` / `bsModerate` / `bsGood`) are for
  hazard data-viz only, always paired with an icon + text label (colorblind-safe).
- **Type:** **Instrument Serif** for display / titles, **JetBrains Mono** for all
  telemetry numbers, micro-labels, and buttons; SF Pro for body. Fonts are
  bundled in `BlindSpot/Resources/Fonts` and registered via `UIAppFonts`.

---

## Folder structure

```
BlindSpot/
├── App/            BlindSpotApp.swift (@main, injects AppEnvironment, forces dark mode)
├── Theme/          Color+BlindSpot, Font+BlindSpot
├── Components/     PrimaryButton, BSCard, StatTile, HazardBadge, FlagButton
├── Models/         Ride, RidePoint, RideEvent, Hazard, Profile, Enums
├── Services/       HazardRepository, RideRepository (protocols); AppEnvironment
│   └── Mock/       MockHazardRepository, MockRideRepository, SampleData
├── Features/
│   ├── Onboarding/ OnboardingView, OnboardingViewModel
│   ├── Map/        MapScreen, MapViewModel
│   ├── Record/     RecordRideView, RecordRideViewModel, CrashSOSOverlay
│   ├── Rides/      RideListView, RideRecapView (+ RideRecapViewModel), RidesViewModel
│   └── Profile/    ProfileView
├── Navigation/     RootView (onboarding ↔ tabs), RootTabView
├── Resources/      Fonts/ (Instrument Serif + JetBrains Mono)
└── Utilities/      Formatters
```

---

## The data-layer seam (how the backend drops in later)

All data flows through **protocols** (`HazardRepository`, `RideRepository`) held
by a single `@Observable` container, `AppEnvironment`, constructed in
`App/BlindSpotApp.swift`:

```swift
AppEnvironment(
    hazardRepository: MockHazardRepository(),
    rideRepository: MockRideRepository()
)
```

Swapping to a real backend means writing `SupabaseHazardRepository` /
`SupabaseRideRepository` and changing **only those two lines**. No views or view
models change.

---

## What works now
- **Onboarding** (first launch) — name, email, phone, skill level, weekly riding
  frequency; persisted locally (UserDefaults) so it only runs once. Re-trigger it
  from Profile → "Replay onboarding".
- **Map** — mock hazards around San Jose as severity-colored pins + legend.
- **Record** — simulated active ride (ticking timer, fake distance/speed), a big
  flag button (haptic + confirmation), STOP → saves & routes to recap, and a
  debug "Simulate crash" → crash-SOS countdown overlay with a mock confirmation.
- **Rides** — list of mock rides → tap → **Recap** (route polyline, stat tiles,
  editable star rating, photos placeholder).
- **Profile** — rider details + emergency contact (local), disabled sign-out.
