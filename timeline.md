# Blind Spot Build Timeline

Generated: 2026-06-13 23:55:03 -0700

This is a public-safe timeline of the Blind Spot hackathon build. It combines the pasted chat transcript, local project notes, verified Pi/device context, and Git history across every fetched branch.

Secrets, credentials, private keys, and local-only deployment details are intentionally omitted.

## Timestamp Rules

| Marker | Meaning |
|---|---|
| `git-second` | Exact commit timestamp from `git log --all --date=iso-local`. |
| `chat-minute` | Exact timestamp visible in the pasted chat transcript. The transcript only records minutes, not seconds. |
| `session-checkpoint` | Exact timestamp from a verified command/log/checkpoint in the working session, or a bounded window anchored by surrounding exact events. |
| `local-commit` | Exact timestamp from local Git history that was not pushed. |

## Sources Used

| Source | What it contributed |
|---|---|
| Pasted chat transcript | Initial PRD, user scope changes, iPhone developer prompts, secret-safety request, and PRD photos/buttons interpretation. |
| `codex.md` local project notes | Pi SSH/GPIO/LED/camera/Supabase/BLE/service context and final demo state. |
| Git history across fetched branches | Exact commit timestamps, branch history, and merge order for `main`, `ronak-app`, and `pranav-algorithm-camera`. |

## Section S1: Product Scope And Initial Direction

| Event | Timestamp | Precision | Source | Event detail |
|---|---|---|---|---|
| `S1-E01` | 2026-06-13 11:05:53 -0700 | git-second | Git `4adae94` | Repository started publicly with `README.md`. |
| `S1-E02` | 2026-06-13 11:07 -0700 | chat-minute | Pasted chat | User linked `pranav-algorithm-camera` and defined their role: algorithm side, image detection, and Raspberry Pi-related work. |
| `S1-E03` | 2026-06-13 11:07 -0700 | chat-minute | Pasted chat | PRD established the product: bike-mounted capture layer, live hazard/accessibility map, manual/automatic hazard capture, photo detection, crash SOS, recap, and safety routing roadmap. |
| `S1-E04` | 2026-06-13 11:12 -0700 | chat-minute | Pasted chat result | First implementation pass completed: Pi/mock capture loop, SQLite ride/event/photo buffering, IMU impact/crash logic, GPS/camera mocks plus Pi-ready adapters, and batch hazard detector CLI. Verification created a mock ride, GPS points, impact event, photo, and mock pothole label. |

## Section S2: Phone GPS Pivot And Protocol Decisions

| Event | Timestamp | Precision | Source | Event detail |
|---|---|---|---|---|
| `S2-E01` | 2026-06-13 11:12 -0700 | chat-minute | Pasted chat | User corrected scope: the Pi should connect to the iPhone hotspot and receive GPS data from the iPhone. |
| `S2-E02` | 2026-06-13 11:43 -0700 | chat-minute | Pasted chat result | First iPhone developer prompt was produced: iPhone app uses CoreLocation and sends 1 Hz GPS JSON over the hotspot LAN to the Pi. |
| `S2-E03` | 2026-06-13 11:44 -0700 | chat-minute | Pasted chat | User supplied protocol options: MQTT, UDP/TCP sockets, and NTRIP. |
| `S2-E04` | 2026-06-13 11:45 -0700 | chat-minute | Pasted chat result | MQTT over hotspot was selected as the best default; HTTP POST was kept as fallback; UDP and NTRIP were deprioritized for the hackathon build. |

## Section S3: Secret Safety And PRD Button/Photo Contract

| Event | Timestamp | Precision | Source | Event detail |
|---|---|---|---|---|
| `S3-E01` | 2026-06-13 11:45 -0700 | chat-minute | Pasted chat | User explicitly warned not to publish secrets to GitHub. |
| `S3-E02` | 2026-06-13 11:45 -0700 | chat-minute | Pasted chat result | Repo was scanned for common secret patterns; `.gitignore` was hardened for `.env`, local data, keys, credentials, mobile profiles, SQLite databases, and Python cache output. |
| `S3-E03` | 2026-06-13 11:46 -0700 | chat-minute | Pasted chat | User asked what the PRD says about photos and buttons. |
| `S3-E04` | 2026-06-13 12:02 -0700 | chat-minute | Pasted chat result | PRD button/photo contract was summarized: one button captures a frame and geo-tagged event within 1 second; photos attach to ride/event/location/time; photos feed local buffering, sync, privacy blurring, detection, map pins, and recap. |

