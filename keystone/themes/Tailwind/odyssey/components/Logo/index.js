import { useRawKeystone } from "@keystone/keystoneProvider";
import Link from "next/link";

export const Logo = () => {
  const { adminConfig } = useRawKeystone();

  // console.log({ adminConfig });

  if (adminConfig.components?.Logo) {
    return <adminConfig.components.Logo />;
  }

  return (
    <h3>
      <Link href="/">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" className="w-5 h-5">
            <defs>
              <linearGradient id="logo-a" x1="0%" x2="50%" y1="0%" y2="71.9%">
                <stop offset="0%" stopColor="#5AE8FA" />
                <stop offset="100%" stopColor="#2684FF" />
              </linearGradient>
            </defs>
            <path
              fill="url(#logo-a)"
              fillRule="evenodd"
              d="M290.1 47h117.5c17.8 0 24.3 1.9 30.8 5.3a36.3 36.3 0 0115.1 15.2c3.5 6.5 5.4 13 5.4 30.8v117.4c0 17.9-1.9 24.3-5.4 30.8a36.3 36.3 0 01-15.1 15.2c-6.5 3.4-13 5.3-30.8 5.3H290c-17.8 0-24.3-1.9-30.8-5.3a36.3 36.3 0 01-15.1-15.2c-3.5-6.5-5.3-13-5.3-30.8V98.3c0-17.9 1.8-24.3 5.3-30.8a36.3 36.3 0 0115.1-15.2c6.5-3.4 13-5.3 30.8-5.3zm11.8 56.8V218H327v-36.8l14.4-14.6 34.4 51.4h31.5l-49-69.1 44.7-45.1h-31.3L327 151v-47.3H302z"
              transform="translate(-238.9 -47)"
            />
          </svg>
          <h1 className={`text-xl md:text-xl font-semibold text-center`}>
            Keystone 6
          </h1>
        </div>
      </Link>
    </h3>
  );
};
