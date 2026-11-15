import { MercatorCoordinate, type CustomLayerInterface, type Map as MapLibreMap } from 'maplibre-gl'
import { BufferAttribute, Box3, DoubleSide, CanvasTexture, Color, DirectionalLight, Group, HemisphereLight, Matrix4, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, Scene, Sprite, SpriteMaterial, SRGBColorSpace, Vector3, WebGLRenderer, type Material } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js'

/**
 * Illegal dumping recurrences are 3D too (owner's test, 2026-11-15): three copies of the owner's big rubble pile (`day_183_garbage`, bricks, debris and black bags; from Sketchfab, shrunk to 0.9 MB, textures 1024 px WebP) heaped at the recurrence's center, the whole heap turned a different way for each recurrence.
 * Parking recurrences as real 3D cars (owner's try, 2026-11-15): the owner's 2022 Honda HR-V eHEV model (a Sketchfab download in `models-source/`, shrunk from 50 MB to 1.1 MB for the web with glTF-Transform: about 19,000 vertices, no normals, which three.js recomputes on load), drawn by three.js inside a MapLibre custom layer, so it has volume, is lit, and turns and tilts with the map. Its paint is the model's own "Platinum White Pearl". Each car is kept at a constant size on screen (`heightPx`, the same 28 to 44 px curve as the old flat car), the way the flat markers were. The warning triangle stays a flat upright image on its own layer.
 */
export type SpotKind = 'parking' | 'dumping'
export interface CarSpot { id: string; lng: number; lat: number; status: string; kind: SpotKind }
export interface CarLayerOptions {
  urls: { parking: string; pile: string } // the car, and the one garbage model a dumping recurrence piles up three times
  cars: () => CarSpot[]
  dimmed: (id: string) => boolean
  heightPx: (zoom: number) => number
  heading?: (id: string) => number // radians clockwise from north; none in the data yet, so 0
  badge: (status: string, dim: boolean) => HTMLCanvasElement // the warning triangle's picture (a square canvas)
  badgeFill: number // the share of that canvas the triangle's width takes
  badgePx: (zoom: number) => number // the triangle's width on screen
  dots: () => { id: string; lng: number; lat: number; color: string; open: boolean; pid?: string }[]
  dimDot: (d: { id: string; pid?: string }) => boolean // a stem toned down while another incident or recurrence is open // the report dots of the recurrences, each gets a stem (owner, 2026-11-15)
  selectedDot: () => string | null // the tapped report: its stem draws in front of the other stems
  dotsZoom: number // the zoom from which every recurrence's dots show; the open recurrence's show at any zoom
  statusColor: (status: string) => string // the status color of the warning, for the line below it
}
/** Where a car's floating warning is on screen, in CSS px (for taps). */
export interface BadgeSpot { x: number; y: number; half: number }
/** How high the warning floats, as a multiple of the old height (owner, 2026-11-15: "much higher"). Dev only: `?lift=` tries another value; /#warning-gallery shows the options. */
const LIFT_MULT = import.meta.env.DEV ? Number(new URLSearchParams(location.search).get('lift')) || 4 : 4
const LIFT = 2.2 // the warning floats at this many car heights above the ground (the roof is at 1)

/** The car's size against the old flat car's curve (owner, 2026-11-15: 10 % bigger). */
const SCALE = 1.2
const SCALE_BADGE = 1.1 // the triangle grows with the car
const DUMP_SCALE = 0.3 // a dumping composition is drawn this much bigger than a car on screen: it is low and wide, and its black bags are hard to see (owner, 2026-11-15: 1.5 first, 3 when it looked small, then back to 1.5, half, once the bags were big piles; then 0.75, half again, with one bag; then 0.3)
const FRONT = Math.PI // the HR-V's front faces south in its own file (seen on screen), so turn it half a circle to point north at heading 0

