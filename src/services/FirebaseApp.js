import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBhWtIizJogCyJFOMAXTgq2TuRPTvLSSo4",
  authDomain: "crazy-cat-granny.firebaseapp.com",
  projectId: "crazy-cat-granny",
  storageBucket: "crazy-cat-granny.firebasestorage.app",
  messagingSenderId: "380885722645",
  appId: "1:380885722645:web:a7c9f5369a11cfd0d9501c"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
