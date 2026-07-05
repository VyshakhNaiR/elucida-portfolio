/* ======================================================================
   ELUCIDA — WebGL "living light" backdrop
   A domain-warped fbm field: near-black fog lit by flowing violet→cyan
   bands that brighten toward the cursor. "bring into the light."
   Falls back silently if WebGL is unavailable.
   ====================================================================== */
window.ElucidaGL = (function () {
  'use strict';

  const FRAG = `
  precision highp float;
  uniform vec2  u_res;
  uniform float u_time;
  uniform vec2  u_mouse;      // 0..1
  uniform vec3  u_c1;         // accent 1
  uniform vec3  u_c2;         // accent 2
  uniform float u_intensity;

  // --- hash / noise (Inigo Quilez style value noise) ---
  float hash(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p+34.345); return fract(p.x*p.y); }
  float noise(in vec2 p){
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    float a = hash(i+vec2(0.0,0.0));
    float b = hash(i+vec2(1.0,0.0));
    float c = hash(i+vec2(0.0,1.0));
    float d = hash(i+vec2(1.0,1.0));
    return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    mat2 m = mat2(1.6,1.2,-1.2,1.6);
    for(int i=0;i<6;i++){ v += a*noise(p); p = m*p; a *= 0.5; }
    return v;
  }

  void main(){
    vec2 uv = gl_FragCoord.xy / u_res.xy;
    vec2 p = (gl_FragCoord.xy - 0.5*u_res.xy) / u_res.y;
    float t = u_time * 0.09;

    // domain warp
    vec2 q = vec2(fbm(p*1.5 + t), fbm(p*1.5 - t + 4.2));
    vec2 r = vec2(fbm(p*1.5 + 1.8*q + vec2(1.7,9.2) + 0.15*t),
                  fbm(p*1.5 + 1.8*q + vec2(8.3,2.8) - 0.12*t));
    float f = fbm(p*1.5 + 2.4*r);

    // dark, moody base with subtle flowing colour bands
    vec3 base = vec3(0.018, 0.022, 0.045);
    float band = pow(clamp(f, 0.0, 1.0), 1.7);
    vec3 col = base;
    col += u_c1 * band * 0.30;
    col += u_c2 * pow(clamp(length(r), 0.0, 1.0), 1.6) * 0.22;

    // cursor light — "bring into the light" (reacts as you move, but never washes content)
    float d = distance(uv, u_mouse);
    float light = smoothstep(0.42, 0.05, d);
    col += mix(u_c1, u_c2, 0.5) * light * 0.22 * u_intensity;

    // strong vignette so edges fall to black (content stays readable)
    float vig = smoothstep(1.35, 0.30, length(p));
    col *= vig;

    col = pow(clamp(col, 0.0, 1.0), vec3(1.06));   // darken mids
    gl_FragColor = vec4(col * u_intensity, 1.0);
  }`;

  const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.0,1.0); }`;

  function hexish(varName, fallback) {
    // read an "r,g,b" (0-255) css var and normalise to 0..1
    const raw = getComputedStyle(document.body).getPropertyValue(varName).trim() || fallback;
    const [r, g, b] = raw.split(',').map((n) => parseFloat(n) / 255);
    return [r || 0, g || 0, b || 0];
  }

  function start(canvas) {
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false })
            || canvas.getContext('experimental-webgl');
    if (!gl) return null;

    function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const U = {
      res: gl.getUniformLocation(prog, 'u_res'),
      time: gl.getUniformLocation(prog, 'u_time'),
      mouse: gl.getUniformLocation(prog, 'u_mouse'),
      c1: gl.getUniformLocation(prog, 'u_c1'),
      c2: gl.getUniformLocation(prog, 'u_c2'),
      intensity: gl.getUniformLocation(prog, 'u_intensity')
    };

    const mouse = { x: 0.5, y: 0.55, tx: 0.5, ty: 0.55 };
    let W, H, dpr, raf, running = true, t0 = null, intensity = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', (e) => { mouse.tx = e.clientX / window.innerWidth; mouse.ty = 1.0 - e.clientY / window.innerHeight; });
    resize();

    const C1 = hexish('--accent-rgb', '139,92,246');
    const C2 = hexish('--accent2-rgb', '34,211,238');

    function frame(now) {
      if (!running) return;
      if (t0 === null) t0 = now;
      const time = (now - t0) / 1000;
      intensity += (1 - intensity) * 0.02;              // fade in
      mouse.x += (mouse.tx - mouse.x) * 0.10;
      mouse.y += (mouse.ty - mouse.y) * 0.10;
      gl.uniform2f(U.res, canvas.width, canvas.height);
      gl.uniform1f(U.time, time);
      gl.uniform2f(U.mouse, mouse.x, mouse.y);
      gl.uniform3fv(U.c1, C1);
      gl.uniform3fv(U.c2, C2);
      gl.uniform1f(U.intensity, intensity);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    // pause when tab hidden or canvas scrolled far away (perf)
    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
      if (running) { raf = requestAnimationFrame(frame); } else { cancelAnimationFrame(raf); }
    });
    return { gl };
  }

  function init(id) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = document.getElementById(id);
    if (!canvas) return false;
    if (reduced) { canvas.style.display = 'none'; return false; }
    const ok = start(canvas);
    if (!ok) { canvas.style.display = 'none'; return false; }
    return true;
  }
  return { init };
})();
