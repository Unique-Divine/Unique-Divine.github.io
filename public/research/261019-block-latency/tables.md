# Captured profiling results

Generated offline from the preserved raw responses. All durations below use unextrapolated counter changes. Missing state series are not zero-duration phases.

## Normal operation

### cataclysm-1-validator

Requested 2026-10-17T04:02:00.000000Z through 2026-10-19T04:02:00.000000Z. Actual scrape endpoints 2026-10-17T04:01:17.125000Z through 2026-10-19T04:01:17.125000Z; raw block-counter change 114,057.

| State | Mean visit, ms | Contribution/block, ms | Visits/block | Share | Coverage |
| --- | ---: | ---: | ---: | ---: | --- |
| NewHeight | 922.50 | 922.49 | 0.99999 | 60.89% | observed |
| NewRound | 1.68 | 1.68 | 0.99956 | 0.11% | observed |
| Propose | 187.65 | 187.56 | 0.99956 | 12.38% | observed |
| Prevote | 165.86 | 165.84 | 0.99991 | 10.95% | observed |
| PrevoteWait | unavailable | unavailable | unavailable | unavailable | series absent |
| Precommit | 159.01 | 159.01 | 1.00000 | 10.50% | observed |
| PrecommitWait | unavailable | unavailable | unavailable | unavailable | series absent |
| Commit | 78.37 | 78.37 | 1.00000 | 5.17% | observed |
| Measured block interval | | 1,515.04 | | | |
| Phase sum | | 1,514.96 | | | |
| Unattributed residual | | 0.08 | | | |

### cataclysm-1-snapshot-0

Requested 2026-10-17T04:02:00.000000Z through 2026-10-19T04:02:00.000000Z. Actual scrape endpoints 2026-10-17T04:01:19.161000Z through 2026-10-19T04:01:19.161000Z; raw block-counter change 114,056.

| State | Mean visit, ms | Contribution/block, ms | Visits/block | Share | Coverage |
| --- | ---: | ---: | ---: | ---: | --- |
| NewHeight | 878.83 | 878.84 | 1.00001 | 58.01% | observed |
| NewRound | 0.05 | 0.05 | 0.99960 | 0.00% | sample gaps |
| Propose | 183.59 | 183.52 | 0.99960 | 12.11% | observed |
| Prevote | 174.99 | 174.00 | 0.99435 | 11.48% | observed |
| PrevoteWait | unavailable | 0.00 | 0.00000 | 0.00% | observed, zero visits |
| Precommit | 153.76 | 153.76 | 1.00001 | 10.15% | observed |
| PrecommitWait | unavailable | unavailable | unavailable | unavailable | series absent |
| Commit | 124.84 | 124.84 | 1.00000 | 8.24% | sample gaps |
| Measured block interval | | 1,515.04 | | | |
| Phase sum | | 1,515.01 | | | |
| Unattributed residual | | 0.03 | | | |

### cataclysm-1-snapshot-1

Requested 2026-10-17T04:02:00.000000Z through 2026-10-19T04:02:00.000000Z. Actual scrape endpoints 2026-10-17T04:01:29.535000Z through 2026-10-19T04:01:29.535000Z; raw block-counter change 114,056.

| State | Mean visit, ms | Contribution/block, ms | Visits/block | Share | Coverage |
| --- | ---: | ---: | ---: | ---: | --- |
| NewHeight | 880.87 | 880.88 | 1.00001 | 58.14% | observed |
| NewRound | 0.05 | 0.05 | 0.99973 | 0.00% | observed |
| Propose | 187.55 | 187.50 | 0.99973 | 12.38% | observed |
| Prevote | 170.58 | 169.61 | 0.99433 | 11.20% | observed |
| PrevoteWait | unavailable | unavailable | unavailable | unavailable | series absent |
| Precommit | 154.17 | 154.18 | 1.00002 | 10.18% | observed |
| PrecommitWait | unavailable | unavailable | unavailable | unavailable | series absent |
| Commit | 122.78 | 122.78 | 1.00000 | 8.10% | observed |
| Measured block interval | | 1,515.04 | | | |
| Phase sum | | 1,515.01 | | | |
| Unattributed residual | | 0.03 | | | |

## v2.20.0

Reset-crossing tables are incomplete; phase counters do not measure stopped-process time.

### Validator before

2026-09-26T08:05:12.320886Z through 2026-09-26T08:30:12.320886Z. Complete: True.

