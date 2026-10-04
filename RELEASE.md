# Releasing the Verdant sidescroller

The bundled-asset API and template must ship together. Publish the new artifacts
before deploying the API; merging this template does not publish them.

1. Run `tools/publish_template.py --template phaser-sidescroller --environment dev
   --session-image <deployed-session-image>` from this revision. The publisher
   checks runtime dependencies and publishes matching source, preview and worker.
2. With this API revision, create a fresh development Game Builder project. Check
   Characters (warrior with both states, guardian, wolf), Tilesets, Maps and Images.
   Edit an asset, sync and build again; check all animations, three Fire Axe hits,
   the map and horizontal parallax in the resulting game.
3. After development verification, publish with `--environment prod` and the
   production session image. Confirm the publisher verifies every artifact.
4. Deploy the matching API only after publication succeeds, then repeat the fresh
   project check in production.

`--environment prod` switches the git namespace and the S3 bucket, not the
credentials: the publisher reads `GAME_BUILDER_AWS_*` and `B2_*`, which exist
only in `.env.development.secrets` / `.env.development`. Keep the default env
files for both environments -- passing the production ones drops every key it
needs. `--session-image` is resolved through the local Docker daemon with
`--pull=never`, so the runtime deployed on the sandbox host has to be present
locally before either publish will run.

## Artifact state

Checked 2026-09-18:

| artifact | state |
|---|---|
| `git/sidescroller-verdant-template-dev/git.tar.gz` | exists, 1.0 MB, published from #701 |
| `git/sidescroller-verdant-template/git.tar.gz` | **absent** |

The dev tarball predates the state rename and the map anchor in this branch, so
step 1 is a republish, not a skip. Until it happens, a dev project's database
rows carry the new state folder while its workspace still holds the old one, and
the first resync after an edit breaks the game's `combatConfig.ts` lookup.

## Who can pick it

"Sidescroller" ships to tier-1 users with this API. `shouldShowSidescrollerTemplate`
in `frontend/src/components/GameBuilder/hooks/useSandboxProjectUiVisibility.ts` is
`!IS_PRODUCTION || hasStableGameBuilderAccess(data)`, the predicate the rest of the
builder already shares -- not Anima's developer-only rule.

That makes the order above load-bearing rather than advisory. The frontend
auto-deploys from master on merge, so the option appears for real users as soon
as the API that bundles the template is deployed. **Publish the prod artifacts
first.** If the API ships before step 3, every tier-1 user who picks Sidescroller
creates a project against a B2/S3 prefix that was never written.

If the prod artifacts are not ready when this merges, set that one line back to
`!IS_PRODUCTION || data?.is_developer === true` and widen it again afterwards.

## Rollback

The registry uses `sidescroller-verdant-template` for both B2 and S3 bases. Keep the
previous `sidescroller-template` artifacts untouched: older API instances still
use them during cutover. Do not deploy the new API before its artifacts exist.

After Verdant projects have been created, an API rollback must retain imported
animation playback metadata handling in asset sync. Older sync code loses custom
clip names, aliases and FPS when edited assets are synchronized again.

`CHARACTER_SYNC_VERSION` 12 also re-syncs characters in **every** project, not
just sidescroller ones, and names each character group by its group name rather
than its primary character's name. Asset folders are keyed by id and do not move,
but a game that reads `manifest.characters["<old name>"]` sees the new key after
its first sync.
