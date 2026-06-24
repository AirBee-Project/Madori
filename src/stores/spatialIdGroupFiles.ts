/**
 * 空間IDグループに紐づく元ファイルのハンドルを保持するモジュール。
 *
 * 再読み込み（ファイル編集後の内容反映）のために、選択時のファイルハンドルを
 * グループIDごとに保持する。File System Access API の FileSystemFileHandle は
 * ホストオブジェクトのため、zustand/immer の状態には入れずここで別管理する。
 */
export type FileHandleLike = {
  name: string;
  getFile: () => Promise<File>;
};

type ShowOpenFilePicker = (options?: {
  types?: { description?: string; accept: Record<string, string[]> }[];
  excludeAcceptAllOption?: boolean;
  multiple?: boolean;
}) => Promise<FileHandleLike[]>;

/**
 * File System Access API（showOpenFilePicker）に対応しているか。
 * 対応: Chromium系（Brave/Chrome/Edge）。非対応: Firefox/Safari。
 */
export function isFileSystemAccessSupported(): boolean {
  return (
    typeof (window as unknown as { showOpenFilePicker?: unknown })
      .showOpenFilePicker === "function"
  );
}

/**
 * <input type="file"> で取得した File を FileHandleLike にラップする。
 * （非対応ブラウザ向けフォールバック。getFile は同じ File を返すため、
 *  再読み込みでの編集反映はブラウザの再読み込み挙動に依存する）
 */
export function fileToHandle(file: File): FileHandleLike {
  return {
    name: file.name,
    getFile: async () => file,
  };
}

const groupFiles = new Map<string, FileHandleLike>();

export function setGroupFile(id: string, handle: FileHandleLike): void {
  groupFiles.set(id, handle);
}

export function getGroupFile(id: string): FileHandleLike | undefined {
  return groupFiles.get(id);
}

export function deleteGroupFile(id: string): void {
  groupFiles.delete(id);
}

/**
 * .txtファイルを選択し、ファイルハンドルを返す。
 * File System Access API 非対応ブラウザの場合は null を返す。
 * ユーザーがキャンセルした場合は例外（AbortError）が投げられる。
 */
export async function pickTextFile(): Promise<FileHandleLike | null> {
  const picker = (
    window as unknown as { showOpenFilePicker?: ShowOpenFilePicker }
  ).showOpenFilePicker;
  if (!picker) return null;

  const [handle] = await picker({
    types: [
      { description: "テキストファイル", accept: { "text/plain": [".txt"] } },
    ],
    multiple: false,
  });
  return handle ?? null;
}

/**
 * .jsonファイルを選択し、ファイルハンドルを返す。
 * File System Access API 非対応ブラウザの場合は null を返す。
 * ユーザーがキャンセルした場合は例外（AbortError）が投げられる。
 */
export async function pickJsonFile(): Promise<FileHandleLike | null> {
  const picker = (
    window as unknown as { showOpenFilePicker?: ShowOpenFilePicker }
  ).showOpenFilePicker;
  if (!picker) return null;

  const [handle] = await picker({
    types: [
      {
        description: "JSONファイル",
        accept: { "application/json": [".json"] },
      },
    ],
    multiple: false,
  });
  return handle ?? null;
}
