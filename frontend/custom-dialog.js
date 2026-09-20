/**
 * Uchala Dumbell Gym - Custom Centered Modal Dialogs
 * Replaces native browser alert() and confirm() with styled center popups.
 */

(function () {
    // 1. Inject Styles
    const styleId = "gym-custom-dialog-styles";
    if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
            .gym-dialog-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(5, 7, 12, 0.85);
                backdrop-filter: blur(6px);
                -webkit-backdrop-filter: blur(6px);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999999;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.25s ease, visibility 0.25s ease;
            }
            .gym-dialog-overlay.active {
                opacity: 1;
                visibility: visible;
            }
            .gym-dialog-box {
                background: #121620;
                border: 1px solid #283046;
                border-top: 3px solid #f39c12;
                border-radius: 12px;
                padding: 28px 24px 24px;
                width: 90%;
                max-width: 440px;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(243, 156, 18, 0.15);
                transform: scale(0.85) translateY(15px);
                transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                box-sizing: border-box;
                font-family: Arial, sans-serif;
            }
            .gym-dialog-overlay.active .gym-dialog-box {
                transform: scale(1) translateY(0);
            }
            .gym-dialog-icon {
                font-size: 38px;
                margin-bottom: 12px;
                display: inline-block;
                line-height: 1;
            }
            .gym-dialog-title {
                color: #ffffff;
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 8px;
                letter-spacing: 0.5px;
            }
            .gym-dialog-message {
                color: #cbd5e1;
                font-size: 14px;
                line-height: 1.6;
                margin-bottom: 24px;
                word-break: break-word;
                white-space: pre-line;
            }
            .gym-dialog-actions {
                display: flex;
                justify-content: center;
                gap: 12px;
            }
            .gym-btn {
                padding: 10px 22px;
                border-radius: 6px;
                font-size: 13px;
                font-weight: bold;
                cursor: pointer;
                border: none;
                transition: all 0.2s;
                min-width: 100px;
                outline: none;
            }
            .gym-btn-primary {
                background: #f39c12;
                color: #000000;
            }
            .gym-btn-primary:hover {
                background: #e67e22;
                transform: translateY(-1px);
            }
            .gym-btn-danger {
                background: #ef4444;
                color: #ffffff;
            }
            .gym-btn-danger:hover {
                background: #dc2626;
                transform: translateY(-1px);
            }
            .gym-btn-secondary {
                background: #1e2536;
                color: #94a3b8;
                border: 1px solid #283046;
            }
            .gym-btn-secondary:hover {
                background: #283046;
                color: #ffffff;
            }
        `;
        document.head.appendChild(style);
    }

    // 2. DOM Elements
    let overlay = null;
    let box = null;
    let iconEl = null;
    let titleEl = null;
    let msgEl = null;
    let actionsEl = null;

    function createModalDOM() {
        if (overlay) return;
        overlay = document.createElement("div");
        overlay.className = "gym-dialog-overlay";
        overlay.innerHTML = `
            <div class="gym-dialog-box">
                <div class="gym-dialog-icon" id="gymDialogIcon">🏋️</div>
                <div class="gym-dialog-title" id="gymDialogTitle">UCHALA DUMBELL GYM</div>
                <div class="gym-dialog-message" id="gymDialogMsg"></div>
                <div class="gym-dialog-actions" id="gymDialogActions"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        box = overlay.querySelector(".gym-dialog-box");
        iconEl = document.getElementById("gymDialogIcon");
        titleEl = document.getElementById("gymDialogTitle");
        msgEl = document.getElementById("gymDialogMsg");
        actionsEl = document.getElementById("gymDialogActions");
    }

    // 3. Custom Alert (Single OK button)
    window.customAlert = function (message, title = "Uchala Dumbell Gym", type = "info") {
        return new Promise((resolve) => {
            createModalDOM();

            let icon = "🏋️";
            const lowerType = String(type).toLowerCase();
            const lowerMsg = String(message).toLowerCase();

            if (lowerType === "success" || lowerMsg.includes("success") || lowerMsg.includes("saved") || lowerMsg.includes("updated") || lowerMsg.includes("recorded")) {
                icon = "✅";
                box.style.borderTopColor = "#2ecc71";
            } else if (lowerType === "error" || lowerType === "danger" || lowerMsg.includes("error") || lowerMsg.includes("failed") || lowerMsg.includes("restricted") || lowerMsg.includes("invalid")) {
                icon = "❌";
                box.style.borderTopColor = "#ef4444";
            } else if (lowerType === "warning" || lowerMsg.includes("warning") || lowerMsg.includes("due")) {
                icon = "⚠️";
                box.style.borderTopColor = "#f39c12";
            } else {
                icon = "🏋️";
                box.style.borderTopColor = "#f39c12";
            }

            iconEl.textContent = icon;
            titleEl.textContent = title;
            msgEl.textContent = message || "";

            actionsEl.innerHTML = `<button type="button" class="gym-btn gym-btn-primary" id="gymDialogOkBtn">Got it</button>`;

            overlay.classList.add("active");

            const okBtn = document.getElementById("gymDialogOkBtn");
            okBtn.focus();

            function closeAlert() {
                overlay.classList.remove("active");
                resolve(true);
            }

            okBtn.onclick = closeAlert;
            overlay.onclick = function (e) {
                if (e.target === overlay) closeAlert();
            };
        });
    };

    // 4. Custom Confirm (2 Options: Confirm & Cancel)
    window.customConfirm = function (message, title = "Please Confirm", confirmText = "Yes, Proceed", cancelText = "Cancel", isDanger = true) {
        return new Promise((resolve) => {
            createModalDOM();

            iconEl.textContent = isDanger ? "⚠️" : "❓";
            box.style.borderTopColor = isDanger ? "#ef4444" : "#f39c12";
            titleEl.textContent = title;
            msgEl.textContent = message || "Are you sure you want to proceed?";

            actionsEl.innerHTML = `
                <button type="button" class="gym-btn gym-btn-secondary" id="gymDialogCancelBtn">${cancelText}</button>
                <button type="button" class="gym-btn ${isDanger ? 'gym-btn-danger' : 'gym-btn-primary'}" id="gymDialogConfirmBtn">${confirmText}</button>
            `;

            overlay.classList.add("active");

            const confirmBtn = document.getElementById("gymDialogConfirmBtn");
            const cancelBtn = document.getElementById("gymDialogCancelBtn");
            confirmBtn.focus();

            function cleanup(result) {
                overlay.classList.remove("active");
                resolve(result);
            }

            confirmBtn.onclick = () => cleanup(true);
            cancelBtn.onclick = () => cleanup(false);
            overlay.onclick = function (e) {
                if (e.target === overlay) cleanup(false);
            };
        });
    };

    // 5. Global Alert Override (so any default alert(...) shows our custom center popup)
    window.alert = function (msg) {
        return window.customAlert(msg);
    };

    // Ensure DOM is ready if script loads early
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", createModalDOM);
    } else {
        createModalDOM();
    }
})();
