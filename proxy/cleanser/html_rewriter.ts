import { replaceBody } from "$http_fns/response/replace_body.ts";
import { HtmlSanitizerStream } from "../../lib/HtmlSanitizerStream.ts";

export default () => (res: Response): Response => {
  if (res.body) {
    return replaceBody(res, res.body.pipeThrough(new HtmlSanitizerStream()));
  }
  return res;
};
