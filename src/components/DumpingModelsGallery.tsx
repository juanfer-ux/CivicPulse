import { useEffect, useRef, useState } from 'react'
import { Box3, CanvasTexture, Color, DirectionalLight, DoubleSide, Group, HemisphereLight, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, RingGeometry, CircleGeometry, Scene, Sprite, SpriteMaterial, SRGBColorSpace, Vector3, WebGLRenderer, type Object3D } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

/**
 * Dev gallery `/#dumping-models` (owner, 2026-11-15): the candidate 3D models for an illegal dumping recurrence, each in context: on the dark ground with the recurrence's red ring, the floating warning on its line, and the HR-V next to it for scale, seen from the map's 55° tilt, turning slowly (hover pauses). The files are local tryouts in `public/models-test/` (git-ignored: not ours to redistribute yet). One WebGL renderer draws every card into 2D canvases, so six models do not need six GL contexts.
 */
const ALL_MODELS = [
  // the three the owner kept in the gallery (2026-11-16); the earlier candidates' files stay in public/models-test/ but are not listed
  { file: 'concrete_trash_bin.glb', name: 'concrete_trash_bin', note: 'A concrete bin, 14 MB' },
  { file: 'trash_container.glb', name: 'trash_container', note: 'A trash container, 2 MB' },
  { file: 'unnamed_882c52.glb', name: '882c52ccf9a6476191414c898e54edf7', note: 'No name in the file, 14 MB' },
]
// `/?only=cans#dumping-models` shows just the models whose file name contains the word
const only = new URLSearchParams(location.search).get('only')
const MODELS = only ? ALL_MODELS.filter((m) => m.file.includes(only)) : ALL_MODELS
const W = 380
const H = 300
const CAR_LENGTH = 2.6 // the HR-V next to a footprint-1 model: a car is about 4.5 m and a heap about 1.7 m

const warning = () => {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  g.lineJoin = 'round'
  g.beginPath()
  g.moveTo(64, 12); g.lineTo(118, 108); g.lineTo(10, 108); g.closePath()
  g.fillStyle = '#F7A7A7'; g.strokeStyle = '#111113'; g.lineWidth = 12
  g.stroke(); g.fill()
  g.fillStyle = '#111113'; g.fillRect(58, 44, 12, 38); g.beginPath(); g.arc(64, 94, 7, 0, 7); g.fill()
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return new Sprite(new SpriteMaterial({ map: t, depthTest: false }))
}

/** Fit a loaded model to a footprint of `size` on the ground, centred, its base at y = 0. */
function fit(obj: Object3D, size: number) {
  const box = new Box3().setFromObject(obj)
  const d = box.getSize(new Vector3())
  const k = size / Math.max(d.x, d.z, 1e-6)
  obj.scale.multiplyScalar(k)
  const b2 = new Box3().setFromObject(obj)
  const c = b2.getCenter(new Vector3())
  obj.position.set(obj.position.x - c.x, obj.position.y - b2.min.y, obj.position.z - c.z)
  return b2.getSize(new Vector3()).y
}

const triangles = (obj: Object3D) => {
  let n = 0
  obj.traverse((o) => {
    const m = o as Mesh
    if (m.isMesh) n += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3
  })
  return Math.round(n)
}

