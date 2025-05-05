// flashcards.js - Модуль для работы с карточками интервального повторения
document.addEventListener('DOMContentLoaded', () => {
    const initBtn = document.getElementById('initLearning');
    if (initBtn) {
      initBtn.addEventListener('click', startLearning);
    } else {
      console.error('Кнопка initLearning не найдена');
    }
  
    function startLearning() {
      console.log('Начинаем обучение');
      // Здесь твоя логика старта
    }
// DOM элементы
const learningModeSelect = document.getElementById("learningMode");
const flashcard = document.getElementById("flashcard");
const showAnswerBtn = document.getElementById("showAnswer");
const startLearningPrompt = document.getElementById("startLearningPrompt");
const initLearningBtn = document.getElementById("initLearning");
const ratingContainer = document.getElementById("ratingContainer");
const flashcardControls = document.getElementById("flashcardControls");
const finishLearningBtn = document.getElementById("finishLearning");
const nextCardBtn = document.getElementById("nextCard");
const flashcardMessage = document.getElementById("flashcardMessage");
const flashcardMessageText = document.getElementById("flashcardMessageText");
const learningStats = document.getElementById("learningStats");
const statTotal = document.getElementById("statTotal");
const statLearned = document.getElementById("statLearned");
const statDueToday = document.getElementById("statDueToday");
const cardFrontType = document.getElementById("cardFrontType");
const cardFrontContent = document.getElementById("cardFrontContent");
const cardBackType = document.getElementById("cardBackType");
const cardBackContent = document.getElementById("cardBackContent");
const cardInner = document.querySelector(".card-inner");

// Состояние приложения
let currentMode = "transcription_to_translation";
let currentCards = [];
let currentCardIndex = 0;
let userID = 1; // В идеале это должно приходить из системы авторизации

// Базовый URL API
const API_BASE_URL = '/api/v1';

// Выбор режима обучения
learningModeSelect.addEventListener("change", function() {
    currentMode = this.value;
});

// Инициализация обучения
initLearningBtn.addEventListener("click", async () => {
    startLearningPrompt.classList.add("hidden");
    showLoadingState("Инициализация обучения...");
    
    try {
        // Инициализируем карточки для текущего режима
        await initializeLearning();
        
        // Загружаем статистику
        await loadLearningStats();
        
        // Загружаем карточки для изучения
        await loadDueCards();
        
        // Показываем статистику
        learningStats.classList.remove("hidden");
        
        if (currentCards.length > 0) {
            // Показываем первую карточку
            showCard(currentCards[0]);
        } else {
            showCompletionMessage();
        }
    } catch (error) {
        showErrorMessage(error.message || "Произошла ошибка при инициализации обучения");
    }
});

// Показать/скрыть ответ
showAnswerBtn.addEventListener("click", () => {
    // Переворачиваем карточку
    cardInner.classList.add("flipped");
    
    // Скрываем кнопку "Показать ответ"
    showAnswerBtn.classList.add("hidden");
    
    // Показываем кнопки оценки
    ratingContainer.classList.remove("hidden");
    
    // Показываем кнопки управления
    flashcardControls.classList.remove("hidden");
});

// Обработка нажатия на кнопки оценки
document.querySelectorAll(".rating-btn").forEach(button => {
    button.addEventListener("click", async function() {
        const quality = parseInt(this.dataset.quality);
        
        // Отключаем кнопки на время обработки
        toggleRatingButtons(false);
        
        try {
            // Сохраняем результат оценки на сервере
            const result = await reviewCard(currentCards[currentCardIndex].id, quality);
            
            // Обновляем локальную статистику после успешной оценки
            // Увеличиваем число изученных карточек, если карточка считается изученной
            // (обычно при оценке 3 и выше карточка считается изученной)
            if (quality >= 3) {
                const learnedCount = parseInt(statLearned.textContent) || 0;
                statLearned.textContent = learnedCount + 1;
            }
            
            // Уменьшаем счетчик карточек на сегодня
            const dueToday = parseInt(statDueToday.textContent) || 0;
            if (dueToday > 0) {
                statDueToday.textContent = dueToday - 1;
            }
            
            // Показываем кнопку "Следующая карточка"
            nextCardBtn.classList.remove("hidden");
            
            // Показываем сообщение в зависимости от оценки
            if (quality >= 4) {
                showSuccessMessage("Отлично! Вы хорошо знаете это имя.");
            } else if (quality >= 2) {
                showWarningMessage("Неплохо! Продолжайте практиковаться.");
            } else {
                showErrorMessage("Не беспокойтесь, вы повторите это имя снова.");
            }
            
            // Активируем кнопки оценки снова, чтобы они были доступны для следующей карточки
            toggleRatingButtons(true);
        } catch (error) {
            showErrorMessage(`Ошибка при сохранении оценки: ${error.message || "Неизвестная ошибка"}`);
            toggleRatingButtons(true);
        }
    });
});

// Следующая карточка
nextCardBtn.addEventListener("click", () => {
    // Переходим к следующей карточке
    currentCardIndex++;
    
    // Скрываем сообщение
    flashcardMessage.classList.add("hidden");
    
    // Скрываем кнопку "Следующая карточка"
    nextCardBtn.classList.add("hidden");
    
    // Сбрасываем состояние кнопок оценки (на всякий случай)
    toggleRatingButtons(true);
    
    if (currentCardIndex < currentCards.length) {
        // Показываем следующую карточку
        showCard(currentCards[currentCardIndex]);
    } else {
        showCompletionMessage();
    }
});

// Завершение обучения
finishLearningBtn.addEventListener("click", () => {
    // Перенаправляем пользователя на главную страницу
    window.location.href = "index.html";
});

// Функции
function resetFlashcardInterface() {
    // Показываем стартовый экран
    startLearningPrompt.classList.remove("hidden");
    
    // Скрываем все остальные элементы
    flashcard.classList.add("hidden");
    ratingContainer.classList.add("hidden");
    flashcardControls.classList.add("hidden");
    nextCardBtn.classList.add("hidden");
    flashcardMessage.classList.add("hidden");
    learningStats.classList.add("hidden");
    
    // Сбрасываем поворот карточки
    cardInner.classList.remove("flipped");
    
    // Показываем кнопку "Показать ответ"
    showAnswerBtn.classList.remove("hidden");
}

function resetFlashcardState() {
    currentCards = [];
    currentCardIndex = 0;
}

function showCard(card) {
    // Сбрасываем поворот карточки
    cardInner.classList.remove("flipped");
    
    // Показываем карточку
    flashcard.classList.remove("hidden");
    
    // Показываем кнопку "Показать ответ"
    showAnswerBtn.classList.remove("hidden");
    
    // Скрываем кнопки оценки
    ratingContainer.classList.add("hidden");
    
    // Скрываем кнопки управления (кроме кнопки "Завершить")
    flashcardControls.classList.remove("hidden");
    nextCardBtn.classList.add("hidden");
    
    // Убедимся, что кнопки оценки активны для следующей карточки
    toggleRatingButtons(true);
    
    // Заполняем содержимое карточки в зависимости от режима
    switch (currentMode) {
        case "transcription_to_translation":
            cardFrontType.textContent = "Транскрипция";
            cardFrontContent.textContent = card.transcription;
            cardBackType.textContent = "Перевод";
            cardBackContent.textContent = card.name_ru;
            break;
        case "translation_to_transcription":
            cardFrontType.textContent = "Перевод";
            cardFrontContent.textContent = card.name_ru;
            cardBackType.textContent = "Транскрипция";
            cardBackContent.textContent = card.transcription;
            break;
        case "arabic_to_translation":
            cardFrontType.textContent = "Арабское написание";
            cardFrontContent.textContent = card.name_ar;
            cardBackType.textContent = "Перевод";
            cardBackContent.textContent = card.name_ru;
            break;
        case "translation_to_arabic":
            cardFrontType.textContent = "Перевод";
            cardFrontContent.textContent = card.name_ru;
            cardBackType.textContent = "Арабское написание";
            cardBackContent.textContent = card.name_ar;
            break;
    }
}

function showLoadingState(message = "Загрузка...") {
    flashcard.classList.add("hidden");
    ratingContainer.classList.add("hidden");
    flashcardControls.classList.add("hidden");
    
    flashcardMessage.classList.remove("hidden");
    flashcardMessage.className = "w-full p-4 rounded-lg mb-6";
    flashcardMessageText.innerHTML = `
        <div class="text-center">
            <div class="loading-spinner mb-4"></div>
            <p>${message}</p>
        </div>
    `;
}

function showSuccessMessage(message) {
    flashcardMessage.classList.remove("hidden");
    flashcardMessage.className = "w-full p-4 rounded-lg mb-6 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100";
    flashcardMessageText.textContent = message;
}

function showWarningMessage(message) {
    flashcardMessage.classList.remove("hidden");
    flashcardMessage.className = "w-full p-4 rounded-lg mb-6 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100";
    flashcardMessageText.textContent = message;
}

function showErrorMessage(message) {
    flashcardMessage.classList.remove("hidden");
    flashcardMessage.className = "w-full p-4 rounded-lg mb-6 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100";
    flashcardMessageText.textContent = message;
}

function showCompletionMessage() {
    flashcard.classList.add("hidden");
    ratingContainer.classList.add("hidden");
    nextCardBtn.classList.add("hidden");
    
    showSuccessMessage("Поздравляем! Вы завершили изучение на сегодня.");
    flashcardControls.classList.remove("hidden");
    
    // После завершения обучения, обновим статистику еще раз
    // чтобы убедиться, что все данные актуальны
    loadLearningStats().catch(error => {
        console.error("Ошибка при обновлении статистики:", error);
    });
}

function toggleRatingButtons(enabled) {
    document.querySelectorAll(".rating-btn").forEach(button => {
        button.disabled = !enabled;
        if (!enabled) {
            button.classList.add("opacity-50", "cursor-not-allowed");
        } else {
            button.classList.remove("opacity-50", "cursor-not-allowed");
        }
    });
}

// API функции для работы с бэкендом

/**
 * Инициализирует карточки для изучения в текущем режиме
 */
async function initializeLearning() {
    try {
        const response = await fetch(`${API_BASE_URL}/flashcards/initialize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json' // Явно указываем, что ожидаем JSON
            },
            body: JSON.stringify({
                user_id: userID,
                mode: currentMode
            })
        });

        const data = await response.text(); // Сначала читаем как текст
        if (!response.ok) {
            // Пытаемся распарсить как JSON, если не получится - вернем текст
            try {
                const errorData = JSON.parse(data);
                throw new Error(errorData.detail || 'Ошибка при инициализации карточек');
            } catch {
                throw new Error(data || 'Ошибка при инициализации карточек');
            }
        }

        return JSON.parse(data);
    } catch (error) {
        console.error('Ошибка при инициализации карточек:', error);
        throw new Error('Не удалось инициализировать карточки для изучения');
    }
}

/**
 * Загружает статистику изучения для текущего пользователя
 */
async function loadLearningStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/flashcards/stats?user_id=${userID}&mode=${currentMode}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Ошибка при загрузке статистики');
        }

        const stats = await response.json();
        
        // Обновляем статистику на странице
        statTotal.textContent = stats.total || 0;
        statLearned.textContent = stats.learned || 0;
        statDueToday.textContent = stats.due_today || 0;

        // Проверяем, если все карточки на сегодня изучены, но пользователь еще не завершил сессию
        if (stats.due_today === 0 && currentCards && currentCardIndex >= currentCards.length) {
            showCompletionMessage();
        }

        return stats;
    } catch (error) {
        console.error('Ошибка при загрузке статистики:', error);
        throw new Error('Не удалось загрузить статистику обучения');
    }
}

/**
 * Загружает карточки для изучения на сегодня
 */
async function loadDueCards() {
    try {
        const response = await fetch(`${API_BASE_URL}/flashcards/due?user_id=${userID}&mode=${currentMode}&limit=5`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Ошибка при загрузке карточек');
        }

        currentCards = await response.json();
        currentCardIndex = 0;

        return currentCards;
    } catch (error) {
        console.error('Ошибка при загрузке карточек:', error);
        throw new Error('Не удалось загрузить карточки для изучения');
    }
}

/**
 * Отправляет оценку карточки на сервер
 * @param {number} nameId - ID имени Аллаха
 * @param {number} quality - оценка от 0 до 5
 */
async function reviewCard(nameId, quality) {
    try {
        const response = await fetch(`${API_BASE_URL}/flashcards/review`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userID,
                name_id: nameId,
                mode: currentMode,
                quality: quality
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Ошибка при сохранении оценки');
        }

        return await response.json();
    } catch (error) {
        console.error('Ошибка при сохранении оценки:', error);
        throw new Error('Не удалось сохранить оценку карточки');
    }
}
});