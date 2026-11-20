import { publicEnv } from "@/lib/env";

const extensionId = publicEnv.extensionId || "nmaljlpliilomdnbbmhejijfhfebhbmf";
const channel = "lockin.tabs.v1";

export type OpenTab = {
  id: number;
  title: string;
  site: string;
  revision: string;
  locked?: boolean;
};

type ExtensionRequest =
  | { action: "list" }
  | { action: "lock"; tabs: Pick<OpenTab, "id" | "revision">[] }
  | { action: "status" }
  | { action: "unlock" };

type ExtensionReply =
  | { action: "list"; tabs: OpenTab[] }
  | { action: "lock"; lockedIds: number[]; lockedCount: number }
  | { action: "status"; lockedCount: number }
  | { action: "unlock"; unlocked: boolean }
  | { action: "error" };

type ChromeRuntime = {
  lastError?: { message?: string };
  sendMessage?: (
    extensionId: string,
    message: ExtensionRequest & { channel: string },
    reply: (response?: ExtensionReply) => void,
  ) => void;
};

export async function sendTabRequest(request: { action: "list" }): Promise<OpenTab[]>;
export async function sendTabRequest(
  request: Extract<ExtensionRequest, { action: "lock" }>,
): Promise<{ lockedIds: number[]; lockedCount: number }>;
export async function sendTabRequest(request: {
  action: "status";
}): Promise<{ lockedCount: number }>;
export async function sendTabRequest(request: { action: "unlock" }): Promise<boolean>;
export async function sendTabRequest(request: ExtensionRequest) {
  const runtime = (window as Window & { chrome?: { runtime?: ChromeRuntime } }).chrome?.runtime;
  return new Promise<
    OpenTab[] | { lockedIds: number[]; lockedCount: number } | { lockedCount: number } | boolean
  >((resolve, reject) => {
    if (!runtime?.sendMessage) {
      reject(new Error("The Chrome extension is unavailable"));
      return;
    }

    runtime.sendMessage(extensionId, { channel, ...request }, (response) => {
      if (runtime.lastError || response?.action !== request.action) {
        reject(new Error(runtime.lastError?.message ?? "The extension request failed"));
        return;
      }

      if (response.action === "list") {
        resolve(response.tabs);
      } else if (response.action === "lock") {
        resolve({ lockedIds: response.lockedIds, lockedCount: response.lockedCount });
      } else if (response.action === "status") {
        resolve({ lockedCount: response.lockedCount });
      } else if (response.action === "unlock") {
        resolve(response.unlocked);
      }
    });
  });
}
