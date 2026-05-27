import type { IPCDataValueType } from '@xeroscout4/shared';
import type { FormControl } from '../controls/formctrl';
import { XeroDialog } from '../widgets';

export interface FontData {
    family: string;
    fullName: string;
    postscriptName: string;
    style: string;
}

declare global {
    interface Window {
        queryLocalFonts?: () => Promise<FontData[]>;
    }
}

export abstract class EditFormControlDialog extends XeroDialog {
    protected formctrl_: FormControl;
    protected font_name_?: HTMLSelectElement;
    protected font_size_?: HTMLInputElement;
    protected font_style_?: HTMLSelectElement;
    protected font_weight_?: HTMLSelectElement;
    protected text_color_?: HTMLInputElement;
    protected background_color_?: HTMLInputElement;
    protected transparent_?: HTMLInputElement;
    protected tag_?: HTMLInputElement;
    protected orientation_?: HTMLSelectElement;

    constructor(title: string, formctr: FormControl) {
        super(title);
        this.formctrl_ = formctr;
    }

    public override okButton(event: Event): void {
        this.extractData();
        this.formctrl_.updateFromItem(true, 1.0, Number.NaN, Number.NaN);
        super.okButton(event);
    }

    protected abstract extractData(): void;

    protected async queryLocalFonts(): Promise<FontData[]> {
        try {
            if (window.queryLocalFonts) return await window.queryLocalFonts();
        } catch {
        }
        return [
            { family: 'Arial', fullName: 'Arial', postscriptName: 'ArialMT', style: 'Regular' },
            { family: 'Helvetica', fullName: 'Helvetica', postscriptName: 'Helvetica', style: 'Regular' },
            { family: 'Verdana', fullName: 'Verdana', postscriptName: 'Verdana', style: 'Regular' },
            { family: 'Tahoma', fullName: 'Tahoma', postscriptName: 'Tahoma', style: 'Regular' },
        ];
    }

    protected async populateFontSelector(div: HTMLElement): Promise<void> {
        let label: HTMLLabelElement;
        let option: HTMLOptionElement;
        this.font_name_ = document.createElement('select');
        this.font_name_.className = 'xero-popup-form-edit-dialog-select';
        const fonts = await this.queryLocalFonts();
        for (const font of fonts) {
            option = document.createElement('option');
            option.value = font.fullName;
            option.innerText = font.fullName;
            this.font_name_.appendChild(option);
        }
        if (!Array.from(this.font_name_.options).some(opt => opt.value === this.formctrl_.item.fontFamily)) {
            option = document.createElement('option');
            option.value = this.formctrl_.item.fontFamily;
            option.innerText = this.formctrl_.item.fontFamily;
            this.font_name_.appendChild(option);
        }
        this.font_name_.value = this.formctrl_.item.fontFamily;
        label = document.createElement('label');
        label.className = 'xero-popup-form-edit-dialog-label';
        label.innerText = 'Font';
        label.appendChild(this.font_name_);
        div.appendChild(label);
        this.font_size_ = document.createElement('input');
        this.font_size_.type = 'number';
        this.font_size_.max = '96';
        this.font_size_.min = '8';
        this.font_size_.className = 'xero-popup-form-edit-dialog-input';
        this.font_size_.value = this.formctrl_.item.fontSize.toString();
        label = document.createElement('label');
        label.className = 'xero-popup-form-edit-dialog-label';
        label.innerText = 'Font Size';
        label.appendChild(this.font_size_);
        div.appendChild(label);
        this.font_style_ = document.createElement('select');
        this.font_style_.className = 'xero-popup-form-edit-dialog-select';
        for (const [value, text] of [['normal', 'Normal'], ['italic', 'Italic']] as const) {
            option = document.createElement('option');
            option.value = value;
            option.innerText = text;
            this.font_style_.appendChild(option);
        }
        this.font_style_.value = this.formctrl_.item.fontStyle;
        label = document.createElement('label');
        label.className = 'xero-popup-form-edit-dialog-label';
        label.innerText = 'Font Style';
        label.appendChild(this.font_style_);
        div.appendChild(label);
        this.font_weight_ = document.createElement('select');
        this.font_weight_.className = 'xero-popup-form-edit-dialog-select';
        for (const [value, text] of [['normal', 'Normal'], ['bold', 'Bold'], ['bolder', 'Bolder'], ['lighter', 'Lighter']] as const) {
            option = document.createElement('option');
            option.value = value;
            option.innerText = text;
            this.font_weight_.appendChild(option);
        }
        this.font_weight_.value = this.formctrl_.item.fontWeight;
        label = document.createElement('label');
        label.className = 'xero-popup-form-edit-dialog-label';
        label.innerText = 'Font Weight';
        label.appendChild(this.font_weight_);
        div.appendChild(label);
    }

