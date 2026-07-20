import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "./api";
import { useRefreshInterval } from "./settings";
import type {
  Disk,
  DockerContainer,
  Metrics,
  NotificationOverview,
  Registration,
  Share,
  SystemInfo,
  UnraidArray,
  UnraidNotification,
  VmDomain,
} from "./types";

const SYSTEM_INFO_QUERY = `
  query SystemInfo {
    info {
      os { platform distro release hostname uptime kernel }
      cpu { manufacturer brand cores threads }
      versions { core { unraid } }
    }
    metrics {
      cpu { percentTotal cpus { percentTotal } }
      memory { total used free percentTotal }
      temperature {
        summary {
          average
          warningCount
          criticalCount
          hottest { name current { value unit } }
        }
      }
      network { name rxSec txSec }
    }
  }
`;

export function useSystemInfo() {
  const { activeInterval } = useRefreshInterval();
  return useQuery({
    queryKey: ["system-info"],
    queryFn: () =>
      graphqlRequest<{ info: SystemInfo; metrics: Metrics }>(SYSTEM_INFO_QUERY),
    refetchInterval: activeInterval,
  });
}

const ARRAY_QUERY = `
  query ArrayStatus {
    array {
      state
      capacity {
        kilobytes { free used total }
        disks { free used total }
      }
      disks { id name device size status temp fsSize fsFree fsUsed }
      caches { id name device size status temp fsSize fsFree fsUsed }
      parities { id name device size status temp }
    }
  }
`;

export function useArrayStatus() {
  const { activeInterval } = useRefreshInterval();
  return useQuery({
    queryKey: ["array-status"],
    queryFn: () => graphqlRequest<{ array: UnraidArray }>(ARRAY_QUERY),
    refetchInterval: activeInterval,
  });
}

const DOCKER_CONTAINERS_QUERY = `
  query DockerContainers {
    docker {
      containers {
        id
        names
        image
        state
        status
        autoStart
        autoStartOrder
        autoStartWait
        created
        command
        webUiUrl
        iconUrl
        isUpdateAvailable
        projectUrl
        supportUrl
        registryUrl
        ports { ip privatePort publicPort type }
        lanIpPorts
        networkSettings
        mounts
        hostConfig { networkMode }
      }
    }
  }
`;

export function useDockerContainers() {
  const { activeInterval } = useRefreshInterval();
  return useQuery({
    queryKey: ["docker-containers"],
    queryFn: () =>
      graphqlRequest<{ docker: { containers: DockerContainer[] } }>(
        DOCKER_CONTAINERS_QUERY,
      ),
    refetchInterval: activeInterval,
  });
}

const DOCKER_UPDATE_MUTATION = `
  mutation UpdateContainer($id: PrefixedID!) {
    docker {
      updateContainer(id: $id) { id state status }
    }
  }
`;

export function useDockerUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => graphqlRequest(DOCKER_UPDATE_MUTATION, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["docker-containers"] });
    },
  });
}

const DOCKER_REMOVE_MUTATION = `
  mutation RemoveContainer($id: PrefixedID!, $withImage: Boolean) {
    docker {
      removeContainer(id: $id, withImage: $withImage)
    }
  }
`;

export function useDockerRemove() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, withImage }: { id: string; withImage: boolean }) =>
      graphqlRequest(DOCKER_REMOVE_MUTATION, { id, withImage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["docker-containers"] });
    },
  });
}

const UPDATE_AUTOSTART_MUTATION = `
  mutation UpdateAutostart($entries: [DockerAutostartEntryInput!]!) {
    docker {
      updateAutostartConfiguration(entries: $entries)
    }
  }
`;

export function useDockerAutostart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entry: { id: string; autoStart: boolean; wait?: number | null }) =>
      graphqlRequest(UPDATE_AUTOSTART_MUTATION, { entries: [entry] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["docker-containers"] });
    },
  });
}

type DockerAction = "start" | "stop" | "restart" | "pause" | "unpause";

const DOCKER_ACTION_MUTATION = `
  mutation DockerAction($id: PrefixedID!) {
    docker {
      result: __ACTION__(id: $id) { id state status }
    }
  }
`;

/**
 * Container ids the user just stopped/restarted/paused from within this app.
 * The notification watcher checks this before reporting a running→exited
 * transition as an unexpected crash, since we caused this one on purpose.
 */
