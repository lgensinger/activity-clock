import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

import HtmlWebpackPlugin from "html-webpack-plugin";
import webpack from "webpack";

const __dirname = dirname(fileURLToPath(import.meta.url));

const webpackConfig = {

    mode: "development",

    entry: {
        index: "./src/index.js"
    },

    plugins: [
        new HtmlWebpackPlugin({
            title: "Development",
        }),
        new webpack.DefinePlugin({
            "process.env": {
                "LAYOUT_RADIUS": JSON.stringify(process.LAYOUT_RADIUS)
            }
        })
    ],

    output: {
        filename: "[name].bundle.js",
        path: path.resolve(__dirname, "dist"),
        clean: true
    }

 };

 export { webpackConfig };
 export default webpackConfig;
