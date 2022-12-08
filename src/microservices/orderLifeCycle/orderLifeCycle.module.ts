import { DynamicModule, Module } from '@nestjs/common';
import { OrderLifeCycleServiceMS } from './orderLifeCycle.service';
import { ClientsModule, Transport } from '@nestjs/microservices'
import { ConfigService } from '@nestjs/config'

interface RmqModuleOptions {
  name: string
}

@Module({
  providers: [OrderLifeCycleServiceMS],
  exports: [OrderLifeCycleServiceMS]
})
export class OrderLifeCycleModuleMS {
  static register({ name }: RmqModuleOptions ): DynamicModule {
    return {
      module: OrderLifeCycleModuleMS,
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
