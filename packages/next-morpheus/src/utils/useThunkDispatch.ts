import { useDispatch } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { AnyAction } from "redux";

const useThunkDispatch = () =>
  useDispatch<ThunkDispatch<any, any, AnyAction>>();
export default useThunkDispatch;
