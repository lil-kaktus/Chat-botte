document.addEventListener("DOMContentLoaded", function () {
    const chatForm = document.getElementById("chat-form");
    const userInput = document.getElementById("user-input");
    const chatMessages = document.getElementById("chat-messages");
    const chatContainer = document.getElementsByClassName('chat-container')

    const OLLAMA_API_URL = "http://localhost:11434/api/chat";
    const username = "Moi"

    let conversationHistory = [];

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
        setTimeout(() => wrapper.scrollIntoView({ behavior: "smooth" }), 600)
    }

    appendMessage("Chat Botté", "Bonjour ! Comment puis-je vous aider aujourd'hui ?")

    chatForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const userMessage = userInput.value.trim();
        if (!userMessage) return;

        appendMessage(username, userMessage);
        userInput.value = "";
        userInput.focus();

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

            appendMessage("Chat Botté", data.message.content);
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
});