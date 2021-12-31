import { FC } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { Provider as SceneProvider } from './hooks/useScene';
import { Provider as SizeProvider } from './hooks/useSize';
import "morpheus";
import { Game } from "morpheus/game";
import storeFactory from "../../store";
import "../../service/firebase";
import useBootMorpheus from "./hooks/useBootMorpheus";
const store = storeFactory();

const Content: FC = () => {
  
  return <Game id="root" className="game" />;
};

const App: FC = () => {
  return (
    <ReduxProvider store={store}>
      <SceneProvider>
        <SizeProvider>
          <Content />
        </SizeProvider>
      </SceneProvider>
    </ReduxProvider>
  );
};

export default App;
