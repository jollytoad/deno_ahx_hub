import * as esbuild from "https://deno.land/x/esbuild@v0.19.7/mod.js";
import { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.8.2/mod.ts";
import { fromFileUrl } from "$std/path/mod.ts";
import { parseArgs } from "$std/cli/parse_args.ts";

export async function bundle(opts?: { watch?: boolean }) {
  console.log("Bundling static hx scripts");

  const configPath = fromFileUrl(import.meta.resolve("../deno.json"));

  const ctxs = [
    await esbuild.context({
      plugins: [...denoPlugins({ configPath })],
      entryPoints: ["ahx/index.ts"],
      bundle: true,
      minify: true,
      sourcemap: true,
      // target: ['chrome58', 'firefox57', 'safari11', 'edge16'],
      outfile: "registry/static/index.js",
      logLevel: "debug",
      logOverride: {
        "direct-eval": "silent",
      },
    }),
  ];

  await Promise.all(ctxs.map((ctx) => ctx.rebuild()));

  if (opts?.watch) {
    await Promise.all(ctxs.map((ctx) => ctx.watch()));
  } else {
    esbuild.stop();
  }
}

if (import.meta.main) {
  const { watch } = parseArgs(Deno.args);
  bundle({ watch });
}
