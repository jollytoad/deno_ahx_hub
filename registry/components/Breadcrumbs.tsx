interface Props {
  breadcrumbs: [string, string][];
}

export function Breadcrumbs({ breadcrumbs }: Props) {
  return (
    <nav class="breadcrumbs" aria-label="Breadcrumbs">
      <ol>
        {breadcrumbs.map(([text, href], index, all) => (
          <li>
            <a
              href={href}
              aria-current={index === all.length - 1 ? "page" : undefined}
            >
              {text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
