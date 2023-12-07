import React, { useState } from "react";
import {
  createStyles,
  Navbar,
  UnstyledButton,
  Tooltip,
  Title,
  Box,
  Badge,
  Group,
  ActionIcon,
  useMantineColorScheme,
  useMantineTheme,
  Divider,
  Breadcrumbs,
  Menu,
  Skeleton,
  Stack,
  Popper,
  Center,
  Paper,
  Code,
  Button,
  Text,
  Burger,
  Transition,
} from "@mantine/core";

import {
  GlobeIcon,
  IssueReopenedIcon,
  StackIcon,
  ContainerIcon,
  SunIcon,
  MoonIcon,
  PackageIcon,
  PlusIcon,
  SignOutIcon,
  KeyIcon,
  CopyIcon,
  SyncIcon,
  CheckIcon,
  ChevronDownIcon,
} from "@primer/octicons-react";
import { LogoIconSVG } from "@svg";
import { useRouter } from "next/router";
import Link from "next/link";
import { SHOPS_QUERY } from "@graphql/shops";
import { CHANNELS_QUERY } from "@graphql/channels";
import { gqlFetcher } from "keystone/lib/gqlFetcher";
import useSWR from "swr";
import { CreateShopView } from "./CreateViews/CreateShopView";
import { CreateChannelView } from "./CreateViews/CreateChannelView";
import { CreateOrderView } from "./CreateViews/CreateOrderView";
import { CreateMatchView } from "./CreateViews/CreateMatchView";
import request, { gql } from "graphql-request";
import { useClipboard, useClickOutside } from "@mantine/hooks";
import { useNotifications } from "@mantine/notifications";
import { useModals } from "@mantine/modals";
import { useSharedState } from "keystone/lib/useSharedState";

const HEADER_SIZE = 50;

const useStyles = createStyles((theme, { opened }) => ({
  wrapper: {
    display: "flex",
    flex: 1,
  },

  aside: {
    flex: "0 0 60px",
    backgroundColor:
      theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    borderRight: `1px solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.colors.gray[3]
    }`,
  },

  main: {
    flex: 1,
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.colors.dark[6]
        : theme.colors.gray[0],
  },

  mainLink: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color:
      theme.colorScheme === "dark"
        ? theme.colors.dark[0]
        : theme.colors.gray[7],

    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[5]
          : theme.colors.gray[0],
    },
  },

  mainLinkActive: {
    "&, &:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.fn.rgba(theme.colors[theme.primaryColor][9], 0.25)
          : theme.colors[theme.primaryColor][0],
      color:
        theme.colors[theme.primaryColor][theme.colorScheme === "dark" ? 4 : 7],
    },
  },

  title: {
    boxSizing: "border-box",
    fontFamily: `Greycliff CF, ${theme.fontFamily}`,
    marginBottom: theme.spacing.xl,
    backgroundColor:
      theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
    padding: theme.spacing.md,
    paddingTop: 18,
    height: 60,
    borderBottom: `1px solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.colors.gray[3]
    }`,
  },

  logo: {
    boxSizing: "border-box",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    height: 60,
    paddingTop: theme.spacing.md,
    borderBottom: `1px solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.colors.gray[3]
    }`,
    marginBottom: theme.spacing.xl,
  },

  link: {
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
    borderTopRightRadius: theme.radius.sm,
    borderBottomRightRadius: theme.radius.sm,
    color:
      theme.colorScheme === "dark"
        ? theme.colors.dark[0]
        : theme.colors.gray[7],
    padding: `0 ${theme.spacing.md}px`,
    marginTop: 2,
    fontSize: theme.fontSizes.sm,
    marginRight: theme.spacing.md,
    height: 44,
    lineHeight: "44px",
    textTransform: "uppercase",
    fontWeight: 700,
    letterSpacing: 0.4,
    cursor: "pointer",
    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[5]
          : theme.colors.gray[1],
      color: theme.colorScheme === "dark" ? theme.white : theme.black,
    },
  },

  linkActive: {
    "&, &:hover": {
      borderLeftColor:
        theme.colors[theme.primaryColor][theme.colorScheme === "dark" ? 7 : 5],
      backgroundImage:
        theme.colorScheme === "dark"
          ? `linear-gradient(to right, #1A1B1E, ${theme.colors.dark[6]})`
          : `linear-gradient(to right, #fff, ${theme.colors.blue[2]})`,
      color: theme.colors.blue[6],
      border: `1px solid ${
        theme.colors[theme.colorScheme === "dark" ? "dark" : "blue"][
          theme.colorScheme === "dark" ? 5 : 1
        ]
      }`,
      borderLeft: "none",
    },
  },

  mobileLink: {
    display: "block",
    lineHeight: 1,
    padding: "8px 12px",
    borderRadius: theme.radius.sm,
    textDecoration: "none",
    color:
      theme.colorScheme === "dark"
        ? theme.colors.dark[0]
        : theme.colors.gray[7],
    fontSize: theme.fontSizes.sm,
    textTransform: "uppercase",
    fontWeight: 700,
    letterSpacing: 0.3,
    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[6]
          : theme.colors.gray[2],
    },

    [theme.fn.smallerThan("sm")]: {
      borderRadius: 0,
      padding: theme.spacing.md,
    },
  },

  mobileLinkActive: {
    "&, &:hover": {
      backgroundColor: theme.fn.variant({
        variant: "light",
        color: theme.primaryColor,
      }).background,
      color: theme.fn.variant({ variant: "light", color: theme.primaryColor })
        .color,
    },
  },

  dropdown: {
    position: "absolute",
    top: HEADER_SIZE,
    left: 0,
    right: 0,
    zIndex: 0,
    borderTopRightRadius: 0,
    borderTopLeftRadius: 0,
    borderTopWidth: 0,
    overflow: "hidden",

    [theme.fn.largerThan("sm")]: {
      display: "none",
    },
  },
}));

