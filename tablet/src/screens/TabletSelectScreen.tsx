import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { getApiClient } from '../api/client';
import type { ApiTablet } from '@xeroscout4/shared';

type Props = NativeStackScreenProps<RootStackParamList, 'TabletSelect'>;

export function TabletSelectScreen({ route, navigation }: Props) {
    const { eventUuid } = route.params;
    const [tablets, setTablets]  = useState<ApiTablet[]>([]);
    const [loading, setLoading]  = useState(true);

    useEffect(() => { void load(); }, []);

    async function load() {
        try {
            const client = await getApiClient();
            setTablets(await client.listTablets(eventUuid));
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
            <FlatList
                data={tablets}
                keyExtractor={t => t.name}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.item}
                        onPress={async () => {
                            try {
                                const client = await getApiClient();
                                const init   = await client.getTabletInit(eventUuid, item.name);
                                navigation.push('MatchList', {
                                    eventUuid,
                                    tabletName: item.name,
                                    purpose: init.tablet.purpose,
                                });
                            } catch (err) {
                                Alert.alert('Error', String(err));
                            }
                        }}
                    >
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.sub}>{item.purpose} — {item.assignedAlliance ? `Alliance ${item.assignedAlliance}` : 'Unassigned'}</Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.empty}>No tablets configured.</Text>}
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
