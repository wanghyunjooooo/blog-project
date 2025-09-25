// ----------------- 토큰 확인 -----------------
const token = localStorage.getItem("token");
if (!token) {
    alert("로그인이 필요합니다.");
    window.location.href = "index.html";
}

// ----------------- 이미지 경로 -----------------
function getFullImagePath(filename, type = 'profile') {
    if (!filename) {
        const defaultImg = type === 'profile'
            ? 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKPelunvobTdrAM_XNl7ME6ThiVkk0yhSHyQ&s'
            : null;
        return defaultImg;
    }
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
        return filename;
    }
    filename = filename.replace(/^\/uploads\/+/, '');
    return 'http://localhost:3000/' + filename;
}

// ----------------- 포스트 불러오기 -----------------
async function loadPosts(query = '') {
    try {
        const url = query
            ? `http://localhost:3000/posts/search?keyword=${encodeURIComponent(query)}`
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
                    <button class="like-btn ${liked}" data-id="${post.post_id}" data-author="${post.author_name}" data-title="${post.title}">
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

// ----------------- 좋아요 토글 + 알림 -----------------
async function toggleLike(btn, postId) {
    const heart = btn.querySelector('i');
    const countEl = btn.querySelector('span');
    const isLiked = btn.classList.contains('liked');
    const postTitle = btn.dataset.title;
    const postAuthor = btn.dataset.author;

    try {
        let res;

        if (!isLiked) {
            res = await axios.post(`http://localhost:3000/posts/${postId}/likes`, {}, { headers: { Authorization: `Bearer ${token}` } });

            // 게시글 작성자에게 좋아요 알림 생성 (API 확장 필요)
            if (res.data.post_owner_id && res.data.post_owner_id !== res.data.user_id) {
                await axios.post('http://localhost:3000/notifications', {
                    user_id: res.data.post_owner_id,
                    type: '좋아요',
                    actor_name: res.data.user_name,
                    post_id: postId,
                    post_title: postTitle
                }, { headers: { Authorization: `Bearer ${token}` } });
            }
        } else {
            res = await axios.delete(`http://localhost:3000/posts/${postId}/likes`, { headers: { Authorization: `Bearer ${token}` } });
        }

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

// ----------------- 검색 -----------------
document.getElementById('searchBtn').addEventListener('click', () => {
    const keyword = document.getElementById('searchInput').value.trim();
    loadPosts(keyword);
});

// ----------------- 알림 -----------------
const notifBtn = document.getElementById('notifBtn');
const notifList = document.getElementById('notifList');
const notifCount = document.getElementById('notifCount');

async function loadNotifications() {
    try {
        const res = await axios.get('http://localhost:3000/notifications', { headers: { Authorization: `Bearer ${token}` } });
        const notifications = res.data;

        notifList.innerHTML = '';
        let unreadCount = 0;

        notifications.forEach(n => {
            if (!n.is_read) unreadCount++;

            const div = document.createElement('div');
            div.className = `notif-item ${!n.is_read ? 'unread' : ''}`;
            div.dataset.id = n.notification_id;
            div.dataset.postId = n.post_id;

            // 타입별 알림 메시지
            if (n.type === '좋아요') {
                div.innerHTML = `<strong>[좋아요]</strong> ${n.actor_name || '누군가'}님이 "${n.post_title || '게시글'}" 글을 좋아합니다.`;
            } else if (n.type === '댓글') {
                div.innerHTML = `<strong>[댓글]</strong> ${n.actor_name || '누군가'}님이 "${n.post_title || '게시글'}" 글에 댓글: "${n.comment || ''}"`;
            } else {
                div.innerHTML = `<strong>[알림]</strong> ${n.message}`;
            }

            div.addEventListener('click', async () => {
                if (!n.is_read) {
                    await axios.patch(`http://localhost:3000/notifications/${n.notification_id}/read`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
                if (n.post_id) {
                    window.location.href = `post_detail.html?post_id=${n.post_id}`;
                }
                loadNotifications();
            });

            notifList.appendChild(div);
        });

        notifCount.textContent = unreadCount;
        notifCount.style.display = unreadCount ? 'inline-block' : 'none';

    } catch (err) {
        console.error('알림 불러오기 실패:', err);
    }
}

// ----------------- 드롭다운 토글 -----------------
notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    notifList.classList.toggle('show');
});

document.addEventListener('click', (e) => {
    if (!notifBtn.contains(e.target) && !notifList.contains(e.target)) {
        notifList.classList.remove('show');
    }
});

// ----------------- 초기 로드 -----------------
loadPosts();
loadNotifications();
setInterval(loadNotifications, 30000); // 30초마다 알림 갱신
