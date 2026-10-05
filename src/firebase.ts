import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAxHfJzfRzSAwp4qroKzMVSTY0AdD3Euu0",
  authDomain: "nobre-barber-club.firebaseapp.com",
  projectId: "nobre-barber-club",
  storageBucket: "nobre-barber-club.firebasestorage.app",
  messagingSenderId: "369597114620",
  appId: "1:369597114620:web:17b9408a0863961b36cf79",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;