| State | Mean visit, ms | Contribution/block, ms | Visits/block | Share | Coverage |
| --- | ---: | ---: | ---: | ---: | --- |
| NewHeight | 912.18 | 912.18 | 1.00000 | 59.50% | observed |
| NewRound | 1.79 | 1.78 | 0.99591 | 0.12% | observed |
| Propose | 186.71 | 185.94 | 0.99591 | 12.13% | observed |
| Prevote | 176.67 | 176.67 | 1.00000 | 11.52% | observed |
| PrevoteWait | unavailable | 0.00 | 0.00000 | 0.00% | observed, zero visits |
| Precommit | 167.74 | 167.74 | 1.00000 | 10.94% | observed |
| PrecommitWait | unavailable | unavailable | unavailable | unavailable | series absent |
| Commit | 88.64 | 88.64 | 1.00000 | 5.78% | observed |
| Measured block interval | | 1,533.02 | | | |
| Phase sum | | 1,532.96 | | | |
| Unattributed residual | | 0.07 | | | |

### Validator transition

2026-09-26T08:30:12.320886Z through 2026-09-26T08:40:12.320886Z. Complete: False.

| State | Mean visit, ms | Contribution/block, ms | Visits/block | Share | Coverage |
| --- | ---: | ---: | ---: | ---: | --- |
| NewHeight | 882.89 | 886.47 | 1.00407 | 45.54% | sample gaps; reset-crossing window |
| NewRound | 1.67 | 1.80 | 1.07724 | 0.09% | sample gaps; reset-crossing window |
| Propose | 408.15 | 438.01 | 1.07317 | 22.50% | sample gaps; reset-crossing window |
| Prevote | 195.13 | 210.20 | 1.07724 | 10.80% | sample gaps; reset-crossing window |
| PrevoteWait | unavailable | 0.00 | 0.00000 | 0.00% | observed, zero visits; reset-crossing window |
| Precommit | 273.91 | 295.07 | 1.07724 | 15.16% | sample gaps; reset-crossing window |
| PrecommitWait | unavailable | unavailable | unavailable | unavailable | series absent; reset-crossing window |
| Commit | 118.13 | 118.13 | 1.00000 | 6.07% | sample gaps; reset-crossing window |
| Measured block interval | | 1,946.67 | | | |
| Phase sum | | 1,949.69 | | | |
| Unattributed residual | | -3.02 | | | |

### Validator recovery

2026-09-26T08:40:12.320886Z through 2026-09-26T09:05:12.320886Z. Complete: True.

| State | Mean visit, ms | Contribution/block, ms | Visits/block | Share | Coverage |
| --- | ---: | ---: | ---: | ---: | --- |
| NewHeight | 882.86 | 881.29 | 0.99822 | 32.91% | observed |
| NewRound | 1.35 | 1.65 | 1.22103 | 0.06% | observed |
| Propose | 730.97 | 893.84 | 1.22282 | 33.38% | observed |
| Prevote | 203.08 | 248.70 | 1.22460 | 9.29% | observed |
| PrevoteWait | unavailable | 0.00 | 0.00000 | 0.00% | observed, zero visits |
| Precommit | 434.95 | 532.64 | 1.22460 | 19.89% | observed |
| PrecommitWait | unavailable | unavailable | unavailable | unavailable | series absent |
| Commit | 117.83 | 117.83 | 1.00000 | 4.40% | observed |
| Measured block interval | | 2,677.78 | | | |
| Phase sum | | 2,675.96 | | | |
| Unattributed residual | | 1.83 | | | |

### Validator later

2026-09-26T09:05:12.320886Z through 2026-09-26T09:35:12.320886Z. Complete: True.

| State | Mean visit, ms | Contribution/block, ms | Visits/block | Share | Coverage |
| --- | ---: | ---: | ---: | ---: | --- |
| NewHeight | 900.92 | 902.07 | 1.00127 | 39.43% | observed |
| NewRound | 1.49 | 1.72 | 1.15541 | 0.08% | observed |
| Propose | 577.30 | 667.02 | 1.15541 | 29.15% | observed |
| Prevote | 180.58 | 208.64 | 1.15541 | 9.12% | observed |
| PrevoteWait | unavailable | 0.00 | 0.00000 | 0.00% | observed, zero visits |
| Precommit | 358.49 | 413.75 | 1.15414 | 18.08% | observed |
| PrecommitWait | unavailable | unavailable | unavailable | unavailable | series absent |
| Commit | 99.87 | 99.87 | 1.00000 | 4.36% | observed |
| Measured block interval | | 2,288.03 | | | |
| Phase sum | | 2,293.07 | | | |
| Unattributed residual | | -5.05 | | | |

### Recovery criterion

six consecutive complete five-minute bins within 10% of the pre-upgrade block mean.

Stable sequence starts 2026-09-26T18:15:12.320886Z; confirmed 2026-09-26T18:45:12.320886Z.

## v2.21.0

Reset-crossing tables are incomplete; phase counters do not measure stopped-process time.

### Validator before

2026-10-11T04:12:37.290130Z through 2026-10-11T04:37:37.290130Z. Complete: True.

