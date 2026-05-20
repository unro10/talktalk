import {

auth,
db,
storage

} from "./firebase.js";

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

let currentUser = null;

/* 사이드바 */

window.toggleSidebar = function(){

document
.getElementById("sidebar")
.classList.toggle("active");

document
.getElementById("overlay")
.classList.toggle("active");
};

/* 회원가입 */

document
.getElementById("signupBtn")
.onclick = async ()=>{

const email =
document.getElementById("email").value;

const password =
document.getElementById("password").value;

const nickname =
document.getElementById("nicknameInput").value;

if(!email || !password || !nickname){

alert("전부 입력");
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
};

/* 로그인 */

document
.getElementById("loginBtn")
.onclick = async ()=>{

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
};

/* 로그아웃 */

document
.getElementById("logoutBtn")
.onclick = async ()=>{

await signOut(auth);

alert("로그아웃");
};

/* 로그인 상태 */

onAuthStateChanged(auth, (user)=>{

currentUser = user;

if(user){

document.getElementById(
"profileName"
).innerText =
localStorage.getItem(
"nickname"
) || "사용자";

document.getElementById(
"profileEmail"
).innerText =
user.email;

document.getElementById(
"profileStatus"
).innerText =
localStorage.getItem(
"status"
) || "상태메세지 없음";

const img =
localStorage.getItem(
"profileImage"
);

if(img){

document.getElementById(
"profileImage"
).src = img;
}

}else{

document.getElementById(
"profileName"
).innerText =
"로그인 안됨";
}
});

/* 프로필 저장 */

document
.getElementById("saveProfileBtn")
.onclick = async ()=>{

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

const url =
await getDownloadURL(
storageRef
);

localStorage.setItem(
"profileImage",
url
);

document.getElementById(
"profileImage"
).src = url;
}

document.getElementById(
"profileStatus"
).innerText =
status;

alert("프로필 저장 완료");
};

/* 게시글 */

document
.getElementById("uploadBtn")
.onclick = async ()=>{

if(!currentUser){

alert("로그인 필요");
return;
}

const content =
document.getElementById(
"content"
).value.trim();

if(!content) return;

await addDoc(

collection(db, "posts"),

{

nickname:
localStorage.getItem(
"nickname"
),

profileImage:
localStorage.getItem(
"profileImage"
),

status:
localStorage.getItem(
"status"
),

content,

createdAt:
serverTimestamp()
}
);

document.getElementById(
"content"
).value = "";
};

/* 게시글 불러오기 */

const postsDiv =
document.getElementById("posts");

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

<div class="user-row">

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
${escapeHTML(data.nickname)}
</div>

<div class="date">
${formatDate(
data.createdAt
)}
</div>

</div>

</div>

</div>

<div class="content">
${escapeHTML(data.content)}
</div>
`;

postsDiv.appendChild(post);
});
});

function formatDate(timestamp){

if(!timestamp) return "";

const date =
timestamp.toDate();

return date.toLocaleString();
}

function escapeHTML(str){

return str
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#039;");
}
