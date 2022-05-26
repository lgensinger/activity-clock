import packagejson from "../package.json";

const configuration = {
    name: packagejson.name.replace("/", "-").slice(1)
};

const configurationLayout = {
    radius: process.env.LAYOUT_RADIUS || 600
}

export { configuration, configurationLayout };
export default configuration;
