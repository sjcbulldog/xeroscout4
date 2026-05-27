import type { IPCRobotPhotoItem } from '@xeroscout4/shared';
import type { FormControl } from '../controls/formctrl';
import { EditFormControlDialog } from './editformctrldialog';

export class EditRobotPhotoDialog extends EditFormControlDialog {
    constructor(formctrl: FormControl) { super('Edit Robot Photo', formctrl); }

    protected async populateDialog(pdiv: HTMLDivElement): Promise<void> {
        const div = document.createElement('div');
        div.className = 'xero-popup-form-edit-dialog-rowdiv';
        this.populateTag(div);
        pdiv.appendChild(div);
    }

    protected extractData(): void {
        const item = this.formctrl_.item as IPCRobotPhotoItem;
        item.tag = this.tag_?.value ?? item.tag;
        item.mode = 'capture';
        item.datatype = 'string';
    }

    protected override onInit(): void {
        this.tag_?.focus();
    }
}
