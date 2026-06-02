class Visualizer {
    static drawNetwork(ctx, network) {
        if (!network) return;
        const margin = 20;
        const left = margin;
        const top = margin;
        const width = ctx.canvas.width - margin * 2;
        const height = ctx.canvas.height - margin * 2;

        const levelHeight = height / network.levels.length;

        for (let i = network.levels.length - 1; i >= 0; i--) {
            const levelTop = top +
                lerp(
                    height - levelHeight,
                    0,
                    network.levels.length == 1
                        ? 0.5
                        : i / (network.levels.length - 1)
                );

            Visualizer.drawLevel(ctx, network.levels[i],
                left, levelTop,
                width, levelHeight,
                i == network.levels.length - 1 ? ['Turn', 'Throttle'] : []
            );
        }
    }

    static drawLevel(ctx, level, left, top, width, height, outputLabels) {
        const right = left + width;
        const bottom = top + height;

        const { inputs, outputs, weights, biases } = level;

        // Draw connections
        for (let i = 0; i < inputs.length; i++) {
            for (let j = 0; j < outputs.length; j++) {
                ctx.beginPath();
                ctx.moveTo(
                    Visualizer.#getNodeX(inputs, i, left, right),
                    bottom
                );
                ctx.lineTo(
                    Visualizer.#getNodeX(outputs, j, left, right),
                    top
                );
                ctx.lineWidth = 2;
                ctx.strokeStyle = Visualizer.#getRGBA(weights[i][j]);
                ctx.stroke();
            }
        }

        // Draw input nodes
        const nodeRadius = 8;
        for (let i = 0; i < inputs.length; i++) {
            const x = Visualizer.#getNodeX(inputs, i, left, right);
            ctx.beginPath();
            ctx.arc(x, bottom, nodeRadius, 0, Math.PI * 2);
            ctx.fillStyle = "black";
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x, bottom, nodeRadius * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = Visualizer.#getRGBA(inputs[i]);
            ctx.fill();
            ctx.strokeStyle = "#fff";
            ctx.stroke();
        }

        // Draw output nodes
        for (let i = 0; i < outputs.length; i++) {
            const x = Visualizer.#getNodeX(outputs, i, left, right);
            ctx.beginPath();
            ctx.arc(x, top, nodeRadius, 0, Math.PI * 2);
            ctx.fillStyle = "black";
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x, top, nodeRadius * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = Visualizer.#getRGBA(outputs[i]);
            ctx.fill();
            ctx.strokeStyle = "#fff";
            ctx.stroke();

            // Bias outline
            ctx.beginPath();
            ctx.arc(x, top, nodeRadius * 1.2, 0, Math.PI * 2);
            ctx.strokeStyle = Visualizer.#getRGBA(biases[i]);
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);

            if (outputLabels[i]) {
                ctx.beginPath();
                ctx.textAlign = "center";
                ctx.textBaseline = "bottom";
                ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
                ctx.font = "10px Inter";
                ctx.fillText(outputLabels[i], x, top - nodeRadius - 5);
            }
        }
    }

    static #getNodeX(nodes, index, left, right) {
        return lerp(
            left,
            right,
            nodes.length == 1
                ? 0.5
                : index / (nodes.length - 1)
        );
    }

    static #getRGBA(value) {
        const alpha = Math.abs(value);
        const R = value < 0 ? 0 : 56;
        const G = value < 0 ? 189 : 248; // Using accent colors from CSS
        const B = value < 0 ? 248 : 56;
        // Basically: Blueish if negative, Greenish if positive
        if(value < 0) return `rgba(239, 68, 68, ${alpha})`; // Red
        return `rgba(56, 189, 248, ${alpha})`; // Blue
    }
}
