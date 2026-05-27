import { DataValue, type IPCChoiceValue, type IPCMultipleChoiceItem, type IPCTypedDataValue } from '@xeroscout4/shared';
import { XeroRect } from '../xerogeom';
import { EditChoiceDialog } from '../dialogs/editchoicedialog';
import type { EditFormControlDialog } from '../dialogs/editformctrldialog';
import type { EditorContext } from './formctrl';
import { FormControl } from './formctrl';

export class MultipleChoiceControl extends FormControl {
    private static item_desc_: IPCMultipleChoiceItem = {
        type: 'choice',
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
        radiosize: 20,
        orientation: 'vertical',
        choices: [
            { text: 'Choice 1', value: 'choice1' },
            { text: 'Choice 2', value: 'choice2' },
            { text: 'Choice 3', value: 'choice3' },
        ],
    };

    private choice_table_?: HTMLTableElement;
    private choice_ctrls_: HTMLInputElement[] = [];
    private choice_ctrl_to_value_: Map<HTMLInputElement, IPCChoiceValue> = new Map();

    constructor(view: EditorContext, tag: string, bounds: XeroRect) {
        super(view, MultipleChoiceControl.item_desc_);
        this.setTag(tag);
        this.setBounds(bounds);
    }

    public copyObject(): FormControl { return new MultipleChoiceControl(this.view, this.item.tag, this.bounds); }

    public updateFromItem(editing: boolean, scale: number, xoff: number, yoff: number): void {
        if (!this.ctrl) return;
        this.setPosition(scale, xoff, yoff);
        this.updateChoices(editing);
    }

    private createVerticalChoices(item: IPCMultipleChoiceItem, editing: boolean): void {
        const oper = editing ? 'edit' : 'view';
        this.choice_ctrl_to_value_.clear();
        for (const choice of item.choices) {
            const tabrow = document.createElement('tr');
            this.setClassList(tabrow, oper, 'vertrow');
            const label = document.createElement('td');
            this.setClassList(label, oper, 'label');
            label.innerHTML = choice.text;
            label.style.fontFamily = item.fontFamily;
            label.style.fontSize = `${item.fontSize}px`;
            label.style.fontWeight = item.fontWeight;
            label.style.fontStyle = item.fontStyle;
            label.style.backgroundColor = item.transparent ? 'transparent' : item.background;
            label.style.color = item.color;
            tabrow.appendChild(label);
            const iwrap = document.createElement('td');
            this.setClassList(iwrap, oper, 'wrapper');
            tabrow.appendChild(iwrap);
            const input = document.createElement('input');
            this.setClassList(input, oper, 'radio');
            this.choice_ctrl_to_value_.set(input, choice.value);
            input.type = item.multiselect ? 'checkbox' : 'radio';
            input.disabled = editing;
            input.checked = true;
            input.name = item.tag;
            input.id = `${item.tag}_${choice.value}`;
            input.style.accentColor = item.color;
            input.style.width = `${item.radiosize}px`;
            input.style.height = `${item.radiosize}px`;
            this.choice_ctrls_.push(input);
            iwrap.appendChild(input);
            this.choice_table_?.appendChild(tabrow);
        }
    }

