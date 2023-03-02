import {
  Box,
  Text,
  Button,
  Group,
  ActionIcon,
  useMantineTheme,
} from '@mantine/core';
import {
  ArrowDownIcon,
  ChevronDownIcon,
  GlobeIcon,
} from '@primer/octicons-react';

export function Order({
  address,
  shopName,
  title,
  link,
  date,
  open,
  setOpen,
  buttons,
  error,
}) {
  const theme = useMantineTheme();

  return (
    <Box sx={{ padding: 10 }}>
      <Group>
        <Group sx={{flexWrap:"wrap"}}>
          <Text
            component="a"
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            weight={600}
            color={
              theme.colorScheme === 'light'
                ? theme.colors.blueGray[7]
                : theme.colors.blueGray[0]
            }
          >
            {title}
          </Text>
          <Text
            sx={{ marginTop: 'auto', marginBottom: 'auto' }}
            size="xs"
            weight={500}
            color={
              theme.colorScheme === 'light'
                ? theme.colors.gray[6]
                : theme.colors.blueGray[3]
            }
            sx={{ marginTop: 1 }}
          >
            {shopName}
          </Text>
          <Text
            size="xs"
            color={
              theme.colorScheme === 'light'
                ? theme.colors.gray[6]
                : theme.colors.blueGray[2]
            }
            weight={600}
            sx={{ marginTop: 'auto', marginBottom: 'auto' }}
          >
            {date}
          </Text>
        </Group>
        <Group spacing={6} sx={{ marginLeft: 'auto' }}>
          {buttons}
          {setOpen && (
            <ActionIcon
              size="xs"
              color="blue"
              variant="light"
              onClick={e => {
                e.stopPropagation();
                setOpen(!open);
              }}
              aria-label="show line-items"
            >
              <ChevronDownIcon />
            </ActionIcon>
          )}
        </Group>
      </Group>
      <Group position="apart">
        <Text
          as="p"
          mt={2}
          size="sm"
          sx={{
            color:
              theme.colorScheme === 'light'
                ? '#425A70'
                : theme.colors.blueGray[3],
          }}
        >
          {address}
        </Text>
        <Group sx={{ marginTop: 'auto' }}>{error}</Group>
      </Group>
    </Box>
  );
}
