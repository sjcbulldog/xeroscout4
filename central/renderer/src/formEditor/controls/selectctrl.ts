import { DataValue, type IPCSelectItem, type IPCTypedDataValue } from '@xeroscout4/shared';
import { XeroRect } from '../xerogeom';
import type { EditFormControlDialog } from '../dialogs/editformctrldialog';
import { EditSelectDialog } from '../dialogs/editselectdialog';
import type { EditorContext } from './formctrl';
import { FormControl } from './formctrl';

export class SelectControl extends FormControl {
    private static item_desc_: IPCSelectItem = {
        type: 'select',
        tag: '',
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        color: 'black',
        background: 'white',
        fontFamily: 'Arial',
        fontSize: 36,
        fontWeight: 'normal',
        fontStyle: 'normal',
        datatype: 'string',
        transparent: true,
        choices: [
            { text: 'Choice 1', value: 'choice1' },
            { text: 'Choice 2', value: 'choice2' },
            { text: 'Choice 3', value: 'choice3' },
        ],
    };

    constructor(view: EditorContext, tag: string, bounds: XeroRect) {
        super(view, SelectControl.item_desc_);
        this.setTag(tag);
        this.setBounds(bounds);
    }

    public copyObject(): FormControl { return new SelectControl(this.view, this.item.tag, this.bounds); }

    public updateFromItem(_editing: boolean, scale: number, xoff: number, yoff: number): void {
        if (!this.ctrl) return;
        const item = this.item as IPCSelectItem;
        const ctrl = this.ctrl as HTMLSelectElement;
        this.setPosition(scale, xoff, yoff);
        ctrl.style.color = item.color;
        ctrl.style.backgroundColor = item.transparent ? 'transparent' : item.background;
        ctrl.style.fontFamily = item.fontFamily;
        ctrl.style.fontSize = `${item.fontSize}px`;
        ctrl.style.fontWeight = item.fontWeight;
        ctrl.style.fontStyle = item.fontStyle;
        this.updateChoices();
    }

    private updateChoices(): void {
        const item = this.item as IPCSelectItem;
        const ctrl = this.ctrl as HTMLSelectElement;
        ctrl.innerHTML = '';
        for (const choice of item.choices) {
            const opt = document.createElement('option');
            opt.value = String(choice.value);
            opt.textContent = choice.text;
            ctrl.appendChild(opt);
        }
    }

    public createForEdit(parent: HTMLElement, xoff: number, yoff: number): void {
        super.createForEdit(parent, xoff, yoff);
        const sel = document.createElement('select');
        this.setClassList(sel, 'edit');
        sel.disabled = true;
        this.ctrl = sel;
        this.updateFromItem(true, 1.0, xoff, yoff);
        parent.appendChild(this.ctrl);
    }

    public createForScouting(parent: HTMLElement, scale: number, xoff: number, yoff: number): void {
        super.createForScouting(parent, scale, xoff, yoff);
        this.ctrl = document.createElement('select');
        this.setClassList(this.ctrl, 'scout');
        this.updateFromItem(false, scale, xoff, yoff);
        parent.appendChild(this.ctrl);
    }

    public createEditDialog(): EditFormControlDialog { return new EditSelectDialog(this); }

    public getData(): IPCTypedDataValue | undefined {
        const ctrl = this.ctrl as HTMLSelectElement;
        if (this.item.datatype === 'integer') return DataValue.fromInteger(parseInt(ctrl.value, 10));
        if (this.item.datatype === 'real') return DataValue.fromReal(parseFloat(ctrl.value));
        return DataValue.fromString(ctrl.value);
    }

    public setData(data: IPCTypedDataValue | undefined): void {
        const ctrl = this.ctrl as HTMLSelectElement;
        if (!ctrl || !data) return;
        if (DataValue.isString(data)) ctrl.value = DataValue.toString(data);
        else if (DataValue.isNumber(data)) ctrl.value = `${DataValue.toReal(data)}`;
    }
}
