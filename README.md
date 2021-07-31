# ActivityClock

ES6 d3.js activity clock visualization.


## Style

Style is expected to be addressed via css. The top-level svg is assigned a class `lgv-activity-clock`. Any style not met by the visualization module is expected to be added by the importing component.

## Environment Variables

The following values can be set via environment or passed into the class.

| Name | Type | Description |
| :-- | :-- | :-- |
| `LAYOUT_RADIUS` | integer | outer radius of clock |

## Install

```bash
# install package
npm install @lgv/activity-clock
```

## Data Format

The following values are the expected input data structure.

```json
[
    {
        "timestamp": "2021-07-31T16:05:55-04:0",
        "value": 1
    },
    {
        "timestamp": "2021-07-31T18:05:55-04:0",
        "value": 3
    },
    {
        "timestamp": "2021-07-31T16:10:55-04:0",
        "value": 2
    }
]
```

### Use Module

```bash
import { ActivityClock } from "@lgv/activity-clock";

// initialize
const ac = new ActivityClock(data);

// render visualization
ac.render(document.body);
```
