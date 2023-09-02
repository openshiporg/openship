import React from "react";
import useSWR from "swr";
import { gqlFetcher } from "keystone/lib/gqlFetcher";
import { useSharedState } from "keystone/lib/useSharedState";
import { CHANNELS_QUERY } from "@graphql/channels";
import { ProductSearch } from "./Search";

export function ChannelProductSearch({
  swrKey,
  disabled,
  addToCart,
  atcText = "Add To Cart",
}) {
  const { data, error } = useSWR(CHANNELS_QUERY, gqlFetcher);

  const [searchEntry, setSearchEntry] = useSharedState(
    `${swrKey}channelSearchEntry`,
    ""
  );

  return data?.channels ? (
    <ProductSearch
      key="channel"
      title={`${swrKey}channel`}
      options={data?.channels}
      disabled={disabled}
      atcText={atcText}
      addToCart={addToCart}
      searchEntry={searchEntry}
      setSearchEntry={setSearchEntry}
    />
  ) : (
    <></>
  );
}
