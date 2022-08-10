import React, { useState } from 'react';
import { useForm } from '@mantine/form';
import {
  TextInput,
  Button,
  Text,
  LoadingOverlay,
  Drawer,
  useMantineTheme,
  Box,
} from '@mantine/core';
import { mutate } from 'swr';
import { useNotifications } from '@mantine/notifications';

export const EditProduct = ({
  product,
  shop,
  isOpen,
  onClose,
  shopId,
  mutateProducts,
  searchEntry,
}) => {
  const notifications = useNotifications();

  const [loading, setLoading] = useState(false);

  const theme = useMantineTheme();

  const { title, productId, variantId, image, domain, accessToken, price } =
    product;

  const params = new URLSearchParams({
    accessToken,
    domain,
    searchEntry,
  }).toString();

  const url = `${product.searchProductsEndpoint}?${params}`;

  const form = useForm({
    initialValues: {
      title,
      price,
    },
  });

  const handleSubmit = async ({ name, error, purchaseId, url }) => {
    setLoading(true);
    // setError(null);
    const res = await fetch(`${product.updateProductEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        price,
        variantId,
        domain,
        accessToken,
      }),
    });

    const { error: updateError } = await res.json();

    setLoading(false);

    if (updateError) {
      notifications.showNotification({
        title: `Error: ${updateError.id}`,
        message: updateError.message,
        color: 'red',
      });
    } else {
      await mutate(url);

      notifications.showNotification({
        title: `Product has been updated.`,
      });
      onClose();
    }
  };

  return (
    <Drawer
      opened={isOpen}
      onClose={onClose}
      title={
        <Text size="xl" weight={600}>
          Update Product
        </Text>
      }
      padding="xl"
      size="lg"
      position="right"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <LoadingOverlay visible={loading} />
        <TextInput
          mt="md"
          placeholder="Empty field"
          label="Title"
          {...form.getInputProps('title')}
        />
        <TextInput
          mt="md"
          placeholder="Empty field"
          label="Price"
          {...form.getInputProps('price')}
        />
        {/* {error && (
          <Text color="red" size="sm" mt="sm">
            {error}
          </Text>
        )} */}
        <Box sx={{ display: 'flex', width: '100%' }}>
          <Button
            color="green"
            type="submit"
            uppercase
            variant="light"
            mt={30}
            ml="auto"
            size="md"
            sx={{
              fontWeight: 700,
              letterSpacing: 0.6,
              border: `2px solid ${
                theme.colorScheme === 'light' && theme.colors.green[1]
              }`,
              // boxShadow: theme.shadows.xs
            }}
          >
            Update Product
          </Button>
        </Box>
      </form>
    </Drawer>
  );
};
