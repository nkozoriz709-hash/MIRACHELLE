// ========== НАСТРОЙКИ JSONBin.IO ==========
const PRODUCTS_BIN_ID = '69d0eadcaaba882197c3930d';
const REVIEWS_BIN_ID = '69d0eb1136566621a87acdca';
const API_KEY = '$2a$10$Q7f3EYrK6RyG37RtKdGbEuinxBtsHPBttKVALqQNjIBNjmub5W2y2';

// Базовые URL для API
const PRODUCTS_URL = `https://api.jsonbin.io/v3/b/${PRODUCTS_BIN_ID}`;
const REVIEWS_URL = `https://api.jsonbin.io/v3/b/${REVIEWS_BIN_ID}`;

// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let products = [];
let reviews = [];
let cart = [];
let currentCurrency = 'rub'; // 'rub' или 'byn'

// ========== МОБИЛЬНЫЕ УЛУЧШЕНИЯ ==========
// Отключаем зумирование при двойном тапе на кнопках
document.querySelectorAll('button, .btn-primary, .add-to-cart, .video-card, .product-card').forEach(el => {
    el.addEventListener('touchstart', (e) => {
        // Просто позволяем событию произойти, но не блокируем
    }, { passive: true });
});

// Улучшаем скролл на iOS
document.body.style.webkitOverflowScrolling = 'touch';

// Предотвращаем случайное масштабирование на инпутах (iOS)
document.querySelectorAll('input, textarea, select').forEach(el => {
    el.addEventListener('focus', () => {
        document.body.style.position = 'relative';
    });
    el.addEventListener('blur', () => {
        document.body.style.position = '';
    });
});

// Обработка свайпов для закрытия модальных окон
let touchStartX = 0;
let touchEndX = 0;

function handleSwipeForModal(modalElement, closeFunction) {
    if (!modalElement) return;
    
    modalElement.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    modalElement.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchEndX - touchStartX > 100) {
            closeFunction();
        }
    }, { passive: true });
}

// ========== ЗАГРУЗКА ДАННЫХ ==========
async function loadProducts() {
    try {
        const response = await fetch(PRODUCTS_URL, {
            headers: { 'X-Master-Key': API_KEY }
        });
        const data = await response.json();
        products = data.record;
        if (!products || products.length === 0) {
            products = [];
        }
        renderProducts();
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        products = [];
        renderProducts();
    }
}

async function loadReviews() {
    try {
        const response = await fetch(REVIEWS_URL, {
            headers: { 'X-Master-Key': API_KEY }
        });
        const data = await response.json();
        reviews = data.record;
        if (!reviews || reviews.length === 0) {
            reviews = [];
        }
        renderReviews();
    } catch (error) {
        console.error('Ошибка загрузки отзывов:', error);
        reviews = [];
        renderReviews();
    }
}

