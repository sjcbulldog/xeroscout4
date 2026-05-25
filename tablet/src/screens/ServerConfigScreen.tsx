import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { getApiClient, resetApiClient } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'ServerConfig'>;

export function ServerConfigScreen({ navigation }: Props) {
    const [baseUrl, setBaseUrl] = useState('');
    const [apiKey, setApiKey]   = useState('');
    const [loading, setLoading] = useState(false);

    async function handleConnect() {
        if (!baseUrl || !apiKey) {
            Alert.alert('Validation', 'Please enter both Server URL and API Key.');
            return;
        }
        setLoading(true);
        resetApiClient();
        try {
            const client = await getApiClient();
            client.setBaseUrl(baseUrl);
            client.setApiKey(apiKey);
            const health = await client.health();
            if (!health.ok) throw new Error('Server returned not-ok');
            await client.persistConfig();
            navigation.replace('EventSelect');
        } catch (err) {
            Alert.alert('Connection Failed', String(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>XeroScout 4</Text>
            <Text style={styles.subtitle}>Scouting Tablet</Text>

            <Text style={styles.label}>Server URL</Text>
            <TextInput
                style={styles.input}
                value={baseUrl}
                onChangeText={setBaseUrl}
                placeholder="http://192.168.1.100:4560"
                placeholderTextColor="#666"
                autoCapitalize="none"
                keyboardType="url"
            />

            <Text style={styles.label}>API Key</Text>
            <TextInput
                style={styles.input}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="xs4_..."
                placeholderTextColor="#666"
                autoCapitalize="none"
                secureTextEntry
            />

            {loading
                ? <ActivityIndicator size="large" color="#4fc3f7" style={{ marginTop: 24 }} />
                : (
                    <TouchableOpacity style={styles.button} onPress={handleConnect}>
                        <Text style={styles.buttonText}>Connect</Text>
                    </TouchableOpacity>
                )}
        </View>
    );
}

const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: '#1a1a2e', padding: 32, justifyContent: 'center' },
    title:       { fontSize: 36, fontWeight: 'bold', color: '#e0e0e0', textAlign: 'center', marginBottom: 4 },
    subtitle:    { fontSize: 18, color: '#90a4ae', textAlign: 'center', marginBottom: 48 },
    label:       { color: '#90a4ae', fontSize: 14, marginBottom: 4 },
    input:       { backgroundColor: '#16213e', color: '#e0e0e0', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: '#2d2d5e' },
    button:      { backgroundColor: '#4fc3f7', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8 },
    buttonText:  { color: '#1a1a2e', fontSize: 18, fontWeight: 'bold' },
});