export const mainLinksMockdata = [
  { icon: GlobeIcon, label: "Orders", href: "/" },
  { icon: ContainerIcon, label: "Products", href: "/products" },
  { icon: PackageIcon, label: "Shops", href: "/shops" },
  { icon: StackIcon, label: "Channels", href: "/channels" },
];

export function AppShell({
  loadingTabs,
  data,
  activeTab,
  setActiveTab,
  children,
}) {
  const [navMode, setNavMode] = useState(null);
  const [showModal, setShowModal] = useSharedState("createModal", false);
  const router = useRouter();

  const toggle = (value) => {
    if (value === navMode) {
      setNavMode(null);
    } else {
      setNavMode(value);
    }
  };

  const ref = useClickOutside(() => setNavMode(null));

  const { classes, cx } = useStyles({});

  const { data: shopData } = useSWR(SHOPS_QUERY, gqlFetcher);

  const { data: channelData, error } = useSWR(CHANNELS_QUERY, gqlFetcher);

  const theme = useMantineTheme();

  const { toggleColorScheme } = useMantineColorScheme();

  const createModals = {
    Order: (
      <CreateOrderView
        showModal={showModal}
        setShowModal={setShowModal}
        shopData={shopData}
        channelData={channelData}
      />
    ),
    Shop: <CreateShopView showModal={showModal} setShowModal={setShowModal} />,
    Channel: (
      <CreateChannelView showModal={showModal} setShowModal={setShowModal} />
    ),
    Match: (
      <CreateMatchView
        showModal={showModal}
        setShowModal={setShowModal}
        shopData={shopData}
        channelData={channelData}
      />
    ),
  };

  const active = mainLinksMockdata.find(
    (item) => item.href === router?.pathname
  );

  const mainLinks = mainLinksMockdata.map((link) => (
    <Tooltip
      label={link.label}
      position="right"
      transitionDuration={0}
      key={link.label}
    >
      <Link href={link.href} passHref legacyBehavior>
        <UnstyledButton
          // onClick={() => setActive(link.label)}
          component="a"
          className={cx(classes.mainLink, {
            [classes.mainLinkActive]: router?.pathname === link.href,
          })}
          my={3}
        >
          <link.icon />
        </UnstyledButton>
      </Link>
    </Tooltip>
  ));

  const links = data?.map(({ label, count }, index) => (
    <a
      className={cx(classes.link, {
        [classes.linkActive]: activeTab === index,
      })}
      onClick={(event) => {
        event.preventDefault();
        setActiveTab(index);
      }}
      key={index}
    >
      {label}
      {(count || count === 0) && <Badge ml="auto">{count}</Badge>}
    </a>
  ));

  const NavigationMap = {
    primary: mainLinksMockdata.map((link, index) => (
      <Link key={link.label} href={link.href} passHref legacyBehavior>
        <a
          // href={link.href}
          className={cx(classes.mobileLink, {
            [classes.mobileLinkActive]: active.href === link.href,
          })}
        >
          <Box component={link.icon} size={12} mr={12} mb={2} />
          {link.label}
        </a>
      </Link>
    )),
    secondary: data.map((link, index) => (
      <a
        key={link.label}
        className={cx(classes.mobileLink, {
          [classes.mobileLinkActive]: index === activeTab,
        })}
        onClick={() => {
          setActiveTab(index);
          setNavMode(null);
        }}
      >
        {link.label}
        {(link?.count || link.count === 0) && (
          <Badge
            size="sm"
            ml="xl"
            color={index === activeTab ? "blue" : "gray"}
            variant={index === activeTab ? "filled" : "light"}
          >
            {link.count}
          </Badge>
        )}
      </a>
    )),
  };

  const signOut = async () => {
    await request(
      "/api/graphql",
      gql`
        mutation {
          endSession
        }
      `
    );
    router.push("/signin");
  };

  return (
    <Group spacing={0}>
      {createModals[showModal]}
      <Navbar
        width={{ sm: data || loadingTabs ? 350 : 0 }}
        sx={{
          [theme.fn.smallerThan("sm")]: { display: "none" },
        }}
      >
        <Navbar.Section grow className={classes.wrapper}>
          <div className={classes.aside}>
            <div className={classes.logo}>
              <Box>
                <LogoIconSVG
                  color={
                    theme.colorScheme === "dark"
                      ? theme.colors.gray[4]
                      : theme.colors.blueGray[5]
                  }
                  width={30}
                />
              </Box>
            </div>
            {mainLinks}
            <Stack mt="auto" my={20}>
              <KeyPopper />

              <Tooltip
                label="Admin UI"
                position="right"
                transitionDuration={0}
                color="green"
              >
                <Link href="/dashboard" passHref legacyBehavior>
                  <ActionIcon
                    variant="light"
                    size={28}
                    color="green"
                    radius="sm"
                    p={4}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8 15C7.44772 15 7 15.4477 7 16C7 16.5523 7.44772 17 8 17C8.55228 17 9 16.5523 9 16C9 15.4477 8.55228 15 8 15Z"
                        fill="currentColor"
                      />
                      <path
                        d="M11 16C11 15.4477 11.4477 15 12 15C12.5523 15 13 15.4477 13 16C13 16.5523 12.5523 17 12 17C11.4477 17 11 16.5523 11 16Z"
                        fill="currentColor"
                      />
                      <path
                        d="M16 15C15.4477 15 15 15.4477 15 16C15 16.5523 15.4477 17 16 17C16.5523 17 17 16.5523 17 16C17 15.4477 16.5523 15 16 15Z"
                        fill="currentColor"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M4 3C2.34315 3 1 4.34315 1 6V18C1 19.6569 2.34315 21 4 21H20C21.6569 21 23 19.6569 23 18V6C23 4.34315 21.6569 3 20 3H4ZM20 5H4C3.44772 5 3 5.44772 3 6V7H21V6C21 5.44772 20.5523 5 20 5ZM3 18V9H21V18C21 18.5523 20.5523 19 20 19H4C3.44772 19 3 18.5523 3 18Z"
                        fill="currentColor"
                      />
                    </svg>
                  </ActionIcon>
                </Link>
              </Tooltip>
              <Tooltip
                label="GraphQL Playground"
                position="right"
                transitionDuration={0}
                color="pink"
              >
                <Link href="/api/graphql" passHref legacyBehavior>
                  <ActionIcon
                    variant="light"
                    size={28}
                    color="pink"
                    radius="sm"
                    p={4}
                  >
                    <svg
                      version="1.1"
                      id="GraphQL_Logo"
                      x="0px"
                      y="0px"
                      viewBox="0 0 400 400"
                      width="100%"
                      hwight="100%"
                    >
                      <g>
                        <g>
                          <g>
                            <rect
                              x="122"
                              y="-0.4"
                              transform="matrix(-0.866 -0.5 0.5 -0.866 163.3196 363.3136)"
                              fill="currentColor"
                              width="16.6"
                              height="320.3"
                            />
                          </g>
                        </g>
                        <g>
                          <g>
                            <rect
                              x="39.8"
                              y="272.2"
                              fill="currentColor"
                              width="320.3"
                              height="16.6"
                            />
                          </g>
                        </g>
                        <g>
                          <g>
                            <rect
                              x="37.9"
                              y="312.2"
                              transform="matrix(-0.866 -0.5 0.5 -0.866 83.0693 663.3409)"
                              fill="currentColor"
                              width="185"
                              height="16.6"
                            />
                          </g>
                        </g>
                        <g>
                          <g>
                            <rect
                              x="177.1"
                              y="71.1"
                              transform="matrix(-0.866 -0.5 0.5 -0.866 463.3409 283.0693)"
                              fill="currentColor"
                              width="185"
                              height="16.6"
                            />
                          </g>
                        </g>
                        <g>
                          <g>
                            <rect
                              x="122.1"
                              y="-13"
                              transform="matrix(-0.5 -0.866 0.866 -0.5 126.7903 232.1221)"
                              fill="currentColor"
                              width="16.6"
                              height="185"
                            />
                          </g>
                        </g>
                        <g>
                          <g>
                            <rect
                              x="109.6"
                              y="151.6"
                              transform="matrix(-0.5 -0.866 0.866 -0.5 266.0828 473.3766)"
                              fill="currentColor"
                              width="320.3"
                              height="16.6"
                            />
                          </g>
                        </g>
                        <g>
                          <g>
                            <rect
                              x="52.5"
                              y="107.5"
                              fill="currentColor"
                              width="16.6"
                              height="185"
                            />
                          </g>
                        </g>
                        <g>
                          <g>
                            <rect
                              x="330.9"
                              y="107.5"
                              fill="currentColor"
                              width="16.6"
                              height="185"
                            />
                          </g>
                        </g>
                        <g>
                          <g>
                            <rect
                              x="262.4"
                              y="240.1"
                              transform="matrix(-0.5 -0.866 0.866 -0.5 126.7953 714.2875)"
                              fill="currentColor"
                              width="14.5"
                              height="160.9"
                            />
                          </g>
                        </g>
                        <path
                          fill="currentColor"
                          d="M369.5,297.9c-9.6,16.7-31,22.4-47.7,12.8c-16.7-9.6-22.4-31-12.8-47.7c9.6-16.7,31-22.4,47.7-12.8   C373.5,259.9,379.2,281.2,369.5,297.9"
                        />
                        <path
                          fill="currentColor"
                          d="M90.9,137c-9.6,16.7-31,22.4-47.7,12.8c-16.7-9.6-22.4-31-12.8-47.7c9.6-16.7,31-22.4,47.7-12.8   C94.8,99,100.5,120.3,90.9,137"
                        />
                        <path
                          fill="currentColor"
                          d="M30.5,297.9c-9.6-16.7-3.9-38,12.8-47.7c16.7-9.6,38-3.9,47.7,12.8c9.6,16.7,3.9,38-12.8,47.7   C61.4,320.3,40.1,314.6,30.5,297.9"
                        />
                        <path
                          fill="currentColor"
                          d="M309.1,137c-9.6-16.7-3.9-38,12.8-47.7c16.7-9.6,38-3.9,47.7,12.8c9.6,16.7,3.9,38-12.8,47.7   C340.1,159.4,318.7,153.7,309.1,137"
                        />
                        <path
                          fill="currentColor"
                          d="M200,395.8c-19.3,0-34.9-15.6-34.9-34.9c0-19.3,15.6-34.9,34.9-34.9c19.3,0,34.9,15.6,34.9,34.9   C234.9,380.1,219.3,395.8,200,395.8"
                        />
                        <path
                          fill="currentColor"
                          d="M200,74c-19.3,0-34.9-15.6-34.9-34.9c0-19.3,15.6-34.9,34.9-34.9c19.3,0,34.9,15.6,34.9,34.9   C234.9,58.4,219.3,74,200,74"
                        />
                      </g>
                    </svg>
                  </ActionIcon>
                </Link>
              </Tooltip>
              <Tooltip
                label="Sign out"
                position="right"
                transitionDuration={0}
                color="red"
              >
                <ActionIcon
                  variant="light"
                  onClick={signOut}
                  size={28}
                  color="red"
                  radius="sm"
                >
                  <SignOutIcon />
                </ActionIcon>
              </Tooltip>
              <Tooltip
                label={
                  theme.colorScheme === "dark" ? "Light-mode" : "Dark-mode"
                }
                position="right"
                transitionDuration={0}
                color={theme.colorScheme === "dark" && theme.white}
              >
                <ActionIcon
                  variant="filled"
                  onClick={toggleColorScheme}
                  size={28}
                  color={theme.colorScheme === "dark" ? "blueGray" : "dark"}
                  radius="sm"
                >
                  {theme.colorScheme === "dark" ? <SunIcon /> : <MoonIcon />}
                </ActionIcon>
              </Tooltip>
            </Stack>
          </div>
          {(data || loadingTabs) && (
            <div className={classes.main}>
              <Group className={classes.title}>
                <Title order={4}>{active?.label}</Title>
                <CreateModalButton
                  shopData={shopData}
                  setShowModal={setShowModal}
                  buttonBorder
                />
              </Group>

              {links}
              {loadingTabs && (
                <Stack mr="md" spacing={2}>
                  <Skeleton
                    height={44}
                    sx={{
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                    }}
                  />
                  <Skeleton
                    height={44}
                    sx={{
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                    }}
                  />
                  <Skeleton
                    height={44}
                    sx={{
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                    }}
                  />
                </Stack>
              )}
            </div>
          )}
        </Navbar.Section>
      </Navbar>
      <Navbar
        hiddenBreakpoint="sm"
        height={HEADER_SIZE}
        sx={{
          [theme.fn.largerThan("sm")]: { display: "none" },
          borderBottom: `1px solid ${
            theme.colorScheme === "dark"
              ? theme.colors.dark[7]
              : theme.colors.gray[3]
          }`,
        }}
      >
        <Stack spacing={0}>
          <Group align={"center"} sx={{ overflow: "hidden" }} p="xs" noWrap>
            <Center
              // py="md"
              // pl="md"
              p={5}
              // sx={{
              //   background: "linear-gradient(87deg,#172b4d 25%,#1a174d 100%)",
              //   borderRadius: theme.radius.sm,
              // }}
            >
              <LogoIconSVG
                color={theme.colorScheme === "light" ? "#000" : "#fff"}
                width={22}
              />
            </Center>

            {/* <Breadcrumbs>
            <Navdropdown active={active} data={mainLinksMockdata} />
            {data && data[activeTab] && (
              <Tabdropdown
                active={data[activeTab]}
                setActiveTab={setActiveTab}
                data={data}
              />
            )}
          </Breadcrumbs> */}
            <Group direction="row" ml="auto" spacing="xs" noWrap>
              {/* <ActionIcon
              variant="light"
              onClick={toggle}
              size={28}
              color="gray"
              radius="sm"
            >
              <Burger opened={opened} size="sm" color="gray" />
            </ActionIcon> */}
              {/* <PrimaryNavigation active={active} data={mainLinksMockdata} />
              {data && data[activeTab] && (
                <SecondaryNavigation
                  active={data[activeTab]}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  data={data}
                />
              )} */}

              <ActionIcon
                onClick={() => {
                  // setNavMode("primary");
                  toggle("primary");
                }}
                sx={{
                  border: `1px solid ${
                    theme.colors.gray[theme.colorScheme === "dark" ? 9 : 2]
                  }`,
                  boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
                  fontSize: "13px",
                  background:
                    theme.colorScheme === "dark"
                      ? theme.colors.dark[5]
                      : theme.fn.lighten(theme.colors.blueGray[0], 0.5),
                  color:
                    theme.colorScheme === "dark"
                      ? theme.colors.dark[0]
                      : theme.colors.blueGray[6],
                }}
              >
                <Box component={active.icon} size={12} mr={-1} />
              </ActionIcon>
              {data && data[activeTab] && (
                <Button
                  size="sm"
                  variant="unstyled"
                  compact
                  // leftIcon={<data[activeTab].icon size={10} />}
                  rightIcon={
                    (data[activeTab]?.count || data[activeTab].count === 0) && (
                      <Badge size="sm">{data[activeTab].count}</Badge>
                    )
                  }
                  onClick={() => {
                    // setNavMode("secondary");
                    toggle("secondary");
                  }}
                  px={8}
                  sx={{
                    height: 28,
                    textTransform: "uppercase",
                    fontWeight: 600,
                    letterSpacing: 0.3,
                    border: `1px solid ${
                      theme.colors.blue[theme.colorScheme === "dark" ? 9 : 1]
                    }`,
                    boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
                    fontSize: "12px",
                    background:
                      theme.colorScheme === "dark"
                        ? theme.colors.dark[5]
                        : theme.fn.lighten(theme.colors.blueGray[0], 0.2),
                    color:
                      theme.colorScheme === "dark"
                        ? theme.colors.dark[0]
                        : theme.colors.blue[6],
                  }}
                >
                  {data[activeTab]?.label}
                </Button>
              )}
              <Transition
                transition="pop-top-right"
                duration={200}
                mounted={navMode}
              >
                {(styles) => (
                  <Paper
                    className={classes.dropdown}
                    withBorder
                    style={styles}
                    mx={5}
                    // ref={ref}
                  >
                    {NavigationMap[navMode] && NavigationMap[navMode]}
                  </Paper>
                )}
              </Transition>
              <CreateModalButton
                shopData={shopData}
                setShowModal={setShowModal}
                position="bottom"
                // buttonColor="blue"
                buttonBorder
                buttonShadow
              />
              <ActionIcon
                variant="light"
                onClick={signOut}
                size={28}
                color="red"
                radius="sm"
                sx={{
                  border: `1px solid ${
                    theme.colors.red[theme.colorScheme === "dark" ? 9 : 1]
                  }`,
                  boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
                }}
              >
                <SignOutIcon />
              </ActionIcon>
              <ActionIcon
                variant="filled"
                onClick={() => toggleColorScheme()}
                size={28}
                color={theme.colorScheme === "dark" ? "gray" : "dark"}
                radius="sm"
                sx={{
                  border: `1px solid ${
                    theme.colors.dark[theme.colorScheme === "dark" ? 1 : 8]
                  }`,
                  boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
                }}
              >
                {theme.colorScheme === "dark" ? <SunIcon /> : <MoonIcon />}
              </ActionIcon>
            </Group>
          </Group>
          {/* <Group px="xs">
            {data && data[activeTab] && (
              <SecondaryNavigation
                active={data[activeTab]}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                data={data}
              />
            )}
          </Group> */}
        </Stack>
      </Navbar>
      <Box
        sx={{
          height: "100vh",
          flex: 1,
          backgroundColor:
            theme.colorScheme === "dark"
              ? theme.colors.dark[9]
              : theme.colors.blueGray[1],
          [theme.fn.smallerThan("sm")]: { height: "calc(100vh - 60px)" },
          overflow: "scroll",
        }}
        p={1}
      >
        {children}
      </Box>
    </Group>
  );
}

