import type { IPCAutoSelectorItem, IPCTypedDataValue } from '@xeroscout4/shared';
import { XeroRect } from '../xerogeom';
import type { EditFormControlDialog } from '../dialogs/editformctrldialog';
import { EditAutoSelectorDialog } from '../dialogs/editautoselectorctrldialog';
import type { EditorContext } from './formctrl';
import { FormControl } from './formctrl';

export class AutoSelectorControl extends FormControl {
    private static item_desc_: IPCAutoSelectorItem = {
        type: 'autoselector',
        tag: '',
        x: 0,
        y: 0,
        width: 400,
        height: 300,
        color: 'black',
        background: '#f0f0f0',
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'normal',
        fontStyle: 'normal',
        datatype: 'string',
        transparent: false,
        fieldImage: '',
        showSourceTagInTab: true,
    };

    constructor(view: EditorContext, tag: string, bounds: XeroRect) {
        super(view, AutoSelectorControl.item_desc_);
        this.setTag(tag);
        this.setBounds(bounds);
    }

    public copyObject(): FormControl { return new AutoSelectorControl(this.view, this.item.tag, this.bounds); }

    public updateFromItem(_editing: boolean, scale: number, xoff: number, yoff: number): void {
        if (!this.ctrl) return;
        const item = this.item as IPCAutoSelectorItem;
        this.setPosition(scale, xoff, yoff);
        this.ctrl.textContent = item.fieldImage ? `Auto Selector: ${item.fieldImage}` : 'Auto Selector';
        this.ctrl.style.backgroundColor = item.transparent ? 'transparent' : item.background;
        this.ctrl.style.color = item.color;
    }

    public createForEdit(parent: HTMLElement, xoff: number, yoff: number): void {
        super.createForEdit(parent, xoff, yoff);
        this.ctrl = document.createElement('div');
        this.setClassList(this.ctrl, 'edit');
        this.ctrl.style.display = 'flex';
        this.ctrl.style.alignItems = 'center';
        this.ctrl.style.justifyContent = 'center';
        this.ctrl.style.border = '1px dashed #666';
        this.updateFromItem(true, 1.0, xoff, yoff);
        parent.appendChild(this.ctrl);
    }

    public createForScouting(parent: HTMLElement, scale: number, xoff: number, yoff: number): void {
        super.createForScouting(parent, scale, xoff, yoff);
        this.ctrl = document.createElement('div');
        this.setClassList(this.ctrl, 'scout');
        this.ctrl.style.display = 'flex';
        this.ctrl.style.alignItems = 'center';
        this.ctrl.style.justifyContent = 'center';
        this.ctrl.style.border = '1px dashed #666';
        this.updateFromItem(false, scale, xoff, yoff);
        parent.appendChild(this.ctrl);
    }

    public createEditDialog(): EditFormControlDialog { return new EditAutoSelectorDialog(this); }
    public getData(): IPCTypedDataValue | undefined { return undefined; }
    public setData(_data: IPCTypedDataValue | undefined): void {}
}
