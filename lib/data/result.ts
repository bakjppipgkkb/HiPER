export type DataResult<T> =
  | { status: "ready"; data: T }
  | { status: "unconfigured"; data: T }
  | { status: "error"; data: T; message: string };
