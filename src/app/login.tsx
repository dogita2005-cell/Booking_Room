import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../firebaseConfig'; // Trỏ đúng đường dẫn đến file firebaseConfig của bạn
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

// Hoàn tất phiên trình duyệt web sau khi chọn tài khoản Google
WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = '502029412632-4qgtssv1fb17ucrqerkqtdc3p6u92736.apps.googleusercontent.com'; // phải là client ID loại "Web application"

// Nạp google-signin an toàn: Expo Go không có module native này nên không được import trực tiếp
let GoogleSignin: any = null;
if (Platform.OS !== 'web') {
  try {
    GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
    GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
  } catch (e) {
    GoogleSignin = null; // đang chạy trong Expo Go
  }
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cấu hình Google Auth Request sử dụng Expo AuthSession Proxy
const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '502029412632-4qgtssv1fb17ucrqerkqtdc3p6u92736.apps.googleusercontent.com',
    iosClientId: '502029412632-4qgtssv1fb17ucrqerkqtdc3p6u92736.apps.googleusercontent.com',
    androidClientId: '502029412632-4qgtssv1fb17ucrqerkqtdc3p6u92736.apps.googleusercontent.com',
  });
  // Lắng nghe phản hồi khi người dùng chọn tài khoản Google xong
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.idToken) {
        handleGoogleFirebaseLogin(authentication.idToken);
      }
    }
  }, [response]);

  const handleGoogleFirebaseLogin = async (idToken: string) => {
    setLoading(true);
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      // Đăng nhập thành công, chuyển hướng vào trang chủ (Tabs)
      router.replace('/(tabs)');
    } catch (error: any) {
      const msg = error.message || 'Đăng nhập Google thất bại.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  // Đăng nhập Google bản native (Android/iOS) bằng google-signin
  const handleGoogleNative = async () => {
    if (!GoogleSignin) {
      Alert.alert('Chưa hỗ trợ', 'Đăng nhập Google chỉ chạy trong bản APK đã build. Hãy dùng Email/Mật khẩu khi chạy Expo Go.');
      return;
    }
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const res: any = await GoogleSignin.signIn();
      if (res?.type === 'cancelled') return; // người dùng tự đóng hộp thoại
      const idToken = res?.data?.idToken;
      if (!idToken) throw new Error('Không lấy được idToken từ Google.');
      await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
      router.replace('/(tabs)');
    } catch (error: any) {
      const msg = error?.message || 'Đăng nhập Google thất bại.';
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  // Web dùng expo-auth-session, điện thoại dùng google-signin
  const handleGooglePress = () => {
    if (Platform.OS === 'web') promptAsync();
    else handleGoogleNative();
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      const msg = 'Vui lòng nhập đầy đủ Email và Mật khẩu.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Thông báo', msg);
      return;
    }

    setLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      router.replace('/(tabs)');
    } catch (error: any) {
      const errMessage = error.message || 'Đã xảy ra lỗi xác thực.';
      Platform.OS === 'web' ? window.alert(errMessage) : Alert.alert('Lỗi', errMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerContainer}>
          <Text style={styles.logoTitle}>VKU ROOMS</Text>
          <Text style={styles.subtitle}>
            {isRegistering ? 'Đạo tạo tài khoản mới' : 'Đăng nhập hệ thống đặt phòng'}
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email sinh viên</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: taitv.23it@vku.udn.vn"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity 
          style={styles.mainButton} 
          onPress={handleEmailAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.mainButtonText}>
              {isRegistering ? 'Đăng Ký' : 'Đăng Nhập'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Hoặc</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* NÚT ĐĂNG NHẬP BẰNG GOOGLE */}
        <TouchableOpacity 
          style={styles.googleButton} 
          onPress={handleGooglePress}
          disabled={loading || (Platform.OS === 'web' && !request)}
        >
          <Text style={styles.googleButtonText}>🌐 Đăng nhập bằng Google</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.switchButton}
          onPress={() => setIsRegistering(!isRegistering)}
        >
          <Text style={styles.switchText}>
            {isRegistering ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Đăng ký mới'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#3B82F6',
    letterSpacing: 1,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0F172A',
  },
  mainButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
    elevation: 2,
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  googleButtonText: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '700',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  switchText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
});