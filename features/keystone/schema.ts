import type { Session } from './access'
import type { Lists } from '.keystone/types'

import { 
  User, 
  Role, 
  ApiKey,
  ShopPlatform,
  ChannelPlatform,
  Shop,
  Channel,
  Order,
  LineItem,
  CartItem,
  ShopItem,
  ChannelItem,
  Match,
  Link,
  TrackingDetail
} from './models'

export const lists: Lists<Session> = {
  // Core Models
  User,
  Role,
  ApiKey,
  
  // E-commerce Platform Models
  ShopPlatform,
  ChannelPlatform,
  Shop,
  Channel,
  
  // Order Management Models
  Order,
  LineItem,
  CartItem,
  
  // Product & Inventory Models
  ShopItem,
  ChannelItem,
  Match,
  
  // Linking & Tracking Models
  Link,
  TrackingDetail,
} satisfies Lists<Session>