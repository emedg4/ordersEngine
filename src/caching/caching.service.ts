import { CACHE_MANAGER, Inject, Injectable } from "@nestjs/common";
import { Cache } from "cache-manager";
import { ModifiedOrder } from "src/order-Life-Cycle/dto/modifiedOrder";
import { Order } from "src/order-Life-Cycle/dto/Order";

Injectable()
export class CachingService {
    constructor(
        @Inject(CACHE_MANAGER) private cacheService: Cache
    ){}
    
    async setData(id: string, data: ModifiedOrder) {
        return await this.cacheService.set(id, data);
    }

    async getData(id: string): Promise<ModifiedOrder> {
        const response: ModifiedOrder = await this.cacheService.get(id)
        return response
    }

    async delData(id: string) {
        return await this.cacheService.del(id)
    }
    async storedKeys() {
        return await this.cacheService.store.keys();
    }
    async delAllData() {
        const keys: string[] = await this.storedKeys()
        for(const key of keys){
            await this.cacheService.del(key);
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