import type { IPCForm } from '@xeroscout4/shared';
import { FormEditorView } from '../formEditor/editformview';

type ViewHost = HTMLElement & { __xeroCleanup__?: () => void };

export async function FormJsonView(container: HTMLElement, purpose: 'team' | 'match') {
    let form: IPCForm | null = null;
    try {
        form = await window.xeroscout.getForm(purpose) as IPCForm | null;
    } catch {
        form = null;
    }

    const host = container as ViewHost;
    const editor = new FormEditorView(container, purpose, form);
    host.__xeroCleanup__ = () => editor.destroy();
}
