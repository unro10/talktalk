import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCwvEU45zXUnJTcISF2CHBb1H5kPvA1UnY",
  authDomain: "talktalk-c3cbe.firebaseapp.com",
  databaseURL: "https://talktalk-c3cbe-default-rtdb.firebaseio.com",
  projectId: "talktalk-c3cbe",
  storageBucket: "talktalk-c3cbe.firebasestorage.app",
  messagingSenderId: "476607267300",
  appId: "1:476607267300:web:1d0ea398b686227c3e87f1",
  measurementId: "G-HYD9W5XNX0"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
