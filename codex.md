# Blind Spot project notes

- The user is working on the algorithm side of Blind Spot: image detection, hazard detection, and Raspberry Pi related device code.
- Scope correction from user: the Raspberry Pi side should only need GPS data. GPS should come from the iPhone app while the Raspberry Pi is connected to the iPhone hotspot.
- Preferred phone/Pi GPS flow: iPhone app gets CoreLocation fixes and sends them over the hotspot LAN to a small HTTP endpoint on the Raspberry Pi. The Pi stores/uses those latitude, longitude, accuracy, speed, heading, altitude, and timestamp values.
- Hotspot networking note: when the iPhone acts as Personal Hotspot, the Raspberry Pi is on the iPhone-created local Wi-Fi subnet, commonly in the 172.20.10.x range. Treat phone-to-Pi communication as local LAN traffic, not cellular.
- Protocol options for iPhone GPS to Pi: MQTT is the preferred robust streaming option if the Pi runs Mosquitto locally; UDP/TCP sockets are fastest but require more reliability handling; NTRIP only matters for high-precision RTK/GNSS correction workflows.
- Hardware currently available from user: an 8-LED strip with 3 wires and a regular momentary button. Assume the 3-wire LED strip is an addressable WS2812/SK6812-style strip unless labels show otherwise. Use button press to trigger photo capture.
- One-button gesture mapping: single click = manual hazard photo, double click = start/stop video recording, long press = start/stop ride. Keep gesture timing simple and reliable for hackathon use.
- Product context: handlebar-mounted Raspberry Pi capture layer with camera, GPS, IMU, manual flag button, buzzer/LED feedback, local buffering, and sync to backend.
- P0 algorithm/device scope: capture images on manual button or IMU event, log GPS at about 1 Hz, detect impact/crash from IMU thresholds, locally buffer rides/events/photos, sync when online, and run pothole/hazard detection server-side or in a batch upload flow.
- Preserve the project direction from the PRD: v1 does not need live real-time on-device object detection; reliable capture and upload plus batch YOLOv8n pothole labeling is the pragmatic hackathon target.
