# OAuth Flow Documentation: OpenShip ↔ OpenFront Integration

## Current OAuth Flow (Complex)

The current OAuth flow requires multiple steps and manual configuration across both platforms:

### Step 1: Create OAuth App in OpenFront
1. User goes to OpenFront
2. Creates new OAuth app (e.g., "OpenShip Integration")
3. Configures:
   - **App Name**: OpenShip
   - **Redirect URI**: Leave blank initially (problematic!)
   - **Scopes**: Full range needed for integration
   - **Developer Email**: Contact email
4. Receives:
   - **Client ID** (App Key)
   - **Client Secret** (App Secret)

### Step 2: Create Platform in OpenShip
1. User goes to OpenShip
2. Creates new Shop/Channel Platform
3. Selects "OpenFront" from dropdown
4. Enters App Credentials:
   - **App Key**: Client ID from OpenFront
   - **App Secret**: Client Secret from OpenFront
5. After creation, receives:
   - **Callback URL**: `https://openship.com/api/oauth/shop/{PLATFORM_ID}/callback`
   - Note: PLATFORM_ID is unique to this platform instance

### Step 3: Update OAuth App in OpenFront
1. User returns to OpenFront
2. Updates the OAuth app created in Step 1
3. Adds the Callback URL from OpenShip as the Redirect URI
4. Saves changes

### Step 4: Connect Shop/Channel in OpenShip
1. User returns to OpenShip
2. Clicks "Create Shop" or "Create Channel"
3. Selects the OpenFront platform
4. Enters domain
5. Clicks "Install App on OpenFront"
6. Gets redirected to OpenFront for authorization
7. Approves the OAuth request
8. Gets redirected back to OpenShip with access token
9. Shop/Channel is created automatically

## Why Platform ID is Currently Necessary

The platform ID in the callback URL (`/api/oauth/shop/{PLATFORM_ID}/callback`) serves critical functions:

1. **Credential Identification**: Multiple OpenFront platforms can exist with different credentials
   ```typescript
   // User could have:
   - OpenFront Platform A: client_id_1, client_secret_1
   - OpenFront Platform B: client_id_2, client_secret_2
   ```

2. **Token Exchange**: The callback needs to know which credentials to use for exchanging the authorization code
   ```typescript
   const channelPlatform = await keystoneContext.sudo().query.ChannelPlatform.findOne({
     where: { id: platform }, // Uses platform ID to find correct credentials
   });
   ```

3. **Multi-tenancy Support**: Different users might have different OpenFront instances with unique configurations

## Proposed Solutions

### Solution 1: State Parameter (Recommended)
Use OAuth state parameter to pass platform ID, eliminating the need for platform-specific URLs:

**Benefits:**
- Single callback URL: `/api/oauth/callback`
- Platform ID passed securely via state parameter
- OpenFront only needs one redirect URI

**Implementation:**
```typescript
// When initiating OAuth
const state = JSON.stringify({ 
  platformId: platform.id,
  type: 'shop', // or 'channel'
  nonce: generateNonce() 
});

// In callback
const { platformId, type } = JSON.parse(state);
```

### Solution 2: OpenFront Apps Marketplace
Create an "Apps" page in OpenFront where users can:

1. **One-Click Setup**:
   - Click "Install OpenShip"
   - Enter OpenShip URL
   - Auto-generates OAuth app with correct redirect URI
   - Redirects to OpenShip with credentials

2. **Flow**:
   ```
   OpenFront Apps Page → Auto-create OAuth App → Redirect to OpenShip with:
   - client_id
   - client_secret
   - callback_url (standardized)
   ```

### Solution 3: Domain-Based Platform Detection
Use the shop domain to determine which platform to use:

**Limitations:**
- Only works if one platform per domain
- Breaks if multiple OpenFront instances for same user

## ✅ IMPLEMENTED SOLUTION: Unified OAuth Callback

We've implemented the industry-standard OAuth flow using a **single callback URL** with state parameters.

### New Simplified Flow

#### Step 1: Create OAuth App in OpenFront (One-time setup)
1. User goes to OpenFront
2. Creates new OAuth app (e.g., "OpenShip Integration")
3. Configures:
   - **App Name**: OpenShip
   - **Redirect URI**: `https://your-openship-domain.com/api/oauth/callback` (SAME FOR ALL!)
   - **Scopes**: Full range needed for integration
   - **Developer Email**: Contact email
4. Receives Client ID and Secret

#### Step 2: Create Platform in OpenShip (One-time setup)
1. User goes to OpenShip
2. Creates new Shop/Channel Platform
3. Selects "OpenFront" from dropdown
4. Enters App Credentials from Step 1
5. **Callback URL is now the same for all platforms**: `/api/oauth/callback`

#### Step 3: Connect Shop/Channel (Repeatable)
1. User clicks "Create Shop" or "Create Channel"
2. Selects the OpenFront platform
3. Enters domain
4. Clicks "Install App on OpenFront"
5. System generates secure state parameter containing platform info
6. Gets redirected to OpenFront for authorization
7. Approves the OAuth request
8. Gets redirected back to unified callback with state
9. System decodes state to identify platform and exchange token
10. Shop/Channel is created automatically

### Technical Implementation

```typescript
// Generate secure state parameter
const state = await generateOAuthState(platformId, 'shop');

// Unified callback URL (no platform-specific paths)
const callbackUrl = `${baseUrl}/api/oauth/callback`;

// In callback handler
const { nonce, platformId, type } = JSON.parse(Buffer.from(state, 'base64').toString());

// Verify nonce and fetch correct platform
const platform = type === 'shop' 
  ? await keystoneContext.sudo().query.ShopPlatform.findOne({ where: { id: platformId }})
  : await keystoneContext.sudo().query.ChannelPlatform.findOne({ where: { id: platformId }});
```

### Benefits of New Approach

1. **Single Redirect URI**: OpenFront app only needs one redirect URI
2. **Industry Standard**: Follows OAuth 2.0 best practices used by Google, Shopify, Microsoft
3. **Better Security**: Uses proper nonce-based CSRF protection
4. **Simplified Setup**: No need to update OAuth app for each platform
5. **Future-Proof**: Enables OpenFront Apps Marketplace integration

### Long-term (Best UX)
Implement Solution 2 - OpenFront Apps Marketplace:

1. **OpenFront Side**:
   - Create `/apps` page
   - Add "OpenShip" as available app
   - Auto-provision OAuth app when activated
   - Pass credentials via secure redirect

2. **OpenShip Side**:
   - Create `/setup/from-openfront` endpoint
   - Auto-create platform with received credentials
   - Immediately start shop/channel creation flow

## Migration Path

1. **Phase 1**: Keep current system, document better
2. **Phase 2**: Implement state parameter approach (backward compatible)
3. **Phase 3**: Work with OpenFront to add Apps marketplace
4. **Phase 4**: Deprecate platform-specific callback URLs

## Security Considerations

1. **State Parameter**: Must include nonce to prevent CSRF attacks
2. **Credential Passing**: Use encrypted JWT when passing credentials between platforms
3. **Validation**: Always validate redirect URIs match expected patterns

## Developer Experience Improvements

1. **Auto-detect redirect URI**: When creating platform, auto-generate and display the redirect URI
2. **Copy button**: Add copy buttons for all URLs and credentials
3. **Setup wizard**: Create guided setup flow with validation at each step
4. **Testing mode**: Add sandbox environment for testing OAuth flows