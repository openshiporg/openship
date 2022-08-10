import { Box, Text, Group } from "@mantine/core";

export function MatchItem({
  image,
  title,
  productId,
  variantId,
  purchaseId,
  price,
  channelName,
  quantity,
  buttons,
}) {
  // const [quantity, setQuantity] = useState(1);

  return (
    <Box>
      <Box>
        <Box>
          <Box src={image} />
        </Box>
        <Box>
          <Group>
            <Text>{channelName}</Text>
            <Text>{purchaseId}</Text>
          </Group>

          <Text>{title}</Text>
          <Text>
            {productId} | {variantId}
          </Text>
          <Box>
            <Box>
              <Text>${(price * quantity).toFixed(2)}</Text>
              {quantity > 1 && (
                <Box>
                  <Text>
                    (${price} x {quantity})
                  </Text>
                </Box>
              )}
            </Box>
            <Box>{buttons}</Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
