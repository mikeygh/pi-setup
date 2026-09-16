"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonPersistence = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * In-memory store with optional JSON file persistence.
 * When filePath is provided, state is persisted to disk on every save.
 */
class JsonPersistence {
    cache = new Map();
    filePath;
    constructor(filePath) {
        this.filePath = filePath ?? null;
        if (this.filePath) {
            this.loadFromFile();
        }
    }
    load(key, fallback) {
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        return fallback;
    }
    save(key, data) {
        this.cache.set(key, data);
        if (this.filePath) {
            this.saveToFile();
        }
    }
    loadFromFile() {
        if (!this.filePath)
            return;
        try {
            if (fs.existsSync(this.filePath)) {
                const raw = fs.readFileSync(this.filePath, "utf-8");
                const parsed = JSON.parse(raw);
                for (const [k, v] of Object.entries(parsed)) {
                    this.cache.set(k, v);
                }
            }
        }
        catch {
            // corrupt file — start fresh
        }
    }
    saveToFile() {
        if (!this.filePath)
            return;
        try {
            const dir = path.dirname(this.filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            const obj = {};
            const entries = Array.from(this.cache.entries());
            for (let i = 0; i < entries.length; i++) {
                obj[entries[i][0]] = entries[i][1];
            }
            fs.writeFileSync(this.filePath, JSON.stringify(obj, null, 2), "utf-8");
        }
        catch {
            // best-effort persistence
        }
    }
}
exports.JsonPersistence = JsonPersistence;
//# sourceMappingURL=persistence.js.map