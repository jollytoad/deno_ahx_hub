export function proxiedUrl(path: string, id: string, url: string): string {
  const targetUrl = new URL(url);
  return `${path}/${id}/${
    targetUrl.pathname.split("/").at(-1)
  }${targetUrl.search}${targetUrl.hash}`;
}
