async function updateShopProduct(root, { shopId, variantId, price }, context) {
    // Fetch the shop using the provided shopId
    const shop = await context.db.Shop.findOne({
      where: { id: shopId },
    });
  
    if (!shop) {
      throw new Error("Shop not found");
    }
  
    if (!shop.platform) {
      throw new Error("Platform configuration not specified.");
    }
  
    // Fetch the platform-specific function for updating products
    const platformConfig = await context.query.ShopPlatform.findOne({
      where: { id: shop.platform.id },
      query: "updateProductFunction",
    });
  
    if (!platformConfig.updateProductFunction) {
      throw new Error("Update product function not configured.");
    }
  
    const { updateProductFunction } = platformConfig;
  
    if (updateProductFunction.startsWith("http")) {
      // External API call (not applicable in this case)
      throw new Error("External API calls not supported for updating products.");
    } else {
      // Internal function call
      const shopFunctions = await import(
        `../../../../shopFunctions/${updateProductFunction}.js`
      );
      const result = await shopFunctions.updateProduct({
        domain: shop.domain,
        accessToken: shop.accessToken,
        variantId,
        price,
      });
  
      if (result.error) {
        throw new Error(result.error);
      }
  
      return { success: true, updatedVariant: result.updatedVariant };
    }
  }
  
  export default updateShopProduct;