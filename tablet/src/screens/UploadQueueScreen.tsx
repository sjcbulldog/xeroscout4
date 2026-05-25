import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { listPending, markSent, markFailed, QueuedResult } from '../storage/offlineQueue';
import { getApiClient } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'UploadQueue'>;

export function UploadQueueScreen({ route, navigation }: Props) {
    const { eventUuid } = route.params;
    const [items, setItems]     = useState<QueuedResult[]>([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => { refresh(); }, []);

    function refresh() { setItems(listPending()); }

    async function uploadAll() {
        setUploading(true);
        const pending = listPending();
        const client  = await getApiClient();
        let ok = 0, fail = 0;
        for (const item of pending) {
            try {
                await client.submitResult(item.eventUuid, item.payload);
                markSent(item.id);
                ok++;
            } catch (err) {
                markFailed(item.id, String(err));
                fail++;
            }
        }
        refresh();
        setUploading(false);
        if (fail === 0) {
            Alert.alert('Upload Complete', `${ok} result(s) uploaded successfully.`);
            if (ok > 0) navigation.goBack();
        } else {
            Alert.alert('Partial Upload', `${ok} uploaded, ${fail} failed. Check server connection.`);
        }
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={items}
                keyExtractor={i => String(i.id)}
                renderItem={({ item }) => (
                    <View style={styles.item}>
                        <Text style={styles.itemTitle}>
                            Match {item.payload.matchNumber} — Team {item.payload.teamNumber}
                        </Text>
                        <Text style={styles.itemSub}>
                            Position: {item.payload.position} | Attempts: {item.attempts}
                        </Text>
                        {item.lastError && <Text style={styles.itemError}>{item.lastError}</Text>}
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.empty}>Nothing queued.</Text>}
            />
            {items.length > 0 && (
                uploading
                    ? <ActivityIndicator size="large" color="#4fc3f7" style={{ margin: 16 }} />
                    : (
                        <TouchableOpacity style={styles.uploadBtn} onPress={uploadAll}>
                            <Text style={styles.uploadBtnText}>Upload All ({items.length})</Text>
                        </TouchableOpacity>
                    )
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container:     { flex: 1, backgroundColor: '#1a1a2e' },
    item:          { padding: 16, borderBottomWidth: 1, borderBottomColor: '#2d2d5e' },
    itemTitle:     { color: '#e0e0e0', fontSize: 15, fontWeight: '600' },
    itemSub:       { color: '#90a4ae', fontSize: 12, marginTop: 4 },
    itemError:     { color: '#ef5350', fontSize: 12, marginTop: 4 },
    empty:         { color: '#666', textAlign: 'center', marginTop: 48, fontSize: 16 },
    uploadBtn:     { margin: 16, backgroundColor: '#4fc3f7', padding: 16, borderRadius: 8, alignItems: 'center' },
    uploadBtnText: { color: '#1a1a2e', fontSize: 16, fontWeight: 'bold' },
});