export const suppressedContainerIds = new Set<string>();

/**
 * Some Unraid API versions don't expose a `restart` field on `DockerMutations`
 * (only start/stop/pause/unpause). Restart is implemented client-side as a
 * stop followed by a start so it works regardless of server API version.
 */
async function runDockerAction(id: string, action: DockerAction) {
  if (action === "restart") {
    await graphqlRequest(DOCKER_ACTION_MUTATION.replace("__ACTION__", "stop"), { id });
    return graphqlRequest(DOCKER_ACTION_MUTATION.replace("__ACTION__", "start"), { id });
  }
  return graphqlRequest(DOCKER_ACTION_MUTATION.replace("__ACTION__", action), { id });
}

export function useDockerAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: DockerAction }) => runDockerAction(id, action),
    onMutate: ({ id, action }) => {
      if (action === "stop" || action === "restart" || action === "pause") {
        suppressedContainerIds.add(id);
        setTimeout(() => suppressedContainerIds.delete(id), 20_000);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["docker-containers"] });
    },
  });
}

const SHARES_QUERY = `
  query Shares {
    shares {
      id
      name
      free
      used
      size
      cache
      comment
      luksStatus
      include
      exclude
      allocator
      splitLevel
      floor
      cow
      color
    }
  }
`;

export function useShares() {
  const { activeInterval } = useRefreshInterval();
  return useQuery({
    queryKey: ["shares"],
    queryFn: () => graphqlRequest<{ shares: Share[] }>(SHARES_QUERY),
    refetchInterval: activeInterval,
  });
}

const VMS_QUERY = `
  query Vms {
    vms {
      domains {
        id
        name
        state
      }
    }
  }
`;

export function useVms() {
  const { activeInterval } = useRefreshInterval();
  return useQuery({
    queryKey: ["vms"],
    queryFn: () => graphqlRequest<{ vms: { domains: VmDomain[] } }>(VMS_QUERY),
    refetchInterval: activeInterval,
  });
}

type VmAction = "start" | "stop" | "pause" | "resume" | "forceStop" | "reboot" | "reset";

const VM_ACTION_MUTATION = `
  mutation VmAction($id: PrefixedID!) {
    vm {
      result: __ACTION__(id: $id)
    }
  }
`;

export function useVmAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: VmAction }) =>
      graphqlRequest(VM_ACTION_MUTATION.replace("__ACTION__", action), { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vms"] });
    },
  });
}

const DISKS_QUERY = `
  query Disks {
    disks {
      id
      device
      type
      name
      vendor
      size
      serialNum
      interfaceType
      smartStatus
      temperature
      isSpinning
    }
  }
`;

export function useDisks() {
  const { activeInterval } = useRefreshInterval();
  return useQuery({
    queryKey: ["disks"],
    queryFn: () => graphqlRequest<{ disks: Disk[] }>(DISKS_QUERY),
    refetchInterval: activeInterval,
  });
}

const REGISTRATION_QUERY = `
  query Registration {
    registration {
      type
      state
      expiration
    }
  }
`;

export function useRegistration() {
  return useQuery({
    queryKey: ["registration"],
    queryFn: () => graphqlRequest<{ registration: Registration | null }>(REGISTRATION_QUERY),
    staleTime: 60 * 60 * 1000,
  });
}

const NOTIFICATIONS_QUERY = `
  query Notifications {
    notifications {
      overview {
        unread { info warning alert total }
        archive { info warning alert total }
      }
      warningsAndAlerts {
        id
        title
        subject
        description
        importance
        link
        timestamp
        formattedTimestamp
      }
    }
  }
`;

export function useNotifications() {
  const { activeInterval } = useRefreshInterval();
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      graphqlRequest<{
        notifications: { overview: NotificationOverview; warningsAndAlerts: UnraidNotification[] };
      }>(NOTIFICATIONS_QUERY),
    refetchInterval: activeInterval,
  });
}

const ARCHIVE_NOTIFICATION_MUTATION = `
  mutation ArchiveNotification($id: PrefixedID!) {
    archiveNotification(id: $id) { id }
  }
`;

export function useArchiveNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => graphqlRequest(ARCHIVE_NOTIFICATION_MUTATION, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
