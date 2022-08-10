import { useState } from 'react';
import {
  Box,
  Group,
  Image,
  Text,
  useMantineTheme,
  Button,
} from '@mantine/core';
import { QuantityCounter } from './quantityCounter';

export function Product({
  channelId,
  channelName,
  image,
  title,
  productId,
  variantId,
  price,
  disabled,
  addToCart,
  atcText,
  productLink,
  accessToken,
  domain,
  buttons,
  searchProductsEndpoint,
  updateProductEndpoint,
}) {
  const theme = useMantineTheme();

  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  return (
    <Box
      sx={{
        background:
          theme.colorScheme === 'light'
            ? theme.white
            : theme.fn.darken(theme.colors.blue[9], 0.8),
        borderTop: `1px solid ${
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
            // background: '#fff',
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
            flex: 9,
            // wordBreak: 'break-all',
            marginTop: 'auto',
            marginBottom: 'auto',
            padding: 5,
          }}
        >
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
              {addToCart && (
                <Group>
                  <QuantityCounter
                    quantity={quantity}
                    setQuantity={setQuantity}
                    color="blue"
                  />
                  <Button
                    variant="light"
                    color="blue"
                    compact
                    uppercase
                    disabled={disabled}
                    loading={loading}
                    onClick={async () => {
                      setLoading(true);
                      await addToCart({
                        name: title,
                        image,
                        price,
                        quantity: quantity.toString(),
                        productId,
                        variantId,
                        channelId,
                        channelName
                      });
                      setLoading(false);
                    }}
                    sx={{ fontWeight: 700, letterSpacing: -0.1 }}
                  >
                    {atcText}
                  </Button>
                </Group>
              )}
              <Box mt="auto" ml="auto">
                {buttons &&
                  buttons({
                    product: {
                      productId,
                      variantId,
                      price,
                      title,
                      image,
                      domain,
                      accessToken,
                      searchProductsEndpoint,
                      updateProductEndpoint,
                    },
                  })}
              </Box>
            </Box>
            <Group
              sx={{ marginTop: 'auto', marginLeft: 'auto', flexWrap: 'nowrap' }}
              spacing={5}
            >
              {/* <Box mb={2}>{error}</Box> */}
              {buttons}
            </Group>
          </Box>
        </Box>
      </Group>
    </Box>
  );
}
