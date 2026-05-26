// Firebase v9 모듈
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔥 Firebase 설정 (네가 준 값)
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

// init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 페이지 이동
window.showPage = (id) => {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
};

// 로그인 상태
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  document.getElementById("userInfo").innerText =
    user ? `로그인됨: ${user.email}` : "로그인 안됨";
});

// 회원가입
window.signup = async () => {
  const email = email.value;
  const password = password.value;

  await createUserWithEmailAndPassword(auth, email, password);
};

// 로그인
window.login = async () => {
  const email = email.value;
  const password = password.value;

  await signInWithEmailAndPassword(auth, email, password);
};

// 게시글 작성
window.addPost = async () => {
  const text = postInput.value;

  await addDoc(collection(db, "posts"), {
    text,
    user: currentUser?.email || "익명",
    createdAt: serverTimestamp()
  });

  postInput.value = "";
};

// 게시글 읽기
onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc")), (snap) => {
  postList.innerHTML = "";
  snap.forEach(doc => {
    const d = doc.data();
    postList.innerHTML += `
      <div class="post">
        <b>${d.user}</b>
        <p>${d.text}</p>
      </div>
    `;
  });
});

// 채팅 보내기
window.sendMessage = async () => {
  const text = chatInput.value;

  await addDoc(collection(db, "messages"), {
    text,
    user: currentUser?.email || "익명",
    createdAt: serverTimestamp()
  });

  chatInput.value = "";
};

// 채팅 읽기
onSnapshot(query(collection(db, "messages"), orderBy("createdAt")), (snap) => {
  chatBox.innerHTML = "";
  snap.forEach(doc => {
    const d = doc.data();
    chatBox.innerHTML += `
      <div class="message">
        <b>${d.user}</b>
        <p>${d.text}</p>
      </div>
    `;
  });
});
