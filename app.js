import {

auth,
db,
storage

}

from "./firebase.js";

import {

createUserWithEmailAndPassword,
signInWithEmailAndPassword,
onAuthStateChanged,
signOut

}

from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {

collection,
addDoc,
query,
orderBy,
onSnapshot,
serverTimestamp

}

from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {

ref,
uploadBytes,
getDownloadURL

}

from "https://www.gstatic.com/firebasejs/12.13.0/firebase-storage.js";

/* =========================
   변수
========================= */

let currentUser = null;

const postsDiv =
document.getElementById("posts");

/* =========================
   사이드바
========================= */

window.toggleSidebar = function(){

document
.getElementById("sidebar")
.classList.toggle("active");

document
.getElementById("overlay")
.classList.toggle("active");
};

/* =========================
   회원가입
========================= */

document
.getElementById("signupBtn")
.onclick = async ()=>{

try{

const email =
document.getElementById("email").value;

const password =
document.getElementById("password").value;

const nickname =
document.getElementById("nicknameInput").value;

if(!email || !password || !nickname){

alert("전부 입력해주세요");
return;
}

await createUserWithEmailAndPassword(
auth,
email,
password
);

localStorage.setItem(
"nickname",
nickname
);

alert("회원가입 성공");

}catch(err){

alert(err.message);
}
};

/* =========================
   로그인
========================= */

document
.getElementById("loginBtn")
.onclick = async ()=>{

try{

const email =
document.getElementById("email").value;

const password =
document.getElementById("password").value;

await signInWithEmailAndPassword(
auth,
email,
password
);

alert("로그인 성공");

}catch(err){

alert(err.message);
}
};

/* =========================
   로그아웃
========================= */

document
.getElementById("logoutBtn")
.onclick = async ()=>{

await signOut(auth);

alert("로그아웃 완료");
};

/* =========================
   로그인 상태
========================= */

onAuthStateChanged(auth, (user)=>{

currentUser = user;

const profileName =
document.getElementById(
"profileName"
);

const profileEmail =
document.getElementById(
"profileEmail"
);

const profileStatus =
document.getElementById(
"profileStatus"
);

const profileImage =
document.getElementById(
"profileImage"
);

if(user){

profileName.innerText =
localStorage.getItem(
"nickname"
) || "사용자";

profileEmail.innerText =
user.email;

profileStatus.innerText =
localStorage.getItem(
"status"
) || "상태메세지 없음";

const img =
localStorage.getItem(
"profileImage"
);

if(img){

profileImage.src = img;
}

}else{

profileName.innerText =
"로그인 안됨";

profileEmail.innerText =
"";

profileStatus.innerText =
"";

profileImage.src =
"https://cdn-icons-png.flaticon.com/512/149/149071.png";
}
});

/* =========================
   프로필 저장
========================= */

document
.getElementById("saveProfileBtn")
.onclick = async ()=>{

try{

if(!currentUser){

alert("로그인 필요");
return;
}

const status =
document.getElementById(
"statusInput"
).value;

localStorage.setItem(
"status",
status
);

const file =
document.getElementById(
"profileUpload"
).files[0];

let imageUrl =
localStorage.getItem(
"profileImage"
) || "";

if(file){

const storageRef =
ref(
storage,
`profiles/${currentUser.uid}`
);

await uploadBytes(
storageRef,
file
);

imageUrl =
await getDownloadURL(
storageRef
);

localStorage.setItem(
"profileImage",
imageUrl
);
}

document.getElementById(
"profileStatus"
).innerText = status;

document.getElementById(
"profileImage"
).src =
imageUrl ||
"https://cdn-icons-png.flaticon.com/512/149/149071.png";

alert("프로필 저장 완료");

}catch(err){

alert(err.message);
}
};

/* =========================
   게시글 작성
========================= */

document
.getElementById("uploadBtn")
.onclick = async ()=>{

try{

if(!currentUser){

alert("로그인 필요");
return;
}

const content =
document.getElementById(
"content"
).value.trim();

if(!content){

alert("내용 입력");
return;
}

await addDoc(

collection(db, "posts"),

{

uid:
currentUser.uid,

nickname:
localStorage.getItem(
"nickname"
) || "사용자",

profileImage:
localStorage.getItem(
"profileImage"
) || "",

status:
localStorage.getItem(
"status"
) || "",

content,

createdAt:
serverTimestamp()
}
);

document.getElementById(
"content"
).value = "";

}catch(err){

alert(err.message);
}
};

/* =========================
   게시글 불러오기
========================= */

const q = query(

collection(db, "posts"),

orderBy(
"createdAt",
"desc"
)
);

onSnapshot(q, (snapshot)=>{

postsDiv.innerHTML = "";

snapshot.forEach((doc)=>{

const data = doc.data();

const post =
document.createElement("div");

post.className = "post";

post.innerHTML = `

<div class="post-header">

<div class="comment-avatar-wrap">

<img
class="comment-avatar"
src="${
data.profileImage ||
'https://cdn-icons-png.flaticon.com/512/149/149071.png'
}"
>

<div class="comment-online"></div>

</div>

<div>

<div class="nickname">
${escapeHTML(data.nickname || "사용자")}
</div>

<div class="date">
${formatDate(data.createdAt)}
</div>

</div>

</div>

<div class="content">
${escapeHTML(data.content || "")}
</div>
`;

postsDiv.appendChild(post);
});
});

/* =========================
   날짜
========================= */

function formatDate(timestamp){

if(!timestamp) return "";

const date =
timestamp.toDate();

return date.toLocaleString();
}

/* =========================
   XSS 방지
========================= */

function escapeHTML(str){

return str
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#039;");
}