## Section S4: App, Computer Vision, And Pi Foundation Commits

| Event | Timestamp | Precision | Source | Event detail |
|---|---|---|---|---|
| `S4-E01` | 2026-06-13 11:24:33 -0700 | git-second | Git `15f11d5` | App history began with `chore(app): initial commit`. |
| `S4-E02` | 2026-06-13 12:14:06 -0700 | git-second | Git `3d4a6e9` | Pi capture controls landed in Git. |
| `S4-E03` | 2026-06-13 12:22:18 -0700 | git-second | Git `514f055` | `ronak-app` added app shell, mock data, and onboarding. |
| `S4-E04` | 2026-06-13 12:23:35 -0700 | git-second | Git `cc2a01f` | `ronak-app` merged remote app work. |
| `S4-E05` | 2026-06-13 12:23:36 -0700 | git-second | Git `ee81c9d` | Computer vision module landed. |
| `S4-E06` | 2026-06-13 12:26:38 -0700 | git-second | Git `aac3735` | Local Codex notes were removed from tracking. |
| `S4-E07` | 2026-06-13 12:57:58 -0700 | git-second | Git `cba2344` | Added guide for obtaining the Ultra Fast Lane Detection model. |
| `S4-E08` | 2026-06-13 13:18:15 -0700 | git-second | Git `35fd998` | LED status display and lane detector work landed. |

## Section S5: Hardware Bring-Up And Lane Model Testing

| Event | Timestamp | Precision | Source | Event detail |
|---|---|---|---|---|
| `S5-E01` | 2026-06-13 13:18:15 -0700 to 2026-06-13 15:45:33 -0700 | session-checkpoint | Session notes bounded by Git events | Raspberry Pi 4B hardware work focused on GPIO17 button wiring, GPIO18 LED data, and the 8-pixel addressable strip. |
| `S5-E02` | 2026-06-13 13:18:15 -0700 to 2026-06-13 15:45:33 -0700 | session-checkpoint | Session notes bounded by Git events | LED tests ran through direct GPIO and NeoPixel paths. Software-side commands completed, but the physical strip did not visibly light. |
| `S5-E03` | 2026-06-13 13:18:15 -0700 to 2026-06-13 15:45:33 -0700 | session-checkpoint | Session notes bounded by Git events | GPIO17 button initially behaved as if permanently pressed, pointing to wrong terminal pair, physical-pin confusion, or a short. |
| `S5-E04` | 2026-06-13 13:18:15 -0700 to 2026-06-13 15:45:33 -0700 | session-checkpoint | Session notes bounded by Git events | One-button contract was finalized: single press = photo, double press = video start/stop, long press = ride start/stop. |
| `S5-E05` | 2026-06-13 13:18:15 -0700 to 2026-06-13 15:45:33 -0700 | session-checkpoint | Session notes bounded by Git events | Existing lane neural network was preserved; TuSimple ONNX path was corrected; model metadata and image outputs were verified. |
| `S5-E06` | 2026-06-13 15:45:33 -0700 | git-second | Git `259a396` | App branch added Firebase auth, Supabase data layer, live GPS/IMU flow, and ride favorites. |

## Section S6: Bike Accessibility, Supabase, And Ride/Photo Data Model

| Event | Timestamp | Precision | Source | Event detail |
|---|---|---|---|---|
| `S6-E01` | 2026-06-13 16:11:57 -0700 | git-second | Git `efe1a82` | Pi branch added ride uploads and bike-accessibility analysis. |
| `S6-E02` | 2026-06-13 16:12:39 -0700 | git-second | Git `b16b8af` | Added automated-photo table configuration. |
| `S6-E03` | 2026-06-13 16:21:05 -0700 | git-second | Git `20f65a5` | Automated photos were routed to `automated_photos`; manual rider photos stayed in `photos`; uploads required a real ride ID. |
| `S6-E04` | 2026-06-13 16:37:40 -0700 | git-second | Git `e43f09f` | Pi BLE ride control was added, initially with Pi as BLE peripheral and iPhone as central. |
| `S6-E05` | 2026-06-13 16:44:17 -0700 | git-second | Git `1ee73d2` | Fixed editable package discovery after Pi install hit setuptools discovery errors. |
| `S6-E06` | 2026-06-13 16:54:48 -0700 | git-second | Git `9fa3cb2` | Added public-safe "ride summary service" path for post-ride AI summaries and recap data. |
| `S6-E07` | 2026-06-13 16:54:48 -0700 to 2026-06-13 18:17:35 -0700 | session-checkpoint | Session notes bounded by Git events | Supabase work connected rides, photos, automated photos, AI summary rows, storage uploads, and ride/photo ID linkage. |
| `S6-E08` | 2026-06-13 18:17:35 -0700 | git-second | Git `48602eb` | App branch added BLE Pi control, AI summary/photos in recap, Pi data merge, pothole email, and a location fix. |

