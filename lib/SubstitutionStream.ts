export interface SubstitutionStreamOptions {
  substitute: (content: string) => string | undefined;
}

export class SubstitutionStream extends TransformStream<string, string> {
  constructor(options?: SubstitutionStreamOptions) {
    let carried: string | undefined;

    super({
      transform(chunk, controller) {
        if (options?.substitute) {
          if (carried) {
            chunk = carried + chunk;
            carried = undefined;
          }

          chunk = chunk.replaceAll(
            /(?<delim>[%_])([A-Z_]+)\k<delim>/g,
            (match, _, key) => {
              return options.substitute(key) ?? match;
            },
          );

          const m = chunk.match(/^([^%_]*)([%_][A-Z_]*)$/);
          if (m) {
            chunk = m[1];
            carried = m[2];
          }
        }

        controller.enqueue(chunk);
      },

      flush(controller) {
        if (carried) {
          controller.enqueue(carried);
          carried = undefined;
        }
      },
    });
  }
}
