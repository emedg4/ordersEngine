import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule'
import configuration from './configuration/configuration';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    load: [configuration]
  }),
            CacheModule.register(),
            ScheduleModule.forRoot()],
  controllers: [],
  providers: [],
})
export class AppModule {}
