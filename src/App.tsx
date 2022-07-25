import { useEffect, useState } from 'react'
import logo from './logo.svg'
import './App.scss'

import * as THREE from 'three'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import Stats from 'stats.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

export type ActionsType = Record<string, {
  weight: number,
  action?: THREE.AnimationAction
}>


const App = () => {

  let camera: THREE.PerspectiveCamera
  let scene: THREE.Scene
  let renderer: THREE.WebGLRenderer
  let controls: OrbitControls

  let currentIntersectObject: THREE.Mesh<THREE.BoxGeometry, THREE.MeshPhongMaterial> | undefined

  let stats: Stats

  let raycaster: THREE.Raycaster

  let clock: THREE.Clock
  let model: THREE.Group
  let mixer: THREE.AnimationMixer
  let numAnimations: number
  const additiveActions: ActionsType = {
    sneak_pose: { weight: 0 },
    sad_pose: { weight: 0 },
    agree: { weight: 0 },
    headShake: { weight: 0 }
  }
  let skeleton: THREE.SkeletonHelper
  let currentObjectName: string

  const allActions: THREE.AnimationAction[] = []

  function init() {
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x282C34)

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100)
    camera.position.set(-3, 3, 3)

    raycaster = new THREE.Raycaster()

    // lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444)
    hemiLight.position.set(0, 20, 0)
    scene.add(hemiLight)

    const dirLight = new THREE.DirectionalLight(0xffffff)
    dirLight.position.set(3, 10, 10)
    scene.add(dirLight)

    const grid = new THREE.GridHelper(20, 40, 0x484848, 0x484848)
    scene.add(grid)

    const axesHelper = new THREE.AxesHelper(5)
    scene.add(axesHelper)

    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.outputEncoding = THREE.sRGBEncoding
    renderer.shadowMap.enabled = true;
    document.querySelector('.App')!.appendChild(renderer.domElement)

    stats = new Stats()
    document.querySelector('.App')!.appendChild(stats.dom);

    window.addEventListener('resize', onWindowResize)

    clock = new THREE.Clock()
    // model
    const loader = new GLTFLoader()
    loader.load(new URL('./models/Xbot.glb', import.meta.url).href, (gltf) => {

      model = gltf.scene
      scene.add(model)

      model.position.set(0, 0, 0)
      model.rotateY(-Math.PI / 4)

      skeleton = new THREE.SkeletonHelper(model)
      console.log('[ qwk-log ] ~ skeleton', skeleton)

      skeleton.visible = true

      // setInterval(() => {
      //   const sk1 = skeleton.bones.find(x => x.name.includes('LeftLeg'))!
      //   sk1.position.x = 1
      //   // sk1.position.y = 0
      //   // sk1.position.z = 0

      //   const { x, y, z } = sk1.position

      //   addCube(0, 0, 0)
      // }, 100)

      scene.add(skeleton)

      const animations = gltf.animations
      mixer = new THREE.AnimationMixer(model)

      numAnimations = animations.length

      for (let i = 0; i !== numAnimations; ++i) {

        let clip = animations[i]
        const name = clip.name

        if (additiveActions[name]) {

          // Make the clip additive and remove the reference frame

          THREE.AnimationUtils.makeClipAdditive(clip)

          if (clip.name.endsWith('_pose')) {

            clip = THREE.AnimationUtils.subclip(clip, clip.name, 2, 3, 30)

          }

          const action = mixer.clipAction(clip)
          activateAction(action)
          additiveActions[name].action = action
          allActions.push(action)

        }

      }

      renderer.render(scene, camera)

      if (skeleton) {
        skeleton.bones.forEach(e => {
          const x = e.matrixWorld.elements.at(-2)!
          const y = e.matrixWorld.elements.at(-3)!
          const z = e.matrixWorld.elements.at(-4)!
          console.log('[ qwk-log ] ~ e', e)
          addCube(x, y, z, e.name)
        });
      }


    }, undefined, (e) => {
      console.error(e)
    })

    controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 1, 0)
    controls.update()
    controls.addEventListener('change', () => {
      renderer.render(scene, camera)
    })

    function animate() {

      requestAnimationFrame(animate)

      if (mixer) {
        const mixerUpdateDelta = clock.getDelta()
        mixer.update(mixerUpdateDelta)
      }
      stats.update()

      renderer.render(scene, camera)
    }

    animate()
  }

  function activateAction(action: THREE.AnimationAction) {
    const clip = action.getClip()
    const settings = additiveActions[clip.name]
    setWeight(action, settings.weight)
    action.play()
  }

  function setWeight(action: THREE.AnimationAction, weight: number) {
    action.enabled = true
    action.setEffectiveTimeScale(1)
    action.setEffectiveWeight(weight)
  }


  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }

  const intersectObjects: THREE.Mesh<THREE.BoxGeometry, THREE.MeshPhongMaterial>[] = []


  function addCube(x: number, y: number, z: number, name: string, type: 'add' | 'set', mesh2?: THREE.Mesh<THREE.BoxGeometry, THREE.MeshPhongMaterial>) {
    if (type === 'set' && mesh2) {
      mesh2.position.set(x, y, z)
      return
    }
    const geometry = new THREE.BoxGeometry(0.05, 0.05, 0.05)
    const material = new THREE.MeshPhongMaterial({
      color: 0xC7FFFF
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(x, y, z)
    mesh.name = name
    scene.add(mesh)

    intersectObjects.push(mesh)
  }


  useEffect(() => {
    init()



    console.log('qwk', skeleton)


    // addCube(1, 1, 0)


    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    renderer.domElement.addEventListener('mousedown', event => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(intersectObjects, true)

      if (intersects.length > 0) {
        const object = intersects[0].object as THREE.Mesh<THREE.BoxGeometry, THREE.MeshPhongMaterial>

        currentIntersectObject = object

        object.material.color.set(0xff0000)

        currentObjectName = object.name

        // object.scale.multiplyScalar(0.9)

      } else {
        currentIntersectObject && currentIntersectObject.material.color.set(0xffffff)
        currentIntersectObject = undefined
      }
    })

    document.addEventListener('wheel', (event) => {
      if (currentIntersectObject) {
        // const scaleFactor = 0.001
        // const scale = 1 + (event as any).wheelDelta * scaleFactor
        // intersectObjects[0].scale.multiplyScalar(scale)


      }
    })

    let lastX: number | null = null;
    renderer.domElement.addEventListener("mousedown", (event) => {
      lastX = event.clientX
      if (currentIntersectObject) {
        controls.enabled = false
      }
    })

    renderer.domElement.addEventListener("mousemove", (event) => {
      if (lastX && currentIntersectObject) {
        let delta = event.clientX - lastX
        intersectObjects[0].rotateY(delta * 0.01)

        const RightUpLeg = skeleton.bones.find(x => x.name.includes(currentObjectName))!
        // RightUpLeg.rotation.x = delta * 0.01
        // RightUpLeg.rotation.y = delta * 0.01
        RightUpLeg.rotation.z = delta * 0.01
      }
    })

    renderer.domElement.addEventListener("mouseup", (event) => {
      lastX = null
      controls.enabled = true

      if (skeleton) {
        skeleton.bones.forEach((e, i) => {
          const x = e.matrixWorld.elements.at(-2)!
          const y = e.matrixWorld.elements.at(-3)!
          const z = e.matrixWorld.elements.at(-4)!
          console.log('qwk', intersectObjects[i])
          addCube(x, y, z, '', 'set', intersectObjects[i])
        });
      }
    })

  }, [])

  return (
    <div className="App">
      <img src={logo} className="App-logo" alt="logo" />
    </div>
  )
}

export default App
