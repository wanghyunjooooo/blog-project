const token = localStorage.getItem("token");
if (!token) {
  alert("로그인이 필요합니다.");
  window.location.href = "login.html";
}

function getFullImagePath(filename, type = 'profile') {
  if (!filename) {
    return type === 'profile'
      ? 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKPelunvobTdrAM_XNl7ME6ThiVkk0yhSHyQ&s'
      : null; // 게시글 이미지 없으면 null
  }

  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }

  return '/uploads/' + filename;
}

async function loadPosts(query = '') {
  try {
    const url = query
      ? `http://localhost:3000/search?keyword=${encodeURIComponent(query)}`
      : `http://localhost:3000/posts`;

    const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    const posts = res.data;
    const postList = document.getElementById('postList');
    postList.innerHTML = '';

    if (!posts.length) {
      postList.innerHTML = '<p class="text-center lead">최근 게시물이 없습니다.</p>';
      return;
    }

    posts.forEach(post => {
      const div = document.createElement('div');
      div.className = 'post-item';

      const authorImg = getFullImagePath(post.author_profile, 'profile');
      const postImg = getFullImagePath(post.image_url, 'post');
      const liked = post.is_liked ? 'liked' : '';

      div.innerHTML = `
        <div class="post-left">
          <div class="post-author">
            <img src="${authorImg}" alt="Author" class="author-img">
            <span>${post.author_name || '알 수 없음'} · ${new Date(post.created_at).toLocaleDateString()}</span>
          </div>
          <div class="post-title">${post.title}</div>
          <div class="post-summary">${post.content}</div>
          <button class="like-btn ${liked}" data-id="${post.post_id}">
            <i class="fas fa-heart" style="color:${post.is_liked ? '#e63946' : '#555'};"></i>
            <span>${post.like_count || 0}</span>
          </button>
        </div>
        ${postImg ? `<div class="post-right"><img src="${postImg}" alt="Post Image"></div>` : ''}
      `;

      div.addEventListener('click', (e) => {
        if (e.target.closest('.like-btn')) return;
        window.location.href = `post_detail.html?post_id=${post.post_id}`;
      });

      postList.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading posts:", err);
    document.getElementById('postList').innerHTML = '<p class="text-center text-danger">게시글 불러오기 실패</p>';
  }
}

async function toggleLike(btn, postId) {
  const heart = btn.querySelector('i');
  const countEl = btn.querySelector('span');
  const isLiked = btn.classList.contains('liked');

  try {
    const res = !isLiked
      ? await axios.post(`http://localhost:3000/posts/${postId}/likes`, {}, { headers: { Authorization: `Bearer ${token}` } })
      : await axios.delete(`http://localhost:3000/posts/${postId}/likes`, { headers: { Authorization: `Bearer ${token}` } });

    const { like_count, is_liked } = res.data;
    btn.classList.toggle('liked', is_liked);
    heart.style.color = is_liked ? '#e63946' : '#555';
    countEl.textContent = like_count;

  } catch (err) {
    console.error('좋아요 처리 실패:', err);
    alert('좋아요 처리 실패');
  }
}

document.getElementById('postList').addEventListener('click', async (e) => {
  const btn = e.target.closest('.like-btn');
  if (!btn) return;
  e.stopPropagation();
  const postId = btn.dataset.id;
  await toggleLike(btn, postId);
});

document.getElementById('searchBtn').addEventListener('click', () => {
  const keyword = document.getElementById('searchInput').value.trim();
  loadPosts(keyword);
});

loadPosts();
