import React from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView,
    TextInput, Switch,
} from 'react-native';
import type { IPCFormItem, DataValue } from '@xeroscout4/shared';

interface ControlProps {
    item: IPCFormItem;
    value: DataValue;
    onChange: (v: DataValue) => void;
}

export function FormControl({ item, value, onChange }: ControlProps) {
    switch (item.type) {
        case 'boolean':    return <BoolControl    item={item} value={value} onChange={onChange} />;
        case 'counter':    return <CounterControl  item={item} value={value} onChange={onChange} />;
        case 'updown':     return <UpDownControl   item={item} value={value} onChange={onChange} />;
        case 'text':       return <TextControl     item={item} value={value} onChange={onChange} />;
        case 'choice':     return <ChoiceControl   item={item} value={value} onChange={onChange} />;
        case 'multichoice':return <MultiChoiceControl item={item} value={value} onChange={onChange} />;
        case 'label':      return <LabelControl    item={item} />;
        case 'timer':      return <TimerControl    item={item} value={value} onChange={onChange} />;
        case 'startpos':   return <StartPosControl item={item} value={value} onChange={onChange} />;
        default:           return <Text style={styles.unknown}>[{item.type}]</Text>;
    }
}

// ── Boolean (toggle) ──────────────────────────────────────────────────────────
function BoolControl({ item, value, onChange }: ControlProps) {
    return (
        <View style={styles.row}>
            <Text style={styles.label}>{item.label}</Text>
            <Switch
                value={Boolean(value)}
                onValueChange={v => onChange(v)}
                trackColor={{ false: '#3d3d6e', true: '#4fc3f7' }}
                thumbColor="#fff"
            />
        </View>
    );
}

