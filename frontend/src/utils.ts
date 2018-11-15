
export function without<T> (items: T[], item: T) {
  const index = items.indexOf(item);
  if (index !== -1) {
    items = items.slice();
    items.splice(index, 1);
  }
  return items;
}

export function difference(xs: string[], ys: string[]): string[] {
  const result = [];
  for (let x of xs) {
    if (ys.indexOf(x) === -1) {
      result.push(x);
    }
  }
  return result;
}

export async function jsonGet (path: string) : Promise<object> {
  const response = await fetch(
    `${process.env.MOUNT_PATH}${path}`,
    {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
  if (response.status !== 200) {
    throw new Error("server error");
  }
  return await response.json();
}

export async function apiPost (path: string, input: object) : Promise<object> {
  const response = await fetch(
    `${process.env.MOUNT_PATH}${path}`,
    {
      method: 'POST',
      body: JSON.stringify(input),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  if (response.status !== 200) {
    throw new Error("server error");
  }
  return await response.json();
}