## Section S7: Demo Integration, Main Merges, And Pi Service Fixes

| Event | Timestamp | Precision | Source | Event detail |
|---|---|---|---|---|
| `S7-E01` | 2026-06-13 18:17:35 -0700 to 2026-06-13 19:10:14 -0700 | session-checkpoint | Session notes bounded by Git events | Pi networking was unstable over IPv4/hostname routes; IPv6 link-local SSH became the reliable control path. |
| `S7-E02` | 2026-06-13 19:10:14 -0700 | git-second | Git `eb11101` | Added USB serial JSON-lines demo bridge for cable status/events and optional gesture triggering. |
| `S7-E03` | 2026-06-13 19:10:54 -0700 | git-second | Git `0a1c069` | App branch added hazard colors, tap-to-add/report/delete, fall detection SOS, and contact picker work. |
| `S7-E04` | 2026-06-13 19:12:52 -0700 | git-second | Git `24a1b72` | Merged `pranav-algorithm-camera` into `main`. |
| `S7-E05` | 2026-06-13 19:13:55 -0700 | git-second | Git `4832a54` | Merged `ronak-app` into `main`. |
| `S7-E06` | 2026-06-13 19:17:03 -0700 | git-second | Git `236ae32` | Main branch fixed dashboard tooltip provider prop issue. |
| `S7-E07` | 2026-06-13 19:22:50 -0700 | git-second | Git `c911f71` | LED strip output was made optional. |
| `S7-E08` | 2026-06-13 19:24:53 -0700 | git-second | Git `368139a` | Fixed serial photo event fields. |
| `S7-E09` | 2026-06-13 19:29:37 -0700 | git-second | Git `2e4d691` | Added Pi camera startup retry/lazy behavior. |
| `S7-E10` | 2026-06-13 19:32:05 -0700 | git-second | Git `4dfa406` | Adjusted service startup ordering so service starts before camera capture is required. |

## Section S8: Final Judging BLE State

| Event | Timestamp | Precision | Source | Event detail |
|---|---|---|---|---|
| `S8-E01` | 2026-06-13 19:51:07 -0700 | session-checkpoint | Pi service log | `blindspot-button.service` was active with BLE enabled and LED disabled. |
| `S8-E02` | 2026-06-13 19:51:07 -0700 | session-checkpoint | Pi Bluetooth state | Pi Bluetooth was powered on and advertising as `BlindSpot-Pi`. |
| `S8-E03` | 2026-06-13 19:51:07 -0700 to 2026-06-13 23:47:13 -0700 | session-checkpoint | Session notes | Judging path changed: USB/cable stayed power/debug, LED was scrapped, and BLE became the ride start/stop path. |
| `S8-E04` | 2026-06-13 23:47:13 -0700 | session-checkpoint | BLE scan/verification | iPhone app was found advertising as BLE peripheral named `Blind Spot`, opposite of the first Pi BLE role. |
| `S8-E05` | 2026-06-13 23:47:13 -0700 | session-checkpoint | Pi deployment verification | Pi central/client BLE support was added locally, deployed to the Pi, and configured for the phone-side BLE signal. |
| `S8-E06` | 2026-06-13 23:47:13 -0700 | session-checkpoint | BLE smoke test | Pi-to-iPhone BLE `ping` write succeeded, proving the Pi could reach the app Bluetooth service. |
| `S8-E07` | 2026-06-13 23:48:47 -0700 | session-checkpoint | Timeline draft | First local `timeline.md` draft was created on `main`; it was not pushed. |
| `S8-E08` | 2026-06-13 23:50:15 -0700 | session-checkpoint | Timeline rewrite | Timeline was rewritten to include actual chat history, project notes, and all fetched branch history. |
| `S8-E09` | 2026-06-13 23:55:03 -0700 | session-checkpoint | Current update | Timeline was restructured with section-level event markers and explicit timestamps. |

