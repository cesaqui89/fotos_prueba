let config = null;

let gameStarted = false;

let startTime = 0;

let timerInterval = null;

let foundDifferences = new Set();

let hintsRemaining = 0;

let hintTimeout = null;

let bgMusic = null;

let audioToggleBtn = null;


/*
=========================================================
INICIALIZACIÓN
=========================================================
*/

document.addEventListener("DOMContentLoaded", async () => {

    try {

        const response = await fetch("game.json");

        if (!response.ok) {
            throw new Error("No se pudo cargar game.json");
        }

        config = await response.json();

        initializeGame();

    } catch (error) {

        console.error(error);

        alert(
            "No fue posible cargar la configuración del juego."
        );
    }

});


/*
=========================================================
CONFIGURACIÓN INICIAL
=========================================================
*/

function initializeGame() {

    const game = config.game;

    document.getElementById("gameTitle")
        .textContent = game.title;

    document.getElementById("gameSubtitle")
        .textContent = game.subtitle;

    document.getElementById("differenceCounter")
        .textContent =
            `0 / ${game.totalDifferences}`;

    hintsRemaining = game.allowHints
        ? game.maxHints
        : 0;

    updateHintCounter();

    document
        .getElementById("startButton")
        .addEventListener(
            "click",
            startGame
        );

    document
        .getElementById("restartButton")
        .addEventListener(
            "click",
            restartGame
        );

    document
        .getElementById("hintButton")
        .addEventListener(
            "click",
            useHint
        );

    document
        .getElementById("gameImage")
        .addEventListener(
            "click",
            handleImageClick
        );

    bgMusic = document.getElementById("bgMusic");
    audioToggleBtn = document.getElementById("audioToggle");

    bgMusic.volume = 0.3;

    audioToggleBtn.addEventListener(
        "click",
        toggleAudio
    );

}


/*
=========================================================
INICIAR
=========================================================
*/

function startGame() {

    document
        .getElementById("startModal")
        .classList.remove("visible");

    resetGame();

    gameStarted = true;

    startTime = performance.now();

    timerInterval = setInterval(
        updateTimer,
        10
    );

    bgMusic.play().catch(() => {});

}


/*
=========================================================
ALTERNAR AUDIO
=========================================================
*/

function toggleAudio() {

    if (bgMusic.paused) {

        bgMusic.play().catch(() => {});

        audioToggleBtn.textContent = "🔊";

        audioToggleBtn.classList.remove("muted");

    } else {

        bgMusic.pause();

        audioToggleBtn.textContent = "🔇";

        audioToggleBtn.classList.add("muted");

    }

}


/*
=========================================================
REINICIAR
=========================================================
*/

function restartGame() {

    document
        .getElementById("finishModal")
        .classList.remove("visible");

    resetGame();

    gameStarted = true;

    startTime = performance.now();

    timerInterval = setInterval(
        updateTimer,
        10
    );

    if (bgMusic.paused) {

        bgMusic.play().catch(() => {});

        audioToggleBtn.textContent = "🔊";

        audioToggleBtn.classList.remove("muted");

    }

}


/*
=========================================================
RESET
=========================================================
*/

function resetGame() {

    clearInterval(timerInterval);

    clearTimeout(hintTimeout);

    foundDifferences.clear();

    hintsRemaining =
        config.game.allowHints
            ? config.game.maxHints
            : 0;

    document
        .getElementById("markersLayer")
        .innerHTML = "";

    document
        .getElementById("differenceCounter")
        .textContent =
            `0 / ${config.game.totalDifferences}`;

    document
        .getElementById("timer")
        .textContent = "00.00";

    updateHintCounter();

    document
        .getElementById("hintButton")
        .disabled =
            hintsRemaining <= 0;

}


/*
=========================================================
CRONÓMETRO
=========================================================
*/

function updateTimer() {

    if (!gameStarted) {
        return;
    }

    const elapsed =
        (performance.now() - startTime) / 1000;

    document
        .getElementById("timer")
        .textContent =
            elapsed.toFixed(2);
}


/*
=========================================================
CLICK EN LA IMAGEN
=========================================================
*/

function handleImageClick(event) {

    if (!gameStarted) {
        return;
    }

    const image =
        document.getElementById("gameImage");

    const rect =
        image.getBoundingClientRect();


    /*
        Coordenadas del click dentro de la imagen
    */

    const clickX =
        event.clientX - rect.left;

    const clickY =
        event.clientY - rect.top;


    /*
        Buscar si el click está cerca
        de alguna diferencia.
    */

    for (const difference of config.differences) {

        if (
            foundDifferences.has(
                difference.id
            )
        ) {
            continue;
        }


        const position =
            relativeToPixels(
                difference,
                rect.width,
                rect.height
            );


        const distance =
            calculateDistance(
                clickX,
                clickY,
                position.x,
                position.y
            );


        if (
            distance <=
            config.game.tolerancePx
        ) {

            registerDifference(
                difference,
                position,
                rect
            );

            break;
        }

    }

}


