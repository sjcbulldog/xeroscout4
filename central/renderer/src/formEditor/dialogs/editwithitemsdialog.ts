import type { IPCChoice, IPCDataValueType } from '@xeroscout4/shared';
import type { FormControl } from '../controls/formctrl';
import { TabWidget } from '../widgets';
import { EditFormControlDialog } from './editformctrldialog';

type ChoiceRow = { row: HTMLDivElement; text: HTMLInputElement; value: HTMLInputElement; select: HTMLInputElement; };

export abstract class EditWithItemsDialog extends EditFormControlDialog {
    private tabwidget_?: TabWidget;
    protected tab_page_1?: HTMLDivElement;
    protected tab_page_2?: HTMLDivElement;
    private rowsHost_?: HTMLDivElement;
    private rows_: ChoiceRow[] = [];
    private data_type_display_?: HTMLSpanElement;

    constructor(name: string, formctrl: FormControl) { super(name, formctrl); }

    protected createTabs(div: HTMLElement): void {
        this.tabwidget_ = new TabWidget();
        div.appendChild(this.tabwidget_.elem);
        this.tab_page_1 = document.createElement('div');
        this.tab_page_1.className = 'xero-popup-form-edit-dialog-tab-page';
        this.tabwidget_.addPage('Properties', this.tab_page_1);
        this.tab_page_2 = document.createElement('div');
        this.tab_page_2.className = 'xero-popup-form-edit-dialog-tab-page';
        this.tabwidget_.addPage('Choices', this.tab_page_2);
        this.tabwidget_.selectPage(0);
    }

    private getColumnData(): string[] { return this.rows_.map(row => row.value.value); }
    protected extractChoices(): IPCChoice[] { return this.rows_.map(row => ({ text: row.text.value, value: row.value.value })); }
    protected extractDataType(): IPCDataValueType { return this.deduceDataType(this.getColumnData()); }

    protected populateChoices(div: HTMLElement, datatype: HTMLElement, choices: IPCChoice[]): void {
        this.data_type_display_ = datatype as HTMLSpanElement;
        const bigdiv = document.createElement('div');
        bigdiv.className = 'xero-popup-form-edit-dialog-bigdiv';
        div.appendChild(bigdiv);
        const header = document.createElement('div');
        header.className = 'form-editor-choice-header';
        header.innerHTML = '<span>Display</span><span>Value</span><span></span>';
        bigdiv.appendChild(header);
        this.rowsHost_ = document.createElement('div');
        this.rowsHost_.className = 'form-editor-choice-rows';
        bigdiv.appendChild(this.rowsHost_);
        for (const choice of choices) this.addChoiceRow(choice.text, String(choice.value));
        const btndiv = document.createElement('div');
        btndiv.className = 'xero-popup-form-edit-dialog-choice-button-div';
        bigdiv.appendChild(btndiv);
        const addbtn = document.createElement('button');
        addbtn.className = 'xero-popup-form-edit-dialog-choice-button';
        addbtn.innerHTML = '&#x2795;';
        addbtn.addEventListener('click', () => this.addChoice());
        btndiv.appendChild(addbtn);
        const delbtn = document.createElement('button');
        delbtn.className = 'xero-popup-form-edit-dialog-choice-button';
        delbtn.innerHTML = '&#x2796;';
        delbtn.addEventListener('click', () => this.deleteChoice());
        btndiv.appendChild(delbtn);
        this.updateDataTypeDisplay();
    }

    private addChoiceRow(text = 'New Choice', value = 'new_value'): void {
        if (!this.rowsHost_) return;
        const row = document.createElement('div');
        row.className = 'form-editor-choice-row';
        const textInput = document.createElement('input');
        textInput.className = 'xero-popup-form-edit-dialog-input';
        textInput.value = text;
        const valueInput = document.createElement('input');
        valueInput.className = 'xero-popup-form-edit-dialog-input';
        valueInput.value = value;
        const select = document.createElement('input');
        select.type = 'radio';
        select.name = 'choice-selected-row';
        select.className = 'form-editor-choice-select';
        textInput.addEventListener('input', () => this.updateDataTypeDisplay());
        valueInput.addEventListener('input', () => this.updateDataTypeDisplay());
        row.append(textInput, valueInput, select);
        this.rowsHost_.appendChild(row);
        this.rows_.push({ row, text: textInput, value: valueInput, select });
        if (this.rows_.length === 1) select.checked = true;
    }

    private deleteChoice(): void {
        const index = this.rows_.findIndex(row => row.select.checked);
        if (index === -1) return;
        const [row] = this.rows_.splice(index, 1);
        row.row.remove();
        if (this.rows_[0]) this.rows_[0].select.checked = true;
        this.updateDataTypeDisplay();
    }

    private addChoice(): void {
        this.addChoiceRow();
        this.updateDataTypeDisplay();
    }

    private updateDataTypeDisplay(): void {
        if (this.data_type_display_) this.data_type_display_.innerText = 'Data Type: ' + this.deduceDataType(this.getColumnData());
    }
}
