import { auth, db } from './firebase.js';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 페이지 이동
window.showPage = function(pageId) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });

  document.getElementById(pageId).classList.add('active');
}

// 회원가입
window.signup = async function() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert('회원가입 성공');
  } catch(error) {
    alert(error.message);
  }
}

// 로그인
window.login = async function() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert('로그인 성공');
  } catch(error) {
    alert(error.message);
  }
}

// 로그인 상태
onAuthStateChanged(auth, user => {
  const userInfo = document.getElementById('userInfo');

  if(user) {
    userInfo.innerText = `로그인됨 : ${user.email}`;
  } else {
    userInfo.innerText = '로그인 안됨';
  }
});

// 게시글 작성
window.addPost = async function() {
  const text = document.getElementById('postInput').value;

  if(text.trim() === '') return;

  await addDoc(collection(db, 'posts'), {
    text,
    createdAt: serverTimestamp()
  });

  document.getElementById('postInput').value = '';
}

// 게시글 불러오기
const postQuery = query(
  collection(db, 'posts'),
  orderBy('createdAt', 'desc')
);

onSnapshot(postQuery, snapshot => {
  const postList = document.getElementById('postList');

  postList.innerHTML = '';

  snapshot.forEach(doc => {
    const post = doc.data();

    const div = document.createElement('div');
    div.className = 'post';
    div.innerText = post.text;

    postList.appendChild(div);
  });
});

// 메시지 전송
window.sendMessage = async function() {
  const input = document.getElementById('chatInput');

  if(input.value.trim() === '') return;

  await addDoc(collection(db, 'messages'), {
    text: input.value,
    createdAt: serverTimestamp()
  });

  input.value = '';
}

// 실시간 채팅 불러오기
const messageQuery = query(
  collection(db, 'messages'),
  orderBy('createdAt')
);

onSnapshot(messageQuery, snapshot => {
  const chatBox = document.getElementById('chatBox');

  chatBox.innerHTML = '';

  snapshot.forEach(doc => {
    const message = doc.data();

    const div = document.createElement('div');
    div.className = 'message';
    div.innerText = message.text;

    chatBox.appendChild(div);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
});
