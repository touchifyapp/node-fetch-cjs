import fs from "fs/promises";
import esbuild from "esbuild";
import { readJSON, writeJSON, spawn, objectEquals } from "./util.mjs";

main();

async function main() {
    await update_version();
    const deps = await update_dependencies();
    await build_node_fetch(deps);
    await fix_fetch_blob_imports();
    await update_types();
}

async function update_version() {
    const version = await fs.readFile("VERSION", "utf-8");
    const pkg = await readJSON("package.json");
    if (version === pkg.version) return;

    pkg.version = version;
    pkg.devDependencies["node-fetch"] = version;

    await writeJSON("package.json", pkg);
    await spawn("npm", ["install"], { stdio: "inherit" });
}

async function update_dependencies() {
    const fetch_pkg = await readJSON("node_modules/node-fetch/package.json");
    const my_pkg = await readJSON("package.json");

    if (objectEquals(fetch_pkg.dependencies, my_pkg.dependencies)) {
        return Object.keys(my_pkg.dependencies);
    }

    my_pkg.dependencies = fetch_pkg.dependencies;

    await writeJSON("package.json", my_pkg);
    await spawn("npm", ["install"], { stdio: "inherit" });

    return Object.keys(my_pkg.dependencies);
}

async function build_node_fetch(deps) {
    const res = await esbuild.build({
        entryPoints: ["src/index.js"],
        platform: "node",
        format: "cjs",
        outfile: "dist/index.js",
        external: deps,
        bundle: true,
    });

    if (res.errors.length) {
        console.log("⚠ Some errors occured while building node-fetch");

        const msgs = await esbuild.formatMessages(res.errors, { kind: "error", color: true, terminalWidth: process.stdout.columns });
        for (const msg of msgs) {
            console.log(msg);
        }

        process.exit(1);
    }

    if (res.warnings.length) {
        console.log("⚠ Some warnings occured while building node-fetch");
        const msgs = await esbuild.formatMessages(res.warnings, { kind: "warning", color: true, terminalWidth: process.stdout.columns });
        for (const msg of msgs) {
            console.log(msg);
        }
    }

    console.log("✅ node-fetch was build successfully!");
}

async function fix_fetch_blob_imports() {
    const content = await fs.readFile("dist/index.js", "utf-8");

    const var_regex = /var ([^ ]+)[^\n]+fetch-blob[^\n]+/;

    const matches = content.match(var_regex);
    if (!matches) {
        console.log("⚠ Cannot find import reference to fetch-blob");
        process.exit(1);
    }

    const var_name = matches[1];

    const replaced = content
        .replace(var_regex, `var ${var_name} = import("fetch-blob");`)
        .replace(new RegExp(`${var_name}\\.`, "g"), `(await ${var_name}).`);

    await fs.writeFile("dist/index.js", replaced);
}

async function update_types() {
    await fs.copyFile("node_modules/node-fetch/@types/index.d.ts", "dist/index.d.ts");
}
