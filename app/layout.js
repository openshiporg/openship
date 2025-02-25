import { OuterLayout } from "@keystone/screens";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function Layout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <OuterLayout>{children}</OuterLayout>
      </body>
    </html>
  );
}
