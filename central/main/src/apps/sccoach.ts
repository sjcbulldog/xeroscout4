import { Menu, MenuItem } from 'electron';
import { Logger } from 'winston';
import { SCBase, NavItem } from './scbase.js';

export class SCCoach extends SCBase {
    constructor(serverBaseUrl: string, logger: Logger) {
        super('coach', serverBaseUrl, logger);
    }

    buildNavData(): NavItem[] {
        if (!this.currentEvent) {
            return [{ id: 'no-event', label: 'No Event Loaded', view: 'text', args: ['No event loaded.'] }];
        }
        return [
            {
                id: 'general', label: 'General', view: '', children: [
                    { id: 'info',  label: 'Event Info', view: 'info' },
                    { id: 'about', label: 'About',      view: 'text', args: ['XeroScout 4.0 — Coach'] },
                ],
            },
            {
                id: 'teams', label: 'Teams', view: '', children: [
                    { id: 'team-status', label: 'Team Status', view: 'team-status' },
                    { id: 'team-data',   label: 'Team Data',   view: 'team-db' },
                ],
            },
            {
                id: 'match', label: 'Match', view: '', children: [
                    { id: 'match-status', label: 'Match Status', view: 'match-status' },
                    { id: 'match-data',   label: 'Match Data',   view: 'match-db' },
                ],
            },
            { id: 'playoffs',  label: 'Playoffs',  view: 'playoffs' },
            {
                id: 'analysis', label: 'Analysis', view: '', children: [
                    { id: 'formulas',   label: 'Formulas',         view: 'formulas' },
                    { id: 'picklist',   label: 'Pick List',        view: 'picklist' },
                    { id: 'singleteam', label: 'Single Team View', view: 'singleteam' },
                ],
            },
        ];
    }

    protected async onEventLoaded(): Promise<void> {
        this.updateStatus('', `XeroScout 4 Coach — ${this.currentEvent!.name}`, '');
        await this.sendNavData();
    }

    createMenu(): Menu {
        const menu = new Menu();

        const fileMenu = new MenuItem({ type: 'submenu', label: 'File', submenu: new Menu() });
        fileMenu.submenu!.append(new MenuItem({
            type: 'normal', label: 'Open Event …',
            click: () => void this.commandOpenEvent(),
        }));
        fileMenu.submenu!.append(new MenuItem({ type: 'separator' }));
        fileMenu.submenu!.append(new MenuItem({ type: 'normal', role: 'quit' }));
        menu.append(fileMenu);

        menu.append(new MenuItem({ type: 'submenu', role: 'viewMenu' }));

        const helpMenu = new MenuItem({ type: 'submenu', label: 'Help', submenu: new Menu() });
        helpMenu.submenu!.append(new MenuItem({
            type: 'normal', label: 'About',
            click: () => { /* TODO */ },
        }));
        menu.append(helpMenu);

        return menu;
    }

    private async commandOpenEvent(): Promise<void> {
        const events = await this.api.listEvents();
        this.setView('select-event', events);
    }
}
