document.addEventListener('DOMContentLoaded', () => {
    const initElements = () => {
      const elements = {
        learningModeSelect: document.getElementById("learningMode"),
        learningModeTitle: document.getElementById("learningModeTitle"),
        cardsLimitSelect: document.getElementById("cardsLimit"),
        cardsLimitTitle: document.getElementById("cardsLimitTitle"),
        flashcard: document.getElementById("flashcard"),
        showAnswerBtn: document.getElementById("showAnswer"),
        startLearningPrompt: document.getElementById("startLearningPrompt"),
        initLearningBtn: document.getElementById("initLearning"),
        ratingContainer: document.getElementById("ratingContainer"),
        flashcardControls: document.getElementById("flashcardControls"),
        finishLearningBtn: document.getElementById("finishLearning"),
        nextCardBtn: document.getElementById("nextCard"),
        flashcardMessage: document.getElementById("flashcardMessage"),
        flashcardMessageText: document.getElementById("flashcardMessageText"),
        learningStats: document.getElementById("learningStats"),
        statTotal: document.getElementById("statTotal"),
        statLearned: document.getElementById("statLearned"),
        statDueToday: document.getElementById("statDueToday"),
        cardFrontType: document.getElementById("cardFrontType"),
        cardFrontContent: document.getElementById("cardFrontContent"),
        cardBackType: document.getElementById("cardBackType"),
        cardBackContent: document.getElementById("cardBackContent"),
        cardInner: document.querySelector(".card-inner"),
        
      };
  
      const missingElements = Object.entries(elements)
        .filter(([key, element]) => !element)
        .map(([key]) => key);
  
      if (missingElements.length > 0) {
        console.error(`Не найдены следующие элементы: ${missingElements.join(', ')}`);
        return null;
      }
  
      return elements;
    };
  
    const DOM = initElements();
    if (!DOM) return;
  
    const state = {
      currentMode: "transcription_to_translation",
      currentCards: [],
      currentCardIndex: 0,
      userID: 3 // TODO: брать id из авторизации
    };
  
    const API_BASE_URL = '/api/v1';
  
    const api = {
      /**
       * Выполняет запрос к API с обработкой ошибок
       * @param {string} url - URL конечной точки
       * @param {Object} options - Опции запроса
       * @returns {Promise} - Ответ от API
       */
      async request(url, options = {}) {
        try {
          const response = await fetch(url, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              ...(options.headers || {})
            }
          });
  
          const data = await response.json();
  
          if (!response.ok) {
            throw new Error(data.detail || 'Произошла ошибка при выполнении запроса');
          }
  
          return data;
        } catch (error) {
          console.error(`Ошибка API (${url}):`, error);
          throw error;
        }
      },
  
      /**
       * Инициализирует карточки для изучения в текущем режиме
       */
      async initializeLearning() {
        return api.request(`${API_BASE_URL}/flashcards/initialize`, {
          method: 'POST',
          body: JSON.stringify({
            user_id: state.userID,
            mode: state.currentMode
          })
        });
      },
  
      /**
       * Загружает статистику изучения для текущего пользователя
       */
      async loadLearningStats() {
        return api.request(`${API_BASE_URL}/flashcards/stats?user_id=${state.userID}&mode=${state.currentMode}`);
      },
  
      /**
       * Загружает карточки для изучения на сегодня
       */
      async loadDueCards() {
        const cards = await api.request(
            `${API_BASE_URL}/flashcards/due?user_id=${state.userID}&mode=${state.currentMode}&limit=${DOM.cardsLimitSelect.value}`
        );
        console.log(`Вот значение селектора: -- ${DOM.cardsLimitSelect.value}`)
        state.currentCards = cards;
        state.currentCardIndex = 0;
        return cards;
      },
  
      /**
       * Отправляет оценку карточки на сервер
       * @param {number} nameId - ID имени Аллаха
       * @param {number} quality - оценка от 0 до 5
       */
      async reviewCard(nameId, quality) {
        return api.request(`${API_BASE_URL}/flashcards/review`, {
          method: 'POST',
          body: JSON.stringify({
            user_id: state.userID,
            name_id: nameId,
            mode: state.currentMode,
            quality: quality
          })
        });
      }
    };
  
    // Объект для работы с интерфейсом
    const ui = {
      /**
       * Показывает сообщение определенного типа
       * @param {string} message - Текст сообщения
       * @param {string} type - Тип сообщения ('success', 'warning', 'error', 'loading')
       */
      showMessage(message, type = 'info') {
        DOM.flashcardMessage.classList.remove("hidden");
        
        // Сбрасываем все классы перед установкой новых
        DOM.flashcardMessage.className = "w-full p-4 rounded-lg mb-6";
        
        // Добавляем классы в зависимости от типа сообщения
        switch (type) {
          case 'success':
            DOM.flashcardMessage.classList.add("bg-green-100", "dark:bg-green-900", "text-green-800", "dark:text-green-100");
            DOM.flashcardMessageText.textContent = message;
            break;
          case 'warning':
            DOM.flashcardMessage.classList.add("bg-yellow-100", "dark:bg-yellow-900", "text-yellow-800", "dark:text-yellow-100");
            DOM.flashcardMessageText.textContent = message;
            break;
          case 'error':
            DOM.flashcardMessage.classList.add("bg-red-100", "dark:bg-red-900", "text-red-800", "dark:text-red-100");
            DOM.flashcardMessageText.textContent = message;
            break;
          case 'loading':
            DOM.flashcardMessageText.innerHTML = `
              <div class="text-center">
                  <div class="loading-spinner mb-4"></div>
                  <p>${message}</p>
              </div>
            `;
            break;
          default:
            DOM.flashcardMessageText.textContent = message;
        }
      },
      
      showSuccessMessage(message) {
        this.showMessage(message, 'success');
      },
      
      showWarningMessage(message) {
        this.showMessage(message, 'warning');
      },
      
      showErrorMessage(message) {
        this.showMessage(message, 'error');
      },
      
      showLoadingState(message = "Загрузка...") {
        DOM.flashcard.classList.add("hidden");
        DOM.ratingContainer.classList.add("hidden");
        DOM.flashcardControls.classList.add("hidden");
        
        this.showMessage(message, 'loading');
      },
  
      /**
       * Показывает карточку
       * @param {Object} card - Данные карточки
       */
      showCard(card) {
        // Сбрасываем поворот карточки
        DOM.cardInner.classList.remove("flipped");
        
        // Показываем карточку
        DOM.flashcard.classList.remove("hidden");
        
        // Показываем кнопку "Показать ответ"
        DOM.showAnswerBtn.classList.remove("hidden");
        
        // Скрываем кнопки оценки
        DOM.ratingContainer.classList.add("hidden");
        
        // Скрываем кнопки управления (кроме кнопки "Завершить")
        DOM.flashcardControls.classList.remove("hidden");
        DOM.nextCardBtn.classList.add("hidden");
        
        this.toggleRatingButtons(true);
        
        // Заполняем содержимое карточки в зависимости от режима
        const contentMap = {
          "transcription_to_translation": {
            front: { type: "Транскрипция", content: card.transcription },
            back: { type: "Перевод", content: card.name_ru }
          },
          "translation_to_transcription": {
            front: { type: "Перевод", content: card.name_ru },
            back: { type: "Транскрипция", content: card.transcription }
          },
          "arabic_to_translation": {
            front: { type: "Арабское написание", content: card.name_ar },
            back: { type: "Перевод", content: card.name_ru }
          },
          "translation_to_arabic": {
            front: { type: "Перевод", content: card.name_ru },
            back: { type: "Арабское написание", content: card.name_ar }
          }
        };
        
        const cardContent = contentMap[state.currentMode] || contentMap["transcription_to_translation"];
        
        DOM.cardFrontType.textContent = cardContent.front.type;
        DOM.cardFrontContent.textContent = cardContent.front.content;
        DOM.cardBackType.textContent = cardContent.back.type;
        DOM.cardBackContent.textContent = cardContent.back.content;
      },
  
      /**
       * Показывает сообщение о завершении обучения
       */
      showCompletionMessage() {
        DOM.flashcard.classList.add("hidden");
        DOM.ratingContainer.classList.add("hidden");
        DOM.nextCardBtn.classList.add("hidden");
        
        this.showSuccessMessage("Поздравляем! Вы завершили изучение на сегодня.");
        DOM.flashcardControls.classList.remove("hidden");
        
        // После завершения обучения, обновим статистику
        api.loadLearningStats()
          .then(stats => this.updateStats(stats))
          .catch(error => {
            console.error("Ошибка при обновлении статистики:", error);
          });
      },
  
      /**
       * Обновляет статистику на странице
       * @param {Object} stats - Объект со статистикой
       */
      updateStats(stats) {
        DOM.statTotal.textContent = stats.due_today || 0;
        DOM.statLearned.textContent = stats.learned || 0;
        DOM.statDueToday.textContent = DOM.cardsLimitSelect.value || 0;
      },
  
      /**
       * Сбрасывает интерфейс флеш-карточек в исходное состояние
       */
      resetFlashcardInterface() {
        // Показываем стартовый экран
        DOM.startLearningPrompt.classList.remove("hidden");
        
        // Скрываем все остальные элементы
        DOM.flashcard.classList.add("hidden");
        DOM.ratingContainer.classList.add("hidden");
        DOM.flashcardControls.classList.add("hidden");
        DOM.nextCardBtn.classList.add("hidden");
        DOM.flashcardMessage.classList.add("hidden");
        DOM.learningStats.classList.add("hidden");
        
        // Сбрасываем поворот карточки
        DOM.cardInner.classList.remove("flipped");
        
        // Показываем кнопку "Показать ответ"
        DOM.showAnswerBtn.classList.remove("hidden");
      },
  
      /**
       * Включает/выключает кнопки оценки
       * @param {boolean} enabled - true для включения, false для выключения
       */
      toggleRatingButtons(enabled) {
        document.querySelectorAll(".rating-btn").forEach(button => {
          button.disabled = !enabled;
          if (!enabled) {
            button.classList.add("opacity-50", "cursor-not-allowed");
          } else {
            button.classList.remove("opacity-50", "cursor-not-allowed");
          }
        });
      }
    };
  
    // Контроллер для связи модели данных и представления
    const controller = {
        /**
         * Инициализирует обучение
        */
       async initLearning() {
        try {
            ui.showLoadingState("Инициализация обучения...");
            
            await api.initializeLearning();
          
            const stats = await api.loadLearningStats();
            ui.updateStats(stats);
          
            const cards = await api.loadDueCards();

            DOM.flashcardMessage.classList.add("hidden");

            DOM.cardsLimitSelect.classList.add("hidden");
            DOM.learningModeSelect.classList.add("hidden");
            DOM.learningModeTitle.classList.add("hidden");
            DOM.cardsLimitTitle.classList.add("hidden");
          
            DOM.learningStats.classList.remove("hidden");
          
            if (cards.length > 0) {
                ui.showCard(cards[0]);
            } else {
                ui.showCompletionMessage();
            }
            } catch (error) {
            ui.showErrorMessage(error.message || "Произошла ошибка при инициализации обучения");
            }
        },
  
      /**
       * Обрабатывает нажатие на кнопку оценки
       * @param {number} quality - Оценка от 0 до 5
       */
      async handleRating(quality) {
        // Отключаем кнопки на время обработки
        ui.toggleRatingButtons(false);
        
        try {
          // Сохраняем результат оценки на сервере
          const result = await api.reviewCard(state.currentCards[state.currentCardIndex].id, quality);
          
          // Уменьшаем счетчик общего колличества карточек
          const dueToday = parseInt(DOM.statDueToday.textContent)
          if (dueToday > 0) {
            DOM.statDueToday.textContent = dueToday - 1;
          }
          

          // Уменьшаем счетчик карточек  на сегодня
          const dueTotal = parseInt(DOM.statTotal.textContent) || 0;
          if (dueTotal > 0) {
            DOM.statTotal.textContent = dueTotal - 1;
          }
          
          // Показываем кнопку "Следующая карточка"
          DOM.nextCardBtn.classList.remove("hidden");
          
          // Показываем сообщение в зависимости от оценки
          if (quality >= 4) {
            ui.showSuccessMessage("Отлично! Вы хорошо знаете это имя.");
          } else if (quality >= 2) {
            ui.showWarningMessage("Неплохо! Продолжайте практиковаться.");
          } else {
            ui.showErrorMessage("Не беспокойтесь, вы повторите это имя снова.");
          }

        } catch (error) {
          ui.showErrorMessage(`Ошибка при сохранении оценки: ${error.message || "Неизвестная ошибка"}`);
          ui.toggleRatingButtons(true);
        }
      },
  
      /**
       * Переходит к следующей карточке
       */
      showNextCard() {
        // Переходим к следующей карточке
        state.currentCardIndex++;
        
        DOM.flashcardMessage.classList.add("hidden");
        
        DOM.nextCardBtn.classList.add("hidden");
        
        ui.toggleRatingButtons(true);
        
        if (state.currentCardIndex < state.currentCards.length) {
          ui.showCard(state.currentCards[state.currentCardIndex]);
        } else {
          ui.showCompletionMessage();
        }
      },
  
      /**
       * Завершает обучение
       */
      finishLearning() {
        // Перенаправляем пользователя на главную страницу
        window.location.href = "index.html";
      }
    };
  
    // Инициализация обработчиков событий
    function initEventListeners() {
      DOM.learningModeSelect.addEventListener("change", function() {
        state.currentMode = this.value;
      });
  
      // Инициализация обучения
      DOM.initLearningBtn.addEventListener("click", () => {
        DOM.startLearningPrompt.classList.add("hidden");
        controller.initLearning();
      });
  
      // Показать/скрыть ответ
      DOM.showAnswerBtn.addEventListener("click", () => {
        DOM.cardInner.classList.add("flipped");
        
        DOM.showAnswerBtn.classList.add("hidden");
        
        DOM.ratingContainer.classList.remove("hidden");
        
        DOM.flashcardControls.classList.remove("hidden");
      });
  
      // Обработка нажатия на кнопки оценки
        document.querySelectorAll(".rating-btn").forEach(button => {
            button.addEventListener(
            "click",
            function (e) {
                const quality = +e.currentTarget.dataset.quality;
                ui.toggleRatingButtons(false);      // ← сразу блокируем
                controller.handleRating(quality);   // асинхронная логика
                DOM.ratingContainer.classList.add("hidden") // Скрываем кнопки оценки
            });
        });
  
      // Следующая карточка
      DOM.nextCardBtn.addEventListener("click", controller.showNextCard);
  
      // Завершение обучения
      DOM.finishLearningBtn.addEventListener("click", controller.finishLearning);
    }
  
    // Запускаем инициализацию обработчиков событий
    initEventListeners();
  });