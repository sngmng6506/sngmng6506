# Activity Atlas

Static interactive map based on public profile links. Edit `data.json` to add nodes and relationships, then run `python scripts/build-activity-preview.py` and commit the regenerated preview.

Node levels: 0 overview, 1 topics (zoom ≥ 0.95), 2 detail (zoom ≥ 1.65). Positions are stable initial coordinates; dragging is session-only. Add edges only for evidenced relationships. Individual blog posts are not automatically fetched.

GitHub Pages setup: repository Settings → Pages → Source → GitHub Actions. Run **Publish activity map**. The map URL for this repository is `https://sngmng6506.github.io/sngmng6506/activity-map/`.

`README.md` can link `docs/activity-map/preview.svg` to the map after deployment is confirmed. The page uses no analytics, external scripts, build dependencies or backend. All graph nodes can be selected using keyboard; search finds nodes at every detail level.
