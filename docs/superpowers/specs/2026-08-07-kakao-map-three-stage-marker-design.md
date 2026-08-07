# Kakao Map Three-Stage Marker Design

## Goal

Render listings with a predictable three-stage drill-down flow while keeping the current map and marker layer visible during data refreshes.

## Zoom Modes

### Overview: Kakao level 6 and above

- Group nearby buildings into neighborhood-scale clusters.
- Render one circular marker per cluster.
- Derive the area label from the first address token ending in `동`, `가`, `읍`, `면`, or `리`; omit it when no such token exists.
- Show the area label and total listing count.
- Clicking a cluster centers the map on it and changes the map to level 5.

### Block: Kakao levels 4 and 5

- Group nearby buildings into smaller block-scale clusters.
- Render a compact pill marker containing the listing count and one representative price.
- For a mixed cluster, prefer a monthly listing to match the existing mixed-cluster color rule; otherwise use the available deal type.
- Within that deal type, choose the representative listing by numeric deposit, numeric rent, and listing ID in ascending order.
- Clicking a cluster centers the map on it and changes the map to level 3.

### Building: Kakao level 3 and below

- Render the existing home pin and price label for each building.
- Keep listings with the same `buildingId`, or the same coordinates when no building ID exists, in one building group.
- A single listing label opens that listing.
- A multi-listing label opens the existing building listings panel.

## Data And Rendering Flow

- Zoom changes never request listing data. They only regroup the property layer already held by `KakaoMap`.
- Map dragging continues to request data only after the existing center-distance threshold is exceeded.
- While new listing coordinates are being resolved, the current property layer remains visible.
- The new property layer replaces the old layer only after coordinate resolution completes.
- If a non-empty response yields no valid coordinates, the current layer remains visible.

## Grouping

- Overview mode uses a coordinate threshold of `0.003 * 2^(level - 6)`.
- Block mode uses a coordinate threshold of `0.0015` at levels 4 and 5.
- Building mode does not merge separate buildings by distance.
- Cluster position is the running average of the grouped building coordinates.

## Presentation

- Overview clusters use a blue circular treatment with a strong count and optional short area label.
- Block clusters use a white pill with a blue count badge and representative price text.
- Building markers retain the existing monthly and jeonse color treatments.
- All cluster controls expose an accessible label containing building and listing counts.

## Tests

- Unit-test level-to-mode mapping for overview, block, and building modes.
- Unit-test that overview grouping is broader than block grouping.
- Component-test the marker content and absence of individual home pins in overview and block modes.
- Component-test cluster click level transitions: overview to 5 and block to 3.
- Preserve the existing tests for building price labels, zoom-only rendering, drag-only center updates, and marker retention during coordinate lookup.
