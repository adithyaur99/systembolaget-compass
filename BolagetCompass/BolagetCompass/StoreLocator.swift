import CoreLocation
import Foundation

struct SystembolagetStore: Decodable, Identifiable {
    let id: String
    let name: String
    let address: String
    let city: String
    let county: String
    let lat: Double
    let lng: Double

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: lat, longitude: lng)
    }
}

struct LocatedStore {
    let store: SystembolagetStore
    let distance: CLLocationDistance
    let bearing: CLLocationDirection
}

enum StoreLocator {
    private struct StoreEnvelope: Decodable {
        let stores: [SystembolagetStore]
    }

    static func loadStores() throws -> [SystembolagetStore] {
        guard let url = Bundle.main.url(forResource: "systembolaget-stores", withExtension: "json") else {
            throw StoreLocatorError.missingDataFile
        }

        let data = try Data(contentsOf: url)
        return try JSONDecoder().decode(StoreEnvelope.self, from: data).stores
    }

    static func nearest(to location: CLLocation, stores: [SystembolagetStore]) -> LocatedStore? {
        stores
            .map { store in
                let storeLocation = CLLocation(latitude: store.lat, longitude: store.lng)
                return LocatedStore(
                    store: store,
                    distance: location.distance(from: storeLocation),
                    bearing: bearing(from: location.coordinate, to: store.coordinate)
                )
            }
            .min { $0.distance < $1.distance }
    }

    static func formattedDistance(_ distance: CLLocationDistance) -> String {
        if distance < 950 {
            return "\(Int(distance.rounded())) m"
        }

        if distance < 10_000 {
            return String(format: "%.1f km", distance / 1_000)
        }

        return "\(Int((distance / 1_000).rounded())) km"
    }

    static func bearing(from origin: CLLocationCoordinate2D, to destination: CLLocationCoordinate2D) -> CLLocationDirection {
        let lat1 = origin.latitude.radians
        let lat2 = destination.latitude.radians
        let deltaLongitude = (destination.longitude - origin.longitude).radians
        let y = sin(deltaLongitude) * cos(lat2)
        let x = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(deltaLongitude)

        return normalizeDegrees(atan2(y, x).degrees)
    }

    static func normalizeDegrees(_ degrees: CLLocationDirection) -> CLLocationDirection {
        let remainder = degrees.truncatingRemainder(dividingBy: 360)
        return remainder >= 0 ? remainder : remainder + 360
    }
}

enum StoreLocatorError: Error {
    case missingDataFile
}

private extension Double {
    var radians: Double { self * .pi / 180 }
    var degrees: Double { self * 180 / .pi }
}
