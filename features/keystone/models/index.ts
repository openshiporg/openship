import { User } from "./User";
import { ApiKey } from "./ApiKey";
import { Role } from "./Role";
import { Order } from "./Order";
import { TrackingDetail } from "./TrackingDetail";
import { LineItem } from "./LineItem";
import { CartItem } from "./CartItem";
import { Channel } from "./Channel";
import { ChannelItem } from "./ChannelItem";
import { Shop } from "./Shop";
import { ShopItem } from "./ShopItem";
import { Match } from "./Match";
import { Link } from "./Link";
import { ShopPlatform } from "./ShopPlatform";
import { ChannelPlatform } from "./ChannelPlatform";
// Add other imports here if needed

// Export individual models for direct import
export {
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
};

// Also export as models object for compatibility
export const models = {
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
  // Add other models here as needed
};
