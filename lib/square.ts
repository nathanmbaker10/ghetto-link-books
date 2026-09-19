import { SquareClient, SquareEnvironment } from "square";

export function getSquareEnvironment(): SquareEnvironment {
  return process.env.SQUARE_ENVIRONMENT === "production"
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox;
}

export function isSquareConfigured(): boolean {
  return Boolean(
    process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID,
  );
}

export function getSquareClient(): SquareClient {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) {
    throw new Error("SQUARE_ACCESS_TOKEN is not set.");
  }

  return new SquareClient({
    token,
    environment: getSquareEnvironment(),
  });
}

export function getSquareLocationId(): string {
  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!locationId) {
    throw new Error("SQUARE_LOCATION_ID is not set.");
  }
  return locationId;
}

export function getSiteUrl(): string {
  const explicit = process.env.SITE_URL?.replace(/\/$/, "");
  if (explicit) {
    return explicit;
  }

  const vercelHost = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercelHost) {
    return vercelHost.startsWith("http") ? vercelHost : `https://${vercelHost}`;
  }

  return "http://localhost:3000";
}
