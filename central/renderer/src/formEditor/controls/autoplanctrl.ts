import type { IPCAutoPlanItem, IPCTypedDataValue } from '@xeroscout4/shared';
import { XeroRect } from '../xerogeom';
import type { EditFormControlDialog } from '../dialogs/editformctrldialog';
import { EditAutoPlanDialog } from '../dialogs/editautoplanctrldialog';
import type { EditorContext } from './formctrl';
import { FormControl } from './formctrl';

export class AutoPlanControl extends FormControl {
    private static item_desc_: IPCAutoPlanItem = {
        type: 'autoplan',
        tag: '',
        x: 0,
        y: 0,
        width: 400,
        height: 300,
        color: '#ffffff',
        background: '#0d1220',
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'bold',
        fontStyle: 'normal',
        datatype: 'string',
        transparent: false,
        fieldImage: '',
        approvedActions: ['Start', 'End'],
        allowMultipleAutos: false,
    };

    constructor(view: EditorContext, tag: string, bounds: XeroRect) {
        super(view, AutoPlanControl.item_desc_);
        this.setTag(tag);
        this.setBounds(bounds);
    }

    public copyObject(): FormControl { return new AutoPlanControl(this.view, this.item.tag, this.bounds); }

    public updateFromItem(_editing: boolean, scale: number, xoff: number, yoff: number): void {
        if (!this.ctrl) return;
        const item = this.item as IPCAutoPlanItem;
        this.setPosition(scale, xoff, yoff);
        this.ctrl.textContent = item.fieldImage ? `Auto Plan: ${item.fieldImage}` : 'Auto Plan';
    }

    public createForEdit(parent: HTMLElement, xoff: number, yoff: number): void {
        super.createForEdit(parent, xoff, yoff);
        this.ctrl = document.createElement('div');
        this.setClassList(this.ctrl, 'edit');
        this.ctrl.style.display = 'flex';
        this.ctrl.style.alignItems = 'center';
        this.ctrl.style.justifyContent = 'center';
        this.ctrl.style.border = '1px dashed #666';
        this.ctrl.style.backgroundColor = '#0d1220';
        this.ctrl.style.color = '#ffffff';
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
        this.ctrl.style.backgroundColor = '#0d1220';
        this.ctrl.style.color = '#ffffff';
        this.updateFromItem(false, scale, xoff, yoff);
        parent.appendChild(this.ctrl);
    }

    public createEditDialog(): EditFormControlDialog { return new EditAutoPlanDialog(this); }
    public getData(): IPCTypedDataValue | undefined { return undefined; }
    public setData(_data: IPCTypedDataValue | undefined): void {}
}
