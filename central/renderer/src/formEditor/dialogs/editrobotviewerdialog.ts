import type { IPCRobotViewerItem } from '@xeroscout4/shared';
import type { FormControl } from '../controls/formctrl';
import { EditFormControlDialog } from './editformctrldialog';

export class EditRobotViewerDialog extends EditFormControlDialog {
    constructor(formctrl: FormControl) { super('Edit Robot Viewer', formctrl); }

    protected async populateDialog(pdiv: HTMLDivElement): Promise<void> {
        const div = document.createElement('div');
        div.className = 'xero-popup-form-edit-dialog-rowdiv';
        this.populateTag(div);
        pdiv.appendChild(div);
    }

    protected extractData(): void {
        const item = this.formctrl_.item as IPCRobotViewerItem;
        item.tag = this.tag_?.value ?? item.tag;
        item.datatype = 'null';
    }

    protected override onInit(): void {
        this.tag_?.focus();
    }
}
