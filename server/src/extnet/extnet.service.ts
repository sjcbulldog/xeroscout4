import { Injectable } from '@nestjs/common';
import { BlueAllianceService } from './blue-alliance.service.js';
import { StatboticsService } from './statbotics.service.js';

@Injectable()
export class ExtnetService {
    constructor(
        private readonly blueAllianceService: BlueAllianceService,
        private readonly statboticsService: StatboticsService,
    ) {}

    getBlueAllianceEvents(year: number) {
        return this.blueAllianceService.getEvents(year);
    }

    getBlueAllianceTeams(eventKey: string) {
        return this.blueAllianceService.getTeams(eventKey);
    }

    getBlueAllianceMatches(eventKey: string) {
        return this.blueAllianceService.getMatches(eventKey);
    }

    getBlueAllianceOprs(eventKey: string) {
        return this.blueAllianceService.getOprs(eventKey);
    }

    getBlueAllianceRankings(eventKey: string) {
        return this.blueAllianceService.getRankings(eventKey);
    }

    getStatboticsTeams(year: number) {
        return this.statboticsService.getTeams(year);
    }
}
