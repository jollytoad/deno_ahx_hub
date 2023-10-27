import init, { HTMLRewriter } from "https://deno.land/x/lol_html@0.0.6/mod.ts";
import { sanitizeElement } from "./sanitizer.ts";

let initPromise: Promise<unknown> | undefined;

export class HtmlSanitizerStream
  extends TransformStream<Uint8Array, Uint8Array> {
  constructor() {
    let rewriter: HTMLRewriter | undefined;

    super({
      async start(controller) {
        if (!initPromise) {
          initPromise = init();
        }

        await initPromise;

        rewriter = new HTMLRewriter(
          "utf8",
          controller.enqueue.bind(controller),
        );

        rewriter.onDocument({
          comments(comment) {
            comment.remove();
          },
        });

        rewriter.on("*", {
          element: sanitizeElement,
          comments(comment) {
            comment.remove();
          },
        });
      },

      transform(chunk) {
        rewriter?.write(chunk);
      },

      flush() {
        try {
          rewriter?.end();
        } finally {
          rewriter?.free();
          rewriter = undefined;
        }
      },
    });
  }
}
