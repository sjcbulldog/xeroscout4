import type { IPCForm, IPCFormItem, IPCSection } from '@xeroscout4/shared';

export class FormObject {
    private form_: IPCForm;

    constructor(form: IPCForm) {
        this.form_ = form;
    }

    public get json(): IPCForm { return this.form_; }
    public get sectionCount(): number { return this.form_.sections.length; }
    public get sections(): IPCSection[] { return this.form_.sections; }

    public findItemByTag(tag: string): IPCFormItem | undefined {
        for (const section of this.form_.sections) {
            for (const item of section.items) {
                if (item.tag === tag) return item;
            }
        }
        return undefined;
    }

    public containsSection(name: string): boolean {
        return this.form_.sections.some(section => section.name === name);
    }

    public findSectionIndexByName(name: string): number {
        return this.form_.sections.findIndex(section => section.name === name);
    }

    public findSectionByName(name: string): IPCSection | undefined {
        return this.form_.sections.find(section => section.name === name);
    }

    public findNewSectionName(): string {
        const name = 'New Section';
        if (this.findSectionByName(name) === undefined) return name;
        let i = 1;
        while (true) {
            const newname = `${name} ${i}`;
            if (this.findSectionByName(newname) === undefined) return newname;
            i++;
        }
    }

    public createNewSection(): IPCSection {
        const section: IPCSection = { name: this.findNewSectionName(), items: [] };
        this.form_.sections.push(section);
        return section;
    }

    public removeSection(section: IPCSection): void {
        const index = this.form_.sections.indexOf(section);
        if (index !== -1) this.form_.sections.splice(index, 1);
    }

    public removeSectionByIndex(index: number): void {
        if (index >= 0 && index < this.form_.sections.length) this.form_.sections.splice(index, 1);
    }

    public getItemFromTag(tag: string): IPCFormItem | undefined {
        return this.findItemByTag(tag);
    }
}
