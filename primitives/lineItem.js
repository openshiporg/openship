import { Box, Group, Image, Text, useMantineTheme } from '@mantine/core';

export function LineItem({
  image,
  title,
  productId,
  variantId,
  purchaseId,
  price,
  channelName,
  quantity,
  buttons,
  error,
}) {
  const theme = useMantineTheme();
  return (
    <Box
      sx={{
        background:
          theme.colorScheme === 'light'
            ? theme.white
            : theme.fn.darken(theme.colors.blue[9], 0.8),
        border: `1px solid ${
          theme.colorScheme === 'light'
            ? theme.colors.blueGray[2]
            : theme.colors.dark[8]
        }`,
      }}
    >
      <Group align={'stretch'} spacing={0}>
        <Group
          align={'center'}
          sx={{
            flex: 1,
            padding: 10,
            background: '#fff',
            borderRight: `1px solid ${
              theme.colorScheme === 'light'
                ? theme.colors.blueGray[2]
                : theme.colors.dark[8]
            }`,
          }}
        >
          <Image radius="sm" src={image} />
        </Group>
        <Box
          sx={{
            flex: 7,
            // wordBreak: 'break-all',
            marginTop: 'auto',
            marginBottom: 'auto',
            padding: 5,
          }}
          // borderLeft="gray.600"
          // padding={2}
          // paddingLeft={4}
          // wordBreak="break-all"
          // my="auto"
        >
          <Box sx={{ display: 'flex' }}>
            {channelName}
            <Box ml="auto">{purchaseId}</Box>
          </Box>
          <Box sx={{ display: 'flex' }}>
            <Box>
              <Text
                size="sm"
                color={
                  theme.colorScheme === 'light'
                    ? theme.colors.blueGray[8]
                    : theme.colors.blueGray[0]
                }
                weight={600}
                sx={{ lineHeight: 1.1 }}
              >
                {title}
              </Text>
              {/* <Text fontSize="xs" color="blueGray.700">
            {lineId}
          </Text> */}
              <Text
                size="xs"
                color={
                  theme.colorScheme === 'light'
                    ? theme.colors.blueGray[6]
                    : theme.colors.blueGray[3]
                }
              >
                {productId} {productId && variantId && '|'} {variantId}
              </Text>
              <Group align="center">
                <Text
                  size="md"
                  color={
                    theme.colorScheme === 'light'
                      ? theme.colors.green[9]
                      : theme.colors.green[6]
                  }
                  weight={600}
                >
                  ${(price * quantity).toFixed(2)}
                </Text>
                {quantity > 1 && (
                  <Box>
                    <Text size="sm" color={theme.colors.dark[3]}>
                      (${price} x {quantity})
                    </Text>
                  </Box>
                )}
              </Group>
            </Box>
            <Group sx={{ marginTop: 'auto', marginLeft: "auto"}}>{buttons}</Group>
          </Box>
        </Box>
      </Group>
    </Box>
  );
}
