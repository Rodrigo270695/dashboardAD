import { timingSafeEqual } from "crypto";

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}

export function validateCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.AUTH_USERNAME;
  const expectedPassword = process.env.AUTH_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    return false;
  }

  return (
    safeCompare(username, expectedUser) &&
    safeCompare(password, expectedPassword)
  );
}
