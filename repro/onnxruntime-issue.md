# [Web] WebGPU: 4-bit MatMulNBits model ~80× slower than fp16 on an Imagination GPU (Pixel 10 Pro)

### Describe the issue

On a Pixel 10 Pro (Tensor G5, Imagination "D-series" GPU), the 4-bit build of EmbeddingGemma 2 takes about **20 seconds per forward pass** on the WebGPU execution provider. The fp16 build of the same model takes **0.24 s** on WebGPU on the same phone, and **0.13 s** on WASM. The 4-bit results are correct: the output vectors match the desktop's. It is only slow.

The time is the same for every input (20.1–21.0 s for one- to three-token inputs), and it doesn't improve with repeated runs. A plain WebGPU compute dispatch plus `mapAsync` readback on the same device takes about 10 ms, so the GPU and the readback path work normally.

The 4-bit and fp16 graphs differ only in quantization: 146 of the fp16 graph's 194 `MatMul` nodes become `com.microsoft.MatMulNBits` (bits=4, block_size=32), plus one `GatherBlockQuantized`. Everything else is the same. So `MatMulNBits` (or `GatherBlockQuantized`) on this GPU is the likely cause.

| Model | Execution provider | Per forward pass (Pixel 10 Pro) | Per forward pass (desktop, NVIDIA Ampere) |
|---|---|---|---|
| 4-bit (`model_q4.onnx`) | WebGPU | **20,111–21,030 ms** | 73–90 ms |
| fp16 (`model_fp16.onnx`) | WebGPU | 243–244 ms (first run 976 ms) | 93–94 ms |
| fp16 | WASM | 131–175 ms | – |

A Samsung Galaxy Tab A9+ runs the same 4-bit model on WebGPU at about 0.5–1.2 s per word, so it isn't mobile WebGPU in general.

### To reproduce

1. On a Pixel 10 Pro, open https://toontalk.github.io/embedding-explorer/repro/webgpu-q4-slow.html in Chrome.
2. Press **4-bit on WebGPU**. It downloads `onnx-community/embeddinggemma-2-ONNX` `model_q4` (text part only, about 175 MB) and times three forward passes.
3. Press **16-bit on WebGPU** to compare.

The page is a few lines of Transformers.js (`AutoModel.from_pretrained(id, { device: "webgpu", dtype: "q4" })`), with the vision and audio configs removed so only the text model loads.

### Urgency

Not urgent for us. Our app now detects Imagination GPUs and uses WASM instead. But any 4-bit model on WebGPU is probably unusable on these phones.

### ONNX Runtime Installation

Released Package (via Transformers.js)

### ONNX Runtime Version or Commit ID

onnxruntime-web 1.31.0-dev.20260914-8d85527a0 (the version Transformers.js 4.3.2 loads)

### Execution Provider

'webgpu' (WebGPU)

### Device and browser

- Pixel 10 Pro (`blazer`), Android 17, Chrome 157.0.8103.46
- `GPUAdapter.info`: vendor `img-tec`, architecture `d-series` (device and description empty)
- Adapter features: atomic-vec2u-min-max, clip-distances, core-features-and-limits, depth-clip-control, depth32float-stencil8, dual-source-blending, float32-blendable, indirect-first-instance, primitive-index, rg11b10ufloat-renderable, shader-f16, subgroup-size-control, subgroups, texture-component-swizzle, texture-compression-astc, texture-compression-etc2, texture-compression-unaligned, texture-formats-tier1, texture-formats-tier2, timestamp-query
- Subgroup size 32–128; maxStorageBufferBindingSize 134217728; maxComputeWorkgroupStorageSize 32768; maxComputeInvocationsPerWorkgroup 1024

### Notes

- Setting `env.backends.onnx.webgpu.profiling = { mode: "default" }` printed nothing with this build, so we couldn't get per-kernel times. We'd be glad to run a build or flag that does.
- We noticed this in [Embedding Explorer](https://github.com/ToonTalk/embedding-explorer), a page for school students to explore embeddings.
