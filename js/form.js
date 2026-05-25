(function () {
  const form = document.getElementById("contactForm");
  const popup = document.getElementById("thankYouPopup");
  const popupText = document.getElementById("thankYouText");
  const closeButton = document.getElementById("thankYouClose");

  if (!form || !popup || !popupText || !closeButton) {
    return;
  }

  const thankYouMessages = {
    vi: "Ch\u00FAng t\u00F4i \u0111\u00E3 nh\u1EADn \u0111\u01B0\u1EE3c th\u00F4ng tin c\u1EE7a b\u1EA1n, c\u1EA3m \u01A1n.",
    en: "We have received your information. Thank you.",
    zh: "\u6211\u4EEC\u5DF2\u6536\u5230\u60A8\u7684\u4FE1\u606F\uFF0C\u611F\u8C22\u60A8\u3002",
    hi: "\u0939\u092E\u0947\u0902 \u0906\u092A\u0915\u0940 \u091C\u093E\u0928\u0915\u093E\u0930\u0940 \u092E\u093F\u0932 \u0917\u0908 \u0939\u0948, \u0927\u0928\u094D\u092F\u0935\u093E\u0926\u0964"
  };

  const getLanguage = () => {
    return localStorage.getItem("l38_lang") || document.documentElement.lang || "vi";
  };

  const getMessageByLanguage = () => {
    const lang = getLanguage();
    return thankYouMessages[lang] || thankYouMessages.vi;
  };

  const openPopup = () => {
    popupText.textContent = getMessageByLanguage();
    popup.classList.add("open");
    popup.setAttribute("aria-hidden", "false");
  };

  const closePopup = () => {
    popup.classList.remove("open");
    popup.setAttribute("aria-hidden", "true");
  };

  closeButton.addEventListener("click", closePopup);

  popup.addEventListener("click", (event) => {
    if (event.target === popup) {
      closePopup();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && popup.classList.contains("open")) {
      closePopup();
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
    }

    const formData = new FormData(form);

    try {
      const response = await fetch("https://formsubmit.co/ajax/vuhang@l38.vn", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Submit failed");
      }

      const data = await response.json();
      if (data && data.success === false) {
        throw new Error("Submit failed");
      }

      form.reset();
      openPopup();
    } catch (error) {
      form.submit();
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
})();
