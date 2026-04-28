
const DB_NAME = 'catalogo_coisa_ruim_db';

export const db = {
    getProducts: () => {
        const data = localStorage.getItem(DB_NAME);
        return data ? JSON.parse(data) : [];
    },
    saveProduct: (product) => {
        const products = db.getProducts();
        if (product.id) {
            const index = products.findIndex(p => p.id === product.id);
            products[index] = product;
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
    getProductById: (id) => {
        return db.getProducts().find(p => p.id === id);
    }
};
