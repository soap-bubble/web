import { type Metadata } from 'next';
import { Client } from './client';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Morpheus',
  description: 'Morpheus',
};

export default function Home() {
  return (
    <Providers>
      <Client />
    </Providers>
  );
}
