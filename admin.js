import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    push,
    set,
    onValue,
    remove,
    update,
    runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ============================================
// FIREBASE CONFIG
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyCq2a6RHcI9EU4xA-j-nHwUVsUkqnRb06E",
    authDomain: "true-seller-5f0e7.firebaseapp.com",
    databaseURL: "https://true-seller-5f0e7-default-rtdb.firebaseio.com",
    projectId: "true-seller-5f0e7",
    storageBucket: "true-seller-5f0e7.firebasestorage.app",
    messagingSenderId: "160519174020",
    appId: "1:160519174020:web:078802af43a697f2604fd1"
};


// ============================================
// ADMIN UID
// ============================================

const ADMIN_UIDS = [
    "2bj30wKRbmQ3AjzRwqJMmD8BZHj2",
    "wH5ou0Gvq2eF6uSbTVokI108pff1"
];


// ============================================
// INITIALIZE FIREBASE
// ============================================

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);

const auth = getAuth(app);


// ============================================
// DOM ELEMENTS
// ============================================

const loginScreen = document.getElementById("loginScreen");
const adminApp = document.getElementById("adminApp");

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

const logoutBtn = document.getElementById("logoutBtn");

const totalProducts = document.getElementById("totalProducts");
const lowStock = document.getElementById("lowStock");
const pendingOrders = document.getElementById("pendingOrders");

const productForm = document.getElementById("productForm");
const productIdInput = document.getElementById("productId");
const productNameInput = document.getElementById("productName");
const productPriceInput = document.getElementById("productPrice");
const productStockInput = document.getElementById("productStock");
const productImageInput = document.getElementById("productImage");

const productSubmitButton =
    document.getElementById("productSubmitButton");

const cancelEditButton =
    document.getElementById("cancelEditButton");

const productMessage =
    document.getElementById("productMessage");

const productList =
    document.getElementById("productList");

const adminProductCount =
    document.getElementById("adminProductCount");

const orderList =
    document.getElementById("orderList");


// ============================================
// LOCAL DATA
// ============================================

let productsData = {};
let ordersData = {};


// ============================================
// AUTH STATE
// ============================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        showLogin();

        return;
    }


    if (!ADMIN_UIDS.includes(user.uid)) {

        loginError.textContent =
            "This account does not have admin access.";

        signOut(auth);

        showLogin();

        return;
    }


    showAdmin();

    loadProducts();

    loadOrders();

});


// ============================================
// SHOW LOGIN
// ============================================

function showLogin() {

    loginScreen.style.display = "flex";

    adminApp.style.display = "none";

}


// ============================================
// SHOW ADMIN
// ============================================

function showAdmin() {

    loginScreen.style.display = "none";

    adminApp.style.display = "block";

}


// ============================================
// LOGIN
// ============================================

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    const email = emailInput.value.trim();

    const password = passwordInput.value;


    loginError.textContent = "";

    loginBtn.disabled = true;

    loginBtn.textContent = "Logging in...";


    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

    } catch (error) {

        console.error(error);

        loginError.textContent =
            getLoginErrorMessage(error);

    } finally {

        loginBtn.disabled = false;

        loginBtn.textContent = "Login";

    }

});


// ============================================
// LOGIN ERROR MESSAGE
// ============================================

function getLoginErrorMessage(error) {

    switch (error.code) {

        case "auth/invalid-email":
            return "Please enter a valid email address.";

        case "auth/user-not-found":
            return "No account found with this email.";

        case "auth/wrong-password":
        case "auth/invalid-credential":
            return "Incorrect email or password.";

        case "auth/too-many-requests":
            return "Too many attempts. Please try again later.";

        default:
            return "Login failed. Please check your email and password.";

    }

}


// ============================================
// LOGOUT
// ============================================

logoutBtn.addEventListener("click", async () => {

    try {

        await signOut(auth);

    } catch (error) {

        console.error("Logout error:", error);

    }

});


// ============================================
// LOAD PRODUCTS
// ============================================

function loadProducts() {

    const productsRef = ref(db, "products");


    onValue(productsRef, (snapshot) => {

        productsData = snapshot.val() || {};

        renderProducts();

        updateProductStats();

    }, (error) => {

        console.error("Products error:", error);

        productList.innerHTML = `
            <div class="admin-empty-state">
                <div class="empty-icon">⚠️</div>
                <h3>Could not load products</h3>
                <p>Please check your Firebase connection.</p>
            </div>
        `;

    });

}


// ============================================
// RENDER PRODUCTS
// ============================================

