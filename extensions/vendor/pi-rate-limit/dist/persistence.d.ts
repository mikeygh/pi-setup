export interface PersistenceStore {
    load<T>(key: string, fallback: T): T;
    save<T>(key: string, data: T): void;
}
/**
 * In-memory store with optional JSON file persistence.
 * When filePath is provided, state is persisted to disk on every save.
 */
export declare class JsonPersistence implements PersistenceStore {
    private cache;
    private filePath;
    constructor(filePath?: string);
    load<T>(key: string, fallback: T): T;
    save<T>(key: string, data: T): void;
    private loadFromFile;
    private saveToFile;
}
//# sourceMappingURL=persistence.d.ts.map