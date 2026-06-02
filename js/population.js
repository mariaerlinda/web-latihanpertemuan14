class Population {
    constructor(size, env) {
        this.size = size;
        this.env = env;
        this.drones = [];
        this.generation = 1;
        this.bestDrone = null;
        this.bestFitness = 0;
        this.mutationRate = 0.1;
        this.fitnessHistory = []; // For the graph

        this.#initialize();
    }

    #initialize() {
        for (let i = 0; i < this.size; i++) {
            this.drones.push(new Drone(this.env.startPos.x, this.env.startPos.y));
        }
        this.bestDrone = this.drones[0];
    }

    update() {
        let allDead = true;
        
        for (let i = 0; i < this.size; i++) {
            this.drones[i].update(this.env);
            if (this.drones[i].alive) {
                allDead = false;
            }
        }

        this.#evaluate();

        return allDead;
    }

    draw(ctx) {
        for (let i = 0; i < this.size; i++) {
            this.drones[i].draw(ctx);
        }
    }

    #evaluate() {
        let maxFitness = 0;
        let currentBest = this.drones[0];

        for (let i = 0; i < this.size; i++) {
            this.drones[i].isBest = false;
            if (this.drones[i].fitness > maxFitness) {
                maxFitness = this.drones[i].fitness;
                currentBest = this.drones[i];
            }
        }

        currentBest.isBest = true;
        this.bestDrone = currentBest;
        this.bestFitness = maxFitness;
    }

    nextGeneration() {
        this.#evaluate(); // Ensure we have the best
        
        // Save history for chart
        this.fitnessHistory.push(this.bestFitness);
        
        let newDrones = [];
        
        // Elitism: keep the best one
        let champion = new Drone(this.env.startPos.x, this.env.startPos.y);
        champion.brain = this.bestDrone.brain.clone();
        newDrones.push(champion);

        // Generate the rest
        for (let i = 1; i < this.size; i++) {
            let child = new Drone(this.env.startPos.x, this.env.startPos.y);
            child.brain = this.bestDrone.brain.clone();
            NeuralNetwork.mutate(child.brain, this.mutationRate);
            newDrones.push(child);
        }

        this.drones = newDrones;
        this.generation++;
    }

    getAliveCount() {
        return this.drones.filter(d => d.alive).length;
    }
}
