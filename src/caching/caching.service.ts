import { CACHE_MANAGER, Inject, Injectable } from "@nestjs/common";
import { Cache, memoryStore } from "cache-manager";
import { randomBytes } from "crypto";
import { ModifiedOrder } from "src/order-Life-Cycle/dto/modifiedOrder";
import { Order } from "src/order-Life-Cycle/dto/Order";

Injectable()
export class CachingService {
    private store: any;
    constructor(
        @Inject(CACHE_MANAGER) private cacheService: Cache
    ){
        this.store = memoryStore({ttl:0})
    }
    
    async setData(id: string, data: ModifiedOrder) {
        return await this.store.set(id, data, 0);
    }

    async getData(id: string): Promise<ModifiedOrder> {
        const response: ModifiedOrder = await this.store.get(id)
        return response
    }

    async delData(id: string) {
        return await this.store.del(id)
    }
    async storedKeys() {
        return await this.store.keys();
    }
    async delAllData() {
        const keys: string[] = await this.storedKeys()
        for(const key of keys){
            await this.store.del(key);
        }
        return
    }
    async getAllData() {
        const keys: string[] = await this.storedKeys();
        const allData: Array<ModifiedOrder> = []
        for(const key of keys) {
            const data: ModifiedOrder = await this.getData(key);
            allData.push(data);
        }
        return allData

    }
}