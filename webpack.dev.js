import { commonConfig } from "./webpack.common.js";

import HtmlWebpackPlugin from "html-webpack-plugin";
import { merge } from "webpack-merge";

const webpackConfig = merge(commonConfig, {

    mode: "development",

    plugins: [
        new HtmlWebpackPlugin({
            title: "Development",
        })
    ]

});

export { webpackConfig };
export default webpackConfig;
