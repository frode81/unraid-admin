import { invoke } from "@tauri-apps/api/core";
import type { ConnectionTestResult } from "./types";

export async function getConnectionHost(): Promise<string | null> {
  return invoke<string | null>("get_connection_host");
}

export async function saveConnection(host: string, apiKey: string): Promise<void> {
  return invoke("save_connection", { host, apiKey });
}

export async function clearConnection(): Promise<void> {
  return invoke("clear_connection");
}

export async function testConnection(host: string, apiKey: string): Promise<ConnectionTestResult> {
  return invoke<ConnectionTestResult>("test_connection", { host, apiKey });
}

export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  return invoke<T>("graphql_request", { query, variables });
}
