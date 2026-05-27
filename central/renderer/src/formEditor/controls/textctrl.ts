import { DataValue, type IPCTextItem, type IPCTypedDataValue } from '@xeroscout4/shared';
import { XeroRect } from '../xerogeom';
import type { EditFormControlDialog } from '../dialogs/editformctrldialog';
import { EditTextDialog } from '../dialogs/edittextdialog';
import type { EditorContext } from './formctrl';
import { FormControl } from './formctrl';

export class TextControl extends FormControl {
    private static item_desc_: IPCTextItem = {
        type: 'text',
        placeholder: 'Enter Text Here',
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
    };

    constructor(view: EditorContext, tag: string, bounds: XeroRect) {
        super(view, TextControl.item_desc_);
        this.setTag(tag);
        this.setBounds(bounds);
    }

    public copyObject(): FormControl { return new TextControl(this.view, this.item.tag, this.bounds); }

    public updateFromItem(editing: boolean, scale: number, xoff: number, yoff: number): void {
        if (!this.ctrl) return;
        const item = this.item as IPCTextItem;
        const ctrl = this.ctrl as HTMLInputElement;
        this.setPosition(scale, xoff, yoff);
        if (editing) ctrl.value = item.placeholder; else ctrl.placeholder = item.placeholder;
        ctrl.style.fontFamily = item.fontFamily;
        ctrl.style.fontSize = `${item.fontSize}px`;
        ctrl.style.fontWeight = item.fontWeight;
        ctrl.style.fontStyle = item.fontStyle;
        ctrl.style.color = item.color;
        ctrl.style.backgroundColor = item.transparent ? 'transparent' : item.background;
    }

    public createForEdit(parent: HTMLElement, xoff: number, yoff: number): void {
        super.createForEdit(parent, xoff, yoff);
        const input = document.createElement('input');
        this.setClassList(input, 'edit');
        input.disabled = true;
        this.ctrl = input;
        this.updateFromItem(true, 1.0, xoff, yoff);
        parent.appendChild(this.ctrl);
    }

    public createForScouting(parent: HTMLElement, scale: number, xoff: number, yoff: number): void {
        super.createForScouting(parent, scale, xoff, yoff);
        const input = document.createElement('input');
        this.setClassList(input, 'scout');
        this.ctrl = input;
        if (this.item.datatype === 'integer') {
            input.type = 'number';
            input.step = '1';
        } else if (this.item.datatype === 'real') {
            input.type = 'number';
            input.step = 'any';
        } else {
            input.type = 'text';
        }
        this.updateFromItem(false, scale, xoff, yoff);
        parent.appendChild(this.ctrl);
    }

    public createEditDialog(): EditFormControlDialog { return new EditTextDialog(this); }
    public getData(): IPCTypedDataValue | undefined { return DataValue.convertFromString(this.item.datatype, (this.ctrl as HTMLInputElement).value); }

    public setData(data: IPCTypedDataValue | undefined): void {
        if (!this.ctrl || !data) return;
        let str = '';
        if (this.item.datatype === 'integer' && DataValue.isInteger(data)) str = DataValue.toDisplayString(data);
        else if (this.item.datatype === 'real' && DataValue.isNumber(data)) str = DataValue.toDisplayString(data);
        else if (this.item.datatype === 'string' && DataValue.isString(data)) str = DataValue.toDisplayString(data);
        (this.ctrl as HTMLInputElement).value = str;
    }
}
