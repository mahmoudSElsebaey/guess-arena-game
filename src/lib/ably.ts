import "server-only";
import * as Ably from "ably";
import { getServerEnv } from "@/lib/env";

let restClient: Ably.Rest | undefined;

export function getAblyRestClient() {
  if (restClient) return restClient;

  const { ABLY_API_KEY } = getServerEnv();
  if (!ABLY_API_KEY) {
    throw new Error("ABLY_API_KEY is not configured.");
  }

  restClient = new Ably.Rest({ key: ABLY_API_KEY });
  return restClient;
}
