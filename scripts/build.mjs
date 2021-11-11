import fs from "fs/promises";
import esbuild from "esbuild";
import { readJSON, writeJSON, spawn, objectEquals } from "./util.mjs";

main();

async function main() {
    await update_version();
    await update_dependencies();
    await build_node_fetch();
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

    const up_to_date = Object.entries(fetch_pkg.dependencies)
        .every(([key, value]) => my_pkg.devDependencies[key] === value);

    if (up_to_date) {
        return;
    }

    my_pkg.devDependencies = {
        ...my_pkg.devDependencies,
        ...fetch_pkg.dependencies,
    };

    await writeJSON("package.json", my_pkg);
    await spawn("npm", ["install"], { stdio: "inherit" });
}

async function build_node_fetch() {
    const res = await esbuild.build({
        entryPoints: ["src/index.js"],
        platform: "node",
        format: "cjs",
        outfile: "dist/index.js",
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

async function update_types() {
    const src_content = await fs.readFile("node_modules/node-fetch/@types/index.d.ts", "utf-8");

    const dest_content = [
        src_content,
        `export const Blob: typeof globalThis.Blob;`,
        `export declare const FormData: { new (): FormData; prototype: FormData; };`,
    ].join("\n\n");

    await fs.writeFile("dist/index.d.ts", dest_content);
}
