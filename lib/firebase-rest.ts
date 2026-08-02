function getApiKey(): string {
  return process.env.FIREBASE_API_KEY || "";
}

function getDbUrl(): string {
  return (process.env.FIREBASE_DB_URL || "").replace(/\/+$/, "");
}

function getAuthEmail(): string {
  return process.env.FIREBASE_AUTH_EMAIL || "";
}

function getAuthPassword(): string {
  return process.env.FIREBASE_AUTH_PASSWORD || "";
}

let cachedToken: string | null = null;
let tokenExpiresAt = 0;
let lastConnected = false;

export function isConnected(): boolean {
  return lastConnected;
}

async function signIn(): Promise<string> {
  const apiKey = getApiKey();
  const email = getAuthEmail();
  const password = getAuthPassword();

  if (!apiKey || !email || !password) {
    lastConnected = false;
    throw new Error(
      "Firebase auth failed: Missing FIREBASE_API_KEY, FIREBASE_AUTH_EMAIL, or FIREBASE_AUTH_PASSWORD environment variables."
    );
  }

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
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
  const dbUrl = getDbUrl();
  if (!dbUrl) {
    lastConnected = false;
    throw new Error(
      "Firebase fetch failed: Missing FIREBASE_DB_URL environment variable."
    );
  }

  const token = await getToken();
  const url = `${dbUrl}/${path}.json?auth=${token}`;
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