## Main Issues And Resolutions

| Issue marker | First timestamp | Issue | Resolution |
|---|---|---|---|
| `I01` | 2026-06-13 11:07 -0700 | Product scope started broad: GPS, camera, IMU, LED/buzzer, local buffering, sync, CV, map, SOS, and recap. | Narrowed around the hackathon loop: button/photo/ride ID, Supabase upload, bike accessibility analysis, app map/recap/SOS, and BLE control. |
| `I02` | 2026-06-13 11:12 -0700 | GPS ownership changed from possible Pi GPS module to iPhone GPS over hotspot. | Final split: iPhone owns GPS/route/session UI; Pi owns button/camera/local buffering/Supabase writes and post-ride summary writes. |
| `I03` | 2026-06-13 11:44 -0700 | Communication protocol changed across HTTP, MQTT, UDP, NTRIP, Bluetooth, and cable/COM. | MQTT was recommended for GPS streaming; final ride control used BLE because the phone app exposed a BLE service. |
| `I04` | 2026-06-13 11:45 -0700 | Secret leakage risk. | `.gitignore` was hardened; `codex.md` and `.env` stayed ignored; this timeline omits credentials and private keys. |
| `I05` | 2026-06-13 11:46 -0700 | PRD photo/button behavior needed clarity. | Clarified one-button photo/event behavior and photo linkage to ride/event/location/time. |
| `I06` | 2026-06-13 13:18:15 -0700 | LED strip did not visibly respond. | LED was made optional and then disabled for final demo. |
| `I07` | 2026-06-13 13:18:15 -0700 | GPIO17 button initially looked permanently pressed. | Clarified BCM GPIO17 / physical pin 11 to GND with pull-up and implemented one-button gestures. |
| `I08` | 2026-06-13 13:18:15 -0700 | Generic lane detection was not enough for bike accessibility. | Analysis shifted to green bike paint, bike symbols, lane type, blocked lanes, rough pavement, and hazards. |
| `I09` | 2026-06-13 16:21:05 -0700 | Manual and machine photos needed different tables. | Manual photos go to `photos`; automatic/machine photos go to `automated_photos`; both require a real `ride_id`. |
| `I10` | 2026-06-13 16:44:17 -0700 | Pi editable install failed because setuptools found multiple top-level packages. | Explicit package discovery was added in `pyproject.toml`. |
| `I11` | 2026-06-13 18:17:35 -0700 | Pi networking and SSH were unreliable across Wi-Fi/hotspot/cable attempts. | IPv6 link-local SSH was used when available; SD boot/service setup was adjusted. |
| `I12` | 2026-06-13 19:29:37 -0700 | Camera availability was unreliable at service startup. | Lazy/retry camera startup kept the service alive. |
| `I13` | 2026-06-13 23:47:13 -0700 | BLE roles were mismatched. | Pi central/client mode was added locally while preserving original Pi-peripheral mode; Pi-to-phone BLE write was verified. |
| `I14` | 2026-06-13 23:48:47 -0700 | GitHub publishing boundary changed after earlier pushes. | No later changes were pushed; timeline remains local on `main` unless explicitly pushed. |

## Commit Coverage Across All Fetched Branches