/** A radial blob (owner, 2026-11-15): first softer, then, with the lighting right, less blur: it stays dark to half way out, then falls to nothing over the outer fifth, so the ellipse has a defined edge. */
function shadowTexture(): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  for (const [t, a] of [[0, 0.14], [0.5, 0.13], [0.75, 0.08], [0.9, 0.025], [1, 0]]) r.addColorStop(t, `rgba(0,0,0,${a})`)
  g.fillStyle = r
  g.fillRect(0, 0, 128, 128)
  return new CanvasTexture(c)
}

// The shadows are ellipses stretched along the direction the light throws them, south-east (owner, 2026-11-15: longer, softer, a radial ellipse). In a car's own axes east is -x and south is -z (its front faces south); this turns a shadow's long axis from south toward east.
const SHADOW_TURN = Math.atan2(0.4, 0.6)

/** Fake ambient occlusion: the paint is darker the closer it is to the ground (`minY` and `h` are the model's lowest point and height), the way a real car is dark under the sills and around the wheels. */
const groundShader = (minY: number, h: number) => (shader: { vertexShader: string; fragmentShader: string }) => {
  shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying float vUp;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvUp = position.y;')
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying float vUp;')
    .replace('#include <opaque_fragment>', `gl_FragColor.rgb *= mix(0.2, 1.0, smoothstep(0.0, 0.5, (vUp - ${minY.toFixed(5)}) / ${h.toFixed(5)}));\n#include <opaque_fragment>`)
}

/** A small stable number from an id (the same recurrence always gets the same turn). */
const hash = (id: string) => [...id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7)

