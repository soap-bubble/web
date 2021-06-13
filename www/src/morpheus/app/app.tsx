import { FC } from "react";
import { Provider } from "react-redux";
import "morpheus";
import { Game } from "morpheus/game";
import storeFactory from "../../store";
import "../../service/firebase";
import useBootMorpheus from "./hooks/useBootMorpheus";
const store = storeFactory();

const Content: FC = () => {
  useBootMorpheus();
  return <Game id="root" className="game" />;
};

const App: FC = () => {
  return (
    <Provider store={store}>
      <Content />
    </Provider>
  );
};

export default App;
