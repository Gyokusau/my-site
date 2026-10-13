document.addEventListener("DOMContentLoaded", function () {
    const content = document.querySelector(".post-content");

    if (!content) {
        return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "writing-mode-toggle";

    // 每篇文章单独保存阅读模式
    const storageKey = "writingMode:" + window.location.pathname;
    // Storage may be unavailable in private or restricted browser sessions.
    function readMode() {
        try { return localStorage.getItem(storageKey); }
        catch (_) { return null; }
    }

    function setWritingMode(vertical, save = true) {
        content.classList.toggle("vertical-writing", vertical);

        if (vertical) {
            button.textContent = "横書き";
            button.setAttribute("aria-pressed", "true");
        } else {
            button.textContent = "縦書き";
            button.setAttribute("aria-pressed", "false");
        }

        if (save) {
            try { localStorage.setItem(
                storageKey,
                vertical ? "vertical" : "horizontal"
            ); } catch (_) { /* Keep the button usable without storage. */ }
        }
    }

    const savedMode = readMode();

    if (savedMode === "vertical" || savedMode === "horizontal") {
        setWritingMode(savedMode === "vertical", false);
    } else {
        setWritingMode(window.pageDefaultVertical === true, false);
    }

    button.addEventListener("click", function () {
        const vertical =
            !content.classList.contains("vertical-writing");

        setWritingMode(vertical);
    });

    content.parentNode.insertBefore(button, content);
});