export function DumpingModelsGallery() {
  const canvases = useRef<(HTMLCanvasElement | null)[]>([])
  const hover = useRef(-1)
  const [info, setInfo] = useState<Record<number, string>>({})

  useEffect(() => {
    let stop = false
    const renderer = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(2)
    const loader = new GLTFLoader()
    const load = (url: string) => loader.loadAsync(url)
    const cards: { scene: Scene; camera: PerspectiveCamera; spin: Group }[] = []

    const build = async (i: number) => {
      const scene = new Scene()
      scene.add(new HemisphereLight(0xffffff, 0x333340, 1.6))
      const sun = new DirectionalLight(0xffffff, 2.2)
      sun.position.set(-0.4, 1, 0.6)
      scene.add(sun)
      // ground and the recurrence ring
      const ground = new Mesh(new CircleGeometry(3.4, 64), new MeshBasicMaterial({ color: new Color('#18181B') }))
      ground.rotation.x = -Math.PI / 2
      scene.add(ground)
      const ring = new Mesh(new RingGeometry(1.5, 1.54, 96), new MeshBasicMaterial({ color: new Color('#F7A7A7'), side: DoubleSide }))
      ring.rotation.x = -Math.PI / 2
      ring.position.y = 0.01
      scene.add(ring)
      const spin = new Group()
      scene.add(spin)
      const model = (await load(`/models-test/${MODELS[i].file}`)).scene
      const h = fit(model, 1.2)
      spin.add(model)
      setInfo((s) => ({ ...s, [i]: `${triangles(model).toLocaleString('en-GB')} triangles` }))
      // the warning on its line
      const top = Math.max(1.5, h + 1.2)
      const line = new Mesh(new PlaneGeometry(0.02, top - h), new MeshBasicMaterial({ color: new Color('#F7A7A7'), side: DoubleSide, transparent: true, opacity: 0.8 }))
      line.position.set(0, h + (top - h) / 2, 0)
      scene.add(line)
      const w = warning()
      w.scale.setScalar(0.55)
      w.position.set(0, top + 0.2, 0)
      scene.add(w)
      // the car, for scale (parking recurrences use it)
      try {
        const car = (await load('/models/car.glb')).scene
        fit(car, CAR_LENGTH)
        car.rotation.y = Math.PI / 2
        car.position.x += -2.2
        car.position.z += 0.2
        scene.add(car)
      } catch { /* the car is only for scale */ }
      const camera = new PerspectiveCamera(44, W / H, 0.1, 100)
      camera.position.set(-1, 5.6, 5.2) // about 45 to 55° down, from the south
      camera.lookAt(-1, 0.4, 0)
      cards[i] = { scene, camera, spin }
    }

    ;(async () => {
      for (let i = 0; i < MODELS.length; i++) {
        try { await build(i) } catch (e) { setInfo((s) => ({ ...s, [i]: `could not load (${(e as Error).message})` })) }
      }
    })()

    const tick = () => {
      if (stop) return
      cards.forEach((c, i) => {
        const cv = canvases.current[i]
        if (!c || !cv) return
        if (hover.current !== i) c.spin.rotation.y += 0.006
        renderer.render(c.scene, c.camera)
        const g = cv.getContext('2d')!
        g.clearRect(0, 0, cv.width, cv.height)
        g.drawImage(renderer.domElement, 0, 0, cv.width, cv.height)
      })
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    return () => { stop = true; renderer.dispose() }
  }, [])

  return (
    <div className="mx-auto flex min-h-svh max-w-6xl flex-col gap-6 p-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-heading">Dumping models · in context</h1>
        <p className="max-w-3xl text-body-sm text-muted-foreground">Each candidate on the recurrence's ground with its ring and floating warning, the HR-V to the left for scale, from the map's tilt. They turn slowly; hover a card to pause it. The model is fitted to one footprint so only its shape and detail differ. Local files in <code>public/models-test</code>, git-ignored.</p>
      </header>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-4">
        {MODELS.map((m, i) => (
          <figure key={m.file} className="flex flex-col gap-2 rounded-lg border border-(--neutral-500) bg-(--neutral-800) p-3" onPointerEnter={() => (hover.current = i)} onPointerLeave={() => (hover.current = -1)}>
            <canvas ref={(el) => { canvases.current[i] = el }} width={W * 2} height={H * 2} style={{ width: '100%', aspectRatio: `${W} / ${H}` }} className="rounded-sm bg-(--neutral-900)" />
            <figcaption className="flex flex-col gap-0.5">
              <span className="text-body-sm-medium">{m.name}</span>
              <span className="text-meta text-muted-foreground">{m.note}</span>
              <span className="text-meta text-(--neutral-300)">{info[i] ?? 'loading…'}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
