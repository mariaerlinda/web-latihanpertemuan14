// Simple 2D Vector Class
class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
    }

    sub(v) {
        return new Vector(this.x - v.x, this.y - v.y);
    }

    mult(n) {
        this.x *= n;
        this.y *= n;
    }

    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        let m = this.mag();
        if (m !== 0) {
            this.mult(1 / m);
        }
    }

    heading() {
        return Math.atan2(this.y, this.x);
    }
    
    static dist(v1, v2) {
        let dx = v1.x - v2.x;
        let dy = v1.y - v2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

// Map a value from one range to another
function mapRange(val, in_min, in_max, out_min, out_max) {
    return (val - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

// Line intersection algorithm (raycasting)
// Returns intersection point {x, y, offset} or null
function getIntersection(A, B, C, D) {
    const tTop = (D.x - C.x) * (A.y - C.y) - (D.y - C.y) * (A.x - C.x);
    const uTop = (C.y - A.y) * (A.x - B.x) - (C.x - A.x) * (A.y - B.y);
    const bottom = (D.y - C.y) * (B.x - A.x) - (D.x - C.x) * (B.y - A.y);

    if (bottom !== 0) {
        const t = tTop / bottom;
        const u = uTop / bottom;
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return {
                x: A.x + (t * (B.x - A.x)),
                y: A.y + (t * (B.y - A.y)),
                offset: t
            };
        }
    }
    return null;
}
