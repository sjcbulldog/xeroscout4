import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { EventsModule } from './events/events.module.js';
import { TeamsModule } from './teams/teams.module.js';
import { MatchesModule } from './matches/matches.module.js';
import { TabletsModule } from './tablets/tablets.module.js';
import { ScoutingModule } from './scouting/scouting.module.js';
import { CorrectionsModule } from './corrections/corrections.module.js';
import { AnalysisModule } from './analysis/analysis.module.js';
import { SyncModule } from './sync/sync.module.js';
import { ExtnetModule } from './extnet/extnet.module.js';
import { ImagesModule } from './images/images.module.js';

import { EventEntity } from './entities/event.entity.js';
import { TeamEntity } from './entities/team.entity.js';
import { MatchEntity } from './entities/match.entity.js';
import { TabletEntity } from './entities/tablet.entity.js';
import { TabletAssignmentEntity } from './entities/tablet-assignment.entity.js';
import { ScoutingResultEntity } from './entities/scouting-result.entity.js';
import { CorrectionEntity } from './entities/correction.entity.js';
import { ApiKeyEntity } from './entities/api-key.entity.js';
import { FormulaEntity, DatasetEntity, GraphEntity, PicklistEntity, PlayoffBracketEntity } from './entities/analysis.entities.js';
import { SyncLogEntity } from './entities/sync-log.entity.js';
import { ImageEntity } from './entities/image.entity.js';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),

        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'mysql',
                host: config.get('DB_HOST', 'localhost'),
                port: config.get<number>('DB_PORT', 3306),
                database: config.get('DB_NAME', 'xeroscout'),
                username: config.get('DB_USER', 'xeroscout'),
                password: config.get('DB_PASS', ''),
                synchronize: config.get('NODE_ENV') !== 'production',
                logging: config.get('NODE_ENV') === 'development',
                entities: [
                    EventEntity,
                    TeamEntity,
                    MatchEntity,
                    TabletEntity,
                    TabletAssignmentEntity,
                    ScoutingResultEntity,
                    CorrectionEntity,
                    ApiKeyEntity,
                    FormulaEntity,
                    DatasetEntity,
                    GraphEntity,
                    PicklistEntity,
                    PlayoffBracketEntity,
                    SyncLogEntity,
                    ImageEntity,
                ],
            }),
        }),

        AuthModule,
        EventsModule,
        TeamsModule,
        MatchesModule,
        TabletsModule,
        ScoutingModule,
        CorrectionsModule,
        AnalysisModule,
        SyncModule,
        ExtnetModule,
        ImagesModule,
    ],
})
export class AppModule {}
