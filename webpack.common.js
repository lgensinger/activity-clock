import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

import webpack from "webpack";

const __dirname = dirname(fileURLToPath(import.meta.url));

const commonConfig = {

    entry: {
        index: "./src/index.js"
    },

    plugins: [
        new webpack.DefinePlugin({
            "process.env": {
                "LGV_CLOCK_HOURS": JSON.stringify(process.env.LGV_CLOCK_HOURS),
                "LGV_RADIUS": JSON.stringify(process.env.LGV_RADIUS)
            }
        })
    ],

    output: {
        filename: "activity-clock.bundle.js",
        path: path.resolve(__dirname, "dist"),
        clean: true
    }

 };

 export { commonConfig };
 export default commonConfig;
