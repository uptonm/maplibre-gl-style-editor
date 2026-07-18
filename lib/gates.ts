import { createClerkClient } from "@clerk/backend";

const CACHE_TTL_MS = 60_000;

let cachedGate: { expiresAt: number; isGated: boolean } | undefined;
let pendingGateLookup: Promise<boolean> | undefined;

/**
 * Reads this app's gate from the fleet operations organization. The module
 * cache limits Clerk Backend API reads to one per minute per runtime instance.
 */
export async function isAppGated(): Promise<boolean> {
  if (cachedGate && cachedGate.expiresAt > Date.now()) {
    return cachedGate.isGated;
  }

  if (!pendingGateLookup) {
    pendingGateLookup = readGate().finally(() => {
      pendingGateLookup = undefined;
    });
  }

  return pendingGateLookup;
}

async function readGate(): Promise<boolean> {
  const organizationId = process.env.GATES_ORG_ID;
  const appId = process.env.GATES_APP_ID;
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (!organizationId || !appId || !secretKey) {
    throw new Error(
      "GATES_ORG_ID, GATES_APP_ID, and CLERK_SECRET_KEY must be configured in production.",
    );
  }

  const client = createClerkClient({ secretKey });
  const organization = await client.organizations.getOrganization({
    organizationId,
  });
  const gates = organization.publicMetadata?.gates;
  const isGated =
    typeof gates === "object" &&
    gates !== null &&
    !Array.isArray(gates) &&
    (gates as Record<string, unknown>)[appId] === true;

  cachedGate = {
    isGated,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };

  return isGated;
}
