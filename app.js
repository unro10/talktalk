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
serverTimestamp,
doc,
setDoc,
getDoc

}

from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {

ref,
uploadBytes,
getDownloadURL

}

from "https://www.gstatic.com/firebasejs/12.13.0/firebase-storage.js";

/* 변수 */

let currentUser = null;

const postsDiv =
document.getElementById("posts");

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

const userCredential =

await createUserWithEmailAndPassword(
auth,
email,
password
);

const user =
userCredential.user;

/* Firestore 저장 */

await setDoc(

doc(db, "users", user.uid),

{

nickname,
email,

status:"상태메세지 없음",

profileImage:""
}
);

alert("회원가입 성공");

}catch(err){

alert(err.message);
}
};

/* 로그인 */

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

/* 로그아웃 */

document
.getElementById("logoutBtn")
.onclick = async ()=>{

await signOut(auth);

alert("로그아웃 완료");
};

/* 로그인 상태 */

onAuthStateChanged(auth, async (user)=>{

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

const userRef =
doc(db, "users", user.uid);

const userSnap =
await getDoc(userRef);

if(userSnap.exists()){

const userData =
userSnap.data();

profileName.innerText =
userData.nickname;

profileEmail.innerText =
userData.email;

profileStatus.innerText =
userData.status;

profileImage.src =

userData.profileImage ||

"https://cdn-icons-png.flaticon.com/512/149/149071.png";
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

/* 프로필 저장 */

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

const file =
document.getElementById(
"profileUpload"
).files[0];

let imageUrl = "";

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

}else{

const userSnap =
await getDoc(
doc(
db,
"users",
currentUser.uid
)
);

imageUrl =
userSnap.data().profileImage || "";
}

/* 기존 닉네임 유지 */

const userSnap =
await getDoc(
doc(
db,
"users",
currentUser.uid
)
);

const oldData =
userSnap.data();

await setDoc(

doc(
db,
"users",
currentUser.uid
),

{

nickname:
oldData.nickname,

email:
currentUser.email,

status:
status || "상태메세지 없음",

profileImage:imageUrl

}

);

alert("프로필 저장 완료");

}catch(err){

alert(err.message);
}
};

/* 게시글 작성 */

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

/* 유저 정보 */

const userSnap =
await getDoc(

doc(
db,
"users",
currentUser.uid
)
);

const userData =
userSnap.data();

await addDoc(

collection(db, "posts"),

{

uid:
currentUser.uid,

nickname:
userData.nickname,

profileImage:
userData.profileImage,

status:
userData.status,

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

/* 게시글 불러오기 */

const q = query(

collection(db, "posts"),

orderBy(
"createdAt",
"desc"
)
);

onSnapshot(q, (snapshot)=>{

postsDiv.innerHTML = "";

snapshot.forEach((postDoc)=>{

const data =
postDoc.data();

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
${escapeHTML(
data.nickname || "사용자"
)}
</div>

<div class="date">
${formatDate(
data.createdAt
)}
</div>

</div>

</div>

<div class="content">
${escapeHTML(
data.content || ""
)}
</div>
`;

postsDiv.appendChild(post);
});
});

/* 날짜 */

function formatDate(timestamp){

if(!timestamp) return "";

const date =
timestamp.toDate();

return date.toLocaleString();
}

/* XSS 방지 */

function escapeHTML(str){

return str
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#039;");
}
