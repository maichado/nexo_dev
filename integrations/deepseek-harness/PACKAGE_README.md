# `@maichado/nexo-dsh` 1.2.0

Community DeepSeek Harness integration for [Nexo](https://github.com/maichado/nexo_dev). This is **not** an official DeepSeek product and does not imply DeepSeek endorsement.

This package bundles **Nexo 3.3.0** from immutable `v3.3.0` tag commit `af3aaf3c36762f2afb62a4a09533f6c7273b07e5`. Both bundled version manifests declare 3.3.0. Adapter and Nexo versions are independent.

The accepted host is the exact developer-preview **`@deepseek-ai/dsh@0.2.2-rc.5`** on Node.js **`^22.19.0 || >=24.0.0`**. It does not make the host stable or guarantee compatibility with other DSH versions. The three-platform release gate establishes clean installation and same-profile upgrades from plugin 0.1.0, 1.0.0, and 1.1.0 to 1.2.0 on Linux, macOS, and Windows using Node 22; the release record carries the verified tarball digest. CLI acceptance does not establish Desktop/Electron or running-host updater support.

## Install or upgrade

Install the exact version in each profile that uses Nexo:

```bash
dsh plugin --profile web add @maichado/nexo-dsh@1.2.0
```

The same command upgrades an existing plugin. Host migration is a separate action: use the exact host recorded in the accepted release, not an inferred `0.2.x` range. Updating DSH itself or the Nexo repository does not update an installed plugin. Do not install from Git source: the repository root is not a DSH package.

For an npm download problem, an integrity-verified tarball can be installed with `dsh plugin --profile web add /absolute/path/to/package.tgz`. See the [changelog](CHANGELOG.md) for the bundled Nexo changes and the [repository integration README](https://github.com/maichado/nexo_dev/tree/main/integrations/deepseek-harness) for publication status.

## Effective Skill source and licenses

Personal and project copies named `nexo` outrank this bundle on the target host. A successful plugin upgrade does not necessarily upgrade the effective Skill. Check the actual loaded source path and body/version when diagnosing a stale Skill; do not automatically remove live personal/project copies.

The adapter remains MIT-licensed. The bundled Nexo 3.3.0 Skill is Apache-2.0; its `LICENSE`, `LICENSE-MIT`, `NOTICE` and `THIRD_PARTY_NOTICES.md` preserve the applicable grants and attribution. The outer package license does not replace those bundled notices.

## Invoke

Ask DSH to load Nexo by name:

```text
Use the nexo skill to map this repository's runtime architecture.
Show 8–12 core components, one primary path, external dependencies, and trust boundaries.
Put supporting detail in cards instead of adding more edges.
After delivery, return the exact workspace paths of the specification JSON and the HTML artifact.
```

Nexo uses DSH's ordinary Skill, shell, and filesystem paths. Generated files do not automatically appear in the Web Produced Files strip; ask for their **exact workspace paths** and open them from the workspace.

## Uninstall

```bash
dsh plugin --profile web remove @maichado/nexo-dsh
```

The standard plugin command removes the adapter dependency and bundle layer. The base profile remains usable.

## Activation and scope

The bundle mounts one filesystem Skill provider named `nexo-plugin`. Its `cordis.patch.yml` contains a `!!js` expression evaluated by the DSH host outside the agent sandbox. The expression uses Node's built-in `path` and `module` helpers to locate this installed package's `skills` directory; it does not fetch data, read credentials, spawn processes, or register another permission path. Review patch changes as host-process code.

The adapter adds no native tools, custom Web client, telemetry, credentials handling, network client, background service, dependencies, or install hooks. The bundled Skill has an optional notification-only stable Nexo update checker and bounded network access for authored remote brand assets. It never upgrades this plugin automatically.

`release.json` records the immutable Skill source and exact acceptance host. Reproduce this version from its adapter tag `nexo-dsh-v1.2.0` once published, using the committed pack script; use the recorded source rather than a moving branch.