    protected populateForegroundColor(div: HTMLElement): void {
        const label = document.createElement('label');
        this.text_color_ = document.createElement('input');
        this.text_color_.className = 'xero-popup-form-edit-dialog-color';
        this.text_color_.type = 'color';
        this.text_color_.value = EditFormControlDialog.colorNameToHex(this.formctrl_.item.color);
        label.className = 'xero-popup-form-edit-dialog-label';
        label.innerText = 'Foreground Color';
        label.appendChild(this.text_color_);
        div.appendChild(label);
    }

    protected populateBackgroundColor(div: HTMLElement): void {
        const label = document.createElement('label');
        this.background_color_ = document.createElement('input');
        this.background_color_.type = 'color';
        this.background_color_.className = 'xero-popup-form-edit-dialog-color';
        this.background_color_.value = EditFormControlDialog.colorNameToHex(this.formctrl_.item.background);
        label.className = 'xero-popup-form-edit-dialog-label';
        label.innerText = 'Background Color';
        label.appendChild(this.background_color_);
        div.appendChild(label);
    }

    protected populateTransparent(div: HTMLElement): void {
        const label = document.createElement('label');
        this.transparent_ = document.createElement('input');
        this.transparent_.type = 'checkbox';
        this.transparent_.checked = this.formctrl_.item.transparent;
        this.transparent_.className = 'xero-popup-form-edit-dialog-checkbox';
        label.className = 'xero-popup-form-edit-dialog-label';
        label.innerText = 'Background Transparent';
        label.appendChild(this.transparent_);
        div.appendChild(label);
    }

    protected populateColors(div: HTMLElement): void {
        this.populateForegroundColor(div);
        this.populateBackgroundColor(div);
        this.populateTransparent(div);
    }

    protected populateTag(div: HTMLElement): void {
        const label = document.createElement('label');
        this.tag_ = document.createElement('input');
        this.tag_.type = 'text';
        this.tag_.className = 'xero-popup-form-edit-dialog-input';
        this.tag_.value = this.formctrl_.item.tag;
        label.className = 'xero-popup-form-edit-dialog-label';
        label.innerText = 'Tag';
        label.appendChild(this.tag_);
        div.appendChild(label);
    }

    protected populateOrientation(div: HTMLElement, value: 'horizontal' | 'vertical'): void {
        let option: HTMLOptionElement;
        const label = document.createElement('label');
        this.orientation_ = document.createElement('select');
        this.orientation_.className = 'xero-popup-form-edit-dialog-select';
        option = document.createElement('option');
        option.value = 'horizontal';
        option.innerText = 'Horizontal';
        this.orientation_.appendChild(option);
        option = document.createElement('option');
        option.value = 'vertical';
        option.innerText = 'Vertical';
        this.orientation_.appendChild(option);
        this.orientation_.value = value;
        label.className = 'xero-popup-form-edit-dialog-label';
        label.innerText = 'Orientation';
        label.appendChild(this.orientation_);
        div.appendChild(label);
    }

    public static getProperty<T, K extends keyof T>(obj: T, key: K): T[K] { return obj[key]; }

    public static colorNameToHex(color: string): string {
        const probe = document.createElement('div');
        probe.style.color = color;
        document.body.appendChild(probe);
        const computed = getComputedStyle(probe).color;
        probe.remove();
        const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        if (!match) return color.startsWith('#') ? color : '#000000';
        const [, r, g, b] = match;
        return `#${[r, g, b].map(v => Number(v).toString(16).padStart(2, '0')).join('')}`;
    }

    protected deduceDataType(data: string[]): IPCDataValueType {
        let type: IPCDataValueType | undefined = 'boolean';
        for (const entry of data) {
            if (entry !== 'true' && entry !== 'false') { type = undefined; break; }
        }
        if (type === undefined) {
            type = 'integer';
            for (const entry of data) {
                const v = parseFloat(entry);
                if (Number.isNaN(v) || !Number.isInteger(v)) { type = undefined; break; }
            }
            if (type === undefined) {
                type = 'real';
                for (const entry of data) {
                    if (Number.isNaN(parseFloat(entry))) { type = undefined; break; }
                }
            }
        }
        return type ?? 'string';
    }
}
