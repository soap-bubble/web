import '@soapbubble/style/dist'
import { connect } from 'react-redux'
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import configureStore from './store'
import '../assets/styles/main.scss'

const { store, firstRoute } = configureStore()

const App = ({ component }) => component()
const ConnectedApp = connect(({ page: { path, component } }) => {
  return {
    component,
  }
})(App)

window.onload = () => {
  function render() {
    ReactDOM.render(
      <Provider store={store}>
        <ConnectedApp />
      </Provider>,
      document.getElementById('root'),
    )
  }
  store.dispatch(firstRoute()).then(() => render())
}
