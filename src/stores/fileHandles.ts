/**
 * 再読み込み（ファイル編集後の内容反映）のため、選択したファイルのハンドルを
 * グループIDごとに保持する。File System Access API の FileSystemFileHandle は
 * ホストオブジェクトのため、zustand/immer の状態には入れずここで別管理する。
 */
export type FileHandleLike = {
  name: string;
  getFile: () => Promise<File>;
};

export type FileFormat = "txt" | "json";

type ShowOpenFilePicker = (options?: {
  types?: { description?: string; accept: Record<string, string[]> }[];
  multiple?: boolean;
}) => Promise<FileHandleLike[]>;

type HandleItem = DataTransferItem & {
  getAsFileSystemHandle?: () => Promise<
    (FileHandleLike & { kind: "file" | "directory" }) | null
  >;
};

const PICKER_TYPES: Record<
  FileFormat,
  { description: string; accept: Record<string, string[]> }
> = {
  txt: { description: "テキストファイル", accept: { "text/plain": [".txt"] } },
  json: {
    description: "JSONファイル",
    accept: { "application/json": [".json"] },
  },
};

const handles = new Map<string, FileHandleLike>();

export function setFileHandle(id: string, handle: FileHandleLike): void {
  handles.set(id, handle);
}

export function getFileHandle(id: string): FileHandleLike | undefined {
  return handles.get(id);
}

export function deleteFileHandle(id: string): void {
  handles.delete(id);
}

/**
 * <input type="file"> で取得した File を FileHandleLike にラップする。
 * getFile は同じ File を返すため、再読み込みでの編集反映はブラウザの挙動に依存する
 */
function fileToHandle(file: File): FileHandleLike {
  return { name: file.name, getFile: async () => file };
}

/** File System Access API 非対応のブラウザ（Firefox/Safari）向け */
function pickWithInput(format: FileFormat): Promise<FileHandleLike | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = `.${format}`;
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      resolve(file ? fileToHandle(file) : null);
    });
    input.addEventListener("cancel", () => resolve(null));
    input.click();
  });
}

/** ファイルを1つ選ばせる。キャンセルされたら null を返す */
export async function pickFile(
  format: FileFormat,
): Promise<FileHandleLike | null> {
  const picker = (
    window as unknown as { showOpenFilePicker?: ShowOpenFilePicker }
  ).showOpenFilePicker;
  if (!picker) return pickWithInput(format);

  try {
    const [handle] = await picker({
      types: [PICKER_TYPES[format]],
      multiple: false,
    });
    return handle ?? null;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") return null;
    throw err;
  }
}

/**
 * ドロップされたファイルのハンドルを返す。
 * DataTransfer はイベント処理中しか読めないため、await より前にすべての項目を取り出す
 */
export function droppedFiles(data: DataTransfer): Promise<FileHandleLike[]> {
  const pending = [...data.items]
    .filter((item) => item.kind === "file")
    .map((item: HandleItem) => {
      const file = item.getAsFile();
      const handle = item.getAsFileSystemHandle?.() ?? Promise.resolve(null);
      return handle.then((h) =>
        h?.kind === "file" ? h : file ? fileToHandle(file) : null,
      );
    });
  return Promise.all(pending).then((list) =>
    list.filter((h): h is FileHandleLike => h !== null),
  );
}

export function fileFormatOf(name: string): FileFormat | null {
  const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  return ext === "txt" || ext === "json" ? ext : null;
}
