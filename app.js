import { auth, db, storage } from "./firebase.js";
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

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-storage.js";

/* 전역 변수 */
let currentUser = null;
const postsDiv = document.getElementById("posts");

/* 사이드바 토글 (HTML에서 호출할 수 있도록 window 객체에 바인딩) */
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

    // 초기 유저 문서 생성
    await setDoc(doc(db, "users", user.uid), {
      nickname,
      email,
      status: "상태메세지 없음",
      profileImage: "",
      friends: []
    });

    alert("회원가입 성공");
    // 입력 칸 비우기
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
  const profileStatus = document.getElementById("profileStatus");
  const profileImage = document.getElementById("profileImage");

  if (user) {
    // 유저가 로그인 상태일 때 Firestore에서 추가 정보 실시간 로드
    const userRef = doc(db, "users", user.uid);
    
    // 회원정보 동기화를 위해 단발성 getDoc 대신 실시간 감시(onSnapshot) 결합 가능하나, 
    // 여기서는 변화 시 수동 갱신 혹은 세션 유지를 위해 기본 데이터 바인딩을 진행합니다.
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      profileName.innerText = userData.nickname || "이름 없음";
      profileEmail.innerText = userData.email || "";
      profileStatus.innerText = userData.status || "상태메세지 없음";
      profileImage.src = userData.profileImage || "https://cdn-icons-png.flaticon.com/512/149/149071.png";

      loadFriends(userData.friends);
    }
  } else {
    // 로그아웃 상태 UI 초기화
    profileName.innerText = "로그인 안됨";
    profileEmail.innerText = "";
    profileStatus.innerText = "상태메세지 없음";
    profileImage.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    document.getElementById("friendList").innerHTML = "";
  }
});

/* 프로필 저장 (상태메시지 및 이미지 업로드) */
document.getElementById("saveProfileBtn").onclick = async () => {
  try {
    if (!currentUser) {
      alert("로그인이 필요합니다.");
      return;
    }

    const statusValue = document.getElementById("statusInput").value.trim();
    const file = document.getElementById("profileUpload").files[0];

    const updateData = {};

    // 1. 상태메시지 입력값이 있는 경우만 업데이트 대상에 추가
    if (statusValue) {
      updateData.status = statusValue;
    }

    // 2. 파일이 선택된 경우 Storage 업로드 후 URL 확보
    if (file) {
      const storageRef = ref(storage, `profiles/${currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);
      updateData.profileImage = imageUrl;
    }

    // 3. 변경할 내용이 존재할 때만 updateDoc 실행 (데이터 덮어쓰기 방지)
    if (Object.keys(updateData).length > 0) {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, updateData);

      alert("프로필이 저장되었습니다.");
      
      // 화면 갱신을 위해 UI 텍스트 임시 반영 및 인풋 초기화
      if (updateData.status) document.getElementById("profileStatus").innerText = updateData.status;
      if (updateData.profileImage) document.getElementById("profileImage").src = updateData.profileImage;
      
      document.getElementById("statusInput").value = "";
      document.getElementById("profileUpload").value = "";
    } else {
      alert("변경할 내용을 입력하거나 파일을 선택해주세요.");
    }

  } catch (err) {
    alert("프로필 저장 실패: " + err.message);
  }
};

/* 친구 추가 로직 (getDocs 방식으로 안전하게 변경) */
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

    // users 컬렉션에서 해당 이메일을 가진 문서 딱 1개만 조회
    const q = query(collection(db, "users"), where("email", "==", friendEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      alert("해당 이메일을 사용하는 사용자가 존재하지 않습니다.");
      return;
    }

    // 내 문서의 friends 배열에 친구 이메일 추가
    const myUserRef = doc(db, "users", currentUser.uid);
    await updateDoc(myUserRef, {
      friends: arrayUnion(friendEmail)
    });

    alert("친구 추가 완료!");
    document.getElementById("friendEmail").value = "";

    // 최신 친구 목록 화면에 리로드
    const mySnap = await getDoc(myUserRef);
    if (mySnap.exists()) {
      loadFriends(mySnap.data().friends);
    }

  } catch (err) {
    alert("친구 추가 실패: " + err.message);
  }
};

/* 친구 목록 렌더링 함수 */
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

    // 작성자의 최신 닉네임과 프로필 사진을 가져오기 위해 디비 조회
    const userSnap = await getDoc(doc(db, "users", currentUser.uid));
    const userData = userSnap.data();

    await addDoc(collection(db, "posts"), {
      uid: currentUser.uid,
      nickname: userData.nickname || "사용자",
      profileImage: userData.profileImage || "",
      content,
      likes: [],
      createdAt: serverTimestamp()
    });

    document.getElementById("content").value = "";
  } catch (err) {
    alert("게시글 올리기 실패: " + err.message);
  }
};

/* 게시글 실시간 불러오기 타임라인 */
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
        <div class="comment-avatar-wrap">
          <img class="comment-avatar" src="${data.profileImage || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}" alt="아바타">
          <div class="comment-online"></div>
        </div>
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

/* 좋아요 토글 이벤트 리스너 */
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
        // 이미 좋아요를 누른 경우 취소
        likes = likes.filter(uid => uid !== currentUser.uid);
      } else {
        // 새로 누른 경우 유저 UID 추가
        likes.push(currentUser.uid);
      }

      await updateDoc(postRef, { likes });
    } catch (err) {
      console.error("좋아요 처리 오류:", err);
    }
  }
});

/* 타임스탬프 변환 함수 */
function formatDate(timestamp) {
  if (!timestamp) return "방금 전";
  const date = timestamp.toDate();
  return date.toLocaleString("ko-KR");
}

/* XSS 방지 처리 함수 */
function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
