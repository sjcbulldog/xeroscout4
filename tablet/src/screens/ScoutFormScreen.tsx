import React, { useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
    SafeAreaView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { FormControl } from '../components/formcontrols/FormControl';
import { getApiClient } from '../api/client';
import { enqueue } from '../storage/offlineQueue';
import type { DataValue } from '@xeroscout4/shared';

type Props = NativeStackScreenProps<RootStackParamList, 'ScoutForm'>;

export function ScoutFormScreen({ route, navigation }: Props) {
    const { eventUuid, tabletName, purpose, match, teamNumber, position, form } = route.params;

    const initialValues: Record<string, DataValue> = {};
    for (const section of form.sections) {
        for (const item of section.items) {
            initialValues[item.tag] = item.defaultValue ?? (item.type === 'counter' || item.type === 'updown' ? 0 : '');
        }
    }

    const [values, setValues] = useState<Record<string, DataValue>>(initialValues);
    const [saving, setSaving]  = useState(false);
    const [sectionIdx, setSectionIdx] = useState(0);

    const section = form.sections[sectionIdx];

    function setValue(tag: string, v: DataValue) {
        setValues(prev => ({ ...prev, [tag]: v }));
    }

    async function handleSubmit() {
        setSaving(true);
        const payload = {
            eventUuid,
            tabletName,
            purpose,
            matchNumber: match.matchNumber,
            teamNumber,
            position,
            dataJson: JSON.stringify(values),
            scoutedAt: new Date().toISOString(),
        };
        try {
            const client = await getApiClient();
            await client.submitResult(eventUuid, payload);
            navigation.goBack();
        } catch {
            // Server unreachable — queue locally
            await enqueue(eventUuid, payload);
            Alert.alert(
                'Saved offline',
                'Could not reach server. Result saved to upload queue.',
                [{ text: 'OK', onPress: () => navigation.goBack() }],
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <SafeAreaView style={styles.root}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>
                    Match {match.matchNumber} — Team {teamNumber} ({position})
                </Text>
                <Text style={styles.headerSub}>{purpose === 'team' ? 'Pit Scout' : 'Match Scout'}</Text>
            </View>

            {/* Section tabs */}
            <ScrollView horizontal style={styles.tabs} showsHorizontalScrollIndicator={false}>
                {form.sections.map((s, i) => (
                    <TouchableOpacity
                        key={i}
                        style={[styles.tab, i === sectionIdx && styles.tabActive]}
                        onPress={() => setSectionIdx(i)}
                    >
                        <Text style={[styles.tabText, i === sectionIdx && styles.tabTextActive]}>
                            {s.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Controls */}
            <ScrollView style={styles.controls}>
                {section?.items.map(item => (
                    <FormControl
                        key={item.tag}
                        item={item}
                        value={values[item.tag]}
                        onChange={v => setValue(item.tag, v)}
                    />
                ))}
            </ScrollView>

            {/* Footer buttons */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={saving}
                >
                    <Text style={styles.submitText}>{saving ? 'Saving…' : 'Submit'}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root:               { flex: 1, backgroundColor: '#1a1a2e' },
    header:             { backgroundColor: '#16213e', padding: 12, borderBottomWidth: 1, borderBottomColor: '#2d2d5e' },
    headerTitle:        { color: '#e0e0e0', fontSize: 18, fontWeight: 'bold' },
    headerSub:          { color: '#90a4ae', fontSize: 13, marginTop: 2 },
    tabs:               { maxHeight: 48, backgroundColor: '#16213e' },
    tab:                { paddingHorizontal: 16, paddingVertical: 12 },
    tabActive:          { borderBottomWidth: 3, borderBottomColor: '#4fc3f7' },
    tabText:            { color: '#90a4ae', fontSize: 14 },
    tabTextActive:      { color: '#4fc3f7', fontWeight: '600' },
    controls:           { flex: 1 },
    footer:             { flexDirection: 'row', gap: 12, padding: 12, backgroundColor: '#16213e', borderTopWidth: 1, borderTopColor: '#2d2d5e' },
    cancelBtn:          { flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#546e7a', alignItems: 'center' },
    cancelText:         { color: '#90a4ae', fontSize: 16 },
    submitBtn:          { flex: 2, padding: 14, borderRadius: 8, backgroundColor: '#4fc3f7', alignItems: 'center' },
    submitBtnDisabled:  { opacity: 0.5 },
    submitText:         { color: '#1a1a2e', fontSize: 16, fontWeight: 'bold' },
});