| State | Mean visit, ms | Contribution/block, ms | Visits/block | Share | Coverage |
| --- | ---: | ---: | ---: | ---: | --- |
| NewHeight | 932.25 | 931.30 | 0.99898 | 60.99% | observed |
| NewRound | 1.45 | 1.44 | 0.99491 | 0.09% | observed |
| Propose | 185.80 | 184.86 | 0.99491 | 12.11% | observed |
| Prevote | 174.71 | 174.53 | 0.99898 | 11.43% | observed |
| PrevoteWait | unavailable | 0.00 | 0.00000 | 0.00% | observed, zero visits |
| Precommit | 165.02 | 165.02 | 1.00000 | 10.81% | observed |
| PrecommitWait | unavailable | unavailable | unavailable | unavailable | series absent |
| Commit | 68.41 | 68.41 | 1.00000 | 4.48% | observed |
| Measured block interval | | 1,526.93 | | | |
| Phase sum | | 1,525.55 | | | |
| Unattributed residual | | 1.37 | | | |

### Validator transition

2026-10-11T04:37:37.290130Z through 2026-10-11T04:47:37.290130Z. Complete: False.

| State | Mean visit, ms | Contribution/block, ms | Visits/block | Share | Coverage |
| --- | ---: | ---: | ---: | ---: | --- |
| NewHeight | 907.00 | 903.23 | 0.99583 | 50.47% | sample gaps; reset-crossing window |
| NewRound | 1.56 | 1.63 | 1.04167 | 0.09% | sample gaps; reset-crossing window |
| Propose | 298.90 | 311.35 | 1.04167 | 17.40% | sample gaps; reset-crossing window |
| Prevote | 188.05 | 195.88 | 1.04167 | 10.95% | sample gaps; reset-crossing window |
| PrevoteWait | unavailable | unavailable | unavailable | unavailable | endpoints differ; reset-crossing window |
| Precommit | 235.50 | 246.29 | 1.04583 | 13.76% | sample gaps; reset-crossing window |
| PrecommitWait | unavailable | unavailable | unavailable | unavailable | series absent; reset-crossing window |
| Commit | 94.06 | 94.06 | 1.00000 | 5.26% | sample gaps; reset-crossing window |
| Measured block interval | | 1,789.68 | | | |
| Phase sum | | 1,752.44 | | | |
| Unattributed residual | | 37.25 | | | |

### Validator recovery

2026-10-11T04:47:37.290130Z through 2026-10-11T05:12:37.290130Z. Complete: True.

| State | Mean visit, ms | Contribution/block, ms | Visits/block | Share | Coverage |
| --- | ---: | ---: | ---: | ---: | --- |
| NewHeight | 891.50 | 893.08 | 1.00177 | 33.60% | observed |
| NewRound | 1.39 | 1.70 | 1.22518 | 0.06% | observed |
| Propose | 711.38 | 870.31 | 1.22340 | 32.74% | observed |
| Prevote | 196.58 | 240.50 | 1.22340 | 9.05% | observed |
| PrevoteWait | unavailable | unavailable | unavailable | unavailable | series absent |
| Precommit | 445.27 | 544.74 | 1.22340 | 20.49% | observed |
| PrecommitWait | unavailable | unavailable | unavailable | unavailable | series absent |
| Commit | 109.22 | 109.22 | 1.00000 | 4.11% | observed |
| Measured block interval | | 2,658.17 | | | |
| Phase sum | | 2,659.56 | | | |
| Unattributed residual | | -1.39 | | | |

### Validator later

2026-10-11T05:12:37.290130Z through 2026-10-11T05:42:37.290130Z. Complete: True.

| State | Mean visit, ms | Contribution/block, ms | Visits/block | Share | Coverage |
| --- | ---: | ---: | ---: | ---: | --- |
| NewHeight | 913.86 | 912.83 | 0.99887 | 44.86% | observed |
| NewRound | 1.31 | 1.44 | 1.09831 | 0.07% | observed |
| Propose | 452.26 | 497.23 | 1.09944 | 24.44% | observed |
| Prevote | 181.54 | 199.80 | 1.10056 | 9.82% | observed |
| PrevoteWait | unavailable | unavailable | unavailable | unavailable | series absent |
| Precommit | 304.79 | 335.44 | 1.10056 | 16.48% | observed |
| PrecommitWait | unavailable | unavailable | unavailable | unavailable | series absent |
| Commit | 86.94 | 86.94 | 1.00000 | 4.27% | observed |
| Measured block interval | | 2,034.88 | | | |
| Phase sum | | 2,033.68 | | | |
| Unattributed residual | | 1.20 | | | |

### Recovery criterion

six consecutive complete five-minute bins within 10% of the pre-upgrade block mean.

Stable sequence starts 2026-10-11T05:47:37.290130Z; confirmed 2026-10-11T06:17:37.290130Z.
