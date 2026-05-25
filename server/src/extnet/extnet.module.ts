import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ExtnetController } from './extnet.controller.js';
import { BlueAllianceService } from './blue-alliance.service.js';
import { StatboticsService } from './statbotics.service.js';
import { ExtnetService } from './extnet.service.js';

@Module({
    imports: [AuthModule],
    controllers: [ExtnetController],
    providers: [BlueAllianceService, StatboticsService, ExtnetService],
})
export class ExtnetModule {}
