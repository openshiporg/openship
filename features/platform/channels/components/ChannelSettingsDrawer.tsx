'use client'

import React, { useState, useEffect } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Ticket, SquareStack, ArrowRightLeft, Webhook } from 'lucide-react'
import { SearchOrders } from './SearchOrders'
import { AdvancedLinks } from './AdvancedLinks'
import { MatchPageClient } from '../../matches/components/MatchPageClient'
import { Webhooks } from './Webhooks'
import { getChannelMatches } from '../../matches/actions/matches'
import type { Channel } from '../lib/types'

interface ChannelSettingsDrawerProps {
  channel: Channel
  open: boolean
  onClose: () => void
}


export function ChannelSettingsDrawer({
  channel,
  open,
  onClose
}: ChannelSettingsDrawerProps) {
  const [matches, setMatches] = useState([])
  const [matchesLoading, setMatchesLoading] = useState(false)
  
  const itemsCount = channel.channelItems?.length || 0
  const linksCount = channel.links?.length || 0
  const matchesCount = matches?.length || 0

  useEffect(() => {
    if (open) {
      setMatchesLoading(true)
      getChannelMatches(channel.id, 1, 50)
        .then((response) => {
          setMatches(response.data?.items || [])
        })
        .catch((error) => {
          console.error('Failed to load matches:', error)
        })
        .finally(() => {
          setMatchesLoading(false)
        })
    }
  }, [open, channel.id])

  const tabsData = [
    { value: 'orders', icon: Ticket, label: 'Orders' },
    { value: 'matches', icon: SquareStack, label: 'Matches', count: matchesCount },
    { value: 'links', icon: ArrowRightLeft, label: 'Links', count: linksCount },
    { value: 'webhooks', icon: Webhook, label: 'Webhooks' },
  ]

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent className="flex flex-col">
        <DrawerHeader className="flex-shrink-0">
          <DrawerTitle>{channel.name} Settings</DrawerTitle>
        </DrawerHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="orders" className="h-full flex flex-col">
            <div className="flex-shrink-0">
              <ScrollArea>
                <TabsList className="justify-start w-full h-auto gap-2 rounded-none bg-transparent px-4 md:px-6 py-0">
                  {tabsData.map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="text-muted-foreground relative pb-3 pt-2 px-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground hover:text-foreground transition-colors after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] data-[state=active]:after:bg-blue-600 rounded-none"
                    >
                      <tab.icon
                        className="-ms-0.5 me-1.5 opacity-60"
                        size={16}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                      <span className="hidden sm:inline">{tab.label}</span>
                      {tab.count !== undefined && (
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          {tab.count}
                        </span>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="orders" className="h-full bg-background border-t mt-0 overflow-auto">
                <SearchOrders
                  channelId={channel.id}
                  pageSize={10}
                />
              </TabsContent>

              <TabsContent value="matches" className="h-full bg-background border-t mt-0 overflow-auto">
                {matchesLoading ? (
                  <div className="p-4">
                    <Skeleton className="h-4 w-[250px] mb-2" />
                    <Skeleton className="h-4 w-[200px] mb-2" />
                    <Skeleton className="h-4 w-[300px]" />
                  </div>
                ) : matches.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                      <SquareStack className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-medium text-foreground mb-1">No matches found</h3>
                    <p className="text-xs text-muted-foreground">This channel doesn't have any matches yet.</p>
                  </div>
                ) : (
                  <MatchPageClient
                    matches={matches}
                    onAcceptPriceChange={async (channelItemId: string, newPrice: string) => {
                      const { updateChannelItem } = await import('../../matches/actions/matches');
                      try {
                        await updateChannelItem(channelItemId, { price: newPrice });
                        // Reload matches after price update
                        const response = await getChannelMatches(channel.id, 1, 50);
                        setMatches(response.data?.items || []);
                      } catch (error) {
                        console.error('Failed to update price:', error);
                      }
                    }}
                  />
                )}
              </TabsContent>

              <TabsContent value="links" className="h-full bg-background p-4 md:p-6 border-t mt-0 overflow-auto">
                <AdvancedLinks channelId={channel.id} />
              </TabsContent>

              <TabsContent value="webhooks" className="h-full bg-background p-4 md:p-6 border-t mt-0 overflow-auto">
                <Webhooks channelId={channel.id} channel={channel} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
