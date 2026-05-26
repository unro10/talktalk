import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  getDocs,
  where,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

/* 전역 변수 */
let currentUser = null;
const postsDiv = document.getElementById("posts");

/* 사이드바 토글 */
window.toggleSidebar = function () {
  document.getElementById("sidebar").classList.toggle("active");
  document.getElementById("overlay").classList.toggle("active");
};

/* 회원가입 */
document.getElementById("signupBtn").onclick = async () => {
  try {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const nickname = document.getElementById("nicknameInput").value.trim();

    if (!email || !password || !nickname) {
      alert("전부 입력해주세요");
      return;
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 초기 유저 문서 생성 (상태메시지, 프로필 이미지 필드 제외)
    await setDoc(doc(db, "users", user.uid), {
      nickname,
      email,
      friends: []
    });

    alert("회원가입 성공");
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";
    document.getElementById("nicknameInput").value = "";

  } catch (err) {
    alert("회원가입 실패: " + err.message);
  }
};

/* 로그인 */
document.getElementById("loginBtn").onclick = async () => {
  try {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    await signInWithEmailAndPassword(auth, email, password);
    alert("로그인 성공");
    
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";
  } catch (err) {
    alert("로그인 실패: " + err.message);
  }
};

/* 로그아웃 */
document.getElementById("logoutBtn").onclick = async () => {
  try {
    await signOut(auth);
    alert("로그아웃 완료");
  } catch (err) {
    alert(err.message);
  }
};

/* 로그인 상태 실시간 감지 */
onAuthStateChanged(auth, async (user) => {
  currentUser = user;

  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");

  if (user) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      profileName.innerText = userData.nickname || "이름 없음";
      profileEmail.innerText = userData.email || "";

      loadFriends(userData.friends);
    }
  } else {
    // 로그아웃 상태 UI 초기화
    profileName.innerText = "로그인 안됨";
    profileEmail.innerText = "";
    document.getElementById("friendList").innerHTML = "";
  }
});

/* 친구 추가 로직 */
document.getElementById("addFriendBtn").onclick = async () => {
  try {
    if (!currentUser) {
      alert("로그인이 필요합니다.");
      return;
    }

    const friendEmail = document.getElementById("friendEmail").value.trim();
    if (!friendEmail) {
      alert("친구의 이메일을 입력해주세요.");
      return;
    }

    if (friendEmail === currentUser.email) {
      alert("본인은 친구로 추가할 수 없습니다.");
      return;
    }

    const q = query(collection(db, "users"), where("email", "==", friendEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      alert("해당 이메일을 사용하는 사용자가 존재하지 않습니다.");
      return;
    }

    const myUserRef = doc(db, "users", currentUser.uid);
    await updateDoc(myUserRef, {
      friends: arrayUnion(friendEmail)
    });

    alert("친구 추가 완료!");
    document.getElementById("friendEmail").value = "";

    const mySnap = await getDoc(myUserRef);
    if (mySnap.exists()) {
      loadFriends(mySnap.data().friends);
    }

  } catch (err) {
    alert("친구 추가 실패: " + err.message);
  }
};

/* 친구 목록 렌더링 */
async function loadFriends(friends) {
  const friendList = document.getElementById("friendList");
  friendList.innerHTML = "";

  if (!friends || friends.length === 0) {
    friendList.innerHTML = "<div style='color:#999; font-size:13px;'>추가된 친구가 없습니다.</div>";
    return;
  }

  friends.forEach((friend) => {
    const div = document.createElement("div");
    div.className = "friend-item";
    div.innerText = friend;
    friendList.appendChild(div);
  });
}

/* 게시글 작성 */
document.getElementById("uploadBtn").onclick = async () => {
  try {
    if (!currentUser) {
      alert("로그인이 필요합니다.");
      return;
    }

    const content = document.getElementById("content").value.trim();
    if (!content) {
      alert("내용을 입력해주세요.");
      return;
    }

    const userSnap = await getDoc(doc(db, "users", currentUser.uid));
    const userData = userSnap.data();

    await addDoc(collection(db, "posts"), {
      uid: currentUser.uid,
      nickname: userData.nickname || "사용자",
      content,
      likes: [],
      createdAt: serverTimestamp()
    });

    document.getElementById("content").value = "";
  } catch (err) {
    alert("게시글 올리기 실패: " + err.message);
  }
};

/* 게시글 실시간 불러오기 (프로필 이미지 태그 영역 삭제) */
const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"));

onSnapshot(postsQuery, (snapshot) => {
  postsDiv.innerHTML = "";

  snapshot.forEach((postDoc) => {
    const data = postDoc.data();
    const post = document.createElement("div");
    post.className = "post";
    const likes = data.likes || [];

    post.innerHTML = `
      <div class="post-header">
        <div>
          <div class="nickname">${escapeHTML(data.nickname || "사용자")}</div>
          <div class="date">${formatDate(data.createdAt)}</div>
        </div>
      </div>
      <div class="content">${escapeHTML(data.content || "")}</div>
      <button class="like-btn" data-id="${postDoc.id}">
        ❤️ ${likes.length}
      </button>
    `;
    postsDiv.appendChild(post);
  });
});

/* 좋아요 토글 */
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("like-btn")) {
    try {
      if (!currentUser) {
        alert("로그인이 필요합니다.");
        return;
      }

      const postId = e.target.dataset.id;
      const postRef = doc(db, "posts", postId);
      const postSnap = await getDoc(postRef);

      if (!postSnap.exists()) return;

      const postData = postSnap.data();
      let likes = postData.likes || [];

      if (likes.includes(currentUser.uid)) {
        likes = likes.filter(uid => uid !== currentUser.uid);
      } else {
        likes.push(currentUser.uid);
      }

      await updateDoc(postRef, { likes });
    } catch (err) {
      console.error("좋아요 처리 오류:", err);
    }
  }
});

/* 타임스탬프 변환 */
function formatDate(timestamp) {
  if (!timestamp) return "방금 전";
  const date = timestamp.toDate();
  return date.toLocaleString("ko-KR");
}

/* XSS 방지 */
function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
