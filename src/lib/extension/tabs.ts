import { publicEnv } from "@/lib/env";

const extensionId = publicEnv.extensionId || "nmaljlpliilomdnbbmhejijfhfebhbmf";
const channel = "lockin.tabs.v1";

export type OpenTab = {
  id: number;
  title: string;
  site: string;
  revision: string;
};

type ExtensionRequest =
  { action: "list" } | { action: "close"; tabs: Pick<OpenTab, "id" | "revision">[] };

type ExtensionReply =
  | { action: "list"; tabs: OpenTab[] }
  | { action: "close"; closedIds: number[] }
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
  request: Extract<ExtensionRequest, { action: "close" }>,
): Promise<number[]>;
export async function sendTabRequest(request: ExtensionRequest) {
  const runtime = (window as Window & { chrome?: { runtime?: ChromeRuntime } }).chrome?.runtime;
  return new Promise<OpenTab[] | number[]>((resolve, reject) => {
    if (!runtime?.sendMessage) {
      reject(new Error("The Chrome extension is unavailable"));
      return;
    }

    runtime.sendMessage(extensionId, { channel, ...request }, (response) => {
      if (runtime.lastError || response?.action !== request.action) {
        reject(new Error(runtime.lastError?.message ?? "The extension request failed"));
        return;
      }

      resolve(response.action === "list" ? response.tabs : response.closedIds);
    });
  });
}
