/** @format */

import { DatabaseSync } from 'node:sqlite';

import type { SqliteBindable, SqliteConnection, SqliteRow } from '../sqlite/SqliteConnection';

export class NodeSqliteConnection implements SqliteConnection {
    readonly #database: DatabaseSync;

    public constructor(databasePath: string) {
        this.#database = new DatabaseSync(databasePath);
    }

    public exec = (sql: string) => {
        this.#database.exec(sql);
    };

    public get = (sql: string, parameters: readonly SqliteBindable[] = []): SqliteRow | undefined =>
        this.#database.prepare(sql).get(...parameters);

    public all = (sql: string, parameters: readonly SqliteBindable[] = []): readonly SqliteRow[] =>
        this.#database.prepare(sql).all(...parameters);

    public run = (sql: string, parameters: readonly SqliteBindable[] = []) => {
        this.#database.prepare(sql).run(...parameters);
    };

    public close = () => {
        this.#database.close();
    };
}

export const openNodeSqliteConnection = (databasePath: string): SqliteConnection =>
    new NodeSqliteConnection(databasePath);
