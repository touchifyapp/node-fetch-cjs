import fs from "fs/promises";
import fetch from "node-fetch";

main();

async function main() {
    const version = await get_latest_version();
    const pkg_version = await fs.readFile("VERSION", "utf-8");
    if (version === pkg_version) return;

    await fs.writeFile("VERSION", version);
}

async function get_latest_version() {
    const res = await fetch("https://api.github.com/repos/node-fetch/node-fetch/releases", {
        headers: {
            Accept: "application/vnd.github.v3+json"
        }
    });

    const releases = await res.json();
    const release = releases.find(({ tag_name }) => {
        const [major] = tag_name.slice(1).split(".");
        return parseInt(major) >= 3;
    });

    return release?.tag_name.slice(1);
}