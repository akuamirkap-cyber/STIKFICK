/**
 * PENGHALUS 2D HD (WebGL, dua tahap):
 *  Tahap A  : EPX 2x ke tekstur perantara (sudut & diagonal dibulatkan, tepi tetap tajam).
 *  Tahap B  : EPX sekali lagi (jadi 4x) lalu interpolasi TAJAM ke layar — lebar peralihan tepi ~1 piksel layar,
 *             jadi garis mulus dan bersih (HD), tidak buram.
 * Alfa diproses premultiplied supaya HUD transparan tidak berpinggiran gelap.
 * Bila WebGL tidak tersedia, draw() mengembalikan null dan pemanggil memakai jalur lama (drawImage biasa).
 */
const VS = `
attribute vec2 aPos;
uniform float uFlip;
varying vec2 vUv;
void main() {
  float y = aPos.y * 0.5 + 0.5;
  vUv = vec2(aPos.x * 0.5 + 0.5, mix(y, 1.0 - y, uFlip));
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FS = `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uTexSize;
uniform vec2 uRegion;
uniform float uPass;
uniform float uSharp;
varying vec2 vUv;
vec4 fetch(vec2 t) {
  t = clamp(floor(t), vec2(0.0), uRegion - 1.0);
  vec4 c = texture2D(uTex, (t + 0.5) / uTexSize);
  return vec4(c.rgb * c.a, c.a);
}
bool same(vec4 a, vec4 b) {
  vec4 d = abs(a - b);
  return max(max(d.r, d.g), max(d.b, d.a)) < 0.03;
}
vec4 epx(vec2 cell) {
  vec2 t = floor(cell * 0.5);
  vec2 q = cell - t * 2.0;
  vec4 P = fetch(t);
  vec4 A = fetch(t + vec2(0.0, -1.0));
  vec4 B = fetch(t + vec2(1.0, 0.0));
  vec4 C = fetch(t + vec2(-1.0, 0.0));
  vec4 D = fetch(t + vec2(0.0, 1.0));
  vec4 r = P;
  if (q.x < 0.5 && q.y < 0.5) { if (same(C, A) && !same(C, D) && !same(A, B)) r = A; }
  else if (q.x > 0.5 && q.y < 0.5) { if (same(A, B) && !same(A, C) && !same(B, D)) r = B; }
  else if (q.x < 0.5 && q.y > 0.5) { if (same(D, C) && !same(D, B) && !same(C, A)) r = C; }
  else { if (same(B, D) && !same(B, A) && !same(D, C)) r = D; }
  return r;
}
void main() {
  if (uPass < 0.5) {
    // tahap A: keluaran = EPX 2x, disimpan TIDAK-premultiplied
    vec4 v = epx(floor(vUv * uRegion * 2.0));
    gl_FragColor = v.a > 0.001 ? vec4(v.rgb / v.a, v.a) : vec4(0.0);
    return;
  }
  vec2 pos = vUv * uRegion;
  vec2 s = pos * 2.0 - 0.5;
  vec2 i0 = floor(s);
  vec2 f = s - i0;
  f = clamp((f - 0.5) * uSharp + 0.5, 0.0, 1.0);
  f = f * f * (3.0 - 2.0 * f);
  vec4 c00 = epx(i0);
  vec4 c10 = epx(i0 + vec2(1.0, 0.0));
  vec4 c01 = epx(i0 + vec2(0.0, 1.0));
  vec4 c11 = epx(i0 + vec2(1.0, 1.0));
  gl_FragColor = mix(mix(c00, c10, f.x), mix(c01, c11, f.x), f.y);
}`;

const MAXW = 960, MAXH = 540;

export class SmoothGL {
  canvas: HTMLCanvasElement;
  ok = false;
  private gl: WebGLRenderingContext | null = null;
  private tex: WebGLTexture | null = null;
  private mid: WebGLTexture | null = null;
  private fbo: WebGLFramebuffer | null = null;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private lost = false;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 16; this.canvas.height = 16;
    this.canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.lost = true; });
    this.canvas.addEventListener('webglcontextrestored', () => { this.lost = false; this.ok = this.init(); });
    this.ok = this.init();
  }

  private mkTex(gl: WebGLRenderingContext, w?: number, h?: number) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (w && h) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    return t;
  }

  private init(): boolean {
    try {
      const gl = (this.canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: true, depth: false, stencil: false }) as WebGLRenderingContext | null);
      if (!gl) return false;
      const mk = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader'); return s; };
      const prog = gl.createProgram()!;
      gl.attachShader(prog, mk(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'link');
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'aPos');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      this.tex = this.mkTex(gl);
      this.mid = this.mkTex(gl, MAXW, MAXH);
      this.fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.mid, 0);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('fbo');
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      for (const n of ['uTex', 'uTexSize', 'uRegion', 'uPass', 'uSharp', 'uFlip']) this.u[n] = gl.getUniformLocation(prog, n);
      gl.uniform1i(this.u.uTex, 0);
      gl.disable(gl.BLEND);
      this.gl = gl;
      return true;
    } catch (err) {
      console.warn('SmoothGL tidak tersedia, memakai jalur biasa:', err);
      this.gl = null;
      return false;
    }
  }

  /** Haluskan wilayah (0,0)-(sw,sh) dari canvas sumber ke canvas internal berukuran outW x outH. */
  draw(src: HTMLCanvasElement, sw: number, sh: number, outW: number, outH: number): HTMLCanvasElement | null {
    const gl = this.gl;
    if (!this.ok || !gl || this.lost || gl.isContextLost()) return null;
    if (sw * 2 > MAXW || sh * 2 > MAXH) return null;
    try {
      if (this.canvas.width !== outW || this.canvas.height !== outH) { this.canvas.width = outW; this.canvas.height = outH; }
      gl.activeTexture(gl.TEXTURE0);
      // ---- tahap A: sumber -> EPX 2x -> tekstur perantara
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.viewport(0, 0, sw * 2, sh * 2);
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.uniform2f(this.u.uTexSize, src.width, src.height);
      gl.uniform2f(this.u.uRegion, sw, sh);
      gl.uniform1f(this.u.uPass, 0);
      gl.uniform1f(this.u.uFlip, 0);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      // ---- tahap B: EPX lagi (4x) + interpolasi tajam ke layar
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, outW, outH);
      gl.bindTexture(gl.TEXTURE_2D, this.mid);
      gl.uniform2f(this.u.uTexSize, MAXW, MAXH);
      gl.uniform2f(this.u.uRegion, sw * 2, sh * 2);
      gl.uniform1f(this.u.uPass, 1);
      gl.uniform1f(this.u.uFlip, 1);
      const cellPx = outW / (sw * 4);                       // piksel layar per sel EPX 4x
      gl.uniform1f(this.u.uSharp, Math.max(1, cellPx / 1.05)); // peralihan tepi ~1 piksel layar
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      return this.canvas;
    } catch {
      this.ok = false;
      return null;
    }
  }
}
