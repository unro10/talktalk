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
getDoc,
updateDoc,
arrayUnion

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

await setDoc(

doc(db, "users", user.uid),

{

nickname,
email,

status:"상태메세지 없음",

profileImage:"",

friends:[]

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
document.getElementById("profileName");

const profileEmail =
document.getElementById("profileEmail");

const profileStatus =
document.getElementById("profileStatus");

const profileImage =
document.getElementById("profileImage");

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

loadFriends(userData.friends);
}

}else{

profileName.innerText =
"로그인 안됨";

profileEmail.innerText =
"";

profileStatus.innerText =
"상태메세지 없음";

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
document.getElementById("statusInput").value;

const file =
document.getElementById("profileUpload").files[0];

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

profileImage:imageUrl,

friends:
oldData.friends || []

}

);

alert("프로필 저장 완료");

}catch(err){

alert(err.message);
}
};

/* 친구 추가 */

document
.getElementById("addFriendBtn")
.onclick = async ()=>{

try{

if(!currentUser){

alert("로그인 필요");
return;
}

const friendEmail =
document.getElementById("friendEmail").value;

const usersQuery =
query(collection(db, "users"));

onSnapshot(usersQuery, async(snapshot)=>{

snapshot.forEach(async(userDoc)=>{

const data =
userDoc.data();

if(data.email === friendEmail){

await updateDoc(

doc(
db,
"users",
currentUser.uid
),

{

friends:
arrayUnion(data.email)

}
);

alert("친구 추가 완료");
}
});
});

}catch(err){

alert(err.message);
}
};

/* 친구 목록 */

async function loadFriends(friends){

const friendList =
document.getElementById("friendList");

friendList.innerHTML = "";

if(!friends) return;

friends.forEach((friend)=>{

const div =
document.createElement("div");

div.className =
"friend-item";

div.innerText =
friend;

friendList.appendChild(div);
});
}

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
document.getElementById("content")
.value
.trim();

if(!content){

alert("내용 입력");
return;
}

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

content,

likes:[],

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

const likes =
data.likes || [];

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

<button
class="like-btn"
data-id="${postDoc.id}"
>
❤️ ${likes.length}
</button>
`;

postsDiv.appendChild(post);
});
});

/* 좋아요 */

document.addEventListener("click", async(e)=>{

if(
e.target.classList.contains("like-btn")
){

if(!currentUser){

alert("로그인 필요");
return;
}

const postId =
e.target.dataset.id;

const postRef =
doc(db, "posts", postId);

const postSnap =
await getDoc(postRef);

const postData =
postSnap.data();

let likes =
postData.likes || [];

if(
likes.includes(currentUser.uid)
){

likes =
likes.filter(
uid => uid !== currentUser.uid
);

}else{

likes.push(currentUser.uid);
}

await updateDoc(postRef,{
likes
});
}
});

/* 날짜 */

function formatDate(timestamp){

if(!timestamp) return "";

const date =
timestamp.toDate();

return date.toLocaleString("ko-KR");
}

/* XSS 방지 */

function escapeHTML(str){

return str
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/\"/g,"&quot;")
.replace(/'/g,"&#039;");
}