function renderProducts() {

    const productEntries =
        Object.entries(productsData);


    if (productEntries.length === 0) {

        productList.innerHTML = `
            <div class="admin-empty-state">
                <div class="empty-icon">📦</div>
                <h3>No products yet</h3>
                <p>Add your first product using the form above.</p>
            </div>
        `;

        adminProductCount.textContent = "0 Products";

        return;
    }


    adminProductCount.textContent =
        `${productEntries.length} ${
            productEntries.length === 1
                ? "Product"
                : "Products"
        }`;


    productList.innerHTML =
        productEntries
            .map(([id, product]) => {

                const name =
                    product.name || "Unnamed Product";

                const price =
                    Number(product.price || 0);

                const stock =
                    Number(product.stock || 0);

                const image =
                    product.image ||
                    product.imageUrl ||
                    "https://via.placeholder.com/500x500?text=True+Seller";


                let stockClass = "";

                let stockText =
                    `Stock: ${stock}`;


                if (stock === 0) {

                    stockClass = "stock-out";

                    stockText = "Out of Stock";

                } else if (stock <= 5) {

                    stockClass = "stock-low";

                    stockText =
                        `Low Stock: ${stock}`;

                }


                return `
                    <article class="admin-product-card">

                        <img
                            class="admin-product-image"
                            src="${escapeHtml(image)}"
                            alt="${escapeHtml(name)}"
                            loading="lazy"
                        >

                        <div class="admin-product-info">

                            <div class="admin-product-name">
                                ${escapeHtml(name)}
                            </div>

                            <div class="admin-product-price">
                                ৳${formatPrice(price)}
                            </div>

                            <div class="admin-product-stock ${stockClass}">
                                ${stockText}
                            </div>

                            <div class="product-actions">

                                <button
                                    type="button"
                                    class="edit-button"
                                    data-action="edit"
                                    data-id="${escapeHtml(id)}"
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    class="delete-button"
                                    data-action="delete"
                                    data-id="${escapeHtml(id)}"
                                >
                                    Delete
                                </button>

                            </div>

                        </div>

                    </article>
                `;

            })
            .join("");

}


// ============================================
// PRODUCT BUTTON ACTIONS
// ============================================

productList.addEventListener("click", async (event) => {

    const button =
        event.target.closest("button[data-action]");


    if (!button) {
        return;
    }


    const id = button.dataset.id;

    const action = button.dataset.action;


    if (!id) {
        return;
    }


    if (action === "edit") {

        editProduct(id);

    }


    if (action === "delete") {

        await deleteProduct(id);

    }

});


// ============================================
// ADD / UPDATE PRODUCT
// ============================================

productForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    const name =
        productNameInput.value.trim();

    const price =
        Number(productPriceInput.value);

    const stock =
        Number(productStockInput.value);

    const image =
        productImageInput.value.trim();

    const productId =
        productIdInput.value.trim();


    if (!name) {

        showProductMessage(
            "Please enter a product name.",
            true
        );

        return;
    }


    if (!Number.isFinite(price) || price < 0) {

        showProductMessage(
            "Please enter a valid price.",
            true
        );

        return;
    }


    if (!Number.isInteger(stock) || stock < 0) {

        showProductMessage(
            "Please enter a valid stock quantity.",
            true
        );

        return;
    }


    if (!image) {

        showProductMessage(
            "Please enter an image URL.",
            true
        );

        return;
    }


    productSubmitButton.disabled = true;

    productSubmitButton.textContent =
        productId ? "Updating..." : "Adding...";


    try {

        const productData = {

            name: name,

            price: price,

            stock: stock,

            image: image,

            updatedAt: Date.now()

        };


        if (productId) {

            const productRef =
                ref(db, `products/${productId}`);


            await update(
                productRef,
                productData
            );


            showProductMessage(
                "Product updated successfully."
            );

        } else {

            const productsRef =
                ref(db, "products");


            const newProductRef =
                push(productsRef);


            await set(
                newProductRef,
                {
                    ...productData,
                    createdAt: Date.now()
                }
            );


            showProductMessage(
                "Product added successfully."
            );

        }


        resetProductForm();

    } catch (error) {

        console.error(
            "Product save error:",
            error
        );

        showProductMessage(
            "Could not save product. Please try again.",
            true
        );

    } finally {

        productSubmitButton.disabled = false;

        productSubmitButton.textContent =
            productIdInput.value
                ? "Update Product"
                : "Add Product";

    }

});


// ============================================
// EDIT PRODUCT
// ============================================

