import packagejson from "../package.json";

const configuration = {
    name: packagejson.name.replace("/", "-").slice(1)
};

const configurationLayout = {
    hours: process.env.LGV_CLOCK_HOURS || 12,
    radius: process.env.LGV_RADIUS || 600
}

export { configuration, configurationLayout };
export default configuration;
