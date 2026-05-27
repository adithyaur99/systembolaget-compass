# Bolaget Compass

A small PWA that points to the nearest Systembolaget store in Sweden.

## Why web app first

An iPhone web app can use GPS from Safari or a Home Screen install. Compass heading also works on iOS after a user gesture, but the page must run from `https://` or `localhost`. This avoids Xcode signing, App Store review, and native app setup while still giving the core experience.

## Run locally

```bash
npm start
```

Open [http://localhost:5173](http://localhost:5173). For a desktop demo without GPS, use a query string:

```text
http://localhost:5173/?lat=59.33022&lng=18.05920
```

## Store data

The app uses `data/systembolaget-stores.json`, filtered to real stores only (`isAgent == false`). The current file contains 451 stores.

Source: [AlexGustafsson/systembolaget-api-data](https://github.com/AlexGustafsson/systembolaget-api-data), generated from its `data/stores.json` mirror. The included snapshot source timestamp is `2025-11-02T16:06:00Z`.

Refresh the local store file with:

```bash
./scripts/update-stores.sh
```

## Test

```bash
npm test
```

## Deploy

The app is static. It can be served directly from GitHub Pages using the `main` branch and `/` root folder.

This is unofficial and not affiliated with Systembolaget AB.
