# Kakao Map Four-Stage Marker Design

## Goal

Prevent map clutter while progressively revealing useful listing information across four zoom stages.

## Behavior

- Level `5` and above groups listings by supported dong and displays only the area name and listing count.
- Level `4` keeps dong grouping and displays the dong name, listing count, and nearest campus gate walking estimate.
- Level `3` groups nearby buildings into broad blocks and displays the nearest campus gate walking estimate and lowest monthly rent.
- Level `2` and below displays one price marker per building. Multiple listings in one building are summarized in one marker.
- Supported areas are `전농동`, `답십리동`, `청량리동`, `회기동`, `휘경동`, `이문동`, `제기동`, `용두동`, `신설동`, `마장동`, `사근동`, `행당동`, `안암동`, `종암동`, `면목동`, `숭인동`.
- Dong labels stay inside the marker rectangle so they remain legible over Kakao map labels.
- Hovering a dong marker previews its legal-dong boundary with a translucent blue fill and no outline. The preview disappears on mouse leave.
- Legal-dong polygons are bundled from the JUSO 2015 Seoul neighborhood GeoJSON published by the `southkorea/seoul-maps` project (Apache-2.0, sourced from Seoul open data). Anam-dong combines Anam-dong 1-ga through 5-ga.
- Listings without an area token use the existing coordinate-distance grouping without making an additional geocoding request.
- Gate estimates compare the main gate (`37.583698, 127.053856`), rear gate (`37.585197, 127.060951`), and side gate (`37.5861, 127.0570`) using straight-line distance and an 80m/min walking speed.
- Clicking area stages centers the marker and advances one stage: `5 -> 4 -> 3`.
- Clicking a block summary at level `3`, or any building price marker below it, opens `BuildingListingsPanel` without another zoom.
- Only clicking a building price marker passes its listings to `onSelectBuilding`, opening `BuildingListingsPanel`.
- Selecting an item in the panel continues to open the existing listing detail view.

## Data Flow

- Zoom changes regroup the listings already held by `KakaoMap` and never request listing data.
- Map dragging requests data only after the existing center-distance threshold is exceeded.
- The current cluster layer remains visible while new listing coordinates are resolved.
- A prepared cluster layer replaces the previous layer only after coordinate resolution completes.
- If a non-empty response yields no valid coordinates, the current cluster layer remains visible.
- While listings load, the current marker layer stays visible with a centered loading status. A completed empty result uses a distinct empty-state message.

## Grouping

- Listings first group by `buildingId`, or by exact coordinates when no building ID exists.
- At levels `5` and `4`, building groups with the same parsed area token form one overview cluster.
- At level `3`, nearby building groups cluster by coordinate distance using threshold `0.0015`.
- At level `2` and below, existing building groups are preserved and are not merged by distance.
- Cluster position is the running average of its building coordinates.

## Tests

- Every zoom level resolves to the expected four-stage display mode.
- Initial overview clusters group listings with the same area token and render the area label and count only.
- Overview labels render the dong name and count inside one rectangle.
- Dong marker hover renders the corresponding blue boundary preview; clicking clears it and only advances the zoom stage.
- Loading and completed-empty states render different status messages.
- Area and block summaries render the expected lowest monthly rent and walking time.
- Building price markers preserve separate building groups.
- Listings without an area token fall back to coordinate grouping.
- The two area click stages zoom without opening the list.
- Building price marker clicks pass listings to the left-side panel callback.
- Zoom-only rendering, drag-only center updates, and marker retention during coordinate lookup remain covered.
