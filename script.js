(() => {
    const Modes = {
        STOPWATCH: "stopwatch",
        TIMER: "timer",
    };

    let currentMode = Modes.STOPWATCH;

    // DOM elements
    const body = document.body;
    const card = document.querySelector(".timer-card");
    const timeDisplay = document.getElementById("time-display");
    const modeButtons = Array.from(
        document.querySelectorAll(".mode-button")
    );
    const primaryBtn = document.getElementById("primary-action-btn");
    const resetBtn = document.getElementById("reset-btn");
    const fullscreenBtn = document.getElementById("fullscreen-btn");

    const minutesInput = document.getElementById("minutes-input");
    const secondsInput = document.getElementById("seconds-input");
    const setTimerBtn = document.getElementById("set-timer-btn");

    // Stopwatch state
    let stopwatchRunning = false;
    let stopwatchStartTime = 0;
    let stopwatchElapsed = 0;
    let stopwatchIntervalId = null;

    // Timer state
    let timerRunning = false;
    let timerDuration = 0; // ms
    let timerRemaining = 0; // ms
    let timerEndTime = 0;
    let timerIntervalId = null;

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
        if (currentMode === Modes.STOPWATCH) {
            primaryBtn.textContent = stopwatchRunning ? "Pause" : "Start";
        } else {
            primaryBtn.textContent = timerRunning ? "Pause" : "Start";
        }
    }

    function clearIntervals() {
        if (stopwatchIntervalId !== null) {
            clearInterval(stopwatchIntervalId);
            stopwatchIntervalId = null;
        }
        if (timerIntervalId !== null) {
            clearInterval(timerIntervalId);
            timerIntervalId = null;
        }
    }

    // ---------- Stopwatch ----------

    function updateStopwatchDisplay(ms) {
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
        if (stopwatchIntervalId !== null) {
            clearInterval(stopwatchIntervalId);
            stopwatchIntervalId = null;
        }
        updateStopwatchDisplay(0);
        updatePrimaryLabel();
    }

    // ---------- Timer ----------

    function updateTimerDisplay(ms) {
        timeDisplay.textContent = formatTimeNoMillis(ms);
    }

    function setTimerFromInputs() {
        const minutes = parseInt(minutesInput.value, 10) || 0;
        const seconds = parseInt(secondsInput.value, 10) || 0;
        const totalMs = (minutes * 60 + seconds) * 1000;

        if (totalMs <= 0) {
            alert("Please set a time greater than zero.");
            return;
        }

        timerDuration = totalMs;
        timerRemaining = totalMs;
        updateTimerDisplay(timerRemaining);
    }

    function startTimer() {
        if (timerRunning) return;

        // If no duration yet, try to read from inputs
        if (timerDuration <= 0 || timerRemaining <= 0) {
            setTimerFromInputs();
            if (timerDuration <= 0) {
                return;
            }
        }

        timerRunning = true;
        timerEndTime = performance.now() + timerRemaining;
        timerIntervalId = setInterval(updateTimer, 80);
        card.classList.remove("finished-flash");
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
            flashFinished();
            updatePrimaryLabel();
            return;
        }

        timerRemaining = remaining;
        updateTimerDisplay(remaining);
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
        card.classList.remove("finished-flash");
        updatePrimaryLabel();
    }

    function flashFinished() {
        card.classList.remove("finished-flash");
        // restart animation
        void card.offsetWidth; // force reflow
        card.classList.add("finished-flash");
    }

    // ---------- Mode switching ----------

    function setMode(newMode) {
        if (newMode === currentMode) return;

        // stop any running measurement
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
                // default 1 minute
                minutesInput.value = "1";
                secondsInput.value = "0";
                setTimerFromInputs();
            } else {
                updateTimerDisplay(
                    timerRemaining > 0 ? timerRemaining : timerDuration
                );
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
            const mode = btn.dataset.mode === "timer" ? Modes.TIMER : Modes.STOPWATCH;
            setMode(mode);
        });
    });

    primaryBtn.addEventListener("click", () => {
        if (currentMode === Modes.STOPWATCH) {
            stopwatchRunning ? pauseStopwatch() : startStopwatch();
        } else {
            timerRunning ? pauseTimer() : startTimer();
        }
    });

    resetBtn.addEventListener("click", () => {
        if (currentMode === Modes.STOPWATCH) {
            resetStopwatch();
        } else {
            resetTimer();
        }
    });

    setTimerBtn.addEventListener("click", () => {
        const wasRunning = timerRunning;
        if (wasRunning) pauseTimer();
        setTimerFromInputs();
    });

    [minutesInput, secondsInput].forEach((input) => {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                setTimerFromInputs();
            }
        });
    });

    // ---------- Keyboard shortcuts ----------

    document.addEventListener("keydown", (e) => {
        const tag = e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;

        if (e.code === "Space") {
            e.preventDefault();
            primaryBtn.click();
        } else if (e.code === "KeyR") {
            e.preventDefault();
            resetBtn.click();
        } else if (e.code === "KeyM") {
            e.preventDefault();
            toggleMode();
        }
    });

    // ---------- Fullscreen ----------

    fullscreenBtn.addEventListener("click", () => {
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
        if (document.fullscreenElement) {
            fullscreenBtn.textContent = "Exit full screen";
        } else {
            fullscreenBtn.textContent = "Full screen";
        }
    });

    // ---------- Init ----------

    updateStopwatchDisplay(0);
    updatePrimaryLabel();
})();
