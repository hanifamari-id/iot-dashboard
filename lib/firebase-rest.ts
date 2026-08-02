const API_KEY = process.env.FIREBASE_API_KEY || "";
const DB_URL = (process.env.FIREBASE_DB_URL || "").replace(/\/+$/, "");
const AUTH_EMAIL = process.env.FIREBASE_AUTH_EMAIL || "";
const AUTH_PASSWORD = process.env.FIREBASE_AUTH_PASSWORD || "";

let cachedToken: string | null = null;
let tokenExpiresAt = 0;
let lastConnected = false;

export function isConnected(): boolean {
  return lastConnected;
}

async function signIn(): Promise<string> {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: AUTH_EMAIL,
        password: AUTH_PASSWORD,
        returnSecureToken: true,
      }),
    }
  );

  if (!res.ok) {
    lastConnected = false;
    const err = await res.json();
    throw new Error(`Firebase auth gagal: ${err.error?.message || res.statusText}`);
  }

  const data = await res.json();
  cachedToken = data.idToken;
  tokenExpiresAt = Date.now() + Number(data.expiresIn) * 1000 - 60_000;
  return cachedToken!;
}

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }
  return signIn();
}

export async function fetchDB<T = unknown>(path: string): Promise<T> {
  const token = await getToken();
  const url = `${DB_URL}/${path}.json?auth=${token}`;
  const res = await fetch(url);

  if (!res.ok) {
    lastConnected = false;
    const err = await res.json();
    throw new Error(`Firebase fetch gagal (${path}): ${err.error || res.statusText}`);
  }

  lastConnected = true;
  const text = await res.text();
  if (text === "null") return null as T;
  return JSON.parse(text) as T;
}
