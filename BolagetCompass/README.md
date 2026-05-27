# Bolaget Compass iOS

Native SwiftUI version of Bolaget Compass.

Open `BolagetCompass.xcodeproj` in Xcode, choose an iPhone target, and run.

The app:

- Requests When In Use location permission on launch.
- Uses live GPS updates and iPhone heading updates through Core Location.
- Reads the bundled `systembolaget-stores.json` data file from the repo-level `data/` folder.
- Shows only the compass, distance, and a small nearest-store/status caption.

The bundle identifier is `com.adithyaur99.BolagetCompass`.
