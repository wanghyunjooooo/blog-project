const editBtn = document.getElementById('editBtn');
const form = document.getElementById('profileForm');
const profilePreview = document.getElementById('profilePreview');
const usernameDisplay = document.getElementById('usernameDisplay');
const introDisplay = document.getElementById('introDisplay');
const logoutBtn = document.getElementById('logoutBtn');
const myPostsList = document.getElementById('myPostsList');
const token = localStorage.getItem('token');

if (!token) {
  alert('로그인 후 접근 가능합니다.');
  window.location.href = 'index.html';
}

// 로그아웃
logoutBtn.addEventListener('click', async () => {
  try {
    await fetch('http://localhost:3000/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  } catch (e) { console.error(e); }
  finally {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
  }
});

// 프로필 수정 토글
editBtn.addEventListener('click', () => {
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
  document.getElementById('username').value = usernameDisplay.textContent;
  document.getElementById('intro').value = introDisplay.textContent !== '소개글 없음'
    ? introDisplay.textContent.replace('소개글: ', '')
    : '';
});

document.getElementById('profilePic').addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) profilePreview.src = URL.createObjectURL(file);
});

// 프로필 수정 저장
form.addEventListener('submit', async e => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const intro = document.getElementById('intro').value.trim();
  const file = document.getElementById('profilePic').files[0];
  const formData = new FormData();
  formData.append('username', username);
  formData.append('intro', intro);
  if (file) formData.append('profilePic', file);

  try {
    const res = await fetch('http://localhost:3000/users/update-profile', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (res.ok) {
      usernameDisplay.textContent = data.user.username;
      introDisplay.textContent = data.user.intro ? `소개글: ${data.user.intro}` : "소개글 없음";
      profilePreview.src = data.user.profile_img
        ? resolveImageUrl(data.user.profile_img)
        : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKPelunvobTdrAM_XNl7ME6ThiVkk0yhSHyQ&s";
      form.style.display = 'none';
    } else alert(data.message);
  } catch (err) {
    console.error(err);
    alert('서버 오류 발생');
  }
});

// uploads 경로를 자동 붙이는 함수
function resolveImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return path.startsWith('/') ? `http://localhost:3000/uploads${path}` : `http://localhost:3000/uploads/${path}`;
}

// 내 글 불러오기
async function loadMyPosts() {
  try {
    const res = await fetch('http://localhost:3000/posts/my-posts', { headers: { 'Authorization': `Bearer ${token}` } });
    const posts = await res.json();
    if (!res.ok) throw new Error(posts.message || '서버 오류');

    if (posts.length === 0) {
      myPostsList.innerHTML = '<p>작성한 글이 없습니다.</p>';
      return;
    }

    myPostsList.innerHTML = '';
    posts.forEach(post => {
      const div = document.createElement('div');
      div.className = 'card p-3 mb-3';
      let imgHTML = '';
      if (post.image_url) {
        const imgUrl = resolveImageUrl(post.image_url);
        if (imgUrl) imgHTML = `<img src="${imgUrl}" class="post-img">`;
      }
      div.innerHTML = `
        <h5>${post.title}</h5>
        <p>${post.content}</p>
        ${imgHTML}
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-primary editBtn" data-id="${post.post_id}">수정</button>
          <button class="btn btn-sm btn-danger deleteBtn" data-id="${post.post_id}">삭제</button>
        </div>
      `;
      myPostsList.appendChild(div);

      // 수정 → post.html 이동
      div.querySelector('.editBtn').addEventListener('click', () => {
        window.location.href = `post.html?post_id=${post.post_id}`;
      });

      // 삭제
      div.querySelector('.deleteBtn').addEventListener('click', async () => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
          const resDel = await fetch(`http://localhost:3000/posts/${post.post_id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const dataDel = await resDel.json();
          if (!resDel.ok) throw new Error(dataDel.message || '삭제 실패');
          alert('삭제 성공');
          loadMyPosts();
        } catch (err) {
          console.error(err);
          alert(err.message);
        }
      });
    });
  } catch (err) {
    console.error(err);
    myPostsList.innerHTML = '<p class="text-danger">내 글 불러오기 실패</p>';
  }
}

// 초기 실행
(async function init() {
  try {
    const res = await fetch('http://localhost:3000/users/me', { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    if (res.ok) {
      usernameDisplay.textContent = data.user.username;
      introDisplay.textContent = data.user.intro ? `소개글: ${data.user.intro}` : "소개글 없음";
      profilePreview.src = data.user.profile_img ? resolveImageUrl(data.user.profile_img) : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKPelunvobTdrAM_XNl7ME6ThiVkk0yhSHyQ&s";
    } else {
      alert(data.message);
      window.location.href = 'index.html';
    }
  } catch (err) {
    console.error(err);
    alert('서버 오류 발생');
  }

  loadMyPosts();
})();
