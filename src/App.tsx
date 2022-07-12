import { useEffect, useState } from 'react'
import logo from './logo.svg'
import './App.scss'

import * as THREE from 'three'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader"

const App = () => {

  function createRender(domElement: HTMLElement) {
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10)
    camera.position.z = 1

    const scene = new THREE.Scene()

    const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2)

    const material = new THREE.MeshLambertMaterial({
      color: 0xff0000
    })

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    const point = new THREE.PointLight(0xffffff)
    point.position.set(400, 200, 300)
    scene.add(point)

    const ambient = new THREE.AmbientLight(0x404040)
    scene.add(ambient)

    const loader = new OBJLoader();

    // load a resource
    loader.load(
      // resource URL
      new URL('./azhe.obj', import.meta.url).href,
      // called when resource is loaded
      function (object) {

        scene.add(object);

      },
      // called when loading is in progresses
      function (xhr) {

        console.log((xhr.loaded / xhr.total * 100) + '% loaded');

      },
      // called when loading has errors
      function (error) {

        console.log('An error happened');

      }
    );


    const axesHelper = new THREE.AxesHelper(5)
    scene.add(axesHelper)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setAnimationLoop(animation)
    renderer.setClearColor(0x282c34, 1)
    domElement.appendChild(renderer.domElement)

    function animation(time: number) {
      mesh.rotation.x = time / 2000
      mesh.rotation.y = time / 1000
      renderer.render(scene, camera)
    }

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.addEventListener('change', () => {
      renderer.render(scene, camera)
    })
  }

  useEffect(() => {
    createRender(document.querySelector('.App')!)
  }, [])

  return (
    <div className="App">
      <img src={logo} className="App-logo" alt="logo" />
    </div>
  )
}

export default App
