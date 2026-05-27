import CoreLocation
import SwiftUI

struct CompassView: View {
    @StateObject private var locationService = LocationService()
    @State private var stores: [SystembolagetStore] = []
    @State private var dataError: String?

    private var nearest: LocatedStore? {
        guard let location = locationService.location else { return nil }
        return StoreLocator.nearest(to: location, stores: stores)
    }

    private var needleDegrees: Double {
        guard let nearest else { return 0 }

        if let heading = locationService.headingDegrees {
            return StoreLocator.normalizeDegrees(nearest.bearing - heading)
        }

        return nearest.bearing
    }

    private var distanceText: String {
        guard let nearest else { return "--" }
        return StoreLocator.formattedDistance(nearest.distance)
    }

    private var captionText: String {
        if let dataError {
            return dataError
        }

        if let nearest {
            return nearest.store.name
        }

        if let errorMessage = locationService.errorMessage {
            return errorMessage
        }

        switch locationService.authorizationStatus {
        case .denied, .restricted:
            return "Location disabled"
        case .notDetermined:
            return "Allow location"
        default:
            return "Finding nearest store"
        }
    }

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(red: 0.06, green: 0.07, blue: 0.06), Color(red: 0.01, green: 0.01, blue: 0.01)],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 34) {
                Spacer(minLength: 24)

                CompassDial(needleDegrees: needleDegrees)
                    .frame(width: 286, height: 286)
                    .accessibilityLabel("Compass")

                VStack(spacing: 8) {
                    Text(distanceText)
                        .font(.system(size: 72, weight: .semibold, design: .rounded))
                        .monospacedDigit()
                        .minimumScaleFactor(0.55)
                        .lineLimit(1)
                        .accessibilityLabel("Distance \(distanceText)")

                    Text(captionText)
                        .font(.system(.footnote, design: .rounded, weight: .medium))
                        .foregroundStyle(.white.opacity(0.52))
                        .lineLimit(1)
                        .minimumScaleFactor(0.72)
                        .padding(.horizontal, 28)
                }

                Spacer(minLength: 40)
            }
            .padding(.horizontal, 22)
        }
        .task {
            loadStores()
            locationService.start()
        }
    }

    private func loadStores() {
        do {
            stores = try StoreLocator.loadStores()
        } catch {
            dataError = "Store data unavailable"
        }
    }
}

private struct CompassDial: View {
    let needleDegrees: Double

    var body: some View {
        ZStack {
            Circle()
                .fill(Color.white.opacity(0.035))

            Circle()
                .strokeBorder(Color.white.opacity(0.12), lineWidth: 1)

            Circle()
                .strokeBorder(Color(red: 0.86, green: 0.72, blue: 0.38).opacity(0.42), lineWidth: 1)
                .padding(18)

            ForEach(0..<60, id: \.self) { index in
                TickMark(isCardinal: index % 15 == 0, isMajor: index % 5 == 0)
                    .rotationEffect(.degrees(Double(index) * 6))
            }

            Text("N")
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .foregroundStyle(Color(red: 0.95, green: 0.34, blue: 0.25))
                .offset(y: -113)

            Needle()
                .frame(width: 26, height: 184)
                .rotationEffect(.degrees(needleDegrees))
                .animation(.smooth(duration: 0.22), value: needleDegrees)

            Circle()
                .fill(Color(red: 0.86, green: 0.72, blue: 0.38))
                .frame(width: 13, height: 13)
                .shadow(color: .black.opacity(0.35), radius: 10, y: 4)
        }
    }
}

private struct TickMark: View {
    let isCardinal: Bool
    let isMajor: Bool

    var body: some View {
        Capsule()
            .fill(Color.white.opacity(isCardinal ? 0.86 : isMajor ? 0.46 : 0.22))
            .frame(width: isCardinal ? 2 : 1, height: isCardinal ? 18 : isMajor ? 12 : 7)
            .offset(y: -126)
    }
}

private struct Needle: View {
    var body: some View {
        ZStack {
            NeedleHalf(pointsUp: true)
                .fill(
                    LinearGradient(
                        colors: [Color(red: 1.0, green: 0.43, blue: 0.34), Color(red: 0.64, green: 0.12, blue: 0.09)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )

            NeedleHalf(pointsUp: false)
                .fill(
                    LinearGradient(
                        colors: [Color.white.opacity(0.95), Color.white.opacity(0.34)],
                        startPoint: .bottom,
                        endPoint: .top
                    )
                )
        }
        .shadow(color: .black.opacity(0.32), radius: 16, y: 8)
    }
}

private struct NeedleHalf: Shape {
    let pointsUp: Bool

    func path(in rect: CGRect) -> Path {
        var path = Path()
        let midX = rect.midX
        let centerY = rect.midY

        if pointsUp {
            path.move(to: CGPoint(x: midX, y: rect.minY))
            path.addLine(to: CGPoint(x: rect.maxX, y: centerY))
            path.addLine(to: CGPoint(x: midX, y: centerY + 12))
            path.addLine(to: CGPoint(x: rect.minX, y: centerY))
        } else {
            path.move(to: CGPoint(x: midX, y: rect.maxY))
            path.addLine(to: CGPoint(x: rect.minX, y: centerY))
            path.addLine(to: CGPoint(x: midX, y: centerY - 12))
            path.addLine(to: CGPoint(x: rect.maxX, y: centerY))
        }

        path.closeSubpath()
        return path
    }
}

#Preview {
    CompassView()
}
