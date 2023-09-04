import type { Children } from "$jsx/types.ts";
import { Breadcrumbs } from "./Breadcrumbs.tsx";
import { UserWidget } from "./UserWidget.tsx";
import css from "./css.ts";

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
          href="https://unpkg.com/missing.css@1.1.0/dist/missing.min.css"
        />
        <style>{css}</style>

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
            <UserWidget />
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
