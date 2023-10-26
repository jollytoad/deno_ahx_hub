import { delay } from "$std/async/delay.ts";
import { assertEquals } from "$std/assert/assert_equals.ts";
import {
  SubstitutionStream,
  type SubstitutionStreamOptions,
} from "./SubstitutionStream.ts";

Deno.test("No substitutes", async () => {
  const result = await sub(["Nothing %HERE% ", "to see!"]);

  assertEquals(result, "Nothing %HERE% to see!");
});

Deno.test("Substitute within a chunk", async () => {
  const result = await sub(["Nothing %HERE% ", "to see!"], {
    substitute: () => "much",
  });

  assertEquals(result, "Nothing much to see!");
});

Deno.test("Substitute across a chunk, start", async () => {
  const result = await sub(["Nothing %", "HERE% to see!"], {
    substitute: () => "much",
  });

  assertEquals(result, "Nothing much to see!");
});

Deno.test("Substitute across a chunk, mid", async () => {
  const result = await sub(["Nothing %HE", "RE% to see!"], {
    substitute: () => "much",
  });

  assertEquals(result, "Nothing much to see!");
});

Deno.test("Substitute across a chunk, end", async () => {
  const result = await sub(["Nothing %HERE", "% to see!"], {
    substitute: () => "much",
  });

  assertEquals(result, "Nothing much to see!");
});

Deno.test("Partial substitution is flushed", async () => {
  const result = await sub(["Nothing here", " to %SEE"], {
    substitute: () => "hear",
  });

  assertEquals(result, "Nothing here to %SEE");
});

function sub(
  chunks: string[],
  options?: SubstitutionStreamOptions,
): Promise<string> {
  return new Response(
    /* @ts-ignore: from exists on ReadableStream in Deno */
    ReadableStream.from(yieldChunks(chunks))
      .pipeThrough(new SubstitutionStream(options))
      .pipeThrough(new TextEncoderStream()),
  ).text();
}

async function* yieldChunks(chunks: string[]): AsyncIterable<string> {
  for (const chunk of chunks) {
    await delay(1);
    yield chunk;
  }
}
