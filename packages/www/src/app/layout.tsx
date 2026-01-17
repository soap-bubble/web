import type { ReactNode } from 'react';
import { Providers } from '@/app/providers';

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="en">
    <body
      style={{
        margin: 0,
        padding: 0,
        overflow: 'hidden',
      }}
    >
      <Providers>{children}</Providers>
    </body>
  </html>
);

export default RootLayout;
