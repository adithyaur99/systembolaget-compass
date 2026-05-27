import Combine
import CoreLocation
import Foundation

final class LocationService: NSObject, ObservableObject {
    @Published private(set) var location: CLLocation?
    @Published private(set) var heading: CLHeading?
    @Published private(set) var authorizationStatus: CLAuthorizationStatus
    @Published private(set) var errorMessage: String?

    private let manager: CLLocationManager

    override init() {
        let manager = CLLocationManager()
        self.manager = manager
        authorizationStatus = manager.authorizationStatus
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
        manager.distanceFilter = 4
        manager.headingFilter = 1
        manager.activityType = .otherNavigation
    }

    var headingDegrees: CLLocationDirection? {
        guard let heading else { return nil }
        let degrees = heading.trueHeading > 0 ? heading.trueHeading : heading.magneticHeading
        return degrees >= 0 ? degrees : nil
    }

    func start() {
        errorMessage = nil

        switch manager.authorizationStatus {
        case .notDetermined:
            manager.requestWhenInUseAuthorization()
        case .authorizedAlways, .authorizedWhenInUse:
            startSensors()
        case .denied, .restricted:
            errorMessage = "Enable location in Settings"
        @unknown default:
            errorMessage = "Location unavailable"
        }
    }

    private func startSensors() {
        manager.startUpdatingLocation()

        if CLLocationManager.headingAvailable() {
            manager.startUpdatingHeading()
        }
    }
}

extension LocationService: CLLocationManagerDelegate {
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        DispatchQueue.main.async {
            self.authorizationStatus = manager.authorizationStatus

            switch manager.authorizationStatus {
            case .authorizedAlways, .authorizedWhenInUse:
                self.errorMessage = nil
                self.startSensors()
            case .denied, .restricted:
                self.errorMessage = "Enable location in Settings"
            case .notDetermined:
                break
            @unknown default:
                self.errorMessage = "Location unavailable"
            }
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let newest = locations.last else { return }

        DispatchQueue.main.async {
            self.location = newest
            self.errorMessage = nil
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateHeading newHeading: CLHeading) {
        DispatchQueue.main.async {
            self.heading = newHeading
        }
    }

    func locationManagerShouldDisplayHeadingCalibration(_ manager: CLLocationManager) -> Bool {
        true
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        DispatchQueue.main.async {
            if let locationError = error as? CLError, locationError.code == .denied {
                self.errorMessage = "Enable location in Settings"
            } else {
                self.errorMessage = "Finding GPS"
            }
        }
    }
}
