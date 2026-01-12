import type { ReactNode } from 'react';

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="en">
    <body
      style={{
        margin: 0,
        padding: 0,
        overflow: 'hidden',
      }}
    >
      {children}
    </body>
  </html>
);

export default RootLayout;