// ========== ПЕРЕКЛЮЧЕНИЕ ВАЛЮТ ==========
function switchCurrency(currency) {
    currentCurrency = currency;
    
    document.querySelectorAll('.currency-btn').forEach(btn => {
        if (btn.dataset.currency === currency) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    renderProducts();
    updateCartUI();
    localStorage.setItem('preferredCurrency', currency);
}

function getPriceInCurrency(product, currency = currentCurrency) {
    if (currency === 'rub') {
        return {
            value: product.priceRub,
            symbol: '₽',
            code: 'RUB'
        };
    } else {
        return {
            value: product.priceByn,
            symbol: 'Br',
            code: 'BYN'
        };
    }
}

function formatPrice(price, currency) {
    if (currency === 'rub') {
        return `${price.toLocaleString()} ₽`;
    } else {
        return `${price.toLocaleString()} Br`;
    }
}

// ========== ОТОБРАЖЕНИЕ ТОВАРОВ ==========
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    if (!products || products.length === 0) {
        grid.innerHTML = '<div style="text-align:center; padding:40px;">Товары скоро появятся...</div>';
        return;
    }
    
    grid.innerHTML = products.map(prod => {
        const price = getPriceInCurrency(prod);
        return `
            <div class="product-card" data-id="${prod.id}">
                <img src="${prod.image}" alt="${prod.name}" class="product-image" loading="lazy" onerror="this.src='https://via.placeholder.com/300?text=No+Image'">
                <h3>${escapeHtml(prod.name)}</h3>
                <div class="product-volume">${prod.volume || 'Объём: 30 мл'}</div>
                <p>${escapeHtml(prod.shortDesc || '')}</p>
                <div class="product-price">
                    <span class="product-price-current">${formatPrice(price.value, currentCurrency)}</span>
                </div>
                <button class="add-to-cart" data-id="${prod.id}">Добавить в корзину</button>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart')) {
                return;
            }
            const id = parseInt(card.dataset.id);
            openProductModal(id);
        });
    });

    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            addToCart(id);
        });
    });
}

// ========== ОТОБРАЖЕНИЕ ОТЗЫВОВ ==========
function renderReviews() {
    const container = document.getElementById('reviewsGrid');
    if (!container) return;
    
    if (!reviews || reviews.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">Пока нет отзывов. Будьте первым!</div>';
        return;
    }
    
    container.innerHTML = reviews.map(rev => {
        let mediaHtml = '';
        if (rev.imgUrl && rev.imgUrl.trim() !== '') {
            mediaHtml += `<div class="review-media"><img src="${rev.imgUrl}" alt="фото отзыва" loading="lazy" onerror="this.style.display='none'"></div>`;
        }
        if (rev.videoUrl && rev.videoUrl.trim() !== '') {
            let videoId = extractYouTubeId(rev.videoUrl);
            if (videoId) {
                mediaHtml += `<div class="review-media"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>`;
            }
        }
        return `
            <div class="review-card">
                <div class="review-name"><i class="fas fa-user-circle"></i> ${escapeHtml(rev.name)}</div>
                <div class="review-text">“${escapeHtml(rev.text)}”</div>
                ${mediaHtml}
            </div>
        `;
    }).join('');
}

// ========== ВИДЕО-ОТЗЫВЫ ==========
let videoReviews = [];

async function loadVideoReviews() {
    try {
        const response = await fetch(REVIEWS_URL, {
            headers: { 'X-Master-Key': API_KEY }
        });
        const data = await response.json();
        const allReviews = data.record || [];
        videoReviews = allReviews.filter(review => review.videoUrl && review.videoUrl.trim() !== '');
        renderVideoReviews();
    } catch (error) {
        console.error('Ошибка загрузки видео-отзывов:', error);
        videoReviews = [];
        renderVideoReviews();
    }
}

function extractYouTubeId(url) {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})(?:[&?\/]|$)/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:[?\/]|$)/,
        /youtu\.be\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

function getVideoType(url) {
    if (!url) return 'normal';
    if (url.includes('/shorts/')) return 'shorts';
    return 'normal';
}

function getYouTubeThumbnail(videoId) {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

function getEmbedUrl(videoId, videoType) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
}

function renderVideoReviews() {
    const container = document.getElementById('videoReviewsGrid');
    if (!container) return;
    
    if (!videoReviews || videoReviews.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px;">Видео-отзывы скоро появятся...</div>';
        return;
    }
    
    container.innerHTML = videoReviews.map(rev => {
        const videoId = extractYouTubeId(rev.videoUrl);
        if (!videoId) return '';
        const videoType = getVideoType(rev.videoUrl);
        return `
            <div class="video-card" data-video-id="${videoId}" data-video-type="${videoType}" data-video-name="${escapeHtml(rev.name)}" data-video-text="${escapeHtml(rev.text || '')}">
                <div class="video-thumbnail">
                    <img src="${getYouTubeThumbnail(videoId)}" alt="${escapeHtml(rev.name)}" loading="lazy">
                    <div class="play-icon"><i class="fas fa-play-circle"></i></div>
                    ${videoType === 'shorts' ? '<span class="shorts-badge">SHORTS</span>' : ''}
                </div>
                <div class="video-info">
                    <div class="video-name"><i class="fas fa-user-circle"></i> ${escapeHtml(rev.name)}</div>
                    ${rev.text ? `<div class="video-text">${escapeHtml(rev.text.substring(0, 100))}${rev.text.length > 100 ? '...' : ''}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('.video-card').forEach(card => {
        card.addEventListener('click', () => {
            const videoId = card.dataset.videoId;
            const videoType = card.dataset.videoType;
            const videoName = card.dataset.videoName;
            const videoText = card.dataset.videoText;
            openVideoModal(videoId, videoType, videoName, videoText);
        });
    });
}

function openVideoModal(videoId, videoType, videoName, videoText) {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');
    const title = document.getElementById('videoModalTitle');
    const text = document.getElementById('videoModalText');
    
    player.src = getEmbedUrl(videoId, videoType);
    title.textContent = videoName;
    text.textContent = videoText || '';
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');
    if (player) player.src = '';
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// ========== МОДАЛЬНОЕ ОКНО ТОВАРА ==========
function openProductModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const modal = document.getElementById('productModal');
    const modalName = document.getElementById('modalProductName');
    const modalImage = document.getElementById('modalProductImage');
    const modalDescription = document.getElementById('modalProductDescription');
    const modalIngredients = document.getElementById('modalProductIngredients');
    const modalBenefits = document.getElementById('modalProductBenefits');
    const modalPriceRub = document.getElementById('modalProductPriceRub');
    const modalPriceByn = document.getElementById('modalProductPriceByn');
    const modalAddBtn = document.getElementById('modalAddToCart');
    const modalPriceContainer = document.querySelector('.modal-price div');

    modalName.textContent = product.name;
    modalImage.src = product.image;
    modalDescription.textContent = product.description || '';
    modalIngredients.textContent = product.ingredients || '';
    
    if (modalPriceContainer) {
        modalPriceContainer.innerHTML = `
            <span class="modal-price-rub">${product.priceRub.toLocaleString()} ₽</span>
            <span style="margin: 0 8px; color: #D4C9BC;">/</span>
            <span class="modal-price-byn">${product.priceByn.toLocaleString()} Br</span>
        `;
    }
    
    modalBenefits.innerHTML = '';
    if (product.benefits && product.benefits.length) {
        product.benefits.forEach(benefit => {
            const li = document.createElement('li');
            li.textContent = benefit;
            modalBenefits.appendChild(li);
        });
    }

    modalAddBtn.dataset.id = productId;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// ========== КОРЗИНА ==========
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ 
            id: product.id, 
            name: product.name, 
            volume: product.volume,
            priceRub: product.priceRub, 
            priceByn: product.priceByn, 
            quantity: 1 
        });
    }
    updateCartUI();
    showTemporaryNotification(`✅ ${product.name} добавлена в корзину`);
}

function updateQuantity(productId, delta) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex === -1) return;
    
    const newQuantity = cart[itemIndex].quantity + delta;
    
    if (newQuantity <= 0) {
        cart.splice(itemIndex, 1);
        showTemporaryNotification(`🗑️ Товар удалён из корзины`);
    } else {
        cart[itemIndex].quantity = newQuantity;
    }
    
    updateCartUI();
}

function removeItem(productId) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex !== -1) {
        const itemName = cart[itemIndex].name;
        cart.splice(itemIndex, 1);
        updateCartUI();
        showTemporaryNotification(`🗑️ ${itemName} удалён(а) из корзины`);
    }
}

function updateCartUI() {
    const cartCountSpan = document.getElementById('cartCount');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCountSpan) cartCountSpan.innerText = totalItems;

    const cartItemsContainer = document.getElementById('cartItemsList');
    const cartTotalRubSpan = document.getElementById('cartTotalRub');
    const cartTotalBynSpan = document.getElementById('cartTotalByn');
    
    if (cartItemsContainer) {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<div style="text-align:center;padding:30px; color:#8B7A6B;">Корзина пуста, но красота ждет ✨</div>';
        } else {
            cartItemsContainer.innerHTML = cart.map(item => {
                const totalRub = item.priceRub * item.quantity;
                const totalByn = item.priceByn * item.quantity;
                const displayPrice = currentCurrency === 'rub' ? totalRub : totalByn;
                const currencySymbol = currentCurrency === 'rub' ? '₽' : 'Br';
                
                return `
                    <div class="cart-item" data-id="${item.id}">
                        <div class="cart-item-info">
                            <span class="cart-item-name">${escapeHtml(item.name)}</span>
                            <span class="cart-item-volume">${item.volume || ''}</span>
                        </div>
                        <div class="cart-item-price">${displayPrice.toLocaleString()} ${currencySymbol}</div>
                        <div class="cart-item-quantity">
                            <button class="qty-minus" data-id="${item.id}">−</button>
                            <span>${item.quantity}</span>
                            <button class="qty-plus" data-id="${item.id}">+</button>
                        </div>
                        <button class="cart-item-remove" data-id="${item.id}" title="Удалить"><i class="fas fa-trash-alt"></i></button>
                    </div>
                `;
            }).join('');
        }
        
        const totalRub = cart.reduce((sum, item) => sum + (item.priceRub * item.quantity), 0);
        const totalByn = cart.reduce((sum, item) => sum + (item.priceByn * item.quantity), 0);
        if (cartTotalRubSpan) cartTotalRubSpan.textContent = `${totalRub.toLocaleString()} ₽`;
        if (cartTotalBynSpan) cartTotalBynSpan.textContent = `${totalByn.toLocaleString()} Br`;
    }
    
    document.querySelectorAll('.qty-plus').forEach(btn => {
        btn.removeEventListener('click', plusHandler);
        btn.addEventListener('click', plusHandler);
    });
    document.querySelectorAll('.qty-minus').forEach(btn => {
        btn.removeEventListener('click', minusHandler);
        btn.addEventListener('click', minusHandler);
    });
    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.removeEventListener('click', removeHandler);
        btn.addEventListener('click', removeHandler);
    });
}

function plusHandler(e) {
    e.stopPropagation();
    const id = parseInt(e.currentTarget.dataset.id);
    updateQuantity(id, 1);
}

function minusHandler(e) {
    e.stopPropagation();
    const id = parseInt(e.currentTarget.dataset.id);
    updateQuantity(id, -1);
}

function removeHandler(e) {
    e.stopPropagation();
    const id = parseInt(e.currentTarget.dataset.id);
    removeItem(id);
}

// ========== ОФОРМЛЕНИЕ ЗАКАЗА (УНИВЕРСАЛЬНАЯ ВЕРСИЯ ДЛЯ ВСЕХ УСТРОЙСТВ) ==========
function formatOrderMessage() {
    let message = `🛍️ НОВЫЙ ЗАКАЗ!\n`;
    message += `📅 ${new Date().toLocaleString('ru-RU')}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📦 СОСТАВ ЗАКАЗА:\n`;
    
    cart.forEach((item, index) => {
        const totalRub = item.priceRub * item.quantity;
        const totalByn = item.priceByn * item.quantity;
        message += `${index + 1}. ${item.name}\n`;
        message += `   • Количество: ${item.quantity} шт\n`;
        message += `   • ${item.priceRub}₽ × ${item.quantity} = ${totalRub}₽\n`;
        message += `   • ${item.priceByn}Br × ${item.quantity} = ${totalByn}Br\n\n`;
    });
    
    const totalRub = cart.reduce((sum, item) => sum + (item.priceRub * item.quantity), 0);
    const totalByn = cart.reduce((sum, item) => sum + (item.priceByn * item.quantity), 0);
    
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `💰 ИТОГО К ОПЛАТЕ:\n`;
    message += `🇷🇺 ${totalRub.toLocaleString()} ₽\n`;
    message += `🇧🇾 ${totalByn.toLocaleString()} Br\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `✨ Спасибо за заказ! Менеджер свяжется с вами.`;
    
    return message;
}

// Универсальная функция отправки заказа (работает на ВСЕХ устройствах)
function sendOrderToTelegram() {
    const message = formatOrderMessage();
    const encodedMessage = encodeURIComponent(message);
    
    // Определяем тип устройства
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
        // Для телефонов и планшетов - копируем в буфер и открываем чат
        navigator.clipboard.writeText(message).then(() => {
            showTemporaryNotification('✅ Текст заказа скопирован!');
            
            setTimeout(() => {
                window.location.href = 'https://t.me/order_101';
                
                setTimeout(() => {
                    showTemporaryNotification('📋 Вставьте сообщение в чат (нажмите и удерживайте поле ввода → Вставить)');
                }, 1500);
            }, 500);
        }).catch(() => {
            // Если не удалось скопировать, показываем текст для ручного копирования
            showTemporaryNotification('⚠️ Скопируйте заказ вручную');
            alert('Ваш заказ:\n\n' + message + '\n\nПожалуйста, скопируйте текст и отправьте в Telegram @order_101');
            window.location.href = 'https://t.me/order_101';
        });
    } else {
        // Для компьютеров и ноутбуков - используем ссылку с параметром text
        const telegramUrl = `https://t.me/order_101?text=${encodedMessage}`;
        window.open(telegramUrl, '_blank');
        showTemporaryNotification('📱 Открывается Telegram с готовым сообщением');
    }
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function showTemporaryNotification(msg) {
    let notif = document.createElement('div');
    notif.innerText = msg;
    notif.style.position = 'fixed';
    notif.style.bottom = '20px';
    notif.style.left = '50%';
    notif.style.transform = 'translateX(-50%)';
    notif.style.backgroundColor = '#1E1E1E';
    notif.style.color = 'white';
    notif.style.padding = '12px 28px';
    notif.style.borderRadius = '50px';
    notif.style.zIndex = '1200';
    notif.style.fontSize = '0.9rem';
    notif.style.fontWeight = '500';
    notif.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
    notif.style.whiteSpace = 'nowrap';
    notif.style.maxWidth = '90%';
    notif.style.whiteSpace = 'normal';
    notif.style.textAlign = 'center';
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transition = 'opacity 0.3s';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
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

// ========== МОДАЛЬНЫЕ ОКНА ==========
const cartModal = document.getElementById('cartModal');
const cartIconBtn = document.getElementById('cartIconBtn');
const closeCart = document.getElementById('closeCart');

function openCartModal() {
    if (cartModal) cartModal.style.display = 'flex';
    updateCartUI();
}
function closeCartModal() {
    if (cartModal) cartModal.style.display = 'none';
}

if (cartIconBtn) cartIconBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openCartModal();
});
if (closeCart) closeCart.addEventListener('click', closeCartModal);
window.addEventListener('click', (e) => {
    if (e.target === cartModal) closeCartModal();
});

// Оформление заказа (обновлённая версия)
document.getElementById('checkoutBtn')?.addEventListener('click', () => {
    if (cart.length === 0) {
        alert('Корзина пуста, выберите сыворотку 🌿');
        return;
    }
    
    showTemporaryNotification('📋 Подготовка заказа...');
    sendOrderToTelegram();
    
    // Очищаем корзину через 2 секунды
    setTimeout(() => {
        cart = [];
        updateCartUI();
        closeCartModal();
    }, 2000);
});

const modal = document.getElementById('productModal');
const closeModalBtn = document.querySelector('.close-modal');
if (closeModalBtn) closeModalBtn.addEventListener('click', closeProductModal);
window.addEventListener('click', (e) => {
    if (e.target === modal) closeProductModal();
});

document.getElementById('modalAddToCart')?.addEventListener('click', (e) => {
    const productId = parseInt(e.target.dataset.id);
    addToCart(productId);
    closeProductModal();
});

// Обработчик закрытия видео модального окна
const closeVideoModalBtn = document.querySelector('.close-video-modal');
if (closeVideoModalBtn) {
    closeVideoModalBtn.addEventListener('click', closeVideoModal);
}
window.addEventListener('click', (e) => {
    const videoModal = document.getElementById('videoModal');
    if (e.target === videoModal) closeVideoModal();
});

// ========== МОБИЛЬНОЕ МЕНЮ ==========
const mobileBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');
if (mobileBtn) {
    mobileBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}

document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === "#" || href === "") return;
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ========== ИНИЦИАЛИЗАЦИЯ ПЕРЕКЛЮЧАТЕЛЯ ==========
function initCurrencySwitcher() {
    const savedCurrency = localStorage.getItem('preferredCurrency');
    if (savedCurrency && (savedCurrency === 'rub' || savedCurrency === 'byn')) {
        currentCurrency = savedCurrency;
    }
    
    document.querySelectorAll('.currency-btn').forEach(btn => {
        if (btn.dataset.currency === currentCurrency) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    document.querySelectorAll('.currency-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchCurrency(btn.dataset.currency);
        });
    });
}

// ========== ЗАПУСК ==========
initCurrencySwitcher();
loadProducts();
loadReviews();
loadVideoReviews();
updateCartUI();

// ========== ИНИЦИАЛИЗАЦИЯ МОБИЛЬНЫХ УЛУЧШЕНИЙ ==========
document.addEventListener('DOMContentLoaded', () => {
    const cartModalElement = document.getElementById('cartModal');
    if (cartModalElement) {
        handleSwipeForModal(cartModalElement, closeCartModal);
    }
    
    const productModalElement = document.getElementById('productModal');
    if (productModalElement) {
        handleSwipeForModal(productModalElement, closeProductModal);
    }
    
    const videoModalElement = document.getElementById('videoModal');
    if (videoModalElement) {
        handleSwipeForModal(videoModalElement, closeVideoModal);
    }
});