    private createHorizontalChoices(item: IPCMultipleChoiceItem, editing: boolean): void {
        const oper = editing ? 'edit' : 'view';
        this.choice_ctrl_to_value_.clear();
        const tabrow = document.createElement('tr');
        this.setClassList(tabrow, oper, 'horizrow');
        tabrow.style.width = '100%';
        this.choice_table_?.appendChild(tabrow);
        let first = true;
        for (const choice of item.choices) {
            if (!first) {
                const sep = document.createElement('td');
                this.setClassList(sep, oper, 'separator');
                sep.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;';
                tabrow.appendChild(sep);
            }
            const label = document.createElement('td');
            this.setClassList(label, oper, 'label');
            label.innerHTML = choice.text;
            label.style.fontFamily = item.fontFamily;
            label.style.fontSize = `${item.fontSize}px`;
            label.style.fontWeight = item.fontWeight;
            label.style.fontStyle = item.fontStyle;
            label.style.backgroundColor = item.transparent ? 'transparent' : item.background;
            label.style.color = item.color;
            tabrow.appendChild(label);
            const iwrap = document.createElement('td');
            this.setClassList(iwrap, oper, 'wrapper');
            tabrow.appendChild(iwrap);
            const input = document.createElement('input');
            this.setClassList(input, oper, 'radio');
            this.choice_ctrl_to_value_.set(input, choice.value);
            input.type = item.multiselect ? 'checkbox' : 'radio';
            input.style.accentColor = item.color;
            input.disabled = editing;
            input.checked = true;
            input.name = item.tag;
            input.id = `${item.tag}_${choice.value}`;
            input.style.width = `${item.radiosize}px`;
            input.style.height = `${item.radiosize}px`;
            this.choice_ctrls_.push(input);
            iwrap.appendChild(input);
            first = false;
        }
    }

    private updateChoices(editing: boolean): void {
        const item = this.item as IPCMultipleChoiceItem;
        if (!this.choice_table_) return;
        this.choice_table_.innerHTML = '';
        this.choice_ctrls_ = [];
        if (item.orientation === 'vertical') this.createVerticalChoices(item, editing); else this.createHorizontalChoices(item, editing);
    }

    public createForEdit(parent: HTMLElement, xoff: number, yoff: number): void {
        super.createForEdit(parent, xoff, yoff);
        const item = this.item as IPCMultipleChoiceItem;
        this.ctrl = document.createElement('div');
        this.setClassList(this.ctrl, 'edit');
        this.choice_table_ = document.createElement('table');
        this.setClassList(this.choice_table_, 'edit', `${item.orientation}-table`);
        this.ctrl.appendChild(this.choice_table_);
        this.updateFromItem(true, 1.0, xoff, yoff);
        parent.appendChild(this.ctrl);
    }

    public createForScouting(parent: HTMLElement, scale: number, xoff: number, yoff: number): void {
        super.createForScouting(parent, scale, xoff, yoff);
        const item = this.item as IPCMultipleChoiceItem;
        this.ctrl = document.createElement('div');
        this.setClassList(this.ctrl, 'scout');
        this.choice_table_ = document.createElement('table');
        this.setClassList(this.choice_table_, 'scout', `${item.orientation}-table`);
        this.ctrl.appendChild(this.choice_table_);
        this.updateFromItem(false, scale, xoff, yoff);
        this.setData(typeof item.choices[0]?.value === 'number' ? DataValue.fromReal(item.choices[0].value) : DataValue.fromString(String(item.choices[0]?.value ?? '')));
        parent.appendChild(this.ctrl);
    }

    public createEditDialog(): EditFormControlDialog { return new EditChoiceDialog(this); }

    public getData(): IPCTypedDataValue | undefined {
        let ret: IPCTypedDataValue | undefined;
        for (const ctrl of this.choice_ctrls_) {
            if (ctrl.checked) {
                if (this.item.datatype !== 'string') ret = DataValue.fromReal(this.choice_ctrl_to_value_.get(ctrl) as number);
                else ret = DataValue.fromString(String(this.choice_ctrl_to_value_.get(ctrl)));
                if (!(this.item as IPCMultipleChoiceItem).multiselect) break;
            }
        }
        return ret;
    }

    public setData(data: IPCTypedDataValue | undefined): void {
        if (!data) return;
        if (DataValue.isString(data)) {
            const str = DataValue.toString(data);
            for (const ctrl of this.choice_ctrls_) ctrl.checked = this.choice_ctrl_to_value_.get(ctrl) === str;
        } else if (DataValue.isNumber(data)) {
            const num = DataValue.toReal(data);
            for (const ctrl of this.choice_ctrls_) ctrl.checked = this.choice_ctrl_to_value_.get(ctrl) === num;
        }
    }
}
