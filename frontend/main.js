console.log("main.js загружен!");
const namesContainer = document.getElementById("names");
const searchInput = document.getElementById("search");
const modal = document.getElementById("detailsModal");
const closeModalButton = document.getElementById("closeModal");
const themeToggle = document.getElementById("themeToggle");
const searchContainer = document.getElementById("searchContainer");

// Элементы для сайдбара (на больших экранах)
const sidebarDetails = document.getElementById("sidebarDetails");
const sidebarArabic = document.getElementById("sidebarArabic");
const sidebarTransliteration = document.getElementById("sidebarTransliteration");
const sidebarTranslation = document.getElementById("sidebarTranslation");
const sidebarTafsir = document.getElementById("sidebarTafsir");

// Элементы для модального окна (на мобильных)
const modalArabic = document.getElementById("modalArabic");
const modalTransliteration = document.getElementById("modalTransliteration");
const modalTranslation = document.getElementById("modalTranslation");
const modalTafsir = document.getElementById("modalTafsir");

// Хранилище для загруженных имен
let allNames = [];

// Загрузка данных с бэкенда
async function fetchNames() {
    try {
    const response = await fetch('/api/v1/names/names');
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Полученные данные:', data);
    
    if (data.response && Array.isArray(data.response)) {
        return data.response.map(item => ({
        arabic: item.Name.name_ar,
        transliteration: item.Name.transliteration,
        translation: item.Name.name_ru,
        tafsir: item.Name.tafsir
        }));
    } else {
        console.error('Неожиданная структура данных:', data);
        throw new Error('Неизвестный формат данных');
    }
    } catch (error) {
    console.error('Ошибка при загрузке имен:', error);
    namesContainer.innerHTML = `
        <div class="col-span-full p-4 text-center">
        <p class="text-red-500">Не удалось загрузить данные. Пожалуйста, попробуйте позже.</p>
        <p class="text-red-500 text-sm mt-2">${error.message}</p>
        <button class="mt-2 px-4 py-2 bg-blue-500 text-white rounded" onclick="loadNames()">
            Попробовать снова
        </button>
        </div>
    `;
    return [];
    }
}

function addTiltEffect(card) {
    card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = -(y - centerY) / 8; // Чем больше делишь, тем меньше угол
        const rotateY = (x - centerX) / 8;
        
        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });

    card.addEventListener("mouseleave", () => {
        card.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
    });

    card.addEventListener("mouseenter", () => {
        card.style.transition = "transform 0.2s ease";
    });
}


function renderNames(filter = "") {
    namesContainer.innerHTML = "";

    const filteredNames = allNames.filter((name) =>
        name.transliteration.toLowerCase().includes(filter.toLowerCase()) ||
        name.translation.toLowerCase().includes(filter.toLowerCase())
    );

    if (filteredNames.length === 0) {
        namesContainer.innerHTML = `
            <div class="col-span-full p-4 text-center">
                <p class="dark:text-gray-300">По запросу "${filter}" ничего не найдено</p>
            </div>
        `;
        return;
    }

    filteredNames.forEach((name) => {
        const card = document.createElement("div");
        card.className =
            "flex flex-col justify-between h-full p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow hover:shadow-md transition text-center card-tilt";

        card.className =
            "flex flex-col justify-between h-full p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow hover:shadow-md transition text-center";

        card.innerHTML = `
            <div class="flex flex-col flex-grow mb-4">
                <div class="text-3xl font-bold text-gray-900 dark:text-white mb-2">${name.arabic}</div>
                <div class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-1">${name.transliteration}</div>
                <div class="text-gray-600 dark:text-gray-400">${name.translation}</div>
            </div>
            <div class="mt-auto">
                <button class="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold py-2 px-4 rounded-md transition-all">
                    Подробнее
                </button>
            </div>
        `;
        

        // Клик на саму карточку
        card.addEventListener("click", (e) => {
            if (!e.target.closest('button')) {
                showDetails(name);
            }
        });

        // Клик именно по кнопке
        card.querySelector("button").addEventListener("click", (e) => {
            e.stopPropagation();
            showDetails(name);
        });

        namesContainer.appendChild(card);
        addTiltEffect(card);
    });
}


function showDetails(name) {
    // Заполняем данные модального окна
    modalArabic.textContent = name.arabic;
    modalTransliteration.textContent = name.transliteration;
    modalTranslation.textContent = name.translation;
    modalTafsir.textContent = name.tafsir;
    
    // Показываем модальное окно
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
    
    // На десктопах также заполняем сайдбар
    if (window.innerWidth >= 1024) {
    sidebarArabic.textContent = name.arabic;
    sidebarTransliteration.textContent = name.transliteration;
    sidebarTranslation.textContent = name.translation;
    sidebarTafsir.textContent = name.tafsir;
    sidebarDetails.classList.remove("hidden");
    }
}

// Закрытие модального окна
closeModalButton.addEventListener("click", closeModal);
modal.addEventListener("click", function(e) {
    if (e.target === modal) {
    closeModal();
    }
});

function closeModal() {
    modal.classList.remove("active");
    document.body.style.overflow = "";
}

// Загрузка данных и отображение
async function loadNames() {
    namesContainer.innerHTML = `
    <div class="loading col-span-full">
        <div class="loading-spinner"></div>
    </div>
    `;
    
    allNames = await fetchNames();
    
    if (allNames.length > 0) {
    renderNames();
    }
}

searchInput.addEventListener("input", (e) => renderNames(e.target.value));

// Запускаем загрузку при открытии страницы
loadNames();

// Проверка текущей темы
if (localStorage.getItem('theme') === 'dark' || 
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add("dark");
    themeToggle.checked = true;
}

// Переключение темы
themeToggle.addEventListener("change", () => {
    document.documentElement.classList.toggle("dark");
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
});

// Обработка изменения размера окна
window.addEventListener("resize", () => {
    if (window.innerWidth >= 1024 && modal.classList.contains("active")) {
    closeModal();
    }
});

// Закрытие модального окна по клавише Escape
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("active")) {
    closeModal();
    }
});