import SwiftUI

@main
struct BolagetCompassApp: App {
    var body: some Scene {
        WindowGroup {
            CompassView()
                .preferredColorScheme(.dark)
        }
    }
}
