import { useEffect, useState } from 'react'
import logo from './logo.svg'
import './App.scss'

import * as THREE from 'three'

const App = () => {

  function createRender(domElement: HTMLElement) {
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10)
    camera.position.z = 1

    const scene = new THREE.Scene()

    const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2)
    const material = new THREE.MeshNormalMaterial({})

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    const point = new THREE.PointLight(0xffffff)
    point.position.set(400, 200, 300)
    scene.add(point)

    const ambient = new THREE.AmbientLight(0xfff)
    scene.add(ambient)

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
