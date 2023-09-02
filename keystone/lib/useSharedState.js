import useSWR from "swr";

export const useSharedState = (key, initial) => {
  const { data: state, mutate: setState } = useSWR(key, {
    initialData: initial,
    fetcher: null
  });
  return [state, setState];
};
