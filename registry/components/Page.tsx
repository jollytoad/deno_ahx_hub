import type { Children } from "$jsx/types.ts";
import { Breadcrumbs } from "./Breadcrumbs.tsx";

interface Props {
  breadcrumbs?: Parameters<typeof Breadcrumbs>[0]["breadcrumbs"];
  children?: Children;
}

export function Page({ breadcrumbs = [], children }: Props) {
  return (
    <html>
      <head>
        <title>Registry - Ahh!</title>
        <link
          rel="stylesheet"
          href="https://the.missing.style/v1.0.8/missing.min.css"
        />
        <link rel="stylesheet" href="/static/index.css" />

        <script
          src="https://unpkg.com/htmx.org@1.8.5"
          integrity="sha384-7aHh9lqPYGYZ7sTHvzP1t3BAfLhYSTy9ArHdP3Xsr9/3TlGurYgcPBoFmXX2TX/w"
          crossOrigin="anonymous"
        />
        <script>htmx.logAll();</script>
      </head>
      <body>
        <main>
          <header>
            <h1>Augmented Hypermedia Registry</h1>
            <Breadcrumbs breadcrumbs={breadcrumbs ?? []} />
          </header>

          <>
            {children}
          </>
        </main>
      </body>
    </html>
  );
}
