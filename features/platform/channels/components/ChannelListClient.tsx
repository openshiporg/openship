"use client";

import { ChannelDetailsComponent } from "./ChannelDetailsComponent";

interface Channel {
  id: string;
  name: string;
  domain: string;
  accessToken: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
  platform?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name?: string;
    email: string;
  };
  channelItems?: Array<{
    id: string;
  }>;
  links?: Array<{
    id: string;
  }>;
}

interface ChannelListClientProps {
  channels: Channel[];
}

export function ChannelListClient({ channels }: ChannelListClientProps) {
  return (
    <div className="relative grid gap-3 p-4">
      {channels.map((channel: Channel) => (
        <ChannelDetailsComponent key={channel.id} channel={channel} />
      ))}
    </div>
  );
}