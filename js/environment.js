class Environment {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.target = { x: width / 2, y: 50, radius: 20 };
        this.startPos = { x: width / 2, y: height - 50 };
        this.obstacles = [];
        this.drawingObstacle = null;
        
        // Add borders as default obstacles
        this.obstacles.push([
            {x: 0, y: 0}, {x: width, y: 0}, 
            {x: width, y: height}, {x: 0, y: height},
            {x: 0, y: 0}
        ]);
    }

    startDrawingObstacle(x, y) {
        this.drawingObstacle = [{x, y}];
    }

    addPointToObstacle(x, y) {
        if (this.drawingObstacle) {
            this.drawingObstacle.push({x, y});
        }
    }

    finishDrawingObstacle() {
        if (this.drawingObstacle && this.drawingObstacle.length > 2) {
            // Close the polygon
            this.drawingObstacle.push({...this.drawingObstacle[0]});
            this.obstacles.push(this.drawingObstacle);
        }
        this.drawingObstacle = null;
    }

    clearObstacles() {
        // Keep borders
        this.obstacles = [this.obstacles[0]];
    }

    draw(ctx) {
        // Pulsing effect
        const pulse = Math.sin(Date.now() / 200) * 5 + 5;
        
        ctx.fillStyle = "rgba(34, 197, 94, 0.8)"; // Success green
        ctx.shadowColor = "#22c55e";
        ctx.shadowBlur = 15 + pulse;
        
        // Inner core
        ctx.beginPath();
        ctx.arc(this.target.x, this.target.y, this.target.radius - 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Outer pulsing ring
        ctx.strokeStyle = "rgba(34, 197, 94, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.target.x, this.target.y, this.target.radius + pulse, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.shadowBlur = 0;

        // Draw Start area
        ctx.fillStyle = "rgba(56, 189, 248, 0.2)"; // Accent blue
        ctx.beginPath();
        ctx.arc(this.startPos.x, this.startPos.y, 20, 0, Math.PI * 2);
        ctx.fill();

        // Draw Obstacles
        ctx.strokeStyle = "rgba(239, 68, 68, 0.8)"; // Danger red
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        this.obstacles.forEach((obs, index) => {
            if (index === 0) return; // Skip border drawing (invisible or handled by edges)
            ctx.beginPath();
            ctx.moveTo(obs[0].x, obs[0].y);
            for (let i = 1; i < obs.length; i++) {
                ctx.lineTo(obs[i].x, obs[i].y);
            }
            ctx.stroke();
            ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
            ctx.fill();
        });

        // Draw current obstacle being drawn
        if (this.drawingObstacle) {
            ctx.beginPath();
            ctx.moveTo(this.drawingObstacle[0].x, this.drawingObstacle[0].y);
            for (let i = 1; i < this.drawingObstacle.length; i++) {
                ctx.lineTo(this.drawingObstacle[i].x, this.drawingObstacle[i].y);
            }
            ctx.strokeStyle = "#fff";
            ctx.stroke();
        }
    }
}
