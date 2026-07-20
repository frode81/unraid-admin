export interface ContainerNetwork {
  ip: string | null;
  mac: string | null;
}

/** Docker's `networkSettings` JSON shape is standard but untyped in the schema. */
export function parseContainerNetwork(networkSettings: unknown): ContainerNetwork {
  if (!networkSettings || typeof networkSettings !== "object") {
    return { ip: null, mac: null };
  }
  const ns = networkSettings as Record<string, unknown>;

  const networks = ns.Networks;
  if (networks && typeof networks === "object") {
    const first = Object.values(networks as Record<string, unknown>)[0];
    if (first && typeof first === "object") {
      const net = first as Record<string, unknown>;
      return {
        ip: typeof net.IPAddress === "string" && net.IPAddress ? net.IPAddress : null,
        mac: typeof net.MacAddress === "string" && net.MacAddress ? net.MacAddress : null,
      };
    }
  }

  return {
    ip: typeof ns.IPAddress === "string" && ns.IPAddress ? (ns.IPAddress as string) : null,
    mac: typeof ns.MacAddress === "string" && ns.MacAddress ? (ns.MacAddress as string) : null,
  };
}

export interface ParsedMount {
  source: string;
  destination: string;
  mode?: string;
}

/**
 * Docker's mount JSON entries are standard (Source/Destination/Mode) but
 * untyped in the schema. Sorted by destination so the order stays stable
 * across polls even if the API doesn't guarantee a consistent order.
 */
export function parseMounts(mounts: unknown[] | null | undefined): ParsedMount[] {
  if (!Array.isArray(mounts)) return [];
  return mounts
    .map((m): ParsedMount | null => {
      if (!m || typeof m !== "object") return null;
      const obj = m as Record<string, unknown>;
      const source = obj.Source ?? obj.source;
      const destination = obj.Destination ?? obj.destination;
      if (typeof source !== "string" || typeof destination !== "string") return null;
      const mode = obj.Mode ?? obj.mode;
      return { source, destination, mode: typeof mode === "string" ? mode : undefined };
    })
    .filter((m): m is ParsedMount => m !== null)
    .sort((a, b) => a.destination.localeCompare(b.destination));
}
