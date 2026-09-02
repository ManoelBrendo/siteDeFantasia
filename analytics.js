(() => {
    const analytics = window.BOSQUE_ANALYTICS || {};

    if (analytics.provider === "ga4" && /^G-[A-Z0-9-]+$/i.test(analytics.id || "")) {
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function () {
            window.dataLayer.push(arguments);
        };
        window.gtag("js", new Date());
        window.gtag("config", analytics.id, { anonymize_ip: true });

        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analytics.id)}`;
        document.head.append(script);
    }

    if (analytics.provider === "plausible" && analytics.domain) {
        window.plausible = window.plausible || function () {
            (window.plausible.q = window.plausible.q || []).push(arguments);
        };
        const script = document.createElement("script");
        script.defer = true;
        script.dataset.domain = analytics.domain;
        script.src = analytics.script || "https://plausible.io/js/script.js";
        document.head.append(script);
    }
})();