| Event | Commit | Timestamp | Precision | Branch/ref context | Summary |
|---|---|---|---|---|---|
| `C01` | `4adae94` | 2026-06-13 11:05:53 -0700 | git-second | shared base | Create README.md |
| `C02` | `15f11d5` | 2026-06-13 11:24:33 -0700 | git-second | app history | chore(app): initial commit |
| `C03` | `3d4a6e9` | 2026-06-13 12:14:06 -0700 | git-second | `pranav-algorithm-camera` | Add Raspberry Pi capture controls |
| `C04` | `514f055` | 2026-06-13 12:22:18 -0700 | git-second | `ronak-app` | Blind Spot foundation: app shell on mock data + onboarding |
| `C05` | `cc2a01f` | 2026-06-13 12:23:35 -0700 | git-second | `ronak-app` | Merge remote-tracking branch `origin/ronak-app` into `ronak-app` |
| `C06` | `ee81c9d` | 2026-06-13 12:23:36 -0700 | git-second | app/CV history | feat: add computer vision module |
| `C07` | `aac3735` | 2026-06-13 12:26:38 -0700 | git-second | `pranav-algorithm-camera` | Stop tracking local Codex notes |
| `C08` | `cba2344` | 2026-06-13 12:57:58 -0700 | git-second | app/CV history | feat: add guide for obtaining ultrafastlanedetection model |
| `C09` | `35fd998` | 2026-06-13 13:18:15 -0700 | git-second | `pranav-algorithm-camera` | Add LED status display and lane detector |
| `C10` | `259a396` | 2026-06-13 15:45:33 -0700 | git-second | `ronak-app` | Add Firebase auth, Supabase data layer, live GPS/IMU, and ride favorites |
| `C11` | `efe1a82` | 2026-06-13 16:11:57 -0700 | git-second | `pranav-algorithm-camera` | Add ride uploads and bike accessibility analysis |
| `C12` | `b16b8af` | 2026-06-13 16:12:39 -0700 | git-second | `pranav-algorithm-camera` | Add automated photos table config |
| `C13` | `20f65a5` | 2026-06-13 16:21:05 -0700 | git-second | `pranav-algorithm-camera` | Route automated photos to separate table |
| `C14` | `e43f09f` | 2026-06-13 16:37:40 -0700 | git-second | `pranav-algorithm-camera` | Add Pi BLE ride control |
| `C15` | `1ee73d2` | 2026-06-13 16:44:17 -0700 | git-second | `pranav-algorithm-camera` | Fix editable package discovery |
| `C16` | `9fa3cb2` | 2026-06-13 16:54:48 -0700 | git-second | `pranav-algorithm-camera` | Add ride summary service |
| `C17` | `48602eb` | 2026-06-13 18:17:35 -0700 | git-second | `ronak-app` | BLE Pi control, AI summary + photos in recap, Pi data merge, pothole email, location fix |
| `C18` | `eb11101` | 2026-06-13 19:10:14 -0700 | git-second | `pranav-algorithm-camera` | Add USB serial demo bridge |
| `C19` | `0a1c069` | 2026-06-13 19:10:54 -0700 | git-second | `ronak-app` | Hazard colors + tap-to-add/report/delete, fall detection SOS, contact picker |
| `C20` | `24a1b72` | 2026-06-13 19:12:52 -0700 | git-second | `main` | Merge branch `pranav-algorithm-camera` into `main` |
| `C21` | `4832a54` | 2026-06-13 19:13:55 -0700 | git-second | `main` | Merge branch `ronak-app` into `main` |
| `C22` | `236ae32` | 2026-06-13 19:17:03 -0700 | git-second | `origin/main` | Fix dashboard tooltip provider prop |
| `C23` | `c911f71` | 2026-06-13 19:22:50 -0700 | git-second | `pranav-algorithm-camera` | Make LED strip optional |
| `C24` | `368139a` | 2026-06-13 19:24:53 -0700 | git-second | `pranav-algorithm-camera` | Fix serial photo event fields |
| `C25` | `2e4d691` | 2026-06-13 19:29:37 -0700 | git-second | `pranav-algorithm-camera` | Retry Pi camera startup |
| `C26` | `4dfa406` | 2026-06-13 19:32:05 -0700 | git-second | `origin/pranav-algorithm-camera` | Start service before camera capture |

## Final Demo State At Last Verification

| State marker | Timestamp | State |
|---|---|---|
| `F01` | 2026-06-13 23:47:13 -0700 | Pi button service active. |
| `F02` | 2026-06-13 23:47:13 -0700 | LED path disabled. |
| `F03` | 2026-06-13 23:47:13 -0700 | iPhone app advertising Bluetooth as `Blind Spot`. |
| `F04` | 2026-06-13 23:47:13 -0700 | Pi configured as BLE central/client for phone-side signal. |
| `F05` | 2026-06-13 23:47:13 -0700 | Single press captures manual photo. |
| `F06` | 2026-06-13 23:47:13 -0700 | Double press starts/stops video. |
| `F07` | 2026-06-13 23:47:13 -0700 | Long press starts/stops ride through phone BLE service. |
| `F08` | 2026-06-13 23:47:13 -0700 | Manual photos attach only to an active ride ID. |
| `F09` | 2026-06-13 23:47:13 -0700 | Automated/machine photos go to `automated_photos`, not `photos`. |
| `F10` | 2026-06-13 23:47:13 -0700 | Last BLE smoke test succeeded with a Pi-to-phone write. |
