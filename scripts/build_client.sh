#!/bin/sh
# Rebuild the pinned official Supabase browser client without a site build system.
set -eu
arvena_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
arvena_build=$(mktemp -d "${TMPDIR:-/private/tmp}/arvena-client.XXXXXX")
trap 'rm -rf "$arvena_build"' EXIT HUP INT TERM
cp "$arvena_root/scripts/client-package.json" "$arvena_build/package.json"
cp "$arvena_root/scripts/client-package-lock.json" "$arvena_build/package-lock.json"
npm ci --prefix "$arvena_build" --ignore-scripts
printf '%s\n' "export { createClient } from '@supabase/supabase-js';" > "$arvena_build/client.js"
"$arvena_build/node_modules/.bin/esbuild" "$arvena_build/client.js" --bundle --minify --format=iife --global-name=ArvenaSupabase --outfile="$arvena_root/supabase-client.js"
