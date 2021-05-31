import { UndirectedGraph } from 'graphology'
import randomLayout from 'graphology-layout/random'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import { WebGLRenderer } from 'sigma'
import axios from 'axios'
import { ACTION_TYPES } from 'morpheus/constants'

import '../css/browser.scss'

const root = document.getElementById('root')
root.style.width = `${window.innerWidth}px`
root.style.height = `${window.innerHeight}px`
const graph = new UndirectedGraph()

const SCENE_CHANGE_TYPES = ['DissolveTo', 'ChangeScene']
function actionType(cast) {
  const { type } = cast
  return ACTION_TYPES[type]
}

function isChangeSceneType(cast) {
  return SCENE_CHANGE_TYPES.indexOf(actionType(cast)) !== -1
}

function isSceneWithNextScene(cast) {
  return cast.nextSceneId
}

const nextSceneIdFromCast = ({ param1: nextSceneId1, nextSceneId }) =>
  nextSceneId || nextSceneId1

function findCastsWithChangeSceneType(scene) {
  return scene.casts.filter(isChangeSceneType)
}

function findCastsWithNextSceneId(scene) {
  return scene.casts.filter(isSceneWithNextScene)
}

function withScenes(scenes) {
  const selfie = {
    findScene(sceneId) {
      const numScene = Number(sceneId)
      return scenes.find(scene => scene.sceneId === numScene)
    },
    nextChildren(scene) {
      const hotspotSceneChilds = findCastsWithChangeSceneType(scene)
      const nextSceneChilds = findCastsWithNextSceneId(scene)
      return hotspotSceneChilds.concat(nextSceneChilds).map(nextSceneIdFromCast)
    },
    addChildren(parent, node) {
      graph.mergeNode(parent, {
        label: parent,
        size: 15,
      })
      const children = selfie.nextChildren(node).map(nextSceneIdFromCast)
      children.map(String).forEach(label => {
        graph.mergeNode(label, {
          label,
          scene: selfie.findScene(label),
          size: 15,
        })
        graph.mergeEdge(parent, label)
      })
    },
  }
  return selfie
}

axios.get('/api/scenes').then(({ data: scenes }) => {
  const ws = withScenes(scenes)
  const scene = ws.findScene(7099)

  ws.addChildren(scene.sceneId, scene)
  ws.nextChildren(scene.sceneId)
    .map(ws.findScene)
    .forEach(node => ws.addChildren(scene.sceneId, node))

  randomLayout.assign(graph)
  forceAtlas2.assign(graph, {
    iterations: 5,
    settings: forceAtlas2.inferSettings(graph),
  })

  const renderer = new WebGLRenderer(graph, root)

  renderer.on('clickNode', ({ node }) => {
    withScenes(scenes).addChildren(node, graph.getNodeAttribute(node, 'scene'))
    randomLayout.assign(graph)
    forceAtlas2.assign(graph, {
      iterations: 5,
      settings: forceAtlas2.inferSettings(graph),
    })
  })
})
