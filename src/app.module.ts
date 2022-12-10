import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule'
import { CachingModule } from './caching/caching.module';
import configuration from './configuration/configuration';
import { OrderLifeCycleModule } from './order-Life-Cycle/orderLifeCycle.module';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    load: [configuration]
  }),
            CacheModule.register({
              isGlobal: true
            }),
            ScheduleModule.forRoot(),
            OrderLifeCycleModule,
            CachingModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