/*
=========================================================
CONVERTIR COORDENADAS 0-10 A PIXELES
=========================================================
*/

function relativeToPixels(
    difference,
    width,
    height
) {

    /*
        X:

        0 = izquierda
        10 = derecha
    */

    const x =
        (difference.x / 10) *
        width;


    /*
        Y:

        Nuestro sistema:

        0 = abajo
        10 = arriba

        HTML:

        0 = arriba
        height = abajo

        Por eso invertimos Y.
    */

    const y =
        height -
        ((difference.y / 10) *
        height);


    return {
        x,
        y
    };

}


/*
=========================================================
DISTANCIA ENTRE DOS PUNTOS
=========================================================
*/

function calculateDistance(
    x1,
    y1,
    x2,
    y2
) {

    const dx = x1 - x2;

    const dy = y1 - y2;

    return Math.sqrt(
        dx * dx +
        dy * dy
    );

}


/*
=========================================================
REGISTRAR DIFERENCIA
=========================================================
*/

function registerDifference(
    difference,
    position,
    rect
) {

    foundDifferences.add(
        difference.id
    );


    createMarker(
        position.x,
        position.y,
        rect
    );


    updateCounter();


    if (
        foundDifferences.size ===
        config.game.totalDifferences
    ) {

        finishGame();

    }

}


/*
=========================================================
CREAR MARCADOR
=========================================================
*/

function createMarker(
    x,
    y,
    rect
) {

    const marker =
        document.createElement("div");

    marker.className =
        "difference-marker";


    const markerSize =
        config.game.markerSizePx;


    marker.style.setProperty(
        "--marker-size",
        `${markerSize}px`
    );


    /*
        Posición relativa.
    */

    const percentageX =
        (x / rect.width) * 100;

    const percentageY =
        (y / rect.height) * 100;


    marker.style.left =
        `${percentageX}%`;

    marker.style.top =
        `${percentageY}%`;


    document
        .getElementById("markersLayer")
        .appendChild(marker);

}


/*
=========================================================
ACTUALIZAR CONTADOR
=========================================================
*/

function updateCounter() {

    document
        .getElementById("differenceCounter")
        .textContent =
            `${foundDifferences.size} / ${config.game.totalDifferences}`;

}


/*
=========================================================
PISTAS
=========================================================
*/

function useHint() {

    if (
        !gameStarted ||
        hintsRemaining <= 0
    ) {
        return;
    }


    /*
        Obtener diferencias todavía
        no encontradas.
    */

    const available =
        config.differences.filter(
            difference =>
                !foundDifferences.has(
                    difference.id
                )
        );


    if (available.length === 0) {
        return;
    }


    /*
        Elegir una diferencia aleatoriamente.
    */

    const randomIndex =
        Math.floor(
            Math.random() *
            available.length
        );


    const difference =
        available[randomIndex];


    const image =
        document.getElementById(
            "gameImage"
        );

    const rect =
        image.getBoundingClientRect();


    const position =
        relativeToPixels(
            difference,
            rect.width,
            rect.height
        );


    showHint(
        position,
        rect
    );


    hintsRemaining--;

    updateHintCounter();

}


/*
=========================================================
MOSTRAR PISTA
=========================================================
*/

function showHint(
    position,
    rect
) {

    clearTimeout(hintTimeout);


    /*
        Crear marcador temporal.
    */

    const marker =
        document.createElement("div");

    marker.className =
        "difference-marker";


    const markerSize =
        config.game.markerSizePx;


    marker.style.setProperty(
        "--marker-size",
        `${markerSize}px`
    );


    marker.style.left =
        `${(position.x / rect.width) * 100}%`;

    marker.style.top =
        `${(position.y / rect.height) * 100}%`;


    /*
        Diferenciar visualmente
        una pista de una diferencia
        encontrada.
    */

    marker.style.opacity = "0.45";


    document
        .getElementById("markersLayer")
        .appendChild(marker);


    hintTimeout = setTimeout(
        () => {

            marker.remove();

        },
        config.game.hintDurationMs
    );

}


/*
=========================================================
ACTUALIZAR CONTADOR DE PISTAS
=========================================================
*/

function updateHintCounter() {

    document
        .getElementById("hintCounter")
        .textContent =
            hintsRemaining;


    document
        .getElementById("hintButton")
        .disabled =
            hintsRemaining <= 0;

}


/*
=========================================================
FINALIZAR
=========================================================
*/

function finishGame() {

    gameStarted = false;

    clearInterval(timerInterval);

    const elapsed =
        (performance.now() - startTime) /
        1000;


    const formattedTime =
        elapsed.toFixed(2);


    document
        .getElementById("timer")
        .textContent =
            formattedTime;


    document
        .getElementById("finalTime")
        .textContent =
            formattedTime;


    document
        .getElementById("completionMessage")
        .textContent =
            `He logrado encontrar las ${
                config.game.totalDifferences
            } diferencias en un total de ${
                formattedTime
            } segundos. ${
                config.game.completionMessage
            }`;


    document
        .getElementById("finishModal")
        .classList.add("visible");

}