import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import * as Device from 'expo-device';
import * as Network from 'expo-network';
import { apiUrl } from '../utils/apiUrl';

export default function PasswordScreen({ navigation, route }) {
  const { name, email, phone } = route.params;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ip, setIp] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  async function fetchDeviceInfo() {
    try {
      // Device ID
      const id = Device.osBuildId || Device.modelId || Device.deviceName || 'Unknown';
      setDeviceId(id);

      // Public IP via external API (works everywhere)
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      setIp(data.ip || 'Unknown');
    } catch (err) {
      setDeviceId('Unknown');
      setIp('Unknown');
    }
  }
  fetchDeviceInfo();
}, []);

  const handleSubmit = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please enter and confirm password.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      Alert.alert('Invalid Phone', 'Phone number must be 10 digits.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          signupip: ip || 'Unknown',
          signupdeviceid: deviceId || 'Unknown',
          password,
        }),
      });

      const result = await response.json();
      setLoading(false);

      if (result.status) {
        Alert.alert('Success', 'Signup completed successfully.');
        navigation.navigate('Demat');
      } else {
        Alert.alert('Error', result.message || 'Signup failed.');
      }
    } catch (error) {
      setLoading(false);
      console.error('Signup error:', error);
      Alert.alert('Error', 'Unable to connect to server.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Image source={require('../../assets/password.png')} style={styles.image} resizeMode="contain" />
        <Text style={styles.title}>Set Your Password</Text>

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Retype Password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextBtn, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.nextText}>{loading ? 'Submitting...' : 'Next'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.note}>Device ID: {deviceId || '...'} | IP: {ip || '...'}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 24, alignItems: 'center' },
  image: { width: '100%', height: 250 },
  title: { fontSize: 22, fontWeight: '700', color: '#210F47', marginVertical: 10, alignSelf: 'flex-start' },
  input: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 10, height: 45, paddingHorizontal: 12, marginTop: 12 },
  buttonRow: { flexDirection: 'row', marginTop: 25, justifyContent: 'space-between', width: '100%' },
  backBtn: { backgroundColor: '#EAEAEA', borderRadius: 25, paddingVertical: 10, paddingHorizontal: 25 },
  backText: { color: '#000', fontWeight: '600' },
  nextBtn: { backgroundColor: '#210F47', borderRadius: 25, paddingVertical: 10, paddingHorizontal: 25 },
  nextText: { color: '#fff', fontWeight: '600' },
  note: { fontSize: 12, color: '#666', marginTop: 25, textAlign: 'center' },
});
