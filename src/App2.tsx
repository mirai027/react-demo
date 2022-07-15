import { useEffect, useState } from 'react'
import logo from './logo.svg'
import './App.scss'

import * as THREE from 'three'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader"
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"

const App = () => {

  let camera: THREE.PerspectiveCamera
  let scene: THREE.Scene
  let renderer: THREE.WebGLRenderer
  let clock: THREE.Clock
  let model: THREE.Group
  let mixer: THREE.AnimationMixer
  const actions: Record<string, THREE.AnimationAction> = {}

  function init() {
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 100)
    camera.position.set(- 5, 3, 10)
    camera.lookAt(new THREE.Vector3(0, 2, 0))

    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x282C34)
    // scene.fog = new THREE.Fog(0xe0e0e0, 20, 12)

    clock = new THREE.Clock()


    // lights
    // const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444)
    // hemiLight.position.set(0, 20, 0)
    // scene.add(hemiLight)

    const dirLight = new THREE.DirectionalLight(0xffffff)
    dirLight.position.set(0, 20, 10)
    scene.add(dirLight)

    // ground
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshPhongMaterial({ color: 0x3C3C3C, depthWrite: false }))
    mesh.rotation.x = - Math.PI / 2
    scene.add(mesh)

    const grid = new THREE.GridHelper(20, 40, 0x484848, 0x484848)
    scene.add(grid)

    // model

    const loader = new GLTFLoader()
    loader.load(new URL('./models/RobotExpressive.glb', import.meta.url).href, (gltf) => {

      model = gltf.scene
      scene.add(model)

      renderer.render(scene, camera)

      createAnimation(model, gltf.animations)

    }, undefined, (e) => {

      console.error(e)

    })


    const axesHelper = new THREE.AxesHelper(5)
    scene.add(axesHelper)

    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.outputEncoding = THREE.sRGBEncoding
    document.querySelector('.App')!.appendChild(renderer.domElement)

    renderer.render(scene, camera)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.addEventListener('change', () => {
      renderer.render(scene, camera)
    })
  }

  function createAnimation(model: THREE.Group, animations: THREE.AnimationClip[]) {
    mixer = new THREE.AnimationMixer(model)

    for (let i = 0; i < animations.length; i++) {
      const clip = animations[i]
      const action = mixer.clipAction(clip)
      actions[clip.name] = action

      action.clampWhenFinished = true
      action.loop = THREE.LoopOnce
    }
  }

  function animate() {
    const dt = clock.getDelta()
    if (mixer) mixer.update(dt)
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
  }

  function dance() {
    actions['Sitting'].time = 2
    // if (actions['Sitting'].paused) {
    //   actions['Sitting'].stop()
    // }
    // actions['Sitting'].play()
  }

  useEffect(() => {
    init()
    animate()
  }, [])

  return (
    <div className="App">
      <img src={logo} className="App-logo" alt="logo" onClick={dance} />
    </div>
  )
}

export default App
