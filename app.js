// --- DATABASE LAYER ---
const DB_NAME = 'catalogo_coisa_ruim_db';
const db = {
    getProducts: () => JSON.parse(localStorage.getItem(DB_NAME)) || [],
    saveProduct: (product) => {
        const products = db.getProducts();
        if (product.id) {
            const index = products.findIndex(p => p.id === product.id);
            if (index !== -1) products[index] = product;
        } else {
            product.id = Date.now().toString();
            products.push(product);
        }
        localStorage.setItem(DB_NAME, JSON.stringify(products));
        return product;
    },
    deleteProduct: (id) => {
        const products = db.getProducts().filter(p => p.id !== id);
        localStorage.setItem(DB_NAME, JSON.stringify(products));
    },
    getProductById: (id) => db.getProducts().find(p => p.id === id)
};

// --- APP STATE ---
let currentCategory = 'todos';
let searchQuery = '';
let selectedProduct = null;
let uploadedImages = [];
let mySwiper = null;

// --- DOM ELEMENTS ---
const productList = document.getElementById('product-list');
const categoryNav = document.getElementById('category-filter');
const searchInput = document.getElementById('search-input');
const productSheet = document.getElementById('product-sheet');
const sheetOverlay = document.getElementById('sheet-overlay');
const choiceSheet = document.getElementById('choice-sheet');
const homeSection = document.getElementById('home-section');
const adminSection = document.getElementById('admin-section');

// --- INITIALIZATION ---
function init() {
    seedInitialData();
    renderProducts();
    setupEventListeners();
    if (window.lucide) lucide.createIcons();
}

function seedInitialData() {
    let products = db.getProducts();
    if (products.length === 0) {
        const initial = [
            {
                id: '1', nome: 'Camiseta Skull Street', preco: 'R$ 89,90', categoria: 'Camisetas',
                descricao: 'Camiseta 100% algodão 30.1 com toque macio e caimento confortável. Estampa em DTF com cores vivas e alta durabilidade.',
                imagens: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80']
            },
            {
                id: '2', nome: 'Caneca Old School Tattoo', preco: 'R$ 45,00', categoria: 'Copos e Canecas',
                descricao: 'Copo americano com estampa em DTF UV, com alta definição e ótima durabilidade.',
                imagens: ['https://images.unsplash.com/photo-1514228742587-6b1558fbed20?auto=format&fit=crop&w=800&q=80']
            },
            {
                id: '3', nome: 'Ecobag Black Rose', preco: 'R$ 35,00', categoria: 'Ecobags',
                descricao: 'Ecobag em algodão cru, resistente e reutilizável, ideal para o dia a dia.',
                imagens: ['https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80']
            }
        ];
        initial.forEach(p => db.saveProduct(p));
    }
}

