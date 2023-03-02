import { useState } from "react";
import Head from "next/head";
import { MantineProvider, ColorSchemeProvider, Global } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import NProgress from "nprogress";
import { NotificationsProvider } from "@mantine/notifications";
import { SWRConfig } from "swr";
import { Router } from "next/router";
import { theme } from "../theme/extendTheme";
import { styles } from "../theme/styles";
import { globalStyles } from "../theme/globalStyles";

Router.events.on("routeChangeStart", () => NProgress.start());
Router.events.on("routeChangeComplete", () => NProgress.done());
Router.events.on("routeChangeError", () => NProgress.done());

export default function App(props) {
  const { Component, pageProps } = props;
  const [colorScheme, setColorScheme] = useState("light");
  const toggleColorScheme = () =>
    setColorScheme(colorScheme === "dark" ? "light" : "dark");

  return (
    <>
      <Head>
        <link href="/favicon.ico" />
        <title>Openship</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </Head>
      <SWRConfig
        value={{
          // refreshInterval: 3000,
          shouldRetryOnError: (error) => {
            // We skip retrying if the API is returning 404:
            console.log({ error });
            if (error) return false;
            return true;
          },
          fetcher: (resource, init) =>
            fetch(resource, init).then((res) => res.json()),
        }}
      >
        <ColorSchemeProvider
          colorScheme={colorScheme}
          toggleColorScheme={toggleColorScheme}
        >
          <MantineProvider
            withGlobalStyles
            withNormalizeCSS
            theme={{ colorScheme, ...theme }}
            defaultProps={{
              Input: { size: "md" },
              TextInput: { size: "md" },
              PasswordInput: { size: "md" },
              NumberInput: { size: "md" },
              Divider: {
                color:
                  colorScheme === "dark"
                    ? theme.colors.blueGray[8]
                    : theme.colors.blueGray[2],
              },
            }}
            styles={styles}
          >
            <NotificationsProvider>
              <ModalsProvider>
                <Global styles={globalStyles} />
                <Component {...pageProps} />
              </ModalsProvider>
            </NotificationsProvider>
          </MantineProvider>
        </ColorSchemeProvider>
      </SWRConfig>
    </>
  );
}
