const editBtn = document.getElementById('editBtn');
const form = document.getElementById('profileForm');
const profilePreview = document.getElementById('profilePreview');
const usernameDisplay = document.getElementById('usernameDisplay');
const introDisplay = document.getElementById('introDisplay');

// 수정 버튼 클릭 시 폼 토글
editBtn.addEventListener('click', () => {
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
  document.getElementById('username').value = usernameDisplay.textContent;
  document.getElementById('intro').value = introDisplay.textContent !== '소개글 없음'
    ? introDisplay.textContent.replace('소개글: ', '')
    : '';
});

// 이미지 미리보기
document.getElementById('profilePic').addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) profilePreview.src = URL.createObjectURL(file);
});

// 폼 제출
form.addEventListener('submit', async e => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const intro = document.getElementById('intro').value.trim();
  const file = document.getElementById('profilePic').files[0];

  const formData = new FormData();
  formData.append('username', username);
  formData.append('intro', intro);
  if (file) formData.append('profilePic', file);

  const token = localStorage.getItem('token'); // 로그인 시 저장한 JWT

  try {
    const res = await fetch('http://localhost:3000/users/update-profile', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}` // 토큰 추가
      },
      body: formData
    });

    const data = await res.json();

    if (res.ok) {
      usernameDisplay.textContent = data.user.username;
      introDisplay.textContent = data.user.intro
        ? `소개글: ${data.user.intro}`
        : "소개글 없음";
      if (data.user.profilePicUrl) profilePreview.src = data.user.profilePicUrl;
      form.style.display = 'none';
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
    alert('서버 오류 발생');
  }
});
