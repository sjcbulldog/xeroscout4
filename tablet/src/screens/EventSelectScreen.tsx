import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { getApiClient } from '../api/client';
import type { ApiEvent } from '@xeroscout4/shared';

type Props = NativeStackScreenProps<RootStackParamList, 'EventSelect'>;

export function EventSelectScreen({ navigation }: Props) {
    const [events, setEvents]   = useState<ApiEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        void load();
    }, []);

    async function load() {
        try {
            const client = await getApiClient();
            const list   = await client.listEvents();
            setEvents(list.filter(e => !e.locked));
        } catch (err) {
            Alert.alert('Error', String(err));
        } finally {
            setLoading(false);
        }
    }

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#4fc3f7" />
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={events}
                keyExtractor={e => e.uuid}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.item}
                        onPress={() => navigation.push('TabletSelect', { eventUuid: item.uuid })}
                    >
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.sub}>{item.startDate} — {item.endDate}</Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.empty}>No open events found.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1a1a2e' },
    center:    { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' },
    item:      { padding: 20, borderBottomWidth: 1, borderBottomColor: '#2d2d5e' },
    name:      { color: '#e0e0e0', fontSize: 18, fontWeight: '600' },
    sub:       { color: '#90a4ae', fontSize: 13, marginTop: 4 },
    empty:     { color: '#666', textAlign: 'center', marginTop: 48, fontSize: 16 },
});
