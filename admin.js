let isLoggedIn = false;

// Проверка логина
function login() {
    const login = document.getElementById('adminLogin').value;
    const password = document.getElementById('adminPassword').value;
    
    if (login === 'admin' && password === 'admin123') {
        isLoggedIn = true;
        localStorage.setItem('adminLoggedIn', 'true');
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        loadProductsAdmin();
        loadReviewsAdmin();
        showNotification('Вход выполнен успешно!', 'success');
    } else {
        showNotification('Неверный логин или пароль', 'error');
    }
}

function logout() {
    localStorage.removeItem('adminLoggedIn');
    isLoggedIn = false;
    document.getElementById('loginContainer').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
    showNotification('Выход выполнен', 'info');
}

// Проверка авторизации при загрузке
if (localStorage.getItem('adminLoggedIn') === 'true') {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    loadProductsAdmin();
    loadReviewsAdmin();
}

// Загрузка товаров для админки
function loadProductsAdmin() {
    const products = window.getProducts ? window.getProducts() : [];
    renderProductsAdmin(products);
}

function renderProductsAdmin(products) {
    const container = document.getElementById('productsList');
    if (!container) return;
    
    container.innerHTML = products.map(product => `
        <div class="product-admin-item" onclick="editProduct(${product.id})" style="cursor: pointer;">
            <img src="${product.image}" alt="${product.name}">
            <h4>${escapeHtml(product.name)}</h4>
            <p style="color:#6B5A4E; font-size:0.85rem;">${escapeHtml(product.shortDesc)}</p>
            <p><strong>${product.price.toLocaleString()} ₽</strong></p>
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button onclick="event.stopPropagation(); editProduct(${product.id})" class="btn-edit">✏️ Редактировать</button>
                <button onclick="event.stopPropagation(); deleteProduct(${product.id})" class="btn-danger">🗑 Удалить</button>
            </div>
        </div>
    `).join('');
}

