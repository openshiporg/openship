import { Center } from '@keystone-ui/core';
import { LoadingDots } from '@keystone-ui/loading';

export function LoadingIcon({ label, size }) {
  return (
    <Center fillView>
      <LoadingDots label={label} size={size} />
    </Center>
  );
}
