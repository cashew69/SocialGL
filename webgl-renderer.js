/**
 * WebGL Renderer - Handles all WebGL rendering for different scene types
 */
class WebGLRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

        if (!this.gl) {
            console.error('WebGL not supported');
            return;
        }

        this.animationId = null;
        this.startTime = Date.now();
        this.scene = null;
    }

    // Initialize a scene
    initScene(sceneType) {
        this.stop();
        this.scene = sceneType;

        const scenes = {
            'cube': () => this.initCube(),
            'sphere': () => this.initSphere(),
            'particles': () => this.initParticles(),
            'wave': () => this.initWave()
        };

        if (scenes[sceneType]) {
            scenes[sceneType]();
            this.start();
        }
    }

    // Create shader program
    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    createProgram(vertexSource, fragmentSource) {
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);

        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Program link error:', this.gl.getProgramInfoLog(program));
            return null;
        }

        return program;
    }

    // Scene 1: Rotating Cube
    initCube() {
        const vertexShader = `
            attribute vec4 aPosition;
            attribute vec3 aColor;
            uniform mat4 uMatrix;
            varying vec3 vColor;

            void main() {
                gl_Position = uMatrix * aPosition;
                vColor = aColor;
            }
        `;

        const fragmentShader = `
            precision mediump float;
            varying vec3 vColor;

            void main() {
                gl_FragColor = vec4(vColor, 1.0);
            }
        `;

        this.program = this.createProgram(vertexShader, fragmentShader);

        // Cube vertices
        const vertices = new Float32Array([
            -1, -1, -1,  -1, -1,  1,  -1,  1,  1,  -1,  1, -1,
             1, -1, -1,   1, -1,  1,   1,  1,  1,   1,  1, -1
        ]);

        // Colors
        const colors = new Float32Array([
            1, 0, 0,  1, 0, 0,  1, 0.5, 0,  1, 0.5, 0,
            0, 1, 0,  0, 1, 0,  0.5, 1, 0.5,  0.5, 1, 0.5
        ]);

        // Indices
        const indices = new Uint16Array([
            0, 1, 2,  0, 2, 3,  // front
            4, 5, 6,  4, 6, 7,  // back
            0, 1, 5,  0, 5, 4,  // bottom
            2, 3, 7,  2, 7, 6,  // top
            0, 3, 7,  0, 7, 4,  // left
            1, 2, 6,  1, 6, 5   // right
        ]);

        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

        this.colorBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, colors, this.gl.STATIC_DRAW);

        this.indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indices, this.gl.STATIC_DRAW);

        this.indexCount = indices.length;
        this.renderFunc = () => this.renderCube();
    }

    renderCube() {
        const gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.useProgram(this.program);

        const time = (Date.now() - this.startTime) * 0.001;
        const matrix = this.createRotationMatrix(time * 0.7, time * 0.5);

        const uMatrix = gl.getUniformLocation(this.program, 'uMatrix');
        gl.uniformMatrix4fv(uMatrix, false, matrix);

        const aPosition = gl.getAttribLocation(this.program, 'aPosition');
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);

        const aColor = gl.getAttribLocation(this.program, 'aColor');
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aColor);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    }

    // Scene 2: Glowing Sphere
    initSphere() {
        const vertexShader = `
            precision mediump float;
            attribute vec4 aPosition;
            attribute vec3 aNormal;
            uniform mat4 uMatrix;
            uniform float uTime;
            varying vec3 vNormal;
            varying vec3 vPosition;

            void main() {
                vNormal = aNormal;
                vPosition = aPosition.xyz;
                vec3 pos = aPosition.xyz * (1.0 + 0.1 * sin(uTime * 2.0));
                gl_Position = uMatrix * vec4(pos, 1.0);
            }
        `;

        const fragmentShader = `
            precision mediump float;
            varying vec3 vNormal;
            varying vec3 vPosition;
            uniform float uTime;

            void main() {
                vec3 normal = normalize(vNormal);
                float intensity = dot(normal, normalize(vec3(0.5, 0.5, 1.0)));
                intensity = 0.5 + 0.5 * intensity;

                vec3 color1 = vec3(0.4, 0.6, 1.0);
                vec3 color2 = vec3(0.8, 0.3, 1.0);
                vec3 color = mix(color1, color2, sin(uTime + vPosition.y) * 0.5 + 0.5);

                float glow = pow(intensity, 2.0);
                gl_FragColor = vec4(color * glow, 1.0);
            }
        `;

        this.program = this.createProgram(vertexShader, fragmentShader);

        const sphere = this.createSphereGeometry(1.5, 32, 32);

        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, sphere.vertices, this.gl.STATIC_DRAW);

        this.normalBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, sphere.normals, this.gl.STATIC_DRAW);

        this.indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, sphere.indices, this.gl.STATIC_DRAW);

        this.indexCount = sphere.indices.length;
        this.renderFunc = () => this.renderSphere();
    }

    renderSphere() {
        const gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.useProgram(this.program);

        const time = (Date.now() - this.startTime) * 0.001;
        const matrix = this.createRotationMatrix(time * 0.3, time * 0.5);

        const uMatrix = gl.getUniformLocation(this.program, 'uMatrix');
        gl.uniformMatrix4fv(uMatrix, false, matrix);

        const uTime = gl.getUniformLocation(this.program, 'uTime');
        gl.uniform1f(uTime, time);

        const aPosition = gl.getAttribLocation(this.program, 'aPosition');
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);

        const aNormal = gl.getAttribLocation(this.program, 'aNormal');
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aNormal);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    }

    // Scene 3: Particles
    initParticles() {
        const vertexShader = `
            attribute vec3 aPosition;
            attribute vec3 aVelocity;
            uniform float uTime;
            uniform mat4 uMatrix;
            varying vec3 vColor;

            void main() {
                vec3 pos = aPosition + aVelocity * uTime;
                pos = mod(pos + 3.0, 6.0) - 3.0;

                float dist = length(pos);
                vColor = vec3(
                    0.5 + 0.5 * sin(dist - uTime),
                    0.5 + 0.5 * cos(dist + uTime),
                    0.8
                );

                gl_Position = uMatrix * vec4(pos, 1.0);
                gl_PointSize = 4.0;
            }
        `;

        const fragmentShader = `
            precision mediump float;
            varying vec3 vColor;

            void main() {
                vec2 coord = gl_PointCoord - vec2(0.5);
                if (length(coord) > 0.5) discard;
                gl_FragColor = vec4(vColor, 1.0);
            }
        `;

        this.program = this.createProgram(vertexShader, fragmentShader);

        const count = 1000;
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 6;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 6;

            velocities[i * 3] = (Math.random() - 0.5) * 0.5;
            velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
        }

        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

        this.velocityBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.velocityBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, velocities, this.gl.STATIC_DRAW);

        this.particleCount = count;
        this.renderFunc = () => this.renderParticles();
    }

    renderParticles() {
        const gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.useProgram(this.program);

        const time = (Date.now() - this.startTime) * 0.001;
        const matrix = this.createRotationMatrix(time * 0.2, time * 0.15);

        const uMatrix = gl.getUniformLocation(this.program, 'uMatrix');
        gl.uniformMatrix4fv(uMatrix, false, matrix);

        const uTime = gl.getUniformLocation(this.program, 'uTime');
        gl.uniform1f(uTime, time);

        const aPosition = gl.getAttribLocation(this.program, 'aPosition');
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);

        const aVelocity = gl.getAttribLocation(this.program, 'aVelocity');
        gl.bindBuffer(gl.ARRAY_BUFFER, this.velocityBuffer);
        gl.vertexAttribPointer(aVelocity, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aVelocity);

        gl.drawArrays(gl.POINTS, 0, this.particleCount);
        gl.disable(gl.BLEND);
    }

    // Scene 4: Wave Grid
    initWave() {
        const vertexShader = `
            attribute vec3 aPosition;
            uniform float uTime;
            uniform mat4 uMatrix;
            varying float vHeight;

            void main() {
                vec3 pos = aPosition;
                float wave = sin(pos.x * 2.0 + uTime) * cos(pos.z * 2.0 + uTime) * 0.3;
                pos.y += wave;
                vHeight = wave;
                gl_Position = uMatrix * vec4(pos, 1.0);
            }
        `;

        const fragmentShader = `
            precision mediump float;
            varying float vHeight;

            void main() {
                vec3 color1 = vec3(0.1, 0.3, 0.8);
                vec3 color2 = vec3(0.3, 0.8, 0.9);
                vec3 color = mix(color1, color2, vHeight + 0.5);
                gl_FragColor = vec4(color, 1.0);
            }
        `;

        this.program = this.createProgram(vertexShader, fragmentShader);

        const grid = this.createGridGeometry(40, 40, 3, 3);

        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, grid.vertices, this.gl.STATIC_DRAW);

        this.indexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, grid.indices, this.gl.STATIC_DRAW);

        this.indexCount = grid.indices.length;
        this.renderFunc = () => this.renderWave();
    }

    renderWave() {
        const gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.useProgram(this.program);

        const time = (Date.now() - this.startTime) * 0.001;
        const matrix = this.createRotationMatrix(time * 0.2, 0.6);

        const uMatrix = gl.getUniformLocation(this.program, 'uMatrix');
        gl.uniformMatrix4fv(uMatrix, false, matrix);

        const uTime = gl.getUniformLocation(this.program, 'uTime');
        gl.uniform1f(uTime, time);

        const aPosition = gl.getAttribLocation(this.program, 'aPosition');
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPosition);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.LINES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    }

    // Helper: Create sphere geometry
    createSphereGeometry(radius, latBands, longBands) {
        const vertices = [];
        const normals = [];
        const indices = [];

        for (let lat = 0; lat <= latBands; lat++) {
            const theta = lat * Math.PI / latBands;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);

            for (let long = 0; long <= longBands; long++) {
                const phi = long * 2 * Math.PI / longBands;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);

                const x = cosPhi * sinTheta;
                const y = cosTheta;
                const z = sinPhi * sinTheta;

                vertices.push(radius * x, radius * y, radius * z);
                normals.push(x, y, z);
            }
        }

        for (let lat = 0; lat < latBands; lat++) {
            for (let long = 0; long < longBands; long++) {
                const first = lat * (longBands + 1) + long;
                const second = first + longBands + 1;

                indices.push(first, second, first + 1);
                indices.push(second, second + 1, first + 1);
            }
        }

        return {
            vertices: new Float32Array(vertices),
            normals: new Float32Array(normals),
            indices: new Uint16Array(indices)
        };
    }

    // Helper: Create grid geometry
    createGridGeometry(rows, cols, width, height) {
        const vertices = [];
        const indices = [];

        for (let row = 0; row <= rows; row++) {
            for (let col = 0; col <= cols; col++) {
                const x = (col / cols - 0.5) * width;
                const z = (row / rows - 0.5) * height;
                vertices.push(x, 0, z);
            }
        }

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const idx = row * (cols + 1) + col;
                indices.push(idx, idx + 1);
                indices.push(idx, idx + cols + 1);
            }
        }

        return {
            vertices: new Float32Array(vertices),
            indices: new Uint16Array(indices)
        };
    }

    // Helper: Create rotation matrix
    createRotationMatrix(angleX, angleY) {
        const aspect = this.canvas.width / this.canvas.height;
        const fov = Math.PI / 4;
        const near = 0.1;
        const far = 100;
        const f = 1 / Math.tan(fov / 2);

        const perspective = [
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) / (near - far), -1,
            0, 0, (2 * far * near) / (near - far), 0
        ];

        const cosX = Math.cos(angleX);
        const sinX = Math.sin(angleX);
        const cosY = Math.cos(angleY);
        const sinY = Math.sin(angleY);

        const rotX = [
            1, 0, 0, 0,
            0, cosX, sinX, 0,
            0, -sinX, cosX, 0,
            0, 0, 0, 1
        ];

        const rotY = [
            cosY, 0, -sinY, 0,
            0, 1, 0, 0,
            sinY, 0, cosY, 0,
            0, 0, 0, 1
        ];

        const translation = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, -6, 1
        ];

        let result = this.multiplyMatrices(rotY, rotX);
        result = this.multiplyMatrices(translation, result);
        result = this.multiplyMatrices(perspective, result);

        return result;
    }

    multiplyMatrices(a, b) {
        const result = new Array(16);
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                result[i * 4 + j] = 0;
                for (let k = 0; k < 4; k++) {
                    result[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j];
                }
            }
        }
        return result;
    }

    // Start rendering loop
    start() {
        const render = () => {
            if (this.renderFunc) {
                this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
                this.gl.clearColor(0, 0, 0, 1);
                this.renderFunc();
            }
            this.animationId = requestAnimationFrame(render);
        };
        render();
    }

    // Stop rendering
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    // Clean up
    destroy() {
        this.stop();
        if (this.gl) {
            const ext = this.gl.getExtension('WEBGL_lose_context');
            if (ext) ext.loseContext();
        }
    }
}
