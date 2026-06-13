//
//  MotionService.swift
//  Blind Spot
//
//  The seam for the device IMU (accelerometer/gyro via CoreMotion). Used during
//  a ride to capture motion and detect impacts/crashes. Delivers the
//  user-acceleration magnitude (in g, gravity removed) at the sensor rate.
//

import Foundation

protocol MotionService: AnyObject {
    var isAvailable: Bool { get }

    /// Start IMU updates. `onSample` receives the user-acceleration magnitude in
    /// g (≈0 at rest, spikes on bumps/impacts), delivered on the main thread.
    func start(onSample: @escaping (Double) -> Void)
    func stop()
}
