(() => {
    const Modes = {
        STOPWATCH: "stopwatch",
        TIMER: "timer",
    };

    const supportedLangs = ["en", "cs", "sk", "de"];

    const translations = {
        en: {
            "app-title": "Minimal Timer",
            "stopwatch-label": "Stopwatch",
            "timer-label": "Timer",
            "hours-label": "Hours",
            "minutes-label": "Minutes",
            "seconds-label": "Seconds",
            "set-time": "Set time",
            start: "Start",
            pause: "Pause",
            reset: "Reset",
            lap: "Lap",
            "laps-title": "Laps",
            "laps-clear": "Clear",
            "hint":
                "Space – start / pause · R – reset · M – switch mode",
            "presets-label": "Quick start:",
            "minus-minute": "− 1 min",
            "plus-minute": "+ 1 min",
            "fullscreen-enter": "Full screen",
            "fullscreen-exit": "Exit full screen",
            "about-link": "About",
        },
        cs: {
            "app-title": "Minimal Timer",
            "stopwatch-label": "Stopky",
            "timer-label": "Časovač",
            "hours-label": "Hodiny",
            "minutes-label": "Minuty",
            "seconds-label": "Sekundy",
            "set-time": "Nastavit čas",
            start: "Start",
            pause: "Pauza",
            reset: "Reset",
            lap: "Mezičas",
            "laps-title": "Mezičasy",
            "laps-clear": "Smazat",
            "hint":
                "Mezerník – start / pauza · R – reset · M – přepnout režim",
            "presets-label": "Rychlý start:",
            "minus-minute": "− 1 min",
            "plus-minute": "+ 1 min",
            "fullscreen-enter": "Celá obrazovka",
            "fullscreen-exit": "Zavřít celou obrazovku",
            "about-link": "O aplikaci",
        },
        sk: {
            "app-title": "Minimal Timer",
            "stopwatch-label": "Stopky",
            "timer-label": "Časovač",
            "hours-label": "Hodiny",
            "minutes-label": "Minúty",
            "seconds-label": "Sekundy",
            "set-time": "Nastaviť čas",
            start: "Štart",
            pause: "Pauza",
            reset: "Reset",
            lap: "Kolo",
            "laps-title": "Kolá",
            "laps-clear": "Vymazať",
            "hint":
                "Medzerník – štart / pauza · R – reset · M – prepnúť režim",
            "presets-label": "Rýchly štart:",
            "minus-minute": "− 1 min",
            "plus-minute": "+ 1 min",
            "fullscreen-enter": "Celá obrazovka",
            "fullscreen-exit": "Zavrieť celú obrazovku",
            "about-link": "O aplikácii",
        },
        de: {
            "app-title": "Minimal Timer",
            "stopwatch-label": "Stoppuhr",
            "timer-label": "Timer",
            "hours-label": "Stunden",
            "minutes-label": "Minuten",
            "seconds-label": "Sekunden",
            "set-time": "Zeit setzen",
            start: "Start",
            pause: "Pause",
            reset: "Zurücksetzen",
            lap: "Runde",
            "laps-title": "Runden",
            "laps-clear": "Löschen",
            "hint":
                "Leertaste – Start / Pause · R – Reset · M – Modus wechseln",
            "presets-label": "Schnellstart:",
            "minus-minute": "− 1 Min",
            "plus-minute": "+ 1 Min",
            "fullscreen-enter": "Vollbild",
            "fullscreen-exit": "Vollbild verlassen",
            "about-link": "Info",
        },
    };

    const body = document.body;
    const card = document.querySelector(".timer-card");
    const timeDisplay = document.getElementById("time-display");
    const modeButtons = Array.from(
        document.querySelectorAll(".mode-button")
    );
    const primaryBtn = document.getElementById("primary-action-btn");
    const resetBtn = document.getElementById("reset-btn");
    const lapBtn = document.getElementById("lap-btn");
    const fullscreenBtn = document.getElementById("fullscreen-btn");
    const langSelect = document.getElementById("language-select");

    const hoursInput = document.getElementById("hours-input");
    const minutesInput = document.getElementById("minutes-input");
    const secondsInput = document.getElementById("seconds-input");
    const setTimerBtn = document.getElementById("set-timer-btn");

    const presetsContainer = document.getElementById("timer-presets");
    const presetButtons = presetsContainer
        ? Array.from(
              presetsContainer.querySelectorAll("[data-preset-mins]")
          )
        : [];

    const minusMinuteBtn = document.getElementById("minus-minute-btn");
    const plusMinuteBtn = document.getElementById("plus-minute-btn");

    const lapsContainer = document.getElementById("laps-container");
    const lapsList = document.getElementById("laps-list");
    const clearLapsBtn = document.getElementById("clear-laps-btn");

    let currentMode = Modes.STOPWATCH;
    let currentLang = "en";

    // Stopwatch state
    let stopwatchRunning = false;
    let stopwatchStartTime = 0;
    let stopwatchElapsed = 0;
    let stopwatchIntervalId = null;

    // Laps
    let laps = [];
    let lastLapElapsed = 0;

    // Timer state
    let timerRunning = false;
    let timerDuration = 0; // ms
    let timerRemaining = 0; // ms
    let timerEndTime = 0;
    let timerIntervalId = null;

    // ---------- i18n helpers ----------

    function detectInitialLang() {
        const stored = localStorage.getItem("mt-lang");
        if (stored && supportedLangs.includes(stored)) {
            return stored;
        }
        if (navigator.language) {
            const code = navigator.language.slice(0, 2).toLowerCase();
            if (supportedLangs.includes(code)) {
                return code;
            }
        }
        return "en";
    }

    function t(key) {
        const dict = translations[currentLang] || translations.en;
        return dict[key] || translations.en[key] || key;
    }

    function applyLanguage() {
        const dict = translations[currentLang] || translations.en;
        document.documentElement.lang = currentLang;
        body.dataset.lang = currentLang;

        document
            .querySelectorAll("[data-i18n]")
            .forEach((el) => {
                const key = el.dataset.i18n;
                const value = dict[key];
                if (!value) return;
                el.textContent = value;
            });

        // Dynamic labels
        updatePrimaryLabel();

        // Fullscreen button text according to state
        if (fullscreenBtn) {
            if (document.fullscreenElement) {
                fullscreenBtn.textContent = t("fullscreen-exit");
            } else {
                fullscreenBtn.textContent = t("fullscreen-enter");
            }
        }

        // Preset buttons
        presetButtons.forEach((btn) => {
            const mins = parseInt(
                btn.dataset.presetMins,
                10
            );
            if (!Number.isFinite(mins)) return;
            if (currentLang === "de") {
                btn.textContent = `${mins} Min`;
            } else {
                btn.textContent = `${mins} min`;
            }
        });

        // plus/minus buttons
        if (minusMinuteBtn) {
            minusMinuteBtn.textContent = t("minus-minute");
        }
        if (plusMinuteBtn) {
            plusMinuteBtn.textContent = t("plus-minute");
        }

        if (langSelect) {
            langSelect.value = currentLang;
        }
    }

    function setLanguage(lang) {
        if (!supportedLangs.includes(lang)) {
            lang = "en";
        }
        currentLang = lang;
        localStorage.setItem("mt-lang", lang);
        applyLanguage();
    }

    // ---------- Helpers ----------

    function pad2(num) {
        return String(num).padStart(2, "0");
    }

    function formatTimeWithMillis(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const tenths = Math.floor((ms % 1000) / 10);

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${pad2(hours)}:${pad2(minutes)}:${pad2(
                seconds
            )}.${pad2(tenths)}`;
        }
        return `${pad2(minutes)}:${pad2(seconds)}.${pad2(tenths)}`;
    }

    function formatTimeNoMillis(ms) {
        const totalSeconds = Math.max(0, Math.round(ms / 1000));
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
        }
        return `${pad2(minutes)}:${pad2(seconds)}`;
    }

    function updatePrimaryLabel() {
        if (!primaryBtn) return;
        const labelKey =
            (currentMode === Modes.STOPWATCH && stopwatchRunning) ||
            (currentMode === Modes.TIMER && timerRunning)
                ? "pause"
                : "start";
        primaryBtn.textContent = t(labelKey);
    }

    function updateTimerProgress() {
        if (!timeDisplay) return;
        if (timerDuration <= 0) {
            timeDisplay.style.setProperty("--progress-angle", "360deg");
            return;
        }

        const base = timerRunning
            ? timerRemaining
            : timerRemaining > 0
            ? timerRemaining
            : timerDuration;

        const fraction = Math.max(
            0,
            Math.min(1, base / timerDuration)
        );
        const angle = fraction * 360;
        timeDisplay.style.setProperty(
            "--progress-angle",
            `${angle}deg`
        );
    }

    // ---------- Stopwatch ----------

    function updateStopwatchDisplay(ms) {
        if (!timeDisplay) return;
        timeDisplay.textContent = formatTimeWithMillis(ms);
    }

    function startStopwatch() {
        if (stopwatchRunning) return;
        stopwatchRunning = true;
        stopwatchStartTime = performance.now();
        stopwatchIntervalId = setInterval(updateStopwatch, 50);
        updatePrimaryLabel();
    }

    function updateStopwatch() {
        if (!stopwatchRunning) return;
        const now = performance.now();
        const elapsed = stopwatchElapsed + (now - stopwatchStartTime);
        updateStopwatchDisplay(elapsed);
    }

    function pauseStopwatch() {
        if (!stopwatchRunning) return;
        const now = performance.now();
        stopwatchElapsed += now - stopwatchStartTime;
        stopwatchRunning = false;
        if (stopwatchIntervalId !== null) {
            clearInterval(stopwatchIntervalId);
            stopwatchIntervalId = null;
        }
        updateStopwatchDisplay(stopwatchElapsed);
        updatePrimaryLabel();
    }

    function resetStopwatch() {
        stopwatchRunning = false;
        stopwatchElapsed = 0;
        lastLapElapsed = 0;
        laps = [];
        if (stopwatchIntervalId !== null) {
            clearInterval(stopwatchIntervalId);
            stopwatchIntervalId = null;
        }
        updateStopwatchDisplay(0);
        renderLaps();
        updatePrimaryLabel();
    }

    function addLap() {
        if (!lapsList) return;
        if (!stopwatchRunning && stopwatchElapsed === 0) return;

        const now = performance.now();
        const elapsedTotal = stopwatchRunning
            ? stopwatchElapsed + (now - stopwatchStartTime)
            : stopwatchElapsed;

        const lapTime = elapsedTotal - lastLapElapsed;
        lastLapElapsed = elapsedTotal;

        laps.push({
            index: laps.length + 1,
            lapTime,
            totalTime: elapsedTotal,
        });

        renderLaps();
    }

    function renderLaps() {
        if (!lapsList) return;
        lapsList.innerHTML = "";
        laps.forEach((lap) => {
            const li = document.createElement("li");
            const labelSpan = document.createElement("span");
            labelSpan.className = "lap-label";
            labelSpan.textContent = `${lap.index}. ${formatTimeWithMillis(
                lap.lapTime
            )}`;

            const totalSpan = document.createElement("span");
            totalSpan.className = "lap-time-total";
            totalSpan.textContent = formatTimeWithMillis(lap.totalTime);

            li.appendChild(labelSpan);
            li.appendChild(totalSpan);
            lapsList.appendChild(li);
        });
    }

    // ---------- Timer ----------

    function updateTimerDisplay(ms) {
        if (!timeDisplay) return;
        timeDisplay.textContent = formatTimeNoMillis(ms);
    }

    function getMsFromInputs() {
        const hours = parseInt(hoursInput?.value ?? "0", 10) || 0;
        const minutes = parseInt(minutesInput?.value ?? "0", 10) || 0;
        const seconds = parseInt(secondsInput?.value ?? "0", 10) || 0;
        return (hours * 3600 + minutes * 60 + seconds) * 1000;
    }

    function setInputsFromMs(totalMs) {
        const totalSeconds = Math.max(0, Math.round(totalMs / 1000));
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hoursInput) hoursInput.value = hours.toString();
        if (minutesInput) minutesInput.value = minutes.toString();
        if (secondsInput) secondsInput.value = seconds.toString();
    }

    function setTimerFromInputs() {
        const totalMs = getMsFromInputs();

        if (totalMs <= 0) {
            alert(
                currentLang === "cs"
                    ? "Zadej čas větší než nula."
                    : currentLang === "sk"
                    ? "Zadajte čas väčší ako nula."
                    : currentLang === "de"
                    ? "Bitte eine Zeit größer als Null eingeben."
                    : "Please set a time greater than zero."
            );
            return;
        }

        timerDuration = totalMs;
        timerRemaining = totalMs;
        updateTimerDisplay(timerRemaining);
        updateTimerProgress();
    }

    function startTimer() {
        if (timerRunning) return;

        if (timerDuration <= 0 || timerRemaining <= 0) {
            setTimerFromInputs();
            if (timerDuration <= 0) {
                return;
            }
        }

        timerRunning = true;
        timerEndTime = performance.now() + timerRemaining;
        timerIntervalId = setInterval(updateTimer, 80);
        card?.classList.remove("finished-flash");
        updatePrimaryLabel();
    }

    function updateTimer() {
        if (!timerRunning) return;
        const now = performance.now();
        let remaining = timerEndTime - now;

        if (remaining <= 0) {
            remaining = 0;
            timerRunning = false;
            timerRemaining = 0;
            if (timerIntervalId !== null) {
                clearInterval(timerIntervalId);
                timerIntervalId = null;
            }
            updateTimerDisplay(remaining);
            updateTimerProgress();
            flashFinished();
            updatePrimaryLabel();
            return;
        }

        timerRemaining = remaining;
        updateTimerDisplay(remaining);
        updateTimerProgress();
    }

    function pauseTimer() {
        if (!timerRunning) return;
        const now = performance.now();
        timerRemaining = Math.max(0, timerEndTime - now);
        timerRunning = false;
        if (timerIntervalId !== null) {
            clearInterval(timerIntervalId);
            timerIntervalId = null;
        }
        updateTimerDisplay(timerRemaining);
        updateTimerProgress();
        updatePrimaryLabel();
    }

    function resetTimer() {
        timerRunning = false;
        if (timerIntervalId !== null) {
            clearInterval(timerIntervalId);
            timerIntervalId = null;
        }
        timerRemaining = timerDuration;
        if (timerDuration > 0) {
            updateTimerDisplay(timerRemaining);
        } else {
            updateTimerDisplay(0);
        }
        card?.classList.remove("finished-flash");
        updateTimerProgress();
        updatePrimaryLabel();
    }

    function flashFinished() {
        if (!card) return;
        card.classList.remove("finished-flash");
        void card.offsetWidth; // force reflow
        card.classList.add("finished-flash");
    }

    function adjustTimerMinutes(deltaMinutes) {
        const deltaMs = deltaMinutes * 60_000;

        if (timerRunning) {
            const now = performance.now();
            timerRemaining = Math.max(0, timerEndTime - now);
        } else if (timerDuration === 0 && timerRemaining === 0) {
            const fromInputs = getMsFromInputs();
            timerDuration = fromInputs;
            timerRemaining = fromInputs;
        }

        let baseMs = timerRemaining > 0 ? timerRemaining : timerDuration;
        let newMs = baseMs + deltaMs;
        if (newMs < 0) newMs = 0;

        timerDuration = newMs;
        timerRemaining = newMs;

        if (timerRunning) {
            timerEndTime = performance.now() + timerRemaining;
        }

        setInputsFromMs(newMs);
        updateTimerDisplay(newMs);
        updateTimerProgress();
        updatePrimaryLabel();
    }

    function startPresetTimer(minutes) {
        if (!Number.isFinite(minutes) || minutes <= 0) return;

        const totalMs = minutes * 60 * 1000;

        if (timerRunning) {
            pauseTimer();
        }

        timerDuration = totalMs;
        timerRemaining = totalMs;
        setInputsFromMs(totalMs);
        updateTimerDisplay(totalMs);
        updateTimerProgress();
        startTimer();
    }

    // ---------- Mode switching ----------

    function setMode(newMode) {
        if (newMode === currentMode) return;

        if (currentMode === Modes.STOPWATCH) {
            pauseStopwatch();
        } else {
            pauseTimer();
        }

        currentMode = newMode;

        body.classList.toggle("mode-stopwatch", currentMode === Modes.STOPWATCH);
        body.classList.toggle("mode-timer", currentMode === Modes.TIMER);

        modeButtons.forEach((btn) => {
            const isActive = btn.dataset.mode === currentMode;
            btn.classList.toggle("active", isActive);
            btn.setAttribute("aria-selected", String(isActive));
        });

        if (currentMode === Modes.STOPWATCH) {
            updateStopwatchDisplay(stopwatchElapsed);
        } else {
            if (timerDuration === 0) {
                if (minutesInput) minutesInput.value = "1";
                if (secondsInput) secondsInput.value = "0";
                if (hoursInput) hoursInput.value = "0";
                setTimerFromInputs();
            } else {
                const toShow =
                    timerRemaining > 0 ? timerRemaining : timerDuration;
                setInputsFromMs(toShow);
                updateTimerDisplay(toShow);
                updateTimerProgress();
            }
        }

        updatePrimaryLabel();
    }

    function toggleMode() {
        const next =
            currentMode === Modes.STOPWATCH ? Modes.TIMER : Modes.STOPWATCH;
        setMode(next);
    }

    // ---------- Controls wiring ----------

    modeButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const mode =
                btn.dataset.mode === "timer"
                    ? Modes.TIMER
                    : Modes.STOPWATCH;
            setMode(mode);
        });
    });

    primaryBtn?.addEventListener("click", () => {
        if (currentMode === Modes.STOPWATCH) {
            stopwatchRunning ? pauseStopwatch() : startStopwatch();
        } else {
            timerRunning ? pauseTimer() : startTimer();
        }
    });

    resetBtn?.addEventListener("click", () => {
        if (currentMode === Modes.STOPWATCH) {
            resetStopwatch();
        } else {
            resetTimer();
        }
    });

    lapBtn?.addEventListener("click", () => {
        if (currentMode === Modes.STOPWATCH) {
            addLap();
        }
    });

    clearLapsBtn?.addEventListener("click", () => {
        laps = [];
        lastLapElapsed = stopwatchElapsed;
        renderLaps();
    });

    setTimerBtn?.addEventListener("click", () => {
        const wasRunning = timerRunning;
        if (wasRunning) pauseTimer();
        setTimerFromInputs();
    });

    [hoursInput, minutesInput, secondsInput].forEach((input) => {
        input?.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                setTimerFromInputs();
            }
        });
    });

    // Presets
    presetButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const mins = parseInt(
                btn.dataset.presetMins,
                10
            );
            if (!Number.isFinite(mins)) return;
            setMode(Modes.TIMER);
            startPresetTimer(mins);
        });
    });

    minusMinuteBtn?.addEventListener("click", () => {
        setMode(Modes.TIMER);
        adjustTimerMinutes(-1);
    });

    plusMinuteBtn?.addEventListener("click", () => {
        setMode(Modes.TIMER);
        adjustTimerMinutes(1);
    });

    // ---------- Keyboard shortcuts ----------

    document.addEventListener("keydown", (e) => {
        const tag = e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

        if (e.code === "Space") {
            e.preventDefault();
            primaryBtn?.click();
        } else if (e.code === "KeyR") {
            e.preventDefault();
            resetBtn?.click();
        } else if (e.code === "KeyM") {
            e.preventDefault();
            toggleMode();
        }
    });

    // ---------- Fullscreen ----------

    fullscreenBtn?.addEventListener("click", () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {
                /* ignore */
            });
        } else {
            document.exitFullscreen().catch(() => {
                /* ignore */
            });
        }
    });

    document.addEventListener("fullscreenchange", () => {
        if (!fullscreenBtn) return;
        if (document.fullscreenElement) {
            fullscreenBtn.textContent = t("fullscreen-exit");
        } else {
            fullscreenBtn.textContent = t("fullscreen-enter");
        }
    });

    // ---------- Language select ----------

    langSelect?.addEventListener("change", () => {
        const val = langSelect.value;
        setLanguage(val);
    });

    // ---------- Init ----------

    currentLang = detectInitialLang();
    setLanguage(currentLang);

    updateStopwatchDisplay(0);
    updateTimerProgress();
    updatePrimaryLabel();
})();