function editProduct(id) {

    const product =
        productsData[id];


    if (!product) {

        showProductMessage(
            "Product not found.",
            true
        );

        return;
    }


    productIdInput.value = id;

    productNameInput.value =
        product.name || "";

    productPriceInput.value =
        product.price ?? "";

    productStockInput.value =
        product.stock ?? "";

    productImageInput.value =
        product.image ||
        product.imageUrl ||
        "";


    productSubmitButton.textContent =
        "Update Product";

    cancelEditButton.style.display =
        "inline-flex";


    showProductMessage(
        "Editing product. Update the fields and save."
    );


    document
        .querySelector(".product-form-card")
        ?.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

}


// ============================================
// CANCEL EDIT
// ============================================

cancelEditButton.addEventListener(
    "click",
    () => {

        resetProductForm();

        showProductMessage(
            "Edit cancelled."
        );

    }
);


// ============================================
// RESET PRODUCT FORM
// ============================================

function resetProductForm() {

    productForm.reset();

    productIdInput.value = "";

    productSubmitButton.textContent =
        "Add Product";

    cancelEditButton.style.display =
        "none";

}


// ============================================
// DELETE PRODUCT
// ============================================

async function deleteProduct(id) {

    const product =
        productsData[id];


    if (!product) {
        return;
    }


    const name =
        product.name || "this product";


    const confirmed =
        confirm(
            `Delete "${name}"?\n\nThis action cannot be undone.`
        );


    if (!confirmed) {
        return;
    }


    try {

        await remove(
            ref(db, `products/${id}`)
        );


        showProductMessage(
            "Product deleted successfully."
        );


    } catch (error) {

        console.error(
            "Delete product error:",
            error
        );

        showProductMessage(
            "Could not delete product.",
            true
        );

    }

}


// ============================================
// PRODUCT STATS
// ============================================

function updateProductStats() {

    const productEntries =
        Object.values(productsData);


    totalProducts.textContent =
        productEntries.length;


    const lowStockCount =
        productEntries.filter((product) => {

            const stock =
                Number(product.stock || 0);

            return stock <= 5;

        }).length;


    lowStock.textContent =
        lowStockCount;

}


// ============================================
// LOAD ORDERS
// ============================================

function loadOrders() {

    const ordersRef =
        ref(db, "orders");


    onValue(ordersRef, (snapshot) => {

        ordersData =
            snapshot.val() || {};


        renderOrders();

        updateOrderStats();

    }, (error) => {

        console.error(
            "Orders error:",
            error
        );

        orderList.innerHTML = `
            <div class="admin-empty-state">
                <div class="empty-icon">⚠️</div>
                <h3>Could not load orders</h3>
                <p>Please check your Firebase connection.</p>
            </div>
        `;

    });

}


// ============================================
// RENDER ORDERS
// ============================================

function renderOrders() {

    const orderEntries =
        Object.entries(ordersData);


    if (orderEntries.length === 0) {

        orderList.innerHTML = `
            <div class="admin-empty-state">
                <div class="empty-icon">🛒</div>
                <h3>No orders yet</h3>
                <p>Customer orders will appear here.</p>
            </div>
        `;

        return;
    }


    orderEntries.sort((a, b) => {

        return Number(
            b[1].createdAt || 0
        ) - Number(
            a[1].createdAt || 0
        );

    });


    orderList.innerHTML =
        orderEntries
            .map(([id, order]) => {

                const status =
                    order.status || "Pending";


                const isConfirmed =
                    status.toLowerCase() === "confirmed";


                const statusClass =
                    isConfirmed
                        ? "status-confirmed"
                        : "status-pending";


                const date =
                    formatDate(
                        order.createdAt
                    );


                const price =
                    Number(order.price || 0);


                const paymentMethod =
                    order.paymentMethod ||
                    "Not specified";


                const trxId =
                    order.trxId ||
                    "Not required";


                return `
                    <article class="order-card">

                        <div class="order-top">

                            <div>

                                <div class="order-product-name">
                                    ${escapeHtml(
                                        order.productName ||
                                        "Unknown Product"
                                    )}
                                </div>

                                <div class="order-date">
                                    ${date}
                                </div>

                            </div>

                            <span
                                class="order-status ${statusClass}"
                            >
                                ${escapeHtml(status)}
                            </span>

                        </div>


                        <div class="order-details">


                            <div class="order-detail">

                                <span>
                                    Customer
                                </span>

                                <strong>
                                    ${escapeHtml(
                                        order.customerName ||
                                        "N/A"
                                    )}
                                </strong>

                            </div>


                            <div class="order-detail">

                                <span>
                                    Phone
                                </span>

                                <strong>
                                    ${escapeHtml(
                                        order.phone ||
                                        "N/A"
                                    )}
                                </strong>

                            </div>


                            <div class="order-detail">

                                <span>
                                    Address
                                </span>

                                <strong>
                                    ${escapeHtml(
                                        order.address ||
                                        "N/A"
                                    )}
                                </strong>

                            </div>


                            <div class="order-detail">

                                <span>
                                    Product Price
                                </span>

                                <strong>
                                    ৳${formatPrice(price)}
                                </strong>

                            </div>


                            <div class="order-detail">

                                <span>
                                    Payment
                                </span>

                                <strong>
                                    ${escapeHtml(
                                        paymentMethod
                                    )}
                                </strong>

                            </div>


                            <div class="order-detail">

                                <span>
                                    Transaction ID
                                </span>

                                <strong>
                                    ${escapeHtml(trxId)}
                                </strong>

                            </div>


                        </div>


                        ${
                            isConfirmed
                                ? ""
                                : `
                                    <div class="order-actions">

                                        <button
                                            type="button"
                                            class="confirm-button"
                                            data-order-id="${escapeHtml(id)}"
                                        >
                                            Confirm Order
                                        </button>

                                    </div>
                                `
                        }

                    </article>
                `;

            })
            .join("");

}


