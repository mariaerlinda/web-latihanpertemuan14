const simCanvas = document.getElementById('simCanvas');
const simCtx = simCanvas.getContext('2d');
const networkCanvas = document.getElementById('networkCanvas');
const networkCtx = networkCanvas.getContext('2d');
const graphCanvas = document.getElementById('graphCanvas');

// Set sizes based on container
function resizeCanvases() {
    simCanvas.width = simCanvas.parentElement.clientWidth;
    simCanvas.height = simCanvas.parentElement.clientHeight;
    
    networkCanvas.width = networkCanvas.parentElement.clientWidth;
    networkCanvas.height = networkCanvas.parentElement.clientHeight;
    
    // Graph canvas handled partly by Chart.js but good to set initial
}
window.addEventListener('resize', resizeCanvases);


let env;
let population;
let animationId;
let isPaused = true;
let isDrawing = false;
let simulationSpeed = 1;

let fitnessChart;

function init() {
    resizeCanvases();
    
    env = new Environment(simCanvas.width, simCanvas.height);
    population = new Population(100, env); // 100 drones

    initChart();

    updateUI();
    
    // Auto-start for preview
    isPaused = false;
    animate();
}

function initChart() {
    const ctx = graphCanvas.getContext('2d');
    fitnessChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [1],
            datasets: [{
                label: 'Best Fitness',
                data: [0],
                borderColor: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#94a3b8' }
                }
            },
            plugins: {
                legend: { labels: { color: '#f8fafc' } }
            }
        }
    });
}

function updateChart() {
    fitnessChart.data.labels = Array.from({length: population.generation}, (_, i) => i + 1);
    fitnessChart.data.datasets[0].data = population.fitnessHistory.concat([population.bestFitness]);
    fitnessChart.update();
}

function animate() {
    if (!isPaused) {
        for (let s = 0; s < simulationSpeed; s++) {
            let allDead = population.update();
            
            if (allDead) {
                population.nextGeneration();
                updateChart();
                updateUI();
            }
        }
    }

    simCtx.clearRect(0, 0, simCanvas.width, simCanvas.height);
    env.draw(simCtx);
    population.draw(simCtx);

    networkCtx.clearRect(0, 0, networkCanvas.width, networkCanvas.height);
    if (population.bestDrone) {
        Visualizer.drawNetwork(networkCtx, population.bestDrone.brain);
    }
    
    // Update live counts if not doing fast simulation loops
    if (simulationSpeed === 1) {
        updateUI();
    }

    animationId = requestAnimationFrame(animate);
}

function updateUI() {
    document.getElementById('gen-counter').innerText = `Gen: ${population.generation}`;
    document.getElementById('alive-counter').innerText = `Alive: ${population.getAliveCount()}`;
}

// UI Controls
document.getElementById('btn-play').addEventListener('click', () => { isPaused = false; });
document.getElementById('btn-pause').addEventListener('click', () => { isPaused = true; });

const btnDraw = document.getElementById('btn-draw');
btnDraw.addEventListener('click', () => {
    isDrawing = !isDrawing;
    btnDraw.classList.toggle('active');
    simCanvas.style.cursor = isDrawing ? 'crosshair' : 'default';
});

document.getElementById('btn-clear-obs').addEventListener('click', () => {
    env.clearObstacles();
});

const speedSlider = document.getElementById('speed-slider');
const speedVal = document.getElementById('speed-val');
speedSlider.addEventListener('input', (e) => {
    simulationSpeed = parseInt(e.target.value);
    speedVal.innerText = `${simulationSpeed}x`;
});

// Mouse drawing logic
simCanvas.addEventListener('mousedown', (e) => {
    if (!isDrawing) return;
    const rect = simCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    env.startDrawingObstacle(x, y);
});

simCanvas.addEventListener('mousemove', (e) => {
    if (!isDrawing || !env.drawingObstacle) return;
    const rect = simCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Prevent adding points too close to each other
    let lastPoint = env.drawingObstacle[env.drawingObstacle.length - 1];
    if (Vector.dist({x, y}, lastPoint) > 10) {
        env.addPointToObstacle(x, y);
    }
});

simCanvas.addEventListener('mouseup', () => {
    if (!isDrawing || !env.drawingObstacle) return;
    env.finishDrawingObstacle();
});

simCanvas.addEventListener('mouseleave', () => {
    if (env.drawingObstacle) {
        env.finishDrawingObstacle();
    }
});

// Save / Load logic (using localStorage for simplicity)
document.getElementById('btn-save').addEventListener('click', () => {
    if (population.bestDrone) {
        localStorage.setItem('bestBrain', JSON.stringify(population.bestDrone.brain));
        alert('Best brain saved to local storage!');
    }
});

document.getElementById('btn-load').addEventListener('click', () => {
    const saved = localStorage.getItem('bestBrain');
    if (saved) {
        const brainData = JSON.parse(saved);
        // Apply to whole population
        population.drones.forEach(d => {
            d.brain = JSON.parse(JSON.stringify(brainData)); // Deep copy
        });
        alert('Brain loaded into current population!');
    } else {
        alert('No saved brain found.');
    }
});

// Start
window.onload = init;
