class Sensor {
    constructor(drone, rayCount = 7, rayLength = 150, raySpread = Math.PI / 1.5) {
        this.drone = drone;
        this.rayCount = rayCount;
        this.rayLength = rayLength;
        this.raySpread = raySpread;
        this.rays = [];
        this.readings = [];
    }

    update(obstacles, target) {
        this.#castRays();
        this.readings = [];
        for (let i = 0; i < this.rays.length; i++) {
            this.readings.push(this.#getReading(this.rays[i], obstacles, target));
        }
    }

    #getReading(ray, obstacles, target) {
        let touches = [];
        
        // Check obstacles
        for (let i = 0; i < obstacles.length; i++) {
            const poly = obstacles[i];
            for (let j = 0; j < poly.length - 1; j++) {
                const touch = getIntersection(ray[0], ray[1], poly[j], poly[j + 1]);
                if (touch) {
                    touches.push(touch);
                }
            }
        }

        if (touches.length === 0) {
            return null;
        } else {
            const offsets = touches.map(e => e.offset);
            const minOffset = Math.min(...offsets);
            return touches.find(e => e.offset === minOffset);
        }
    }

    #castRays() {
        this.rays = [];
        for (let i = 0; i < this.rayCount; i++) {
            const rayAngle = lerp(
                this.raySpread / 2,
                -this.raySpread / 2,
                this.rayCount == 1 ? 0.5 : i / (this.rayCount - 1)
            ) + this.drone.angle;

            const start = { x: this.drone.x, y: this.drone.y };
            const end = {
                x: this.drone.x - Math.sin(rayAngle) * this.rayLength,
                y: this.drone.y - Math.cos(rayAngle) * this.rayLength
            };
            this.rays.push([start, end]);
        }
    }

    draw(ctx) {
        for (let i = 0; i < this.rayCount; i++) {
            let end = this.rays[i][1];
            if (this.readings[i]) {
                end = this.readings[i];
            }

            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba(255, 255, 0, 0.4)";
            ctx.moveTo(this.rays[i][0].x, this.rays[i][0].y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();

            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba(255, 0, 0, 0.4)";
            ctx.moveTo(this.rays[i][1].x, this.rays[i][1].y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        }
    }
}

class Drone {
    constructor(x, y, isBest = false) {
        this.x = x;
        this.y = y;
        this.width = 15;
        this.height = 20;
        this.angle = 0;
        
        this.speed = 0;
        this.acceleration = 0.2;
        this.maxSpeed = 5;
        this.friction = 0.05;

        this.isBest = isBest;
        this.alive = true;
        this.fitness = 0;
        this.timeAlive = 0;

        // Neural Network & Sensors
        this.sensor = new Sensor(this);
        // Inputs: 7 ray sensors + 2 for target vector (x, y) = 9
        // Hidden: 8
        // Outputs: 2 (turn, speed)
        this.brain = new NeuralNetwork([9, 8, 2]);
        this.controls = { turn: 0, throttle: 0 };
    }

    update(env) {
        if (!this.alive) return;

        this.timeAlive++;

        this.sensor.update(env.obstacles, env.target);
        
        // Prepare inputs
        const inputs = [];
        // 7 sensor distances
        for (let i = 0; i < this.sensor.rayCount; i++) {
            inputs.push(this.sensor.readings[i] ? 1 - this.sensor.readings[i].offset : 0);
        }

        // 2 inputs for direction to target (normalized)
        let targetVec = new Vector(env.target.x - this.x, env.target.y - this.y);
        let distToTarget = targetVec.mag();
        targetVec.normalize();
        
        // Localize target vector to drone's angle
        let s = Math.sin(-this.angle);
        let c = Math.cos(-this.angle);
        let localTx = targetVec.x * c - targetVec.y * s;
        let localTy = targetVec.x * s + targetVec.y * c;

        inputs.push(localTx);
        inputs.push(localTy);

        // Get outputs from NN
        const outputs = NeuralNetwork.feedForward(inputs, this.brain);
        
        // Outputs are in range -1 to 1 (tanh)
        this.controls.turn = outputs[0];
        this.controls.throttle = (outputs[1] + 1) / 2; // Map -1,1 to 0,1

        this.#move();
        this.#checkCollisions(env);
        this.#calculateFitness(env, distToTarget);
    }

    #move() {
        // Turning
        this.angle -= this.controls.turn * 0.05; // 0.05 is turn speed

        // Throttle
        this.speed += this.controls.throttle * this.acceleration;
        
        if (this.speed > this.maxSpeed) {
            this.speed = this.maxSpeed;
        }
        if (this.speed > 0) {
            this.speed -= this.friction;
        }
        if (Math.abs(this.speed) < this.friction) {
            this.speed = 0;
        }

        // Apply movement
        this.x -= Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed;
    }

    #checkCollisions(env) {
        // Simple bounding box / point collision for now
        // To be precise, check if center is inside any polygon
        // But for speed, just check if any sensor reading is too close (offset < 0.1)
        
        for (let i = 0; i < this.sensor.readings.length; i++) {
            if (this.sensor.readings[i] && this.sensor.readings[i].offset < 0.05) {
                this.alive = false;
                return;
            }
        }
        
        // Bounds check with margin
        const margin = Math.max(this.width, this.height) / 2;
        if (this.x < margin || this.x > env.width - margin || this.y < margin || this.y > env.height - margin) {
            this.alive = false;
        }
        
        // Timeout check to prevent infinite generation stuck state
        if (this.timeAlive > 800) {
            this.alive = false;
        }
        
        // Target check
        let d = Vector.dist({x: this.x, y: this.y}, env.target);
        if (d < env.target.radius) {
            // Reached target!
            this.fitness += 1000;
            this.alive = false; 
        }
    }

    #calculateFitness(env, distToTarget) {
        // Base fitness is proximity to target (inverse distance)
        let maxDist = Math.sqrt(env.width*env.width + env.height*env.height);
        
        // Reward getting closer, heavily penalize being far
        let distFitness = mapRange(distToTarget, 0, maxDist, 100, 0);
        
        // Reward staying alive but slightly penalize taking too long (optional)
        this.fitness = distFitness + (this.timeAlive * 0.01);
    }

    draw(ctx) {
        if (this.isBest && this.alive) {
            this.sensor.draw(ctx);
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(-this.angle);

        // Draw Engine Flame if alive and moving
        if (this.alive && this.speed > 0.5) {
            const flameLength = (this.speed / this.maxSpeed) * 15;
            const flicker = Math.random() * 5;
            ctx.beginPath();
            ctx.moveTo(-this.width / 3, this.height / 2);
            ctx.lineTo(0, this.height / 2 + flameLength + flicker);
            ctx.lineTo(this.width / 3, this.height / 2);
            ctx.closePath();
            ctx.fillStyle = "rgba(249, 115, 22, 0.8)"; // Orange flame
            ctx.shadowColor = "#f97316";
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Draw Drone Body (Sleek sci-fi dart shape)
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 1.5); // Nose
        ctx.lineTo(-this.width / 2, this.height / 2); // Left wing
        ctx.lineTo(0, this.height / 3); // Tail indent
        ctx.lineTo(this.width / 2, this.height / 2); // Right wing
        ctx.closePath();

        if (!this.alive) {
            ctx.fillStyle = "rgba(71, 85, 105, 0.4)";
            ctx.strokeStyle = "rgba(71, 85, 105, 0.2)";
        } else if (this.isBest) {
            ctx.fillStyle = "rgba(56, 189, 248, 0.9)";
            ctx.strokeStyle = "#fff";
            ctx.shadowColor = "#38bdf8";
            ctx.shadowBlur = 15;
        } else {
            ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
            ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        }

        ctx.fill();
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
    }
}
