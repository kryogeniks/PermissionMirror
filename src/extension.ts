import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';
import { promises as fs } from 'fs';

export function activate(context: vscode.ExtensionContext) {
    if (process.platform !== 'linux' && process.platform !== 'darwin') {
        return; // silently skip on Windows
    }

    const config = vscode.workspace.getConfiguration("permissionmirror");
    const autoExecExtensions: string[] = config.get("autoExecutableExtensions", []);

    function shouldAutoExec(filePath: string): boolean {
        return autoExecExtensions.some(ext => filePath.endsWith(ext));
    }

    // --- Handle creation of files and directories ---
    const disposablecreate = vscode.workspace.onDidCreateFiles(async (event) => {
        for (const file of event.files) {
            const parent = path.dirname(file.fsPath);

            // Get parent mode and group (quoted format kept as one arg)
            const parentStat = await runCommand("stat", ["-c", "%A %G", parent]);
            const [parentMode, parentGroup] = parentStat.split(" ");

            const uPerms = parentMode.slice(1, 4);
            const gPerms = parentMode.slice(4, 7);
            const oPerms = parentMode.slice(7, 10);

            const isDir = await isDirectory(file.fsPath);
            const autoExec = shouldAutoExec(file.fsPath);

            // Mirror permissions
            const spec = buildMirrorSpec(uPerms, gPerms, oPerms, isDir, autoExec);
            await runCommand("chmod", [spec, file.fsPath]);

            // Only enforce group ownership if parent has setgid
            if (gPerms.includes("s")) {
                await runCommand("chgrp", [parentGroup, file.fsPath]);
            }
        }
    });

    // --- Handle save operation with same mirroring ---
    const disposablesave = vscode.workspace.onDidSaveTextDocument(async (doc) => {
        const filePath = doc.fileName;
        const dirPath = path.dirname(filePath);

        const parentStat = await runCommand("stat", ["-c", "%A %G", dirPath]);
        const [parentMode, dirGroup] = parentStat.split(" ");

        const uPerms = parentMode.slice(1, 4);
        const gPerms = parentMode.slice(4, 7);
        const oPerms = parentMode.slice(7, 10);

        const isDir = await isDirectory(filePath);
        const autoExec = shouldAutoExec(filePath);

        const spec = buildMirrorSpec(uPerms, gPerms, oPerms, isDir, autoExec);
        await runCommand("chmod", [spec, filePath]);

        if (gPerms.includes("s")) {
            await runCommand("chgrp", [dirGroup, filePath]);
        }
    });

    context.subscriptions.push(disposablecreate);
    context.subscriptions.push(disposablesave);
}

export function deactivate() { }

// --- Helpers ---

async function isDirectory(p: string): Promise<boolean> {
    try {
        const stats = await fs.stat(p);
        return stats.isDirectory();
    } catch {
        return false;
    }
}

function runCommand(cmd: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const safeArgs = args.map(a => (a.includes(" ") ? `"${a}"` : a));
        const command = [cmd, ...safeArgs].join(" ");
        exec(command, (err, stdout, stderr) => {
            if (err) {
                console.error(`Command failed: ${command}\n${stderr}`);
                reject(err);
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

/**
 * Build a chmod numeric mode string by mirroring parent u/g/o r/w,
 * and applying execute as follows:
 * - Directories: mirror execute per class from parent (to allow traversal).
 * - Files: apply execute per class only if autoExec is true, mirroring parent x.
 * If the parent had setgid and the new item is a directory, add the setgid bit (leading 2).
 */
function buildMirrorSpec(
    uPerms: string,
    gPerms: string,
    oPerms: string,
    isDir: boolean,
    autoExec: boolean
): string {
    const u = parseBits(uPerms);
    const g = parseBits(gPerms);
    const o = parseBits(oPerms);

    // Execute logic:
    // - Directories: mirror x for each class exactly as parent
    // - Files: only mirror x for each class if autoExec is true
    const wantUX = isDir ? u.x : (autoExec && u.x);
    const wantGX = isDir ? g.x : (autoExec && g.x);
    const wantOX = isDir ? o.x : (autoExec && o.x);

    const uBits = (u.r ? 4 : 0) + (u.w ? 2 : 0) + (wantUX ? 1 : 0);
    const gBits = (g.r ? 4 : 0) + (g.w ? 2 : 0) + (wantGX ? 1 : 0);
    const oBits = (o.r ? 4 : 0) + (o.w ? 2 : 0) + (wantOX ? 1 : 0);

    // Build numeric: special prefix for setgid dirs, then u/g/o digits
    const special = g.s && isDir ? "2" : "";
    const spec = `${special}${uBits}${gBits}${oBits}`; // e.g., "755" or "2755"

    return spec;
}

function parseBits(perm: string): { r: boolean; w: boolean; x: boolean; s: boolean } {
    // perm is 3 chars, e.g., "rwx", "rw-", "r-x", "r-s", "rws"
    const ch = perm[2];
    const hasX = ch === 'x' || ch === 's';
    const hasS = ch === 's';
    return {
        r: perm[0] === 'r',
        w: perm[1] === 'w',
        x: hasX,
        s: hasS
    };
}
