import { KeystoneProvider } from "@keystone/keystoneProvider";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { ViewTransitions } from "next-view-transitions";
import { DrawerProvider } from "../Modals";
import { ToastProvider } from "../Toast";
import { UIProvider } from "../UIProvider";

export function OuterLayout({ children }) {
  return (
    <ViewTransitions>
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
    </ViewTransitions>
  );
}
