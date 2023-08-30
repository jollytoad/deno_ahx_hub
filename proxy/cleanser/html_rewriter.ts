import { replaceBody } from "$http_fns/response/replace_body.ts";
import init, {
  type DocumentHandlers,
  type ElementHandlers,
  HTMLRewriter,
} from "https://deno.land/x/lol_html@0.0.6/mod.ts";

let initPromise: Promise<unknown> | undefined;

// TODO: Create sanitizer handlers

const handlers: RewriterHandlers = {
  onDocument: [{
    comments(comment) {
      comment.remove();
    },
  }],
  onElements: [
    ["script", {
      element(el) {
        el.remove();
      },
    }],
    ["*", {
      // This is an example
      element(el) {
        el.setAttribute("data-rewrite", "true");
      },
    }],
  ],
};

export default () =>
async (
  res: Response,
  _prefix: string,
): Promise<Response> => {
  if (!initPromise) {
    initPromise = init();
  }
  await initPromise;

  // TODO: prefix ids

  const out = res.body?.pipeThrough(htmlRewriterStream(handlers));

  return out ? replaceBody(res, out) : res;
};

interface RewriterHandlers {
  onDocument?: DocumentHandlers[];
  onElements?: [selector: string, handlers: ElementHandlers][];
}

function htmlRewriterStream({ onDocument, onElements }: RewriterHandlers) {
  let controller: TransformStreamDefaultController<Uint8Array>;

  function sink(chunk: Uint8Array) {
    controller?.enqueue(chunk);
  }

  let rewriter = new HTMLRewriter("utf8", sink);

  onDocument?.forEach((handlers) => {
    rewriter = rewriter.onDocument(handlers);
  });

  onElements?.forEach(([selector, handlers]) => {
    rewriter = rewriter.on(selector, handlers);
  });

  const transformer: Transformer<Uint8Array> = {
    start(c) {
      controller = c;
    },

    transform(chunk) {
      rewriter.write(chunk);
    },

    flush() {
      try {
        rewriter.end();
      } finally {
        rewriter.free();
      }
    },
  };

  return new TransformStream(transformer);
}