function CreateModalButton({
  shopData,
  setShowModal,
  position = "right",
  buttonColor,
  buttonBorder,
  buttonShadow,
}) {
  const theme = useMantineTheme();

  return (
    <Menu
      transition="rotate-right"
      transitionDuration={100}
      transitionTimingFunction="ease"
      ml="auto"
      size="sm"
      shadow={"xs"}
      control={
        <ActionIcon
          variant="light"
          color={buttonColor}
          sx={{
            border:
              buttonBorder &&
              `1px solid ${
                theme.colors.gray[theme.colorScheme === "dark" ? 9 : 3]
              }`,
            boxShadow: buttonShadow && "0 1px 2px 0 rgb(0 0 0 / 0.05)",
          }}
        >
          <PlusIcon />
        </ActionIcon>
      }
      styles={{
        item: {
          color:
            theme.colorScheme === "dark"
              ? theme.colors.blueGray[2]
              : theme.colors.blueGray[7],
          textTransform: "uppercase",
          fontWeight: 600,
          letterSpacing: 0.4,
        },
      }}
      position={position}
    >
      <Menu.Label sx={{ fontSize: 13 }}>Create a new</Menu.Label>
      {[
        { mode: "Order", enabled: shopData?.shops.length > 0 },
        { mode: "Shop" },
        { mode: "Channel" },
        { mode: "Match" },
      ].map(({ mode, enabled = true }) => (
        <Menu.Item
          key={mode}
          onClick={() => setShowModal(mode)}
          disabled={!enabled}
        >
          {mode}
        </Menu.Item>
      ))}
    </Menu>
  );
}

