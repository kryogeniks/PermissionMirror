<h1><center><a href="https://kryogeniks.net/PermissionMirror">Permission Mirror</a></center></h1>

<h5><center>by: <a href="https://kryogeniks.net">Kryogeniks</a></center></h5>

## Introduction

[Permission Mirror](https://marketplace.visualstudio.com/items?itemname=kryogeniks.permissionmirror) is a VS Code extension that applies inheritance when new files or directories are created, ensuring they match the parent’s ownership and permission model. Existing files are not altered on save, so any intentional changes to permissions or group ownership remain intact.

<details open>
<summary>
Why?
</summary><br/>

By default, Linux only applies group ownership if the user’s active group matches. Permission Mirror bridges that gap by interpreting directory intent (`g+s`) and enforcing it automatically, so you don’t have to run `chgrp` manually.

</details>

<details>
<summary>
Features
</summary><br/>

- Mirrors parent directory permissions on file or directory creation.
- Applies execute bits to files only if they are configured as auto‑executable (e.g. `.sh`).
- Always mirrors execute bits for directories to allow traversal.
- Enforces group ownership when parent has setgid.
- Preserves g+s on new directories when parent has setgid.

</details>

## Setup and Installation

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
- On file or directory creation, permissions are mirrored automatically.
- Create a file inside a directory with the setgid bit set (`chmod g+s dir`).
- If you’re a member of that directory’s group, the extension will automatically `chgrp` the file.
- If not, the file is created normally without errors.

## Example

Here’s how permissions are mirrored in practice:

### *Example:* parent is root:www-data

| Context | Permissions | Owner:Group |
| :-- | :-- | :-- |
| Parent | `drwxr-s---` | root:www-data |
| New file | `-rw-r-----` | `user`<sup>1</sup>:`group`<sup>2</sup> |
| New `.sh` file | `-rwxr-x---` | `user`<sup>1</sup>:`group`<sup>2</sup> |
| New directory | `drwxr-s---` | `user`<sup>1</sup>:`group`<sup>2</sup> |

&nbsp;&nbsp;&nbsp;&nbsp;<sup>1</sup> current user<br>
&nbsp;&nbsp;&nbsp;&nbsp;<sup>2</sup> directory's set-group, if applicable; otherwise active group

---

### *Example:* parent is alice:dev

| Context | Permissions | Owner:Group |
| :-- | :-- | :-- |
| Parent | `drwxrwxr-x`  | alice:dev |
| New file | `-rw-rw-r--` | `user`<sup>1</sup>:`group`<sup>2</sup>  |
| New `.py` file | `-rwxrwxr-x` | `user`<sup>1</sup>:`group`<sup>2</sup>  |
| New directory | `drwxrwxr-x` | `user`<sup>1</sup>:`group`<sup>2</sup>  |

&nbsp;&nbsp;&nbsp;&nbsp;<sup>1</sup> current user<br>
&nbsp;&nbsp;&nbsp;&nbsp;<sup>2</sup> current active group

## Requirements
- Unix-like OS (Linux, macOS).
- User must be a member of the target group for enforcement to succeed.
- Standard tools available: `stat`, `chgrp`.

---

### Notes
- No effect on Windows — the extension silently skips.
- Lightweight utility for exploring group ownership automation in your workflow.

### Changes
[CHANGELOG](/CHANGELOG.md)

### License
[MIT](/LICENSE.md)