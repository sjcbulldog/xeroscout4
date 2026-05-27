// Form type definitions — 100% compatible with XeroScout 3 form JSON files

import { IPCDataValueType, IPCTypedDataValue } from './datavalue.js';

export type IPCFormPurpose = 'match' | 'team';
export type IPCFormControlType =
    | 'label' | 'text' | 'textarea' | 'boolean' | 'updown'
    | 'choice' | 'select' | 'timer' | 'stopwatch'
    | 'box' | 'image' | 'autoplan' | 'autoselector'
    | 'robotphoto' | 'robotviewer';

export interface IPCSize {
    width: number;
    height: number;
}

export interface IPCTablet {
    name: string;
    size: IPCSize;
}

// Base form item — absolute pixel layout
export interface IPCFormItem {
    type: IPCFormControlType;
    tag: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontFamily: string;
    fontSize: number;
    fontStyle: string;
    fontWeight: string;
    color: string;
    background: string;
    transparent: boolean;
    datatype: IPCDataValueType;
    locked?: boolean;
}

export interface IPCLabelItem extends IPCFormItem {
    text: string;
}

export interface IPCImageItem extends IPCFormItem {
    image: string;
    field: boolean;
    mirrorx: boolean;
    mirrory: boolean;
}

export interface IPCAutoPlanItem extends IPCFormItem {
    fieldImage: string;
    approvedActions: string[];
    allowMultipleAutos: boolean;
}

export interface IPCAutoSelectorItem extends IPCFormItem {
    fieldImage: string;
    showSourceTagInTab?: boolean;
}

export interface IPCBoxItem extends IPCFormItem {
    borderStyle: string;
    borderWidth: number;
    borderRadius: number;
    borderShadow: boolean;
}

export interface IPCTextItem extends IPCFormItem {
    placeholder: string;
}

export interface IPCTextAreaItem extends IPCFormItem {
    rows: number;
    cols: number;
}

export interface IPCBooleanItem extends IPCFormItem {
    accent: string;
}

export interface IPCUpDownItem extends IPCFormItem {
    orientation: 'horizontal' | 'vertical';
    minvalue: number;
    maxvalue: number;
}

export type IPCChoiceValue = number | string;

export interface IPCChoice {
    text: string;
    value: IPCChoiceValue;
}

export interface IPCChoicesItem extends IPCFormItem {
    choices: IPCChoice[];
}

export type IPCMultipleChoiceOrientation = 'horizontal' | 'vertical';

export interface IPCMultipleChoiceItem extends IPCChoicesItem {
    radiosize: number;
    orientation: IPCMultipleChoiceOrientation;
    multiselect?: boolean;
}

export interface IPCSelectItem extends IPCChoicesItem {}
export interface IPCTimerItem extends IPCFormItem {}
export interface IPCStopwatchItem extends IPCFormItem { holdMode?: boolean; }

export type IPCRobotPhotoMode = 'capture' | 'display';

export interface IPCRobotPhotoItem extends IPCFormItem {
    mode: IPCRobotPhotoMode;
}

export interface IPCRobotViewerItem extends IPCFormItem {}

export interface IPCSection {
    name: string;
    items: IPCFormItem[];
}

export interface IPCForm {
    purpose: IPCFormPurpose;
    tablet: IPCTablet;
    sections: IPCSection[];
}

// Scouting result submitted by a tablet
export interface IPCScoutResult {
    item?: string;                  // The match or team identifier
    data: IPCNamedDataValue[];
}

export interface IPCNamedDataValue {
    tag: string;
    value: IPCTypedDataValue;
}

export interface IPCScoutResults {
    tablet: string;
    purpose: string;
    results: IPCScoutResult[];
}

// Form scouting display context
export interface IPCFormScoutData {
    message?: string;
    form?: IPCForm;
    reversed?: boolean;
    mirrorx?: boolean;
    mirrory?: boolean;
    color?: string;
    title?: string;
    scoutItem?: string;
    activeTeamResult?: IPCScoutResult;
}
