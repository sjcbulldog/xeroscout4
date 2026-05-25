import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ServerConfigScreen } from '../screens/ServerConfigScreen';
import { EventSelectScreen } from '../screens/EventSelectScreen';
import { TabletSelectScreen } from '../screens/TabletSelectScreen';
import { MatchListScreen } from '../screens/MatchListScreen';
import { ScoutFormScreen } from '../screens/ScoutFormScreen';
import { UploadQueueScreen } from '../screens/UploadQueueScreen';
import type { IPCForm } from '@xeroscout4/shared';
import type { ApiMatch } from '@xeroscout4/shared';

export type RootStackParamList = {
    ServerConfig: undefined;
    EventSelect: undefined;
    TabletSelect: { eventUuid: string };
    MatchList: { eventUuid: string; tabletName: string; purpose: 'team' | 'match' };
    ScoutForm: {
        eventUuid: string;
        tabletName: string;
        purpose: 'team' | 'match';
        match: ApiMatch;
        teamNumber: number;
        position: string;
        form: IPCForm;
    };
    UploadQueue: { eventUuid: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="ServerConfig"
                screenOptions={{
                    headerStyle: { backgroundColor: '#1a1a2e' },
                    headerTintColor: '#e0e0e0',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            >
                <Stack.Screen name="ServerConfig"   component={ServerConfigScreen}   options={{ title: 'XeroScout 4 — Server Setup' }} />
                <Stack.Screen name="EventSelect"     component={EventSelectScreen}    options={{ title: 'Select Event' }} />
                <Stack.Screen name="TabletSelect"    component={TabletSelectScreen}   options={{ title: 'Select Tablet' }} />
                <Stack.Screen name="MatchList"       component={MatchListScreen}      options={{ title: 'Matches' }} />
                <Stack.Screen name="ScoutForm"       component={ScoutFormScreen}      options={{ title: 'Scout', headerShown: false }} />
                <Stack.Screen name="UploadQueue"     component={UploadQueueScreen}    options={{ title: 'Upload Queue' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
