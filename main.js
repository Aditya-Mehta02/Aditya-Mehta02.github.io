import * as THREE from 'three'

let app
let group
let camera, scene, renderer
let positions, colors
let pointCloud
let particles
let particlePositions
let linesMesh

let maxSize = Math.max(window.innerWidth, window.innerHeight)
let minSize = Math.min(window.innerWidth, window.innerHeight)
const r = 800
let particleCount = 200

const maxConnections = 20
const minDistance = 100

console.log(window.innerWidth)

const particleData = []




init()
animate()

function init() {

  app = document.body

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000)
  camera.position.z = minSize

  scene = new THREE.Scene()

  group = new THREE.Group()
  scene.add(group)

  const helper = new THREE.BoxHelper(new THREE.Mesh(new THREE.PlaneGeometry(r, r)))
  helper.material.color.set(0xffffff)
  helper.material.blending = THREE.AdditiveBlending
  helper.material.transparent = true
  group.add(helper)

  const segments = particleCount * particleCount

  positions = new Float32Array(segments * 3)
  colors = new Float32Array(segments * 3)

  const pointMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1,
    blending: THREE.AdditiveBlending,
    transparent: true,
    sizeAttenuation: false
  })

  particles = new THREE.BufferGeometry()
  particlePositions = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount; i++) {
    const x = Math.random() * r - r / 2
    const y = Math.random() * r - r / 2

    particlePositions[i * 3] = x
    particlePositions[i * 3 + 1] = y
    particlePositions[i * 3 + 2] = 0

    particleData.push({
      velocity: new THREE.Vector3(2 * Math.random() - 1, 2 * Math.random() - 1, 0),
      numConnections: 0
    })
  }

  particles.setDrawRange(0, particleCount)
  particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3).setUsage(THREE.DynamicDrawUsage))

  pointCloud = new THREE.Points(particles, pointMaterial)
  group.add(pointCloud)

  const geometry = new THREE.BufferGeometry()

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage))

  geometry.computeBoundingSphere()

  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    transparent: true
  })

  linesMesh = new THREE.LineSegments(geometry, material)
  group.add(linesMesh)

  group.scale.set(maxSize/r, maxSize/r, maxSize/r)

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.outputEncoding = THREE.sRGBEncoding;

  console.log(renderer.domElement);

  window.addEventListener('resize', onWindowResize)

  app.appendChild(renderer.domElement)
}

function onWindowResize() {
  maxSize = Math.max(window.innerWidth, window.innerHeight)
  minSize = Math.min(window.innerWidth, window.innerHeight)
  camera.position.z = minSize
  group.scale.set(maxSize/r, maxSize/r, maxSize/r)

  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

function animate() {
  let vertexpos = 0
  let colorpos = 0
  let numConnected = 0

  for (let i = 0; i < particleCount; i++) {
    particleData[i].numConnections = 0
  }

  for (let i = 0; i < particleCount; i++) {

    particlePositions[i * 3] += particleData[i].velocity.x
    particlePositions[i * 3 + 1] += particleData[i].velocity.y
    particlePositions[i * 3 + 2] += particleData[i].velocity.z

    if (particlePositions[i * 3] < -r / 2 || particlePositions[i * 3] > r / 2) {
      particleData[i].velocity.x = -particleData[i].velocity.x
    }

    if (particlePositions[i * 3 + 1] < -r / 2 || particlePositions[i * 3 + 1] > r / 2) {
      particleData[i].velocity.y = -particleData[i].velocity.y
    }

    if (particlePositions[i * 3 + 2] < -r / 2 || particlePositions[i * 3 + 2] > r / 2) {
      particleData[i].velocity.z = -particleData[i].velocity.z
    }

    if (particleData[i].numConnections >= maxConnections) {
      continue
    }

    for (let j = i + 1; j < particleCount; j++) {

      if (particleData[j].numConnections >= maxConnections) {
        continue
      }

      const dx = particlePositions[i * 3] - particlePositions[j * 3]
      const dy = particlePositions[i * 3 + 1] - particlePositions[j * 3 + 1]
      const dz = particlePositions[i * 3 + 2] - particlePositions[j * 3 + 2]
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (dist < minDistance) {

        particleData[i].numConnections++
        particleData[j].numConnections++

        const alpha = 1.0 - dist / minDistance

        positions[vertexpos++] = particlePositions[i * 3]
        positions[vertexpos++] = particlePositions[i * 3 + 1]
        positions[vertexpos++] = particlePositions[i * 3 + 2]

        positions[vertexpos++] = particlePositions[j * 3]
        positions[vertexpos++] = particlePositions[j * 3 + 1]
        positions[vertexpos++] = particlePositions[j * 3 + 2]

        colors[colorpos++] = alpha
        colors[colorpos++] = alpha
        colors[colorpos++] = alpha

        colors[colorpos++] = alpha
        colors[colorpos++] = alpha
        colors[colorpos++] = alpha

        numConnected++
      }
    }
  }

  linesMesh.geometry.setDrawRange(0, numConnected * 2)
  linesMesh.geometry.attributes.position.needsUpdate = true
  linesMesh.geometry.attributes.color.needsUpdate = true

  pointCloud.geometry.attributes.position.needsUpdate = true

  requestAnimationFrame(animate)
  renderer.render(scene, camera)
  }