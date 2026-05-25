import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { getApiClient } from '../api/client';
import { pendingCount } from '../storage/offlineQueue';
import type { ApiMatch, IPCForm } from '@xeroscout4/shared';

type Props = NativeStackScreenProps<RootStackParamList, 'MatchList'>;

export function MatchListScreen({ route, navigation }: Props) {
    const { eventUuid, tabletName, purpose } = route.params;
    const [matches, setMatches]   = useState<ApiMatch[]>([]);
    const [form, setForm]         = useState<IPCForm | null>(null);
    const [loading, setLoading]   = useState(true);
    const [queueCount, setQueueCount] = useState(0);

    useEffect(() => { void load(); }, []);
    useEffect(() => {
        const interval = setInterval(() => setQueueCount(pendingCount()), 5000);
        return () => clearInterval(interval);
    }, []);

    async function load() {
        try {
            const client     = await getApiClient();
            const [matchList, event] = await Promise.all([
                client.listMatches(eventUuid),
                client.getEvent(eventUuid),
            ]);
            setMatches(matchList.sort((a, b) => a.matchNumber - b.matchNumber));
            const formJson = purpose === 'team' ? event.teamFormJson : event.matchFormJson;
            setForm(formJson ? JSON.parse(formJson) as IPCForm : null);
            setQueueCount(pendingCount());
        } catch (err) {
            Alert.alert('Error', String(err));
        } finally {
            setLoading(false);
        }
    }

    if (loading) return (
        <View style={styles.center}><ActivityIndicator size="large" color="#4fc3f7" /></View>
    );

    return (
        <View style={styles.container}>
            {queueCount > 0 && (
                <TouchableOpacity
                    style={styles.queueBanner}
                    onPress={() => navigation.push('UploadQueue', { eventUuid })}
                >
                    <Text style={styles.queueText}>⚠ {queueCount} result{queueCount !== 1 ? 's' : ''} pending upload — Tap to upload</Text>
                </TouchableOpacity>
            )}
            <FlatList
                data={matches}
                keyExtractor={m => String(m.id)}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.item}
                        disabled={!form}
                        onPress={() => {
                            if (!form) return;
                            const alliance = tabletName.toLowerCase().includes('red') ? 'red' : 'blue';
                            const pos = tabletName.replace(/[^0-9]/g, '') || '1';
                            const teams = alliance === 'red' ? item.redTeams : item.blueTeams;
                            const teamNumber = teams[parseInt(pos, 10) - 1] ?? teams[0];
                            navigation.push('ScoutForm', {
                                eventUuid,
                                tabletName,
                                purpose,
                                match: item,
                                teamNumber,
                                position: `${alliance}${pos}`,
                                form,
                            });
                        }}
                    >
                        <Text style={styles.matchNum}>Match {item.matchNumber}</Text>
                        <Text style={styles.teams}>
                            🔴 {item.redTeams.join(', ')}   🔵 {item.blueTeams.join(', ')}
                        </Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.empty}>No matches yet.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: '#1a1a2e' },
    center:      { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' },
    item:        { padding: 16, borderBottomWidth: 1, borderBottomColor: '#2d2d5e' },
    matchNum:    { color: '#e0e0e0', fontSize: 16, fontWeight: '600' },
    teams:       { color: '#90a4ae', fontSize: 13, marginTop: 4 },
    empty:       { color: '#666', textAlign: 'center', marginTop: 48, fontSize: 16 },
    queueBanner: { backgroundColor: '#e65100', padding: 12 },
    queueText:   { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
});
