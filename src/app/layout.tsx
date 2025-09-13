
'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { UserContext, UserProvider } from '@/context/user-context';
import { useContext } from 'react';
import { hexToHsl } from '@/lib/utils';

// This component now needs to be a client component to access context
function ThemedLayout({ children }: { children: React.ReactNode }) {
  const { student } = useContext(UserContext);

  const themeStyle = student?.themeColors ? `
    :root {
      --background: ${hexToHsl(student.themeColors.background)};
      --primary: ${hexToHsl(student.themeColors.primary)};
      --accent: ${hexToHsl(student.themeColors.accent)};
    }
  ` : '';

  return (
    <html lang="fr">
      <head>
        <title>Classe Magique</title>
        <meta name="description" content="Des exercices amusants et engageants pour développer vos compétences !" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&family=Belleza&display=swap" rel="stylesheet" />
        {themeStyle && <style>{themeStyle}</style>}
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <UserProvider>
      <ThemedLayout>{children}</ThemedLayout>
    </UserProvider>
  );
}
