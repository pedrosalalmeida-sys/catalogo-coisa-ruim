// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyDMe3oacCzx-Zknl7jTzNKTE4Mmv98fc1U",
  authDomain: "catalago-coisa-ruim.firebaseapp.com",
  projectId: "catalago-coisa-ruim",
  storageBucket: "catalago-coisa-ruim.firebasestorage.app",
  messagingSenderId: "166445002022",
  appId: "1:166445002022:web:1d4913879bc889636ae5e7",
  measurementId: "G-TS30YEWPN3"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db_fs = firebase.firestore();
const storage = firebase.storage();

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
    renderProducts();
    setupEventListeners();
    if (window.lucide) lucide.createIcons();
}

// --- CORE LOGIC (FIRESTORE) ---
async function renderProducts() {
    if (!productList) return;
    
    // Mostra um loader simples enquanto carrega
    productList.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: #555;">Carregando catálogo...</div>`;

    try {
        const snapshot = await db_fs.collection('produtos').get();
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const filtered = products.filter(p => {
            const matchesCategory = currentCategory === 'todos' || p.categoria === currentCategory;
            const matchesSearch = p.nome.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });

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
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        productList.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: #ff3e3e;">Erro ao carregar catálogo. Verifique as regras do Firebase.</div>`;
    }
}

async function openDetails(id) {
    try {
        const doc = await db_fs.collection('produtos').doc(id).get();
        if (!doc.exists) return;
        
        const product = { id: doc.id, ...doc.data() };
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
    } catch (error) {
        console.error("Erro ao abrir detalhes:", error);
    }
}

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

    document.getElementById('open-wa-options').onclick = () => choiceSheet.classList.add('active');

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

    // Secret Admin Trigger
    const logo = document.getElementById('home-link');
    let logoClicks = 0;
    if (logo) {
        logo.onclick = () => {
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

            logoClicks++;
            if (logoClicks === 3) {
                const trigger = document.getElementById('admin-trigger');
                if (trigger) trigger.style.display = 'flex';
                setTimeout(() => { logoClicks = 0; }, 3000);
            }
        };
    }

    const adminTrig = document.getElementById('admin-trigger');
    if (adminTrig) {
        adminTrig.style.display = 'none';
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

    // Admin Form with Cloud Storage
    const form = document.getElementById('product-form');
    const imgInp = document.getElementById('prod-images');
    const preview = document.getElementById('img-preview');

    if (imgInp) {
        imgInp.onchange = (e) => {
            const files = Array.from(e.target.files);
            uploadedImages = files; // Save files, not base64 yet
            preview.innerHTML = '';
            files.forEach(f => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    preview.innerHTML += `<img src="${ev.target.result}" style="width:100%; aspect-ratio:1; object-fit:cover; border-radius:4px;">`;
                };
                reader.readAsDataURL(f);
            });
        };
    }

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const saveBtn = e.target.querySelector('button[type="submit"]');
            saveBtn.textContent = 'Salvando na Nuvem...';
            saveBtn.disabled = true;

            const id = document.getElementById('prod-id').value;
            const nome = document.getElementById('prod-name').value;
            const categoria = document.getElementById('prod-category').value;
            const preco = document.getElementById('prod-price').value;
            const descricao = document.getElementById('prod-desc').value;

            try {
                let imageUrls = [];
                
                // Upload Images to Firebase Storage
                if (uploadedImages.length > 0) {
                    for (let file of uploadedImages) {
                        const storageRef = storage.ref(`produtos/${Date.now()}_${file.name}`);
                        await storageRef.put(file);
                        const url = await storageRef.getDownloadURL();
                        imageUrls.push(url);
                    }
                } else if (id) {
                    // Keep old images if no new ones
                    const oldDoc = await db_fs.collection('produtos').doc(id).get();
                    imageUrls = oldDoc.data().imagens;
                }

                const productData = {
                    nome, categoria, preco, descricao,
                    imagens: imageUrls,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                if (id) {
                    await db_fs.collection('produtos').doc(id).update(productData);
                } else {
                    await db_fs.collection('produtos').add(productData);
                }

                form.reset();
                preview.innerHTML = '';
                uploadedImages = [];
                document.getElementById('prod-id').value = '';
                renderAdminProducts();
                alert('Produto salvo com sucesso no Banco de Dados!');
            } catch (error) {
                console.error("Erro ao salvar:", error);
                alert('Erro ao salvar no Firebase. Verifique se o Firestore e o Storage estão em Modo de Teste.');
            } finally {
                saveBtn.textContent = 'Salvar Produto';
                saveBtn.disabled = false;
            }
        };
    }
}

async function renderAdminProducts() {
    const list = document.getElementById('admin-product-list');
    if (!list) return;
    list.innerHTML = 'Carregando lista...';

    try {
        const snapshot = await db_fs.collection('produtos').get();
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
    } catch (error) {
        list.innerHTML = 'Erro ao carregar lista.';
    }
}

window.editProduct = async (id) => {
    const doc = await db_fs.collection('produtos').doc(id).get();
    const p = doc.data();
    document.getElementById('prod-id').value = id;
    document.getElementById('prod-name').value = p.nome;
    document.getElementById('prod-category').value = p.categoria;
    document.getElementById('prod-price').value = p.preco;
    document.getElementById('prod-desc').value = p.descricao;
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteProduct = async (id) => {
    if (confirm('Excluir produto definitivamente?')) {
        await db_fs.collection('produtos').doc(id).delete();
        renderAdminProducts();
    }
};

init();
