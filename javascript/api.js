document.addEventListener("DOMContentLoaded", function () {
    const chatForm = document.getElementById("chat-form");
    const userInput = document.getElementById("user-input");
    const chatMessages = document.getElementById("chat-messages");
    const resetBtn = document.getElementById('resetBtn')
    const nightThemeBtn = document.getElementById('switchThemeBtn')

    const toolbarBtn = document.getElementById('toolbar-btn')
    const mobileToolbarContainer = document.getElementById('mobile-toolbar-container')
    const resetBtnMobile = document.getElementById('resetBtnMobileToolbar')
    const nightThemeBtnMobile = document.getElementById('switchThemeBtnMobileToolbar')

    const messageTimeout = 250

    const OLLAMA_API_URL = "http://localhost:11434/api/chat";
    const username = "Moi"
    const botname = "Chat Botté"

    let conversationHistory = [];

    function loadLocalHistory() {

        const history = localStorage.getItem('conversationHistory')

        if (history) {
            chatMessages.innerHTML = ""

            conversationHistory = JSON.parse(history)

            conversationHistory.forEach((element) => {
                appendMessage(element.role === "user" ? username : botname, element.content)
            })
        }
        else {
            appendMessage(botname, "Bonjour ! Comment puis-je vous aider aujourd'hui ?")
            console.log('unloaded')
        }
    }

    loadLocalHistory()

    function appendMessage(sender, text) {
        const messageElement = document.createElement("div");
        messageElement.className = `message ${sender.toLowerCase()}-message`;

        const date = document.createElement('div')
        date.classList = "messageDate"

        const currDate = new Date()
        const hours = String(currDate.getHours())
        let minutes = String(currDate.getMinutes())

        while (minutes.length < 2) {
            minutes = "0".concat(minutes);
        }

        date.textContent = `à ${hours}h${minutes}`;

        const senderElement = document.createElement("strong");
        senderElement.textContent = sender + ": ";

        const textElement = document.createElement("span");

        const formattedText = formatCodeBlocks(text);
        textElement.innerHTML = formattedText;

        const textElementsContainer = document.createElement('div')
        textElementsContainer.classList = "textElementsContainer"

        textElementsContainer.appendChild(senderElement);
        textElementsContainer.appendChild(textElement);

        messageElement.appendChild(textElementsContainer)

        const tail = document.createElement('img')

        if (sender === username) {
            tail.src = "./assets/images/blue-tail.png"
        }
        else {
            tail.src = "./assets/images/orange-tail.png"
        }

        tail.classList = "textTail"
        messageElement.appendChild(tail)
        messageElement.appendChild(date)

        const wrapper = document.createElement('div')
        wrapper.appendChild(messageElement)

        if (sender === username) {
            wrapper.classList = "userMessage"
        }
        else {
            wrapper.classList = "botMessage"
        }

        chatMessages.appendChild(wrapper);

        setTimeout(() => tail.scrollIntoView({ behavior: "smooth" }), messageTimeout)
    }

    chatForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const userMessage = userInput.value.trim();
        if (!userMessage) return;

        appendMessage(username, userMessage);
        userInput.value = "";
        userInput.focus();

        appendLoader()

        try {
            conversationHistory.push({
                role: "user",
                content: userMessage,
            });

            const messages = [{ role: "system" }, ...conversationHistory];

            const requestData = {
                model: "llama3.2:3b",
                messages: messages,
                stream: false,
            };

            const response = await fetch(OLLAMA_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();

            conversationHistory.push({
                role: "assistant",
                content: data.message.content,
            });

            appendMessage(botname, data.message.content);
            saveToLocal()

        } catch (error) {
            console.error(
                "Erreur lors de la communication avec Ollama:",
                error
            );
            appendMessage(
                "Système",
                "Désolé, une erreur est survenue lors de la communication avec l'IA."
            );
        }
        finally {
            removeLoader()
        }
    });

    function formatCodeBlocks(text) {
        const formattedText = text.replace(
            /```([a-z]*)\n([\s\S]*?)\n```/g,
            function (match, language, code) {
                return `<pre><code class="language-${language}">${escapeHTML(
                    code
                )}</code></pre>`;
            }
        );

        return formattedText.replace(/`([^`]+)`/g, "<code>$1</code>");
    }

    function escapeHTML(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function saveToLocal() {
        localStorage.setItem(
            "conversationHistory",
            JSON.stringify(conversationHistory)
        )
    }

    function resetChat() {
        removeLoader()
        conversationHistory = []
        chatMessages.innerHTML = ""

        userInput.value = ""
        userInput.focus()

        localStorage.removeItem('conversationHistory')

        appendMessage(botname, "Bonjour ! Comment puis-je vous aider aujourd'hui ?")
    }

    if (resetBtn) resetBtn.addEventListener('click', resetChat);
    if (resetBtnMobile) resetBtnMobile.addEventListener('click', () => {resetChat(); hideMobileToolbar()});

    function appendLoader() {
        const loaderWrapper = document.createElement('div')
        loaderWrapper.id = "loading-indicator"

        const loader = document.createElement('div')
        loader.classList.add('spinner')

        loaderWrapper.appendChild(loader)
        chatMessages.appendChild(loaderWrapper)
    }

    function removeLoader() {
        const loaderWrapper = document.querySelector('#loading-indicator')
        if (loaderWrapper) {
            loaderWrapper.classList.add('fadeOutLoader')
            setTimeout(() => chatMessages.removeChild(loaderWrapper), messageTimeout)
        }
    }

    function applyColorMode(mode) {
        document.documentElement.setAttribute("data-theme", mode)
        localStorage.setItem("themePreference", mode)

        const resetImg = document.querySelector('#resetBtn img');
        const resetMobileImg = document.querySelector('#resetBtnMobileToolbar img')

        if (resetImg) {
            if (mode === "light") {
                resetImg.src = "./assets/images/light-reset-btn.png"
                resetMobileImg.src = "./assets/images/light-reset-btn.png"
            }
            else {
                resetImg.src = "./assets/images/reset-btn.png"
                resetMobileImg.src = "./assets/images/reset-btn.png"
            }
        }
    }

    function toggleTheme() {
        const currentTheme = localStorage.getItem('themePreference')
        if (currentTheme === "dark") {
            applyColorMode("light")
        }
        else {
            applyColorMode("dark")
        }
    }
    (function initializeTheme() {
        const savedTheme = localStorage.getItem("themePreference")
        if (savedTheme) {
            applyColorMode(savedTheme)
        }
        else {
            applyColorMode("dark")
        }
    })();

    if (nightThemeBtn) nightThemeBtn.addEventListener('click', toggleTheme)
    if (nightThemeBtnMobile) nightThemeBtnMobile.addEventListener('click', () => { toggleTheme(); hideMobileToolbar() })

    toolbarBtn.addEventListener('click', (e) => {
        mobileToolbarContainer.classList.toggle('hidden-toolbar')
    })

    window.addEventListener("resize", () => {
        const isMobile = window.innerWidth <= 768;
        if (!isMobile) {
            hideMobileToolbar()
        }
    })

    function hideMobileToolbar() {
        mobileToolbarContainer.classList.add('hidden-toolbar');
    }
});