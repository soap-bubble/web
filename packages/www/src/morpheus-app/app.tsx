import './runtime';

import { FC } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as SizeProvider } from './hooks/useSize';
import 'morpheus';
import { Game } from 'morpheus/game';
import storeFactory from '../store';
import '../service/firebase';
import useBootMorpheus from './hooks/useBootMorpheus';
const store = storeFactory();

const Content: FC = () => {
  useBootMorpheus();
  return <Game id="root" className="game" />;
};

const App: FC = () => {
  return (
    <ReduxProvider store={store}>
      <SizeProvider>
        <Content />
      </SizeProvider>
    </ReduxProvider>
  );
};

export default App;
