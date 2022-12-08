import { Module } from "@nestjs/common";
import { CachingService } from "./caching.service";

@Module({
    imports: [],
    providers: [CachingService],
    exports: [CachingService]
})
export class CachingModule {}