// ============================================
// ORDER CONFIRM BUTTON
// ============================================

orderList.addEventListener(
    "click",
    async (event) => {

        const button =
            event.target.closest(
                ".confirm-button"
            );


        if (!button) {
            return;
        }


        const orderId =
            button.dataset.orderId;


        if (!orderId) {
            return;
        }


        await confirmOrder(
            orderId,
            button
        );

    }
);


// ============================================
// CONFIRM ORDER
// ============================================

async function confirmOrder(
    orderId,
    button
) {

    const order =
        ordersData[orderId];


    if (!order) {

        alert("Order not found.");

        return;
    }


    if (
        String(order.status).toLowerCase()
        === "confirmed"
    ) {

        return;
    }


    const productId =
        order.productId;


    if (!productId) {

        alert(
            "This order does not have a valid product ID."
        );

        return;
    }


    const product =
        productsData[productId];


    if (!product) {

        alert(
            "The product for this order no longer exists."
        );

        return;
    }


    button.disabled = true;

    button.textContent =
        "Confirming...";


    try {

        const productRef =
            ref(
                db,
                `products/${productId}`
            );


        let stockError = false;


        const transactionResult =
            await runTransaction(
                productRef,
                (currentProduct) => {

                    if (
                        currentProduct === null
                    ) {

                        stockError = true;

                        return;

                    }


                    const currentStock =
                        Number(
                            currentProduct.stock || 0
                        );


                    if (currentStock <= 0) {

                        stockError = true;

                        return;

                    }


                    return {
                        ...currentProduct,
                        stock: currentStock - 1,
                        updatedAt: Date.now()
                    };

                }
            );


        if (
            stockError ||
            !transactionResult.committed
        ) {

            throw new Error(
                "Product is out of stock."
            );

        }


        await update(
            ref(
                db,
                `orders/${orderId}`
            ),
            {
                status: "Confirmed",
                confirmedAt: Date.now()
            }
        );


    } catch (error) {

        console.error(
            "Confirm order error:",
            error
        );


        alert(
            error.message ===
                "Product is out of stock."
                ? "This product is out of stock."
                : "Could not confirm the order. Please try again."
        );


        button.disabled = false;

        button.textContent =
            "Confirm Order";

    }

}


// ============================================
// ORDER STATS
// ============================================

function updateOrderStats() {

    const orderEntries =
        Object.values(ordersData);


    const pendingCount =
        orderEntries.filter((order) => {

            return String(
                order.status || "Pending"
            ).toLowerCase() !== "confirmed";

        }).length;


    pendingOrders.textContent =
        pendingCount;

}


// ============================================
// PRODUCT MESSAGE
// ============================================

function showProductMessage(
    message,
    isError = false
) {

    productMessage.textContent =
        message;


    productMessage.classList.toggle(
        "error",
        isError
    );


    clearTimeout(
        showProductMessage.timer
    );


    showProductMessage.timer =
        setTimeout(() => {

            productMessage.textContent = "";

            productMessage.classList.remove(
                "error"
            );

        }, 4000);

}


// ============================================
// FORMAT PRICE
// ============================================

function formatPrice(value) {

    const number =
        Number(value || 0);


    return number.toLocaleString(
        "en-BD",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    );

}


// ============================================
// FORMAT DATE
// ============================================

function formatDate(timestamp) {

    if (!timestamp) {

        return "Date unavailable";

    }


    const date =
        new Date(Number(timestamp));


    if (Number.isNaN(date.getTime())) {

        return "Date unavailable";

    }


    return date.toLocaleString(
        "en-BD",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );

}


// ============================================
// ESCAPE HTML
// ============================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}