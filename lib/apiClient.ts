type JsonBody = unknown;

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  return parseResponse<T>(await fetch(path));
}

export async function apiPost<T>(path: string, body: JsonBody): Promise<T> {
  return parseResponse<T>(
    await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
}

export async function apiPut<T>(path: string, body: JsonBody): Promise<T> {
  return parseResponse<T>(
    await fetch(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
}

export async function apiDelete(path: string): Promise<void> {
  await parseResponse<void>(await fetch(path, { method: 'DELETE' }));
}
