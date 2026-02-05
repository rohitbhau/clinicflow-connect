import NodeCache from 'node-cache';
import { config } from '../config/index';

class CacheManager {
    private static instance: CacheManager;
    private cache: NodeCache;

    private constructor() {
        this.cache = new NodeCache({
            stdTTL: config.CACHE_TTL,
            checkperiod: 60,
            maxKeys: 1000,
            useClones: false,
        });
    }

    public static getInstance(): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }
        return CacheManager.instance;
    }

    public get<T>(key: string): T | undefined {
        return this.cache.get<T>(key);
    }

    public set<T>(key: string, value: T, ttl?: number): boolean {
        return this.cache.set(key, value, ttl || config.CACHE_TTL);
    }

    public del(key: string): number {
        return this.cache.del(key);
    }

    public delPattern(pattern: string): void {
        const keys = this.cache.keys();
        const regex = new RegExp(pattern);
        keys.forEach((key) => {
            if (regex.test(key)) {
                this.cache.del(key);
            }
        });
    }

    public flush(): void {
        this.cache.flushAll();
    }

    public getStats(): NodeCache.Stats {
        return this.cache.getStats();
    }
}

export const cache = CacheManager.getInstance();