// Функция редактирования товара (открывает модальное окно)
function editProduct(productId) {
    const products = window.getProducts ? window.getProducts() : [];
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Заполняем форму редактирования
    document.getElementById('editProductId').value = product.id;
    document.getElementById('editProdName').value = product.name;
    document.getElementById('editProdShortDesc').value = product.shortDesc;
    document.getElementById('editProdDesc').value = product.description;
    document.getElementById('editProdPrice').value = product.price;
    document.getElementById('editProdImage').value = product.image;
    document.getElementById('editProdIngredients').value = product.ingredients;
    document.getElementById('editProdBenefits').value = product.benefits.join(', ');
    
    // Показываем модальное окно редактирования
    const modal = document.getElementById('editProductModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// Сохранение изменений товара
function saveProductEdit() {
    const productId = parseInt(document.getElementById('editProductId').value);
    const products = window.getProducts ? window.getProducts() : [];
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex !== -1) {
        const benefitsArray = document.getElementById('editProdBenefits').value
            .split(',')
            .map(b => b.trim())
            .filter(b => b);
        
        products[productIndex] = {
            ...products[productIndex],
            name: document.getElementById('editProdName').value,
            shortDesc: document.getElementById('editProdShortDesc').value,
            description: document.getElementById('editProdDesc').value,
            price: parseInt(document.getElementById('editProdPrice').value),
            image: document.getElementById('editProdImage').value,
            ingredients: document.getElementById('editProdIngredients').value,
            benefits: benefitsArray
        };
        
        if (window.setProducts) window.setProducts(products);
        showNotification('Товар успешно обновлен!', 'success');
        closeEditModal();
        loadProductsAdmin();
    }
}

// Закрытие модального окна редактирования
function closeEditModal() {
    const modal = document.getElementById('editProductModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Добавление товара
document.getElementById('addProductForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const benefitsArray = document.getElementById('prodBenefits').value
        .split(',')
        .map(b => b.trim())
        .filter(b => b);
    
    const products = window.getProducts ? window.getProducts() : [];
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    
    const newProduct = {
        id: newId,
        name: document.getElementById('prodName').value,
        shortDesc: document.getElementById('prodShortDesc').value,
        description: document.getElementById('prodDesc').value,
        price: parseInt(document.getElementById('prodPrice').value),
        image: document.getElementById('prodImage').value,
        ingredients: document.getElementById('prodIngredients').value,
        benefits: benefitsArray
    };
    
    products.push(newProduct);
    if (window.setProducts) window.setProducts(products);
    
    showNotification('Товар успешно добавлен!', 'success');
    document.getElementById('addProductForm').reset();
    loadProductsAdmin();
});

// Удаление товара
async function deleteProduct(id) {
    if (confirm('Вы уверены, что хотите удалить этот товар?')) {
        let products = window.getProducts ? window.getProducts() : [];
        products = products.filter(p => p.id !== id);
        if (window.setProducts) window.setProducts(products);
        showNotification('Товар удален', 'success');
        loadProductsAdmin();
    }
}

// Загрузка отзывов для админки
function loadReviewsAdmin() {
    const reviews = window.getReviews ? window.getReviews() : [];
    renderReviewsAdmin(reviews);
}

function renderReviewsAdmin(reviews) {
    const container = document.getElementById('reviewsList');
    if (!container) return;
    
    container.innerHTML = reviews.map(review => `
        <div class="review-admin-item">
            <strong>${escapeHtml(review.name)}</strong>
            <p style="margin: 8px 0;">${escapeHtml(review.text)}</p>
            ${review.imgUrl ? `<small>📷 Фото: <a href="${review.imgUrl}" target="_blank">просмотр</a></small><br>` : ''}
            ${review.videoUrl ? `<small>🎥 Видео: <a href="${review.videoUrl}" target="_blank">ссылка</a></small><br>` : ''}
            <button onclick="deleteReview(${review.id})" class="btn-danger" style="margin-top: 10px;">🗑 Удалить отзыв</button>
        </div>
    `).join('');
}

// Добавление отзыва
document.getElementById('addReviewForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const reviews = window.getReviews ? window.getReviews() : [];
    const newId = reviews.length > 0 ? Math.max(...reviews.map(r => r.id)) + 1 : 1;
    
    const newReview = {
        id: newId,
        name: document.getElementById('reviewName').value,
        text: document.getElementById('reviewText').value,
        imgUrl: document.getElementById('reviewImgUrl').value || '',
        videoUrl: document.getElementById('reviewVideoUrl').value || ''
    };
    
    reviews.push(newReview);
    if (window.setReviews) window.setReviews(reviews);
    
    showNotification('Отзыв успешно добавлен!', 'success');
    document.getElementById('addReviewForm').reset();
    loadReviewsAdmin();
});

// Удаление отзыва
async function deleteReview(id) {
    if (confirm('Вы уверены, что хотите удалить этот отзыв?')) {
        let reviews = window.getReviews ? window.getReviews() : [];
        reviews = reviews.filter(r => r.id !== id);
        if (window.setReviews) window.setReviews(reviews);
        showNotification('Отзыв удален', 'success');
        loadReviewsAdmin();
    }
}

// Переключение вкладок
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(`${tab}Tab`).classList.add('active');
    event.target.classList.add('active');
    
    if (tab === 'products') loadProductsAdmin();
    if (tab === 'reviews') loadReviewsAdmin();
}

function showNotification(msg, type = 'info') {
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.textContent = msg;
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        background: #1E1E1E;
        color: white;
        border-radius: 40px;
        z-index: 2000;
        animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Добавляем стили для кнопки редактирования
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .btn-edit {
        background: #B28B6F;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 24px;
        cursor: pointer;
        font-size: 0.85rem;
        transition: all 0.2s;
    }
    
    .btn-edit:hover {
        background: #9B6E4E;
        transform: translateY(-2px);
    }
    
    .edit-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.6);
        backdrop-filter: blur(8px);
        z-index: 2000;
        justify-content: center;
        align-items: center;
    }
    
    .edit-modal-content {
        background: white;
        max-width: 600px;
        width: 90%;
        max-height: 85vh;
        overflow-y: auto;
        border-radius: 32px;
        padding: 32px;
        animation: slideUp 0.3s ease;
    }
    
    .edit-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 2px solid #F0EBE3;
    }
    
    .edit-modal-header h3 {
        font-size: 1.5rem;
        color: #1E1E1E;
    }
    
    .close-edit-modal {
        font-size: 28px;
        cursor: pointer;
        color: #8B7A6B;
        transition: all 0.2s;
    }
    
    .close-edit-modal:hover {
        color: #B28B6F;
        transform: rotate(90deg);
    }
    
    .product-admin-item {
        background: #FEFCF9;
        border: 1px solid #F0EBE3;
        border-radius: 24px;
        padding: 20px;
        transition: all 0.3s ease;
        cursor: pointer;
    }
    
    .product-admin-item:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(0,0,0,0.08);
        border-color: #B28B6F;
    }
    
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(50px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// Закрытие модального окна при клике вне его
window.addEventListener('click', (e) => {
    const modal = document.getElementById('editProductModal');
    if (e.target === modal) {
        closeEditModal();
    }
});