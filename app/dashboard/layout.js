"use client";

import { DrawerProvider } from "@keystone/components/Modals";
import { ToastProvider } from "@keystone/components/Toast";
import { UIProvider } from "@keystone/components/UIProvider";
import { KeystoneProvider } from "@keystone/keystoneProvider";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
// import './globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <UIProvider>
        <KeystoneProvider>
          <ToastProvider>
            <DrawerProvider>{children}</DrawerProvider>
          </ToastProvider>
        </KeystoneProvider>
        <ProgressBar
          height="3px"
          color="#0284c7"
          options={{ showSpinner: false }}
          shallowRouting
        />
      </UIProvider>
    </html>
  );
}
