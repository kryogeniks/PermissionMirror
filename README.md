# Permission Mirror – VS Code Extension

### kryogeniks <img src="images/verified.png" alt="Verified badge" width="12"/>

**Permission Mirror** is a VS Code extension that applies inheritance when new files or directories are created, ensuring they match the parent’s ownership and permission model. Existing files are not altered on save, so any intentional changes to permissions or group ownership remain intact.

## Features
- Mirrors parent directory permissions on file create.
- Applies execute bits to files only if they are configured as auto‑executable (e.g. `.sh`).
- Always mirrors execute bits for directories to allow traversal.
- Enforces group ownership when parent has setgid.
- Preserves g+s on new directories when parent has setgid.

## Example
Here’s how permissions are mirrored in practice:

*Example:* parent is root:www-data

| Context | Permissions | Owner:Group |
| :-- | :-- | :-- |
| Parent | `drwxr-s---` | root:www-data |
| New file | `-rw-r-----` | `user`<sup>1</sup>:`sgroup`<sup>2</sup> |
| New `.sh` file | `-rwxr-x---` | `user`<sup>1</sup>:`sgroup`<sup>2</sup> |
| New directory | `drwxr-s---` | `user`<sup>1</sup>:`sgroup`<sup>2</sup> |

*Example:* parent is alice:dev

| Context | Permissions | Owner:Group |
| :-- | :-- | :-- |
| Parent | `drwxrwxr-x`  | alice:dev |
| New file | `-rw-rw-r--` | `user`<sup>1</sup>:`group`<sup>3</sup>  |
| New `.py` file | `-rwxrwxr-x` | `user`<sup>1</sup>:`group`<sup>3</sup>  |
| New directory | `drwxrwxr-x` | `user`<sup>1</sup>:`group`<sup>3</sup>  |

<sup>1</sup> current user<br>
<sup>2</sup> directory's set-group, if applicable; otherwise active group<br>
<sup>3</sup> current active group

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
- On file create, permissions are mirrored automatically.
- Create a file inside a directory with the setgid bit set (`chmod g+s dir`).
- If you’re a member of that directory’s group, the extension will automatically `chgrp` the file.
- If not, the file is created normally without errors.

## Notes
- No effect on Windows — the extension silently skips.
- Lightweight utility for exploring group ownership automation in your workflow.

## License
MIT