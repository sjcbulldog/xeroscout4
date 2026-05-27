import { XeroDialog } from '../widgets';

export class EditSectionNameDialog extends XeroDialog {
    private section_name_?: HTMLInputElement;
    private oldname_: string;
    private newname_ = '';

    constructor(oldname: string) {
        super('Edit Section Name');
        this.oldname_ = oldname;
    }

    public get enteredName(): string { return this.newname_; }

    protected override async populateDialog(pdiv: HTMLDivElement): Promise<void> {
        const div = document.createElement('div');
        div.className = 'xero-popup-form-edit-dialog-rowdiv';
        this.section_name_ = document.createElement('input');
        this.section_name_.type = 'text';
        this.section_name_.className = 'xero-popup-form-edit-dialog-input';
        this.section_name_.value = this.oldname_;
        const label = document.createElement('label');
        label.className = 'xero-popup-form-edit-dialog-label';
        label.innerText = 'Section Name';
        label.appendChild(this.section_name_);
        div.appendChild(label);
        pdiv.appendChild(div);
    }

    protected override onInit(): void {
        this.section_name_?.focus();
        this.section_name_?.select();
    }

    public override okButton(event: Event): void {
        this.newname_ = this.section_name_?.value ?? '';
        super.okButton(event);
    }
}