export function createCarLayer(o: CarLayerOptions): CustomLayerInterface & { badgeAt: (id: string) => BadgeSpot | undefined; dotLift: (id: string) => { x: number; y: number } | undefined } {
  const lifts = new Map<string, { x: number; y: number }>() // where the top of a dot's stem is, from the dot, on screen (px; y negative is up, x follows the stem's lean)
  const spots = new Map<string, BadgeSpot>()
  const badgeMats = new Map<string, SpriteMaterial>()
  const stripGeometry = new PlaneGeometry(1, 1).translate(0, 0.5, 0) // a strip standing on its bottom edge
  {
    // a gradient along the line (owner, 2026-11-15): clear at the vehicle, solid at the warning
    const y = stripGeometry.getAttribute('position')
    const rgba = new Float32Array(y.count * 4)
    for (let i = 0; i < y.count; i++) rgba.set([1, 1, 1, y.getY(i)], i * 4)
    stripGeometry.setAttribute('color', new BufferAttribute(rgba, 4))
  }
  const stripDown = new PlaneGeometry(1, 1).translate(0, 0.5, 0) // the dot stems fade the other way: solid at the dot, clear at the top
  {
    const y = stripDown.getAttribute('position')
    const rgba = new Float32Array(y.count * 4)
    for (let i = 0; i < y.count; i++) rgba.set([1, 1, 1, 1 - y.getY(i)], i * 4)
    stripDown.setAttribute('color', new BufferAttribute(rgba, 4))
  }
  const dotStems = new Map<string, Group>()
  const stemMats = new Map<string, MeshBasicMaterial>()
  const stemDims = new Map<string, MeshBasicMaterial>()
  const stemDim = (color: string) => {
    let m = stemDims.get(color)
    if (!m) stemDims.set(color, (m = new MeshBasicMaterial({ color, side: DoubleSide, depthTest: false, transparent: true, vertexColors: true, opacity: 0.22 })))
    return m
  }
  const stemMat = (color: string) => {
    let m = stemMats.get(color)
    if (!m) stemMats.set(color, (m = new MeshBasicMaterial({ color, side: DoubleSide, depthTest: false, transparent: true, vertexColors: true })))
    return m
  }
  const badgeMat = (status: string, dim: boolean) => {
    const key = `${status}${dim ? '-dim' : ''}`
    let m = badgeMats.get(key)
    if (!m) {
      const t = new CanvasTexture(o.badge(status, dim))
      t.colorSpace = SRGBColorSpace
      m = new SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false })
      badgeMats.set(key, m)
    }
    return m
  }
  let map: MapLibreMap
  let renderer: WebGLRenderer
  const scene = new Scene()
  const behind = new Scene() // drawn first: the report dots' stems, so a car is always on top of them (owner, 2026-11-15)
  const camera = new PerspectiveCamera()
  const dimOf = new Map<Material, Material>() // each material's toned-down twin
  /** What one kind of recurrence is made of: its model (centered, on the ground, in its own units) and its shadows. */
  interface Template { model: Group; length: number; height: number; width: number; front: number; side: number; lift: number; shadow: Group; contact: Group }
  const templates: Partial<Record<SpotKind, Template>> = {}
  const cars = new Map<string, Group>()

  // sky light from above and a dark bounce from the ground below (the map is dark), so the lower body is dark and the car sits in its place instead of glowing (owner, 2026-11-15: not grounded)
  scene.add(new HemisphereLight(0xdfe6ff, 0x16161c, 1.6))
  const sun = new DirectionalLight(0xffffff, 1.9)
  sun.position.set(-0.4, -0.6, 1) // from above, a little from the north-west, in map space (z up, y south)
  scene.add(sun)

  return {
    badgeAt: (id) => spots.get(id),
    dotLift: (id) => lifts.get(id),
    id: 'problem-cars-3d',
    type: 'custom',
    renderingMode: '3d',
    onAdd(m, gl) {
      map = m
      renderer = new WebGLRenderer({ canvas: m.getCanvas(), context: gl, antialias: true })
      renderer.autoClear = false
      const loader = new GLTFLoader()
      /** Gives a loaded model's materials the look the car got: non-metallic, darker toward the ground, with a toned-down twin; normals are made when the file has none. */
      const prepare = (root: Group) => {
        const pre = new Box3().setFromObject(root)
        root.traverse((n) => {
          const mesh = n as Mesh
          if (!mesh.isMesh) return
          if (!mesh.geometry.getAttribute('normal')) mesh.geometry = toCreasedNormals(mesh.geometry, Math.PI / 5) // the web copy of the car has no normals (smaller); three makes them, smooth on gentle curves and sharp at creases (36°)
          const mat = mesh.material as MeshStandardMaterial
          mat.metalness = 0 // a metallic surface goes black without a reflection map, and the map has no sky to reflect
          mat.roughness = Math.max(mat.roughness, 0.5)
          mat.onBeforeCompile = groundShader(pre.min.y, pre.max.y - pre.min.y) // baked occlusion near the ground
          const d = mat.clone()
          d.onBeforeCompile = mat.onBeforeCompile
          d.color = new Color(mat.color).multiplyScalar(0.3) // the toned-down copy
          dimOf.set(mat, d)
        })
      }
      /** Puts an object on the ground (lowest point at y 0) and returns its size. */
      const seat = (obj: Group) => {
        const box = new Box3().setFromObject(obj)
        obj.position.y -= box.min.y
        return box.getSize(new Vector3())
      }
      const blob = (w: number, l: number, opacity: number) => {
        const flat = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity }))
        flat.rotation.x = -Math.PI / 2
        flat.scale.set(w, l, 1)
        const turned = new Group().add(flat)
        turned.rotation.y = SHADOW_TURN
        return turned
      }
      /** Centers a model, measures it and gives it its shadows. */
      const finish = (root: Group, front: number, side: number, lift: number): Template => {
        const box = new Box3().setFromObject(root)
        const size = box.getSize(new Vector3())
        const mid = box.getCenter(new Vector3())
        root.position.set(-mid.x, -box.min.y, -mid.z)
        const length = Math.max(size.x, size.z)
        // the light comes from the north-west and above (the sun below), so a shadow falls to the south-east, further the higher the thing; in the model's own axes east is -x and south is -z (the car's front faces south in its file)
        const shadow = blob(size.x * 1.9, length * 3.4, 1)
        shadow.position.set(-0.4 * size.y * 1.9, size.y * 0.004, -0.6 * size.y * 1.9)
        const contact = blob(size.x * 1.3, size.z * 1.2, 0.8) // a tight, darker contact shadow right under it (owner, 2026-11-15: "the car flies on top of the map")
        contact.position.set(0, size.y * 0.006, 0)
        return { model: new Group().add(root), length, height: size.y, width: size.x, front, side: side * size.x, lift: lift * size.y * LIFT_MULT, shadow, contact }
      }
      void Promise.all([loader.loadAsync(o.urls.parking), loader.loadAsync(o.urls.pile)]).then(([car, pile]) => {
        for (const g of [car, pile]) prepare(g.scene)
        templates.parking = finish(car.scene, FRONT, 0, LIFT) // the car: east of it by 1.35 car widths (at most 0.45 of its length) and 2.2 car heights up
        // a dumping composition (owner, 2026-11-15: three heaped piles first, then "keep one bag"): one big pile, turned its own way per recurrence
        const comp = new Group()
        const heap = pile.scene.clone(true)
        const sz = new Box3().setFromObject(heap).getSize(new Vector3())
        heap.scale.setScalar(1 / Math.max(sz.x, sz.z))
        seat(heap)
        comp.add(heap)
        templates.dumping = finish(comp, FRONT, 0, 1.7) // turned half a circle like the car, so that in its axes too east is -x and south is -z (shadows and the warning rely on it) // a dumping composition: just east of it and a little over its top
        m.triggerRepaint()
      })
    },
    render(_gl, args) {
      const want = o.cars().filter((c) => templates[c.kind])
      if (!want.length) return
      const ids = new Set(want.map((c) => c.id))
      for (const [id, g] of cars) if (!ids.has(id)) { scene.remove(g); cars.delete(id) }
      const pxBase = o.heightPx(map.getZoom()) * SCALE
      const main = new Matrix4().fromArray(args.defaultProjectionData.mainMatrix) // map space (mercator) to clip space
      const proj = new Matrix4().fromArray(args.projectionMatrix) // camera space to clip space, with the map's own, very deep, near and far planes
      const view = proj.clone().invert().multiply(main) // map space to camera space
      const tilt = new Matrix4().makeRotationX(Math.PI / 2)
      for (const c of want) {
        const t = templates[c.kind]!
        const px = pxBase * (c.kind === 'dumping' ? DUMP_SCALE : 1)
        let g = cars.get(c.id)
        if (!g) {
          g = new Group()
          g.matrixAutoUpdate = false
          const body = t.model.clone(true)
          if (c.kind === 'dumping') body.rotation.y = (hash(c.id) % 628) / 100 // each pile is turned its own way
          g.add(body, t.shadow.clone(), t.contact.clone())
          // a 2 px line in the warning's status color from the model's center up to the warning (owner, 2026-11-15): one thin flat strip (WebGL lines are only 1 px) that turns to face the camera every frame, so it is 2 px wide from any angle, sized every frame
          const stem = new Group()
          stem.name = 'stem'
          stem.renderOrder = 9
          const strip = new Mesh(stripGeometry, stemMat(o.statusColor(c.status)))
          strip.renderOrder = 9
          stem.add(strip)
          g.add(stem)
          const sprite = new Sprite(badgeMat(c.status, false))
          sprite.name = 'badge'
          sprite.renderOrder = 10
          g.add(sprite)
          g.traverse((n) => (n.frustumCulled = false)) // the car's size in map units is tiny; its bounds are not worth testing
          g.userData = { kind: c.kind }
          scene.add(g)
          cars.set(c.id, g)
        }
        const dimmed = o.dimmed(c.id)
        g.traverse((n) => {
          const mesh = n as Mesh
          if (!mesh.isMesh) return
          const orig = (mesh.userData.orig ??= mesh.material) as Material
          if (dimOf.has(orig)) mesh.material = dimmed ? dimOf.get(orig)! : orig
        })
        const sprite = g.getObjectByName('badge') as Sprite
        sprite.material = badgeMat(c.status, dimmed)
        const wUnits = ((o.badgePx(map.getZoom()) * SCALE_BADGE) / o.badgeFill) * (t.length / px) // the triangle's width on screen, in the model's own units
        sprite.scale.set(wUnits, wUnits, 1)
        sprite.position.set(-t.side, t.lift, 0)
        const stem = g.getObjectByName('stem') as Group
        stem.position.set(0, t.height * 0.5, 0)
        stem.scale.set((2 * t.length) / px, t.lift - 0.36 * wUnits - t.height * 0.5, 1) // 2 screen px wide (one px is length / px model units), as long as the climb up to the warning's bottom edge, so it does not show over the triangle (owner, 2026-11-15)
        stem.visible = !dimmed // east is -x in the model's axes
        const mc = MercatorCoordinate.fromLngLat([c.lng, c.lat], 0)
        const metersPerPx = (40075016.686 * Math.cos((c.lat * Math.PI) / 180)) / (512 * 2 ** map.getZoom())
        const s = ((px * metersPerPx) / t.length) * mc.meterInMercatorCoordinateUnits()
        const heading = new Matrix4().makeRotationY(t.front - (o.heading?.(c.id) ?? 0))
        // in camera space, multiplied out in double precision here: the map's own matrix has huge numbers at high zoom, and multiplying them on the GPU (single precision) made the car's corners wobble and speckle at the closest zoom (owner's screenshot)
        g.matrix.copy(view).multiply(new Matrix4().makeTranslation(mc.x, mc.y, 0)).multiply(new Matrix4().makeScale(s, -s, s)).multiply(tilt).multiply(heading)
        g.matrixWorldNeedsUpdate = true // matrixAutoUpdate is off, so three has to be told the matrix changed
        // face the strip toward the camera (the camera is at the origin of camera space): its yaw is where the camera is, seen from the model
        const eye = new Vector3().applyMatrix4(g.matrix.clone().invert())
        ;(g.getObjectByName('stem') as Group).rotation.y = Math.atan2(eye.x, eye.z)
      }
      // a stem on every report dot (owner, 2026-11-15): 2 px wide, solid at the dot and fading up, each its own random height up to half the warning line's; faces the camera like that line
      const parkingT = templates.parking
      const dotList = parkingT ? o.dots().filter((d) => d.open || map.getZoom() >= o.dotsZoom) : []
      const dotIds = new Set(dotList.map((d) => d.id))
      for (const [id, st] of dotStems) if (!dotIds.has(id)) { behind.remove(st); dotStems.delete(id) }
      const dotPos: Vector3[] = []
      for (const d of dotList) {
        let st = dotStems.get(d.id)
        if (!st) {
          st = new Group()
          st.matrixAutoUpdate = false
          const strip = new Mesh(stripDown, stemMat(d.color))
          strip.renderOrder = 9
          strip.frustumCulled = false
          st.add(strip)
          st.userData = { rnd: 0.25 + 0.75 * ((hash(d.id) % 997) / 996) }
          behind.add(st)
          dotStems.set(d.id, st)
        }
        ;(st.children[0] as Mesh).renderOrder = d.id === o.selectedDot() ? 12 : 9
        ;(st.children[0] as Mesh).material = o.dimDot(d) ? stemDim(d.color) : stemMat(d.color)
        const mc = MercatorCoordinate.fromLngLat([d.lng, d.lat], 0)
        const u = (40075016.686 * Math.cos((d.lat * Math.PI) / 180)) / (512 * 2 ** map.getZoom()) * mc.meterInMercatorCoordinateUnits() // one screen px, in map units
        const warnPx = (parkingT!.lift / parkingT!.length) * pxBase // the warning line's height in px
        const h = (warnPx / 2) * (d.id === o.selectedDot() ? 1 : (st.userData.rnd as number)) // the tapped report's stem is the tallest (owner, 2026-11-15), so its pin sits high, not among the other stems
        st.matrix.copy(view).multiply(new Matrix4().makeTranslation(mc.x, mc.y, 0)).multiply(new Matrix4().makeScale(u, -u, u)).multiply(tilt)
        st.matrixWorldNeedsUpdate = true
        const eye = new Vector3().applyMatrix4(st.matrix.clone().invert())
        const strip = st.children[0] as Mesh
        strip.rotation.y = Math.atan2(eye.x, eye.z)
        strip.scale.set(2, h, 1)
        st.userData.h = h
        dotPos.push(new Vector3(mc.x, mc.y, 0))
      }
      // The map's depth range is huge compared with a car, so the car's own panels fought each other (white speckles). Tighten near and far around the cars on screen, which gives the depth buffer far more resolution.
      let near = Infinity
      let far = 0
      for (const c of [...want, ...dotList.map((d) => ({ id: '', lng: d.lng, lat: d.lat }))]) {
        // only the cars on screen count: one behind the camera or far off to the side used to stretch the range, which brought the speckles back at high zoom
        const mc = MercatorCoordinate.fromLngLat([c.lng, c.lat], 0)
        const p = new Vector3(mc.x, mc.y, 0)
        const d = -p.clone().applyMatrix4(view).z
        const clip = p.clone().applyMatrix4(main)
        const on = d > 0 && Math.abs(clip.x) < 1.4 && Math.abs(clip.y) < 1.4
        const g = cars.get(c.id)
        if (g) g.visible = on
        if (!on) continue
        near = Math.min(near, d)
        far = Math.max(far, d)
      }
      if (!Number.isFinite(near)) return
      const n = near * 0.6
      const f = far * 1.6
      proj.elements[10] = -(f + n) / (f - n)
      proj.elements[14] = (-2 * f * n) / (f - n)
      camera.projectionMatrix.copy(proj)
      camera.projectionMatrixInverse.copy(proj).invert()
      sun.position.copy(new Vector3(-0.4, -0.6, 1).transformDirection(view)) // the light is fixed in map space (from above, a little from the north-west), so it is turned into camera space
      // where each floating warning is on screen, for taps
      const cw = map.getCanvas().clientWidth
      const ch = map.getCanvas().clientHeight
      for (const [id, g] of cars) {
        if (!g.visible) { spots.delete(id); continue }
        const t = templates[g.userData.kind as SpotKind]!
        const v = new Vector3(-t.side, t.lift, 0).applyMatrix4(g.matrix).applyMatrix4(camera.projectionMatrix)
        spots.set(id, { x: ((v.x + 1) / 2) * cw, y: ((1 - v.y) / 2) * ch, half: (o.badgePx(map.getZoom()) * SCALE_BADGE) / 2 + 4 })
      }
      // where the top of each dot's stem is, so the tapped incident's pin can ride up to it (owner, 2026-11-15)
      lifts.clear()
      for (const [id, st] of dotStems) {
        const ground = new Vector3(0, 0, 0).applyMatrix4(st.matrix).applyMatrix4(camera.projectionMatrix)
        const top = new Vector3(0, st.userData.h as number, 0).applyMatrix4(st.matrix).applyMatrix4(camera.projectionMatrix)
        lifts.set(id, { x: ((top.x - ground.x) / 2) * cw, y: ((ground.y - top.y) / 2) * ch })
      }
      renderer.resetState()
      renderer.render(behind, camera)
      renderer.render(scene, camera)
    },
  }
}