function KeyPopper({
  shopData,
  setShowModal,
  position = "right",
  buttonColor,
  buttonBorder,
}) {
  const [referenceElement, setReferenceElement] = useState(null);
  const [visible, setVisible] = useState(false);
  const theme = useMantineTheme();
  const clipboard = useClipboard({ timeout: 1000 });
  const notifications = useNotifications();
  const modals = useModals();

  const { data, error, mutate } = useSWR(
    gql`
      query KEY_QUERY {
        apiKeys {
          id
        }
      }
    `,
    gqlFetcher
  );

  async function createKey() {
    return await request(
      "/api/graphql",
      gql`
        mutation {
          createapiKey(data: {}) {
            id
          }
        }
      `
    )
      .then(async ({ createapiKey }) => {
        await mutate(({ apiKeys }) => {
          return {
            apiKeys: [createapiKey],
          };
        }, false);
        notifications.showNotification({
          title: `API Key has been generated.`,
          // message: JSON.stringify(data),
        });
      })
      .catch((error) => {
        // setLoading(false);
        notifications.showNotification({
          title: error.response.errors[0].extensions.code,
          message: error.response.errors[0].message,
          color: "red",
        });
      });
  }

  return (
    <Box>
      <ActionIcon
        ref={setReferenceElement}
        variant="light"
        color={buttonColor}
        sx={{
          border:
            buttonBorder &&
            `1px solid ${
              theme.colors.gray[theme.colorScheme === "dark" ? 9 : 3]
            }`,
          // boxShadow: theme.shadows.xs,
        }}
        onClick={() => setVisible((m) => !m)}
      >
        <KeyIcon />
      </ActionIcon>

      <Popper
        position="right"
        placement="center"
        mounted={visible}
        referenceElement={referenceElement}
        transition="pop-top-left"
        transitionDuration={200}
      >
        <Paper
          // style={{
          //   backgroundColor:
          //     theme.colorScheme === "dark"
          //       ? theme.colors.dark[5]
          //       : theme.colors.gray[1],
          // }}
          shadow="xs"
          withBorder
          sx={{ pointerEvents: "all" }}
          py="xs"
          px="xs"
        >
          {data?.apiKeys[0] ? (
            <Group spacing={0}>
              <Code>
                <Group spacing="xs" pl={4}>
                  {data.apiKeys[0].id}
                  <ActionIcon
                    // variant="light"
                    // color="blue"
                    size="sm"
                    sx={{
                      border:
                        buttonBorder &&
                        `1px solid ${
                          theme.colors.gray[
                            theme.colorScheme === "dark" ? 9 : 3
                          ]
                        }`,
                      // boxShadow: theme.shadows.xs,
                    }}
                    color="blue"
                    onClick={() => clipboard.copy(data.apiKeys[0].id)}
                  >
                    {clipboard.copied ? (
                      <CheckIcon size={10} />
                    ) : (
                      <CopyIcon size={10} />
                    )}
                  </ActionIcon>
                </Group>
              </Code>

              <ActionIcon
                ml={6}
                variant="light"
                color="red"
                size="sm"
                sx={{
                  border:
                    buttonBorder &&
                    `1px solid ${
                      theme.colors.gray[theme.colorScheme === "dark" ? 9 : 3]
                    }`,
                  // boxShadow: theme.shadows.xs,
                }}
                onClick={() =>
                  modals.openConfirmModal({
                    title: (
                      <Text
                        weight={600}
                        size="xl"
                        // transform="uppercase"
                        color="gray"
                        sx={
                          {
                            // fontWeight: 700,
                            // letterSpacing: 0.6,
                          }
                        }
                      >
                        Regenerate Key
                      </Text>
                    ),
                    centered: true,
                    children: (
                      <Text size="sm">
                        Are you sure you want to regenerate this key? This
                        action will invalidate your previous key and any
                        applications using the previous key will need to be
                        updated.
                      </Text>
                    ),
                    labels: {
                      confirm: "Regenerate Key",
                      cancel: "No don't regenerate it",
                    },
                    confirmProps: { color: "red" },
                    // onCancel: () => console.log("Cancel"),
                    onConfirm: createKey,
                  })
                }
              >
                <SyncIcon size={12} />
              </ActionIcon>
            </Group>
          ) : (
            <Button
              color="teal"
              variant="light"
              compact
              leftIcon={<SyncIcon size={12} />}
              onClick={async () => await createKey()}
            >
              GENERATE KEY
            </Button>
          )}

          {/* <ActionIcon
            ref={setReferenceElement}
            variant="light"
            color={buttonColor}
            sx={{
              border:
                buttonBorder &&
                `1px solid ${
                  theme.colors.gray[theme.colorScheme === "dark" ? 9 : 3]
                }`,
              // boxShadow: theme.shadows.xs,
            }}
            onClick={() => setVisible((m) => !m)}
          >
            <CopyIcon />
          </ActionIcon> */}
        </Paper>
      </Popper>
    </Box>
  );
}
