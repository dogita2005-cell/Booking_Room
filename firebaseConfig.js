import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDQggh8IqcwvAge93o9SNomp8TXLuFMv9k",
  authDomain: "bookingroom-8ba0a.firebaseapp.com",
  projectId: "bookingroom-8ba0a",
  storageBucket: "bookingroom-8ba0a.firebasestorage.app",
  messagingSenderId: "502029412632",
  appId: "1:502029412632:web:e61c8d662a402da302966d",
  measurementId: "G-03S64QVEPW"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);