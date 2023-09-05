"use client";

import { DrawerProvider } from "@keystone/components/Modals";
import { ToastProvider } from "@keystone/components/Toast";
import { UIProvider } from "@keystone/components/UIProvider";
import { KeystoneProvider } from "@keystone/keystoneProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <UIProvider>
          <KeystoneProvider>
            <ToastProvider>
              <DrawerProvider>{children}</DrawerProvider>
            </ToastProvider>
          </KeystoneProvider>
        </UIProvider>
      </body>
    </html>
  );
}
