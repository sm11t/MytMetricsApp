import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Dimensions, StyleSheet, PermissionsAndroid, Platform } from 'react-native';
import GoogleFit, { Scopes } from 'react-native-google-fit';
import { VictoryChart, VictoryLine, VictoryTheme, VictoryAxis } from 'victory-native';

const mockHRData = [
  { x: 'Mon', y: 72 },
  { x: 'Tue', y: 75 },
  { x: 'Wed', y: 70 },
  { x: 'Thu', y: 68 },
  { x: 'Fri', y: 74 },
  { x: 'Sat', y: 73 },
  { x: 'Sun', y: 71 },
];

function TrackScreen() {
  const [hrData, setHrData] = useState<{ x: string; y: number }[]>([]);

  useEffect(() => {
    async function fetchData() {
      // On Android 10+ request ACTIVITY_RECOGNITION first
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn('Activity recognition permission denied');
          return;
        }
      }

      const options = {
        scopes: [
          Scopes.FITNESS_ACTIVITY_READ,
          Scopes.FITNESS_HEART_RATE_READ,
        ],
      };

      GoogleFit.authorize(options)
        .then(authResult => {
          console.log('🔍 FULL AUTH RESULT:', authResult);
          if (authResult.success) {
            const end = new Date();
            const start = new Date();
            start.setDate(end.getDate() - 7);

            GoogleFit.getHeartRateSamples({
              startDate: start.toISOString(),
              endDate: end.toISOString(),
            })
              .then(samples => {
                const formatted = (samples as Array<{ value: number; startDate: string }>).map(s => ({
                  x: new Date(s.startDate).toLocaleDateString('en-US', { weekday: 'short' }),
                  y: s.value as number,
                }));
                setHrData(formatted);
              })
              .catch(err => console.error('HR fetch error', err));
          } else {
            console.warn('Auth denied:', authResult);
          }
        })
        .catch(err => console.error('Auth error:', err));
    }

    fetchData();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Your Metrics</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Resting Heart Rate (7d)</Text>
        <VictoryChart
          theme={VictoryTheme.material}
          width={Dimensions.get('window').width - 32}
          height={200}
        >
          <VictoryAxis style={{ tickLabels: { fontSize: 10 } }} />
          <VictoryAxis dependentAxis style={{ tickLabels: { fontSize: 10 } }} />
          <VictoryLine
            data={hrData.length ? hrData : mockHRData}
            interpolation="monotoneX"
            style={{ data: { strokeWidth: 2 } }}
          />
        </VictoryChart>
      </View>
      {/* …other cards */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { fontSize: 24, fontWeight: '600', marginBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '500', marginBottom: 8 },
});

export default TrackScreen;
