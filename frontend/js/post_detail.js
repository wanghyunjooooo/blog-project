document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('로그인 후 접근 가능합니다.');
        window.location.href = 'index.html';
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const postId = params.get('post_id');

    const likeButton = document.getElementById('likeButton');
    const likeCountEl = document.getElementById('likeCount');
    const commentBtn = document.getElementById('commentBtn');
    const commentInput = document.getElementById('commentInput');
    const myProfilePic = document.getElementById('myProfilePic');
    const commentsList = document.getElementById('commentsList');

    let userId;

    // 이미지 경로 처리
    function getFullImagePath(filename, type = 'profile') {
        if (!filename) {
            return type === 'profile'
                ? 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKPelunvobTdrAM_XNl7ME6ThiVkk0yhSHyQ&s'
                : '/uploads/default_post.png';
        }
        if (filename.startsWith('http://') || filename.startsWith('https://')) {
            return filename;
        }
        return `http://localhost:3000${filename.startsWith('/') ? '' : '/uploads/'}${filename}`;
    }

    // 로그인 유저 정보 가져오기
    async function loadUserInfo() {
        try {
            const res = await axios.get('http://localhost:3000/users/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const user = res.data.user;
            userId = user.user_id;
            myProfilePic.src = getFullImagePath(user.profile_img, 'profile');
        } catch (err) {
            console.error(err);
            alert('유저 정보 불러오기 실패');
            window.location.href = 'index.html';
        }
    }

    // 게시글 불러오기
    async function loadPost() {
        try {
            const res = await axios.get(`http://localhost:3000/posts/${postId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const post = res.data;

            document.getElementById('postTitle').textContent = post.title;
            document.getElementById('postContent').textContent = post.content;
            document.getElementById('postAuthor').textContent = post.author_name || '알 수 없음';
            document.getElementById('postDate').textContent = post.created_at
                ? new Date(post.created_at).toLocaleDateString()
                : '';

            if (post.image_url) {
                const img = document.getElementById('postImage');
                img.src = getFullImagePath(post.image_url, 'post');
                img.style.display = 'block';
            }

            // 좋아요 초기 상태
            likeCountEl.textContent = post.like_count || 0;
            likeButton.classList.toggle('liked', post.is_liked);

            loadComments();
        } catch (err) {
            console.error(err);
            alert('게시글 불러오기 실패');
        }
    }

    // 좋아요 토글
    likeButton.addEventListener('click', async () => {
        let count = parseInt(likeCountEl.textContent);
        const isLiked = likeButton.classList.contains('liked');

        try {
            if (!isLiked) {
                await axios.post(`http://localhost:3000/posts/${postId}/likes`, { user_id: userId }, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                count++;
                likeButton.classList.add('liked');
            } else {
                await axios.delete(`http://localhost:3000/posts/${postId}/likes`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    data: { user_id: userId }
                });
                count--;
                likeButton.classList.remove('liked');
            }
            likeCountEl.textContent = count;
        } catch (err) {
            console.error(err);
            alert('좋아요 처리 실패');
        }
    });

    // 댓글 불러오기
    async function loadComments() {
        try {
            const res = await axios.get(`http://localhost:3000/posts/${postId}/comments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            commentsList.innerHTML = '';
            res.data.forEach(c => {
                const div = document.createElement('div');
                div.classList.add('comment');

                const img = document.createElement('img');
                img.src = getFullImagePath(c.profile_img, 'profile');
                div.appendChild(img);

                const body = document.createElement('div');
                body.classList.add('comment-body');

                const header = document.createElement('div');
                header.classList.add('comment-header');
                header.textContent = c.author_name || '익명';

                const time = document.createElement('span');
                time.classList.add('comment-time');
                time.textContent = c.created_at ? ` | ${new Date(c.created_at).toLocaleString()}` : '';
                header.appendChild(time);

                const text = document.createElement('div');
                text.classList.add('comment-text');
                text.textContent = c.content;

                body.appendChild(header);
                body.appendChild(text);
                div.appendChild(body);

                commentsList.appendChild(div);
            });
        } catch (err) {
            console.error(err);
        }
    }

    // 댓글 작성
    commentBtn.addEventListener('click', async () => {
        const content = commentInput.value.trim();
        if (!content) return alert("댓글을 입력하세요!");

        try {
            await axios.post(`http://localhost:3000/posts/${postId}/comments`, {
                user_id: userId,
                content
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            commentInput.value = '';
            loadComments();
        } catch (err) {
            console.error(err);
            alert("댓글 작성 실패");
        }
    });

    await loadUserInfo();
    await loadPost();
});
