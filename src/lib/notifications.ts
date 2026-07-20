import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

let permissionGranted: boolean | null = null;

async function ensurePermission(): Promise<boolean> {
  if (permissionGranted !== null) return permissionGranted;
  permissionGranted = await isPermissionGranted();
  if (!permissionGranted) {
    const result = await requestPermission();
    permissionGranted = result === "granted";
  }
  return permissionGranted;
}

export async function notify(title: string, body: string) {
  const granted = await ensurePermission();
  if (!granted) return;
  sendNotification({ title, body });
}
