import { type Metadata } from 'next';
import { Client } from './client';

export const metadata: Metadata = {
  title: 'Morpheus',
  description: 'Morpheus',
};

export default function Home() {
  return <Client />;
}
