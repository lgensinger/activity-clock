# Activity Clock

ES6 d3.js activity clock visualization.

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
        "timestamp": "2021-07-31T16:05:55-04",
        "value": 1
    },
    {
        "timestamp": "2021-07-31T18:05:55-04",
        "value": 3
    },
    {
        "timestamp": "2021-07-31T16:10:55-04",
        "value": 2
    }
]
```

## Use Module

```bash
import { ActivityClock } from "@lgv/activity-clock";

// have some data
let data = [
    {
        "timestamp": "2021-07-31T16:05:55-04",
        "value": 1
    },
    {
        "timestamp": "2021-07-31T18:05:55-04",
        "value": 3
    },
    {
        "timestamp": "2021-07-31T16:10:55-04",
        "value": 2
    }
]

// initialize
const ac = new ActivityClock(data);

// render visualization
ac.render(document.body);
```

## Environment Variables

The following values can be set via environment or passed into the class.

| Name | Type | Description |
| :-- | :-- | :-- |
| `LGV_CLOCK_RADIUS` | integer | number of arcs in clock |
| `LGV_RADIUS` | integer | outer radius of clock |

## Style

Style is expected to be addressed via css. Any style not met by the visualization module is expected to be added by the importing component.

| Class | Element |
| :-- | :-- |
| `lgv-activity-clock` | top-level svg element |
| `lgv-annotation` | am/pm ring label |
| `lgv-annotation-background` | arc hour label background |
| `lgv-annotation-hour` | arc hour label |
| `lgv-annotation-hour-group` | arc hour group |
| `lgv-arc` | ring arc element |
| `lgv-arc-group` | ring arc group (label + shape) |
| `lgv-container` | content margined from artboard |
| `lgv-label` | arc value label element |

## Actively Develop

```bash
# clone repository
git clone <repo_url>

# update directory context
cd activity-clock

# run docker container
docker run \
  --rm \
  -it  \
  -v $(pwd):/project \
  -w /project \
  -p 8080:8080 \
  node \
  bash

# FROM INSIDE RUNNING CONTAINER

# install module
npm install .

# run development server
npm run startdocker

# edit src/index.js
# add const ac = new ActivityClock(data);
# add ac.render(document.body);
# replace `data` with whatever data you want to develop with

# view visualization in browser at http://localhost:8080
```
