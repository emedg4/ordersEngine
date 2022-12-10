import { DynamicModule, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices'
import { ConfigService } from '@nestjs/config'
import { OrdersEngineService } from './ordersEngine.service';

interface RmqModuleOptions {
  name: string
}

@Module({
  providers: [OrdersEngineService],
  exports: [OrdersEngineService]
})
export class OrdersEngineModule {
  static register({ name }: RmqModuleOptions ): DynamicModule {
    return {
      module: OrdersEngineModule,
      imports: [
        ClientsModule.registerAsync([
          {
            name,
            useFactory: (configService: ConfigService) => ({
              transport: Transport.RMQ,
              options: {
                urls: [configService.get<string>('rbmq.url')],
                queue: configService.get<string>('rbmq.queue.toOrdersEngine')
              },
            }),
            inject: [ConfigService]
          }
        ])
      ],
      exports: [ClientsModule]
    }
  }
}