// ── Counter ───────────────────────────────────────────────────────────────────
function CounterControl({ item, value, onChange }: ControlProps) {
    const n = (typeof value === 'number' ? value : 0);
    return (
        <View style={styles.row}>
            <Text style={styles.label}>{item.label}</Text>
            <View style={styles.counterRow}>
                <TouchableOpacity style={styles.counterBtn} onPress={() => onChange(Math.max(0, n - 1))}>
                    <Text style={styles.counterBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.counterVal}>{n}</Text>
                <TouchableOpacity style={styles.counterBtn} onPress={() => onChange(n + 1)}>
                    <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ── Up/Down ───────────────────────────────────────────────────────────────────
function UpDownControl({ item, value, onChange }: ControlProps) {
    const n = typeof value === 'number' ? value : (item as unknown as { minimum: number }).minimum ?? 0;
    const min = (item as unknown as { minimum?: number }).minimum ?? 0;
    const max = (item as unknown as { maximum?: number }).maximum ?? 9999;
    return (
        <View style={styles.row}>
            <Text style={styles.label}>{item.label}</Text>
            <View style={styles.counterRow}>
                <TouchableOpacity style={styles.counterBtn} onPress={() => onChange(Math.max(min, n - 1))}>
                    <Text style={styles.counterBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.counterVal}>{n}</Text>
                <TouchableOpacity style={styles.counterBtn} onPress={() => onChange(Math.min(max, n + 1))}>
                    <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ── Text ──────────────────────────────────────────────────────────────────────
function TextControl({ item, value, onChange }: ControlProps) {
    return (
        <View style={styles.col}>
            <Text style={styles.label}>{item.label}</Text>
            <TextInput
                style={styles.textInput}
                value={String(value ?? '')}
                onChangeText={onChange}
                multiline
                placeholderTextColor="#555"
            />
        </View>
    );
}

// ── Choice (radio) ────────────────────────────────────────────────────────────
function ChoiceControl({ item, value, onChange }: ControlProps) {
    const choices = (item as unknown as { choices: string[] }).choices ?? [];
    return (
        <View style={styles.col}>
            <Text style={styles.label}>{item.label}</Text>
            <View style={styles.choiceRow}>
                {choices.map(c => (
                    <TouchableOpacity
                        key={c}
                        style={[styles.choiceBtn, value === c && styles.choiceBtnSelected]}
                        onPress={() => onChange(c)}
                    >
                        <Text style={[styles.choiceBtnText, value === c && styles.choiceBtnTextSelected]}>{c}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

// ── Multi Choice (checkboxes) ─────────────────────────────────────────────────
function MultiChoiceControl({ item, value, onChange }: ControlProps) {
    const choices = (item as unknown as { choices: string[] }).choices ?? [];
    const selected: string[] = Array.isArray(value) ? (value as string[]) : [];
    function toggle(c: string) {
        const next = selected.includes(c) ? selected.filter(x => x !== c) : [...selected, c];
        onChange(next);
    }
    return (
        <View style={styles.col}>
            <Text style={styles.label}>{item.label}</Text>
            <View style={styles.choiceRow}>
                {choices.map(c => (
                    <TouchableOpacity
                        key={c}
                        style={[styles.choiceBtn, selected.includes(c) && styles.choiceBtnSelected]}
                        onPress={() => toggle(c)}
                    >
                        <Text style={[styles.choiceBtnText, selected.includes(c) && styles.choiceBtnTextSelected]}>{c}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

// ── Label (read-only text) ────────────────────────────────────────────────────
function LabelControl({ item }: { item: IPCFormItem }) {
    return <Text style={styles.labelOnly}>{item.label}</Text>;
}

// ── Timer ─────────────────────────────────────────────────────────────────────
function TimerControl({ item, value, onChange }: ControlProps) {
    const [running, setRunning] = React.useState(false);
    const [start, setStart]     = React.useState<number | null>(null);
    const elapsed = typeof value === 'number' ? value : 0;

    function handleToggle() {
        if (running) {
            const now = Date.now();
            onChange(elapsed + Math.round((now - (start ?? now)) / 1000));
            setRunning(false);
            setStart(null);
        } else {
            setStart(Date.now());
            setRunning(true);
        }
    }

    return (
        <View style={styles.row}>
            <Text style={styles.label}>{item.label}</Text>
            <View style={styles.counterRow}>
                <Text style={styles.counterVal}>{elapsed}s</Text>
                <TouchableOpacity
                    style={[styles.counterBtn, running && { backgroundColor: '#e53935' }]}
                    onPress={handleToggle}
                >
                    <Text style={styles.counterBtnText}>{running ? '⏹' : '▶'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.counterBtn, { backgroundColor: '#546e7a' }]}
                    onPress={() => { setRunning(false); setStart(null); onChange(0); }}
                >
                    <Text style={styles.counterBtnText}>↺</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ── Start Position (placeholder — needs field image from server) ──────────────
function StartPosControl({ item, value, onChange }: ControlProps) {
    const positions = ['Left', 'Center', 'Right'];
    return (
        <View style={styles.col}>
            <Text style={styles.label}>{item.label}</Text>
            <View style={styles.choiceRow}>
                {positions.map(p => (
                    <TouchableOpacity
                        key={p}
                        style={[styles.choiceBtn, value === p && styles.choiceBtnSelected]}
                        onPress={() => onChange(p)}
                    >
                        <Text style={[styles.choiceBtnText, value === p && styles.choiceBtnTextSelected]}>{p}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row:                   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#2d2d5e' },
    col:                   { padding: 12, borderBottomWidth: 1, borderBottomColor: '#2d2d5e' },
    label:                 { color: '#e0e0e0', fontSize: 15 },
    labelOnly:             { color: '#90a4ae', fontSize: 15, fontWeight: '600', padding: 12, backgroundColor: '#16213e' },
    counterRow:            { flexDirection: 'row', alignItems: 'center', gap: 8 },
    counterBtn:            { backgroundColor: '#4fc3f7', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 6 },
    counterBtnText:        { color: '#1a1a2e', fontSize: 20, fontWeight: 'bold' },
    counterVal:            { color: '#e0e0e0', fontSize: 22, minWidth: 36, textAlign: 'center' },
    textInput:             { backgroundColor: '#16213e', color: '#e0e0e0', borderRadius: 8, padding: 10, marginTop: 6, borderWidth: 1, borderColor: '#2d2d5e', minHeight: 60 },
    choiceRow:             { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    choiceBtn:             { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#4fc3f7' },
    choiceBtnSelected:     { backgroundColor: '#4fc3f7' },
    choiceBtnText:         { color: '#4fc3f7', fontSize: 15 },
    choiceBtnTextSelected: { color: '#1a1a2e' },
    unknown:               { color: '#ef5350', padding: 12 },
});
