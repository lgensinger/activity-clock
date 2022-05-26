import { commonConfig } from "./webpack.common.js";

import { merge } from "webpack-merge";

const webpackConfig = merge(commonConfig, {

    mode: "production",

    output: {
        library: {
            name: "ActivityClock",
            type: "umd"
        }
    }

});

export { webpackConfig };
export default webpackConfig;
