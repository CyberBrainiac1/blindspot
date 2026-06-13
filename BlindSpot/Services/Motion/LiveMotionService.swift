//
//  LiveMotionService.swift
//  Blind Spot
//
//  CoreMotion-backed `MotionService`. Streams device-motion at ~25 Hz and
//  reports the magnitude of user acceleration (gravity already removed by
//  CoreMotion's sensor fusion) in g.
//

import Foundation
import CoreMotion

final class LiveMotionService: MotionService {

    private let manager = CMMotionManager()

    var isAvailable: Bool { manager.isDeviceMotionAvailable }

    func start(onSample: @escaping (Double) -> Void) {
        guard manager.isDeviceMotionAvailable else { return }
        manager.deviceMotionUpdateInterval = 1.0 / 25.0   // 25 Hz

        // Deliver on the main queue so the consumer can update UI state directly.
        manager.startDeviceMotionUpdates(to: .main) { motion, _ in
            guard let acc = motion?.userAcceleration else { return }
            // Magnitude of the user-acceleration vector, in g.
            let magnitude = (acc.x * acc.x + acc.y * acc.y + acc.z * acc.z).squareRoot()
            onSample(magnitude)
        }
    }

    func stop() {
        manager.stopDeviceMotionUpdates()
    }
}
