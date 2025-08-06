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

export const lists = {
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
}