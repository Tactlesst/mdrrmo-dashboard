export async function swrJsonFetcher(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error('Request failed');
    err.status = res.status;
    try {
      err.info = await res.json();
    } catch {
      err.info = null;
    }
    throw err;
  }
  return res.json();
}
