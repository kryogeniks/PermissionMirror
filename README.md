# Permission Mirror – VS Code Extension

### kryogeniks <img src="images/verified.png" alt="Verified badge" width="12"/>

**Permission Mirror** is a VS Code extension that ensures new files and directories inherit the permissions of their parent directory. It mirrors user, group, and other read/write/execute bits. If the parent directory has the setgid bit set, Permission Mirror also enforces group ownership and preserves g+s on new directories.

## Features
- Mirrors parent directory permissions on file create and save.
- Applies execute bits to files only if they are configured as auto‑executable (e.g. `.sh`).
- Always mirrors execute bits for directories to allow traversal.
- Enforces group ownership when parent has setgid.
- Preserves g+s on new directories when parent has setgid.

## Example
Here’s how permissions are mirrored in practice:
- `Parent: drwxr-s--- www-data`
- `New file: -rw-r----- www-data`
- `New .sh file: -rwxr-x--- www-data`
- `New directory: drwxr-s--- www-data`

## Why
By default, Linux only applies group ownership if the user’s active group matches. Permission Mirror bridges that gap by interpreting directory intent (`g+s`) and enforcing it automatically, so you don’t have to run `chgrp` manually.

## Requirements
- Unix-like OS (Linux, macOS).
- User must be a member of the target group for enforcement to succeed.
- Standard tools available: `stat`, `chgrp`.

## Installation

1. Clone this repo: 
   ```bash
   git clone https://github.com/kryogeniks/PermissionMirror.git
   cd PermissionMirror
   ```
2. Install dependencies: 
   ```bash
   npm install
   ```
3. Compile TypeScript: 
   ```bash
   npm run compile
   ```
4. Open the folder in VS Code and press F5 to launch an Extension Development Host, or run `vsce package` to build a `.vsix` and install it.

## Usage
- On file create or save, permissions are mirrored automatically.
- Save a file inside a directory with the setgid bit set (`chmod g+s dir`).
- If you’re a member of that directory’s group, the extension will automatically `chgrp` the file.
- If not, the file is saved normally without errors.

## Notes
- No effect on Windows — the extension silently skips.
- Lightweight utility for exploring group ownership automation in your workflow.

## License
MIT