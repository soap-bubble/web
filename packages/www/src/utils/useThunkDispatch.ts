import { useDispatch } from 'react-redux';
import type { MorpheusDispatch } from '@soapbubble/morpheus-client';

const useThunkDispatch = () => useDispatch<MorpheusDispatch>();
export default useThunkDispatch;
