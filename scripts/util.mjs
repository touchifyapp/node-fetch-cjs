import fs from "fs/promises";
import cp from "child_process";

/**
 * Read file as JSON
 *
 * @param {string} file
 * @returns {Promise<*>}
 */
export async function readJSON(file) {
    const content = await fs.readFile(file, "utf-8");
    return JSON.parse(content);
}

/**
 * Write a JSON to a file
 *
 * @param {string} file
 * @param {Object} content
 * @param {number} spaces
 * @returns {Promise<void>}
 */
export async function writeJSON(file, content, spaces = 2) {
    const data = JSON.stringify(content, undefined, spaces);
    await fs.writeFile(file, data);
}

/**
 * Check if two objects are equals.
 *
 * @param {Object} src
 * @param {Object} dest
 * @returns {boolean}
 */
export function objectEquals(src, dest) {
    if (Object.keys(src).length !== Object.keys(dest).length) {
        return false;
    }

    return Object.entries(src).every(([key, value]) => dest[key] === value);
}

/**
 * Spawn a program
 * 
 * @param {string} command 
 * @param {string[]} args 
 * @param {cp.SpawnOptions} [options] 
 * @returns {Promise<string>}
 */
export function spawn(command, args, options) {
    return new Promise((resolve, reject) => {
        const child = cp.spawn(command, args, {
            stdio: "pipe",
            ...options,
        });

        child.on("error", reject);

        let stdout = "";
        child.stdout?.on("data", (str) => {
            stdout += str;
        });

        let stderr = "";
        child.stderr?.on("data", (str) => {
            stderr += str;
        });

        child.on("exit", (code) => {
            code === 0
                ? resolve(stdout.trim())
                : reject(new SpawnError(command, args, code, stdout.trim(), stderr.trim()));
        });
    });
}

export class SpawnError extends Error {
    /**
     * Constructs a SpawnError.
     * 
     * @param {string} command 
     * @param {string[]} args 
     * @param {number | null} code 
     * @param {string} stdout 
     * @param {string} stderr 
     */
    constructor(command, args, code, stdout, stderr) {
        super(`"${command} ${args.join(" ")}" exited with code: ${code}`);

        this.name = this.constructor.name;

        if (Object.setPrototypeOf) {
            Object.setPrototypeOf(this, SpawnError.prototype);
        }

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }

        this.code = code;
        this.stdout = stdout;
        this.stderr = stderr;
    }
}

