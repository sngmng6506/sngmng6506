# Profile repository views graph

Uses [gayanvoice/github-profile-views-counter](https://github.com/gayanvoice/github-profile-views-counter) and its action (5.0.0, pinned commit).

## One-time setup

1. Create a fine-grained GitHub personal access token. Select only `sngmng6506/sngmng6506`, grant repository **Administration: Read-only**, and **Contents: Read-only** (Metadata is automatic). Administration read access is required by the repository traffic API.
2. Save it as an Actions repository secret named `INSIGHTS_TOKEN`. Do not paste the token into a file or chat.
3. In Actions, open **Daily profile repository views** and run the workflow on main.

The first successful run replaces the Komarev badge with only the monthly graph. Before the first success, the current README stays intact to avoid a broken image.

Runs daily at 09:17 KST (scheduled runs may be delayed). Traffic dates use UTC. The graph shows repository views and daily unique visitors, not direct profile-page visits. It starts with whatever recent traffic GitHub returns; older history cannot be reconstructed.

## Storage

The `master` branch is used exclusively for upstream-generated cache, graphs, tables and README. The profile is served from `main`. Upstream hardcodes pushes to `master` and rewrites its README, so do not merge that branch into main or edit its cache manually.

Repository pushes use the workflow's built-in GITHUB_TOKEN; INSIGHTS_TOKEN is used to read traffic. When the token expires, replace the secret and rerun. Graph generation failures leave the profile README intact.
