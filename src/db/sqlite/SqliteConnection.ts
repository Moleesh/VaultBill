export type SqliteBindable = string | number | bigint | Uint8Array | null;

export type SqliteRow = Readonly<Record<string, unknown>>;

export type SqliteConnection = {
  readonly exec: (sql: string) => void;
  readonly get: (
    sql: string,
    parameters?: readonly SqliteBindable[],
  ) => SqliteRow | undefined;
  readonly all: (
    sql: string,
    parameters?: readonly SqliteBindable[],
  ) => readonly SqliteRow[];
  readonly run: (sql: string, parameters?: readonly SqliteBindable[]) => void;
  readonly close: () => void;
};

export class DatabaseRecoveryError extends Error {
  public override readonly name = 'DatabaseRecoveryError';

  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export class DatabaseConfigurationError extends Error {
  public override readonly name = 'DatabaseConfigurationError';

  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}
