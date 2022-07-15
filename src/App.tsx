import { useEffect, useState } from 'react'
import logo from './logo.svg'
import './App.scss'

import * as THREE from 'three'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader"
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import GUI, { Controller } from 'lil-gui'
import Stats from 'stats.js'

export type ActionsType = Record<string, {
  weight: number,
  action?: THREE.AnimationAction
}>

const App = () => {

  let camera: THREE.PerspectiveCamera
  let scene: THREE.Scene
  let renderer: THREE.WebGLRenderer
  let clock: THREE.Clock
  let model: THREE.Group
  let mixer: THREE.AnimationMixer

  let numAnimations: number

  const allActions: THREE.AnimationAction[] = []
  let currentBaseAction = 'idle'
  const baseActions: ActionsType = {
    idle: { weight: 1 },
    walk: { weight: 0 },
    run: { weight: 0 }
  }
  const additiveActions: ActionsType = {
    sneak_pose: { weight: 0 },
    sad_pose: { weight: 0 },
    agree: { weight: 0 },
    headShake: { weight: 0 }
  }

  let stats: Stats
  let panelSettings: Record<string, number | (() => void)>

  const crossFadeControls: any[]= []

  function init() {
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100)
    camera.position.set(-3, 3, 3)

    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x282C34)

    clock = new THREE.Clock()

    // lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444)
    hemiLight.position.set(0, 20, 0)
    scene.add(hemiLight)

    const dirLight = new THREE.DirectionalLight(0xffffff)
    dirLight.position.set(3, 10, 10)
    dirLight.castShadow = true
    dirLight.shadow.camera.top = 2
    dirLight.shadow.camera.bottom = - 2
    dirLight.shadow.camera.left = - 2
    dirLight.shadow.camera.right = 2
    dirLight.shadow.camera.near = 0.1
    dirLight.shadow.camera.far = 40
    scene.add(dirLight)

    const grid = new THREE.GridHelper(20, 40, 0x484848, 0x484848)
    scene.add(grid)

    // model
    const loader = new GLTFLoader()
    loader.load(new URL('./models/Xbot.glb', import.meta.url).href, (gltf) => {

      model = gltf.scene
      scene.add(model)

      const skeleton = new THREE.SkeletonHelper(model)
      skeleton.visible = true
      scene.add(skeleton)

      const animations = gltf.animations
      mixer = new THREE.AnimationMixer(model)

      numAnimations = animations.length

      for (let i = 0; i !== numAnimations; ++i) {

        let clip = animations[i]
        const name = clip.name

        if (baseActions[name]) {

          const action = mixer.clipAction(clip)
          activateAction(action)
          baseActions[name].action = action
          allActions.push(action)

        } else if (additiveActions[name]) {

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

      createPanel()

      animate()

      renderer.render(scene, camera)

    }, undefined, (e) => {
      console.error(e)
    })


    const axesHelper = new THREE.AxesHelper(5)
    scene.add(axesHelper)

    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.outputEncoding = THREE.sRGBEncoding
    renderer.shadowMap.enabled = true;
    document.querySelector('.App')!.appendChild(renderer.domElement)

    renderer.render(scene, camera)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 1, 0)
    controls.update()
    controls.addEventListener('change', () => {
      renderer.render(scene, camera)
    })

    stats = new Stats();
    document.querySelector('.App')!.appendChild(stats.dom);

    window.addEventListener('resize', onWindowResize)
  }

  function activateAction(action: THREE.AnimationAction) {
    const clip = action.getClip()
    const settings = baseActions[clip.name] || additiveActions[clip.name]
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

  function createPanel() {
    const panel = new GUI({ width: 310 })
    // const folder1 = panel.addFolder('Base Actions')
    const folder2 = panel.addFolder('Additive Action Weights')
    const folder3 = panel.addFolder('General Speed')

    panelSettings = {
      'modify time scale': 1.0
    }

    const baseNames = ['None', ...Object.keys(baseActions)]

    for (let i = 0, l = baseNames.length; i !== l; ++i) {

      const name = baseNames[i];
      const settings = baseActions[name];
      panelSettings[name] = function () {

        const currentSettings = baseActions[currentBaseAction];
        const currentAction = currentSettings ? currentSettings.action : null;
        const action = settings ? settings.action : null;

        if (currentAction !== action) {

          prepareCrossFade(currentAction, action, 0.35);

        }

      };

      // crossFadeControls.push(folder1.add(panelSettings, name));

    }

    for (const name of Object.keys(additiveActions)) {

      const settings = additiveActions[name];

      panelSettings[name] = settings.weight;
      folder2.add(panelSettings, name, 0.0, 1.0, 0.01).listen().onChange(function (weight: number) {

        setWeight(settings.action!, weight);
        settings.weight = weight;

      });

    }

    folder3.add(panelSettings, 'modify time scale', 0.0, 1.5, 0.01).onChange(modifyTimeScale);

    // folder1.open();
    folder2.open();
    folder3.open();

    crossFadeControls.forEach(function (control) {

      control.setInactive = function () {

        control.domElement.classList.add('control-inactive');

      };

      control.setActive = function () {

        control.domElement.classList.remove('control-inactive');

      };

      const settings = baseActions[control.property];

      if (!settings || !settings.weight) {

        control.setInactive();

      }

    });

  }

  function modifyTimeScale(speed: number) {
    mixer.timeScale = speed;
  }


  function prepareCrossFade(startAction: any, endAction: any, duration: any) {

    // If the current action is 'idle', execute the crossfade immediately;
    // else wait until the current action has finished its current loop

    if (currentBaseAction === 'idle' || !startAction || !endAction) {

      executeCrossFade(startAction, endAction, duration);

    } else {

      synchronizeCrossFade(startAction, endAction, duration);

    }

    // Update control colors

    if (endAction) {

      const clip = endAction.getClip();
      currentBaseAction = clip.name;

    } else {

      currentBaseAction = 'None';

    }

    crossFadeControls.forEach(function (control) {

      const name = control.property;

      if (name === currentBaseAction) {

        control.setActive();

      } else {

        control.setInactive();

      }

    });

  }

  function executeCrossFade(startAction: any, endAction: any, duration: any) {

    // Not only the start action, but also the end action must get a weight of 1 before fading
    // (concerning the start action this is already guaranteed in this place)

    if (endAction) {

      setWeight(endAction, 1);
      endAction.time = 0;

      if (startAction) {

        // Crossfade with warping

        startAction.crossFadeTo(endAction, duration, true);

      } else {

        // Fade in

        endAction.fadeIn(duration);

      }

    } else {

      // Fade out

      startAction.fadeOut(duration);

    }

  }

  function synchronizeCrossFade(startAction: any, endAction: any, duration: any) {

    mixer.addEventListener('loop', onLoopFinished);

    function onLoopFinished(event: any) {

      if (event.action === startAction) {

        mixer.removeEventListener('loop', onLoopFinished);

        executeCrossFade(startAction, endAction, duration);

      }

    }

  }

  function animate() {

    // Render loop

    requestAnimationFrame(animate);

    for (let i = 0; i !== numAnimations; ++i) {

      const action = allActions[i];
      const clip = action.getClip();
      const settings = baseActions[clip.name] || additiveActions[clip.name];
      settings.weight = action.getEffectiveWeight();

    }

    // Get the time elapsed since the last frame, used for mixer update

    const mixerUpdateDelta = clock.getDelta();

    // Update the animation mixer, the stats panel, and render this frame

    mixer.update(mixerUpdateDelta);

    stats.update();

    renderer.render(scene, camera);

  }

  useEffect(() => {
    init()
  }, [])

  return (
    <div className="App">
      <img src={logo} className="App-logo" alt="logo" />
    </div>
  )
}

export default App
