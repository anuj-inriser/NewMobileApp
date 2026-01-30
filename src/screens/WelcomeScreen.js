import React from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
} from 'react-native';

export default function WelcomeScreen({navigation}) {
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Illustration */}
                <Image
                    source={require('../../assets/welcome.png')}
                    style={styles.image}
                    resizeMode="contain"
                />


                {/* Text Section */}
                <Text style={styles.title}>Hi there!</Text>
                <Text style={styles.subtitle}>
                    Welcome to <Text style={styles.bold}>1Trade</Text>, a partner to your
                    financial journey.
                </Text>

                <Text style={styles.body}>
                    We help you manage your finances and portfolios, you can also trade
                    through different brokers. We shall share relevant market updates
                    based on your preferences, all at one place.
                </Text>

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.signUpBtn} onPress={() => navigation.navigate('Signup')}>
                        <Text style={styles.signUpText}>Sign Up</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.loginBtn}
                        onPress={() => navigation.navigate('Login')}  // 👈 navigate to Login
                    >
                        <Text style={styles.loginText}>Login</Text>
                    </TouchableOpacity>

                </View>

                {/* Footer Note */}
                <Text style={styles.footer}>
                    Note: We are SEBI Registered through our Research Analyst Number XXXXX
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scroll: { padding: 24, alignItems: 'center' },
    image: { width: "100%", height: 220, marginTop: 90 },
    title: { fontSize: 24, fontWeight: '700', color: '#210F47', marginTop: 20 },
    subtitle: { fontSize: 16, textAlign: 'center', marginTop: 8, color: '#000' },
    bold: { fontWeight: '700' },
    body: {
        fontSize: 14,
        textAlign: 'center',
        color: '#444',
        marginTop: 10,
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        marginTop: 25,
    },
    signUpBtn: {
        backgroundColor: '#EAEAEA',
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 25,
        marginRight: 10,
    },
    loginBtn: {
        backgroundColor: '#210F47',
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 25,
    },
    signUpText: { color: '#000', fontWeight: '600' },
    loginText: { color: '#fff', fontWeight: '600' },
    footer: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginTop: 25,
        lineHeight: 18,
    },
});
