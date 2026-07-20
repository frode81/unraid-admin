export interface SystemInfo {
  os: {
    platform: string | null;
    distro: string | null;
    release: string | null;
    hostname: string | null;
    uptime: string | null;
    kernel: string | null;
  };
  cpu: {
    manufacturer: string | null;
    brand: string | null;
    cores: number | null;
    threads: number | null;
  };
  versions: {
    core: {
      unraid: string | null;
    };
  } | null;
}

export interface Metrics {
  cpu: {
    percentTotal: number;
    cpus: { percentTotal: number }[];
  } | null;
  memory: {
    total: string;
    used: string;
    free: string;
    percentTotal: number;
  } | null;
  temperature: {
    summary: {
      average: number;
      warningCount: number;
      criticalCount: number;
      hottest: {
        name: string;
        current: { value: number; unit: string };
      };
    };
  } | null;
  network: {
    name: string;
    rxSec: number;
    txSec: number;
  }[];
}

export type ArrayState =
  | "STARTED"
  | "STOPPED"
  | "NEW_ARRAY"
  | "RECON_DISK"
  | "DISABLE_DISK"
  | "SWAP_DSBL"
  | "INVALID_EXPANSION"
  | "PARITY_NOT_BIGGEST"
  | "TOO_MANY_MISSING_DISKS"
  | "NEW_DISK_TOO_SMALL"
  | "NO_DATA_DISKS";

export type ArrayDiskStatus =
  | "DISK_NP"
  | "DISK_OK"
  | "DISK_NP_MISSING"
  | "DISK_INVALID"
  | "DISK_WRONG"
  | "DISK_DSBL"
  | "DISK_NP_DSBL"
  | "DISK_DSBL_NEW"
  | "DISK_NEW";

export interface ArrayDisk {
  id: string;
  name: string | null;
  device: string | null;
  size: string | null;
  status: ArrayDiskStatus | null;
  temp: number | null;
  fsSize: string | null;
  fsFree: string | null;
  fsUsed: string | null;
}

export interface Capacity {
  free: string;
  used: string;
  total: string;
}

export interface UnraidArray {
  state: ArrayState;
  capacity: {
    kilobytes: Capacity;
    disks: Capacity;
  };
  disks: ArrayDisk[];
  caches: ArrayDisk[];
  parities: ArrayDisk[];
}

export type ContainerState = "RUNNING" | "PAUSED" | "EXITED";

export interface ContainerPort {
  ip: string | null;
  privatePort: number | null;
  publicPort: number | null;
  type: string;
}

export interface DockerContainer {
  id: string;
  names: string[];
  image: string;
  state: ContainerState;
  status: string;
  autoStart: boolean;
  autoStartOrder: number | null;
  autoStartWait: number | null;
  created: number;
  command: string;
  webUiUrl: string | null;
  iconUrl: string | null;
  isUpdateAvailable: boolean | null;
  projectUrl: string | null;
  supportUrl: string | null;
  registryUrl: string | null;
  ports: ContainerPort[];
  lanIpPorts: string[] | null;
  networkSettings: unknown;
  mounts: unknown[] | null;
  hostConfig: { networkMode: string } | null;
}

export interface DockerContainerStats {
  id: string;
  cpuPercent: number;
  memUsage: string;
  memPercent: number;
  netIO: string;
  blockIO: string;
}

export type VmState =
  | "NOSTATE"
  | "RUNNING"
  | "IDLE"
  | "PAUSED"
  | "SHUTDOWN"
  | "SHUTOFF"
  | "CRASHED"
  | "PMSUSPENDED";

export interface VmDomain {
  id: string;
  name: string | null;
  state: VmState;
}

export interface ConnectionTestResult {
  ok: boolean;
  message: string;
}

export interface Share {
  id: string;
  name: string | null;
  free: string | null;
  used: string | null;
  size: string | null;
  cache: boolean | null;
  comment: string | null;
  luksStatus: string | null;
  include: string[] | null;
  exclude: string[] | null;
  allocator: string | null;
  splitLevel: string | null;
  floor: string | null;
  cow: string | null;
  color: string | null;
}

export type DiskInterfaceType = "SAS" | "SATA" | "USB" | "PCIE" | "UNKNOWN";
export type DiskSmartStatus = "OK" | "UNKNOWN";

export interface Disk {
  id: string;
  device: string;
  type: string;
  name: string;
  vendor: string;
  size: number;
  serialNum: string;
  interfaceType: DiskInterfaceType;
  smartStatus: DiskSmartStatus;
  temperature: number | null;
  isSpinning: boolean;
}

export type RegistrationType =
  | "BASIC"
  | "PLUS"
  | "PRO"
  | "STARTER"
  | "UNLEASHED"
  | "LIFETIME"
  | "INVALID"
  | "TRIAL";

export interface Registration {
  type: RegistrationType | null;
  state: string | null;
  expiration: string | null;
}

export type NotificationImportance = "ALERT" | "INFO" | "WARNING";

export interface UnraidNotification {
  id: string;
  title: string;
  subject: string;
  description: string;
  importance: NotificationImportance;
  link: string | null;
  timestamp: string | null;
  formattedTimestamp: string | null;
}

export interface NotificationCounts {
  info: number;
  warning: number;
  alert: number;
  total: number;
}

export interface NotificationOverview {
  unread: NotificationCounts;
  archive: NotificationCounts;
}
