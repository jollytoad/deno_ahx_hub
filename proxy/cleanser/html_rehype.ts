import { unified } from "https://esm.sh/unified@10.1.2";
import rehypeParse from "https://esm.sh/rehype-parse@8.0.4";
import rehypeSanitize, {
  defaultSchema,
} from "https://esm.sh/rehype-sanitize@5.0.1";
import rehypeStringify from "https://esm.sh/rehype-stringify@9.0.3";
import { deepMerge } from "$std/collections/deep_merge.ts";

// hast-util-sanitize doesn't support wildcard attribute name matching,
// so we can't just match hx-* attrs.

const schema = deepMerge(defaultSchema, {
  attributes: {
    "*": [],
  },
}, { arrays: "merge" });

export default () => async (res: Response): Promise<Response> => {
  const rawContent = await res.text();

  const cleanContent = (await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeSanitize, schema)
    .use(rehypeStringify)
    .process(rawContent))
    .toString();

  // if (cleanContent !== rawContent) {
  //   console.debug(
  //     "---- CLEANED: ----\n",
  //     rawContent,
  //     "\n---- TO: ----\n",
  //     cleanContent,
  //     "\n----",
  //   );
  // }

  return new Response(cleanContent, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
};