// --- CORE LOGIC ---
function renderProducts() {
    const products = db.getProducts();
    const filtered = products.filter(p => {
        const matchesCategory = currentCategory === 'todos' || p.categoria === currentCategory;
        const matchesSearch = p.nome.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (!productList) return;

    if (filtered.length === 0) {
        productList.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: #555;">Nenhum produto encontrado.</div>`;
        return;
    }

    productList.innerHTML = filtered.map(p => `
        <div class="product-card" onclick="openDetails('${p.id}')">
            <div class="product-img-wrapper">
                <img src="${p.imagens[0]}" class="product-img" loading="lazy">
            </div>
            <div class="product-info">
                <div class="product-name">${p.nome}</div>
                <div class="product-price">${p.preco}</div>
            </div>
        </div>
    `).join('');
}

window.openDetails = (id) => {
    const product = db.getProductById(id);
    if (!product) return;
    selectedProduct = product;

    document.getElementById('detail-name').textContent = product.nome;
    document.getElementById('detail-price').textContent = product.preco;
    document.getElementById('detail-desc').textContent = product.descricao;

    const wrapper = document.getElementById('swiper-images');
    wrapper.innerHTML = product.imagens.map(img => `<div class="swiper-slide"><img src="${img}"></div>`).join('');

    sheetOverlay.classList.add('active');
    productSheet.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (mySwiper) mySwiper.destroy();
    mySwiper = new Swiper('#product-swiper', {
        pagination: { el: '.swiper-pagination', clickable: true },
        loop: product.imagens.length > 1
    });
};

function closeAllSheets() {
    productSheet.classList.remove('active');
    choiceSheet.classList.remove('active');
    sheetOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// --- EVENTS ---
function setupEventListeners() {
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderProducts();
        });
    }

    if (categoryNav) {
        categoryNav.addEventListener('click', (e) => {
            const btn = e.target.closest('.category-btn');
            if (btn) {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentCategory = btn.dataset.category;
                renderProducts();
            }
        });
    }

    sheetOverlay.onclick = closeAllSheets;
    const closeChoice = document.getElementById('close-choice');
    if (closeChoice) closeChoice.onclick = closeAllSheets;

    const waOptions = document.getElementById('open-wa-options');
    if (waOptions) waOptions.onclick = () => choiceSheet.classList.add('active');

    const headWa = document.getElementById('header-whatsapp');
    if (headWa) {
        headWa.onclick = () => {
            selectedProduct = null;
            sheetOverlay.classList.add('active');
            choiceSheet.classList.add('active');
        };
    }

    const waMsg = (p) => p ? `Oi vi o produto ${p.nome} no catálogo e quero saber mais` : `Olá, vi o catálogo e gostaria de informações`;
    
    document.getElementById('wa-pitorexco').onclick = (e) => {
        e.preventDefault();
        window.open(`https://wa.me/5562991122237?text=${encodeURIComponent(waMsg(selectedProduct))}`, '_blank');
    };
    document.getElementById('wa-mendez').onclick = (e) => {
        e.preventDefault();
        window.open(`https://wa.me/5562984845085?text=${encodeURIComponent(waMsg(selectedProduct))}`, '_blank');
    };

    // Navigation (RESET LOGIC)
    const logo = document.getElementById('home-link');
    let logoClicks = 0;
    if (logo) {
        logo.onclick = () => {
            // Reset to home
            currentCategory = 'todos';
            searchQuery = '';
            if (searchInput) searchInput.value = '';
            
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            const allBtn = document.querySelector('[data-category="todos"]');
            if (allBtn) allBtn.classList.add('active');
            
            adminSection.classList.remove('active');
            homeSection.classList.remove('hidden');
            renderProducts();
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Secret Admin Trigger: 3 clicks
            logoClicks++;
            if (logoClicks === 3) {
                const trigger = document.getElementById('admin-trigger');
                if (trigger) trigger.style.display = 'flex';
                setTimeout(() => { logoClicks = 0; }, 3000); // Reset after 3s
            }
        };
    }

    const adminTrig = document.getElementById('admin-trigger');
    if (adminTrig) {
        adminTrig.style.display = 'none'; // Hide by default
        adminTrig.onclick = () => {
            const pass = prompt('Digite a senha de administrador:');
            if (pass === 'admin123') {
                homeSection.classList.add('hidden');
                adminSection.classList.add('active');
                renderAdminProducts();
            } else {
                alert('Senha incorreta!');
            }
        };
    }

    const exitAdmin = document.getElementById('exit-admin');
    if (exitAdmin) {
        exitAdmin.onclick = () => {
            adminSection.classList.remove('active');
            homeSection.classList.remove('hidden');
            renderProducts();
        };
    }

    const form = document.getElementById('product-form');
    const imgInp = document.getElementById('prod-images');
    const preview = document.getElementById('img-preview');

    if (imgInp) {
        imgInp.onchange = (e) => {
            const files = Array.from(e.target.files);
            uploadedImages = [];
            preview.innerHTML = '';
            files.forEach(f => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    uploadedImages.push(ev.target.result);
                    preview.innerHTML += `<img src="${ev.target.result}" style="width:100%; aspect-ratio:1; object-fit:cover; border-radius:4px;">`;
                };
                reader.readAsDataURL(f);
            });
        };
    }

    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            const id = document.getElementById('prod-id').value;
            const p = {
                id: id || null,
                nome: document.getElementById('prod-name').value,
                categoria: document.getElementById('prod-category').value,
                preco: document.getElementById('prod-price').value,
                descricao: document.getElementById('prod-desc').value,
                imagens: uploadedImages.length > 0 ? uploadedImages : (id ? db.getProductById(id).imagens : [])
            };
            db.saveProduct(p);
            form.reset();
            preview.innerHTML = '';
            uploadedImages = [];
            document.getElementById('prod-id').value = '';
            renderAdminProducts();
            alert('Produto salvo!');
        };
    }
}

function renderAdminProducts() {
    const products = db.getProducts();
    const list = document.getElementById('admin-product-list');
    if (!list) return;
    list.innerHTML = `
        <h3 style="margin-bottom: 1rem;">Produtos (${products.length})</h3>
        ${products.map(p => `
            <div style="display:flex; align-items:center; gap:10px; background:#111; padding:10px; border-radius:8px; margin-bottom:8px;">
                <img src="${p.imagens[0]}" style="width:50px; height:50px; border-radius:4px; object-fit:cover;">
                <div style="flex:1;">
                    <div style="font-weight:600; font-size:0.9rem;">${p.nome}</div>
                    <div style="font-size:0.8rem; color:#666;">${p.categoria}</div>
                </div>
                <div style="display:flex; gap:5px;">
                    <button onclick="editProduct('${p.id}')" style="background:#222; border:none; color:white; padding:5px; border-radius:4px;"><i data-lucide="edit-2" size="14"></i></button>
                    <button onclick="deleteProduct('${p.id}')" style="background:#311; border:none; color:white; padding:5px; border-radius:4px;"><i data-lucide="trash" size="14"></i></button>
                </div>
            </div>
        `).join('')}
    `;
    if (window.lucide) lucide.createIcons();
}

window.editProduct = (id) => {
    const p = db.getProductById(id);
    if (!p) return;
    document.getElementById('prod-id').value = p.id;
    document.getElementById('prod-name').value = p.nome;
    document.getElementById('prod-category').value = p.categoria;
    document.getElementById('prod-price').value = p.preco;
    document.getElementById('prod-desc').value = p.descricao;
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteProduct = (id) => {
    if (confirm('Excluir produto?')) {
        db.deleteProduct(id);
        renderAdminProducts();
    }
};

init();
