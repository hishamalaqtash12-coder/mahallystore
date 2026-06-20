import { fetchGraphQL } from "./graphql";
import { 
  GET_PRODUCTS, GET_PRODUCT, GET_CATEGORIES, 
  GET_ORDERS, GET_VENDORS, GET_VENDOR, GET_PRODUCT_REVIEWS
} from "./graphql/queries";
import { 
  CREATE_PRODUCT, UPDATE_PRODUCT, CREATE_CUSTOMER, 
  UPDATE_CUSTOMER, CREATE_ORDER, UPDATE_ORDER 
} from "./graphql/mutations";
import { generateMahallyId } from "./id-generator";

// Helper to standardise headers if using Basic Auth for mutations
const getAuthHeaders = () => {
  const auth = Buffer.from(`${process.env.WP_ADMIN_USER}:${process.env.WP_ADMIN_APP_PASS}`).toString("base64");
  return {
    Authorization: `Basic ${auth}`
  };
};

// Maps WPGraphQL Product to WooCommerce REST API format to prevent UI breakage
const mapProduct = (node) => {
  if (!node) return null;
  // Extract meta_data from GraphQL metaData field
  const meta_data = (node.metaData || []).map(m => ({ key: m.key, value: m.value }));
  const isFeatured = typeof node.featured === 'string'
    ? node.featured.toLowerCase() === 'true'
    : Boolean(node.featured);

  // Try to find the vendor/author ID from meta_data
  const vendorMeta = meta_data.find(m => ["_vendor_id", "mahally_owner_id", "merchant_id"].includes(m.key));
  const authorId = vendorMeta ? parseInt(vendorMeta.value, 10) : 0;

  return {
    id: node.databaseId,
    ID: node.databaseId,
    name: node.name,
    slug: node.slug,
    type: node.type,
    status: node.status,
    description: node.description,
    short_description: node.shortDescription,
    reviews_allowed: node.reviewsAllowed,
    average_rating: node.averageRating || '0',
    rating_count: node.reviewCount || 0,
    price: node.price ? node.price.replace(/[^\d.-]/g, '') : '',
    regular_price: node.regularPrice ? node.regularPrice.replace(/[^\d.-]/g, '') : '',
    sale_price: node.salePrice ? node.salePrice.replace(/[^\d.-]/g, '') : '',
    on_sale: node.onSale || false,
    date_on_sale_to: node.dateOnSaleTo || null,
    date_on_sale_to_gmt: node.dateOnSaleTo || null,
    date_on_sale_from: node.dateOnSaleFrom || null,
    date_on_sale_from_gmt: node.dateOnSaleFrom || null,
    stock_status: node.stockStatus ? node.stockStatus.toLowerCase().replace(/_/g, '') : 'instock',
    stock_quantity: node.stockQuantity,
    manage_stock: node.manageStock === "TRUE" || node.manageStock === true,
    total_sales: node.totalSales || 0,
    weight: node.weight || "",
    purchasable: node.purchasable !== false,
    virtual: node.virtual === true,
    downloadable: node.downloadable === true,
    menu_order: node.menuOrder || 0,
    author: authorId,
    sku: node.sku || "",
    permalink: node.link,
    featured: isFeatured,
    date_created: node.date,
    date_modified: node.modified,
    tags: node.productTags?.nodes?.map(t => ({ id: t.databaseId, name: t.name, slug: t.slug })) || [],
    attributes: node.attributes?.nodes?.map(a => ({ name: a.name, options: a.options })) || [],
    images: [node.image, ...(node.galleryImages?.nodes || [])].filter(Boolean).map(img => ({ src: img.sourceUrl, alt: img.altText })),
    categories: node.productCategories?.nodes?.map(cat => ({ id: cat.databaseId, name: cat.name, slug: cat.slug })) || [],
    meta_data
  };
};


const mapCategory = (node) => {
  if (!node) return null;
  return {
    id: node.databaseId,
    ID: node.databaseId,
    name: node.name,
    slug: node.slug,
    description: node.description,
    count: node.count,
    image: node.image ? { src: node.image.sourceUrl, alt: node.image.altText } : null,
    parent: node.parent?.node?.databaseId || 0
  };
};

const mapUser = (node) => {
  if (!node) return null;
  return {
    id: node.databaseId,
    ID: node.databaseId,
    email: node.email,
    first_name: node.firstName,
    last_name: node.lastName,
    username: node.name,
    date_created: node.registeredDate,
    avatar_url: node.avatar?.url,
    meta_data: [
      { key: 'mahally_id', value: node.mahallyId },
      { key: 'mahally_role', value: node.mahallyRole },
      { key: 'mahally_store_slug', value: node.mahallyStoreSlug },
      { key: 'mahally_is_restricted', value: node.mahallyIsRestricted },
      { key: 'dokan_enable_selling', value: node.dokanEnableSelling },
    ].filter(m => m.value !== undefined && m.value !== null),
    roles: node.roles?.nodes?.map(r => r.name) || []
  };
};

const mapOrder = (node) => {
  if (!node) return null;
  return {
    id: node.databaseId,
    ID: node.databaseId,
    order_key: node.orderKey,
    status: node.status,
    currency: node.currency,
    date_created: node.date,
    total: node.total,
    billing: {
      first_name: node.billing?.firstName,
      last_name: node.billing?.lastName,
      email: node.billing?.email,
      phone: node.billing?.phone,
      address_1: node.billing?.address1,
      city: node.billing?.city,
    },
    shipping: {
      first_name: node.shipping?.firstName,
      last_name: node.shipping?.lastName,
      address_1: node.shipping?.address1,
      city: node.shipping?.city,
    },
    line_items: node.lineItems?.nodes?.map(item => ({
      product_id: item.product?.node?.databaseId,
      name: item.product?.node?.name,
      quantity: item.quantity,
      total: item.total
    })) || []
  };
};

export async function getPage(slug) {
  // Page is core WP, WPGraphQL supports it easily
  const query = `
    query GetPage($slug: ID!) {
      page(id: $slug, idType: URI) {
        title
        content
      }
    }
  `;
  try {
    const data = await fetchGraphQL(query, { slug });
    return data?.page || null;
  } catch (e) {
    console.error(`Error fetching page ${slug}:`, e);
    return null;
  }
}

export async function getProducts(options = {}, withRealRatings = false, retries = 3, includeRestricted = false) {
  try {
    let category = null;
    let categoryId = null;

    if (options.category) {
      if (/^\d+$/.test(options.category.toString())) {
        categoryId = parseInt(options.category, 10);
      } else {
        category = String(options.category);
      }
    }

    const featuredFilter = typeof options.featured === 'string'
      ? options.featured === 'true'
      : typeof options.featured === 'boolean'
        ? options.featured
        : null;

    const data = await fetchGraphQL(GET_PRODUCTS, {
      first: options.per_page ? parseInt(options.per_page, 10) : 10,
      category,
      categoryId,
      search: options.search || null,
      featured: featuredFilter,
      status: options.status || null
    });
    
    let products = (data?.products?.nodes || []).map(mapProduct);

    if (!includeRestricted) {
      products = products.filter(p => 
        !p.meta_data?.some(m => m.key === "mahally_is_restricted" && m.value === "yes")
      );
    }

    if (typeof featuredFilter === 'boolean') {
      products = products.filter(p => Boolean(p.featured) === featuredFilter);
    }

    if (options.status) {
      products = products.filter(p => String(p.status || 'publish').toLowerCase() === String(options.status).toLowerCase());
    }

    return {
      data: products,
      total: products.length, // GraphQL doesn't give total count easily without extra plugins
      totalPages: data?.products?.pageInfo?.hasNextPage ? 2 : 1
    };
  } catch (e) {
    console.error("GraphQL error fetching products:", e);
    return { data: [], total: 0, totalPages: 1 };
  }
}

export async function getProduct(id, retries = 3) {
  try {
    // If id is string and not numeric, fetch by slug
    if (isNaN(id)) {
      const GET_PRODUCT_BY_SLUG = GET_PRODUCT.replace('idType: DATABASE_ID', 'idType: SLUG');
      const data = await fetchGraphQL(GET_PRODUCT_BY_SLUG, { id: id });
      return mapProduct(data?.product);
    }
    
    const data = await fetchGraphQL(GET_PRODUCT, { id: parseInt(id) });
    return mapProduct(data?.product);
  } catch (e) {
    console.error(`GraphQL error fetching product ${id}:`, e);
    return null;
  }
}

export async function getProductVariations(id, retries = 3) {
  // Requires specific query in WPGraphQL WooCommerce
  const query = `
    query GetVariations($id: ID!) {
      product(id: $id, idType: DATABASE_ID) {
        ... on VariableProduct {
          variations {
            nodes {
              databaseId
              name
              price
              attributes {
                nodes {
                  name
                  value
                }
              }
            }
          }
        }
      }
    }
  `;
  try {
    const data = await fetchGraphQL(query, { id: parseInt(id) });
    return data?.product?.variations?.nodes?.map(v => ({
      id: v.databaseId,
      name: v.name,
      price: v.price ? v.price.replace(/[^\d.-]/g, '') : '',
      attributes: v.attributes?.nodes || []
    })) || [];
  } catch (e) {
    return [];
  }
}

export async function getCategories(options = {}, retries = 3) {
  try {
    const data = await fetchGraphQL(GET_CATEGORIES, { first: options.per_page ? parseInt(options.per_page, 10) : 100 });
    return (data?.productCategories?.nodes || []).map(mapCategory);
  } catch (error) {
    console.error("GraphQL error fetching categories:", error);
    return [];
  }
}

export async function createProduct(productData) {
  try {
    const { vendor_slug, ...cleanData } = productData;
    const mahallyId = generateMahallyId('product', vendor_slug);
    
    const input = {
      name: cleanData.name,
      regularPrice: String(cleanData.regular_price),
      description: cleanData.description,
      shortDescription: cleanData.short_description,
      // Meta data requires custom GraphQL mutation inputs or fallback to REST for mutation
    };

    const data = await fetchGraphQL(CREATE_PRODUCT, { input }, getAuthHeaders());
    return mapProduct(data?.createProduct?.product);
  } catch (error) {
    console.error("Error creating product via GraphQL:", error);
    throw new Error("Failed to create product");
  }
}

export async function getProductReviews(productId) {
  try {
    const data = await fetchGraphQL(GET_PRODUCT_REVIEWS, { id: String(productId) });
    return data?.product?.reviews?.nodes || [];
  } catch (e) {
    return [];
  }
}

export async function createCustomer(customerData) {
  try {
    const input = {
      username: customerData.email,
      email: customerData.email,
      firstName: customerData.first_name,
      lastName: customerData.last_name,
      password: customerData.password || Math.random().toString(36).slice(-8)
    };
    const data = await fetchGraphQL(CREATE_CUSTOMER, { input }, getAuthHeaders());
    return mapUser(data?.createCustomer?.customer);
  } catch (error) {
    console.error("Error creating customer via GraphQL:", error);
    throw error;
  }
}

export async function checkCustomerExists(email, phone) {
  try {
    if (email) {
      const query = `query GetUser($email: String!) { users(where: { search: $email }) { nodes { databaseId } } }`;
      const data = await fetchGraphQL(query, { email }, getAuthHeaders());
      if (data?.users?.nodes?.length > 0) return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

export async function getVendors({ page = 1, per_page = 40, includeRestricted = false } = {}) {
  try {
    const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;
    const auth = Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`).toString("base64");
    
    // We fetch all users (role=all) to find sellers and admins who are acting as merchants
    const response = await fetch(`${WP_URL}/wp-json/wc/v3/customers?role=all&per_page=${per_page}&page=${page}`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    
    if (!response.ok) {
      console.error("Failed to fetch vendors via REST API", response.status);
      return [];
    }
    
    let customers = await response.json();
    
    // Convert to the shape the frontend expects (similar to mapUser)
    let vendors = customers.map(c => ({
      id: c.id,
      email: c.email,
      first_name: c.first_name,
      last_name: c.last_name,
      name: `${c.first_name} ${c.last_name}`.trim(),
      username: c.username,
      date_created: c.date_created,
      avatar_url: c.avatar_url,
      meta_data: c.meta_data || [],
      roles: [c.role]
    }));
    
    // Ensure we only return vendors/sellers
    vendors = vendors.filter(v => 
      v.roles.includes('seller') || 
      v.roles.includes('administrator') || 
      v.meta_data?.some(m => m.key === 'mahally_role' && (m.value === 'seller' || m.value === 'administrator'))
    );
    
    if (!includeRestricted) {
      vendors = vendors.filter(c => 
        !c.meta_data?.some(m => m.key === "mahally_is_restricted" && m.value === "yes")
      );
    }
    
    return vendors;
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return [];
  }
}

export async function getVendorById(vendorId) {
  try {
    const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;
    const auth = Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`).toString("base64");
    
    const response = await fetch(`${WP_URL}/wp-json/wc/v3/customers/${vendorId}`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    
    if (!response.ok) return null;
    const c = await response.json();
    
    const vendor = {
      id: c.id,
      email: c.email,
      first_name: c.first_name,
      last_name: c.last_name,
      name: `${c.first_name} ${c.last_name}`.trim(),
      date_created: c.date_created,
      avatar_url: c.avatar_url,
      meta_data: c.meta_data || [],
      roles: [c.role]
    };

    // Fetch this vendor's products directly using REST API (much faster than fetching all and filtering)
    const productsRes = await fetch(`${WP_URL}/wp-json/wc/v3/products?author=${vendorId}&per_page=100&status=publish`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    let vendorProducts = [];
    if (productsRes.ok) {
      const restProducts = await productsRes.json();
      vendorProducts = (Array.isArray(restProducts) ? restProducts : []).map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        type: p.type,
        status: p.status,
        description: p.description,
        short_description: p.short_description,
        price: p.price,
        regular_price: p.regular_price,
        sale_price: p.sale_price,
        average_rating: p.average_rating,
        rating_count: p.rating_count,
        on_sale: p.on_sale,
        stock_status: p.stock_status,
        stock_quantity: p.stock_quantity,
        manage_stock: p.manage_stock,
        images: (p.images || []).map(img => ({ src: img.src, alt: img.alt })),
        categories: (p.categories || []).map(c => ({ id: c.id, name: c.name, slug: c.slug })),
        attributes: p.attributes || [],
        meta_data: p.meta_data || []
      }));
    }
      
    vendor.products = vendorProducts;
    return { vendor, products: vendorProducts };
  } catch (error) {
    console.error(`Error fetching vendor ${vendorId}:`, error);
    return null;
  }
}

export async function getVendorBySlug(slug) {
  try {
    // If slug is numeric, check by ID first
    const idMatch = slug.match(/^(\d+)-/);
    if (idMatch) {
      return await getVendorById(parseInt(idMatch[1]));
    }
    
    // Fetch all vendors (with full meta_data) and find by slug
    const vendors = await getVendors({ per_page: 100, includeRestricted: true });
    const matchedVendor = vendors.find(c =>
      c.meta_data?.some(m => m.key === "mahally_store_slug" && m.value === slug)
    );
    
    if (!matchedVendor) return null;
    
    // Build result directly from matched data + REST products (avoids second customer fetch)
    const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;
    const auth = Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`).toString("base64");
    
    const productsRes = await fetch(`${WP_URL}/wp-json/wc/v3/products?author=${matchedVendor.id}&per_page=100&status=publish`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    
    let vendorProducts = [];
    if (productsRes.ok) {
      const restProducts = await productsRes.json();
      vendorProducts = (Array.isArray(restProducts) ? restProducts : []).map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        type: p.type,
        status: p.status,
        description: p.description,
        short_description: p.short_description,
        price: p.price,
        regular_price: p.regular_price,
        sale_price: p.sale_price,
        average_rating: p.average_rating,
        rating_count: p.rating_count,
        on_sale: p.on_sale,
        stock_status: p.stock_status,
        stock_quantity: p.stock_quantity,
        manage_stock: p.manage_stock,
        images: (p.images || []).map(img => ({ src: img.src, alt: img.alt })),
        categories: (p.categories || []).map(c => ({ id: c.id, name: c.name, slug: c.slug })),
        attributes: p.attributes || [],
        meta_data: p.meta_data || []
      }));
    }
    
    matchedVendor.products = vendorProducts;
    return { vendor: matchedVendor, products: vendorProducts };
  } catch (error) {
    console.error(`Error fetching vendor by slug ${slug}:`, error);
    return null;
  }
}

export async function getCustomerById(id) {
  try {
    const data = await fetchGraphQL(GET_VENDOR, { id: parseInt(id) }, getAuthHeaders());
    return mapUser(data?.user);
  } catch (error) {
    return null;
  }
}

export async function updateCustomerMeta(customerId, metaUpdates) {
  // Since GraphQL mutation for arbitrary user meta is complex without explicit plugins,
  // we fallback to WP REST API for this specific admin action
  try {
    const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;
    const auth = Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`).toString("base64");
    
    const existingRes = await fetch(`${WP_URL}/wp-json/wc/v3/customers/${customerId}`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    const existing = await existingRes.json();
    const currentMeta = existing.meta_data || [];

    const metaToUpdate = [];
    for (const [key, value] of Object.entries(metaUpdates)) {
      const existingMeta = currentMeta.find(m => m.key === key);
      if (existingMeta && existingMeta.id) {
        metaToUpdate.push({ id: existingMeta.id, key, value });
      } else {
        metaToUpdate.push({ key, value });
      }
    }

    const response = await fetch(`${WP_URL}/wp-json/wc/v3/customers/${customerId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
      body: JSON.stringify({ meta_data: metaToUpdate })
    });

    return await response.json();
  } catch (error) {
    console.error(`Error updating meta for customer ${customerId}:`, error.message);
    throw error;
  }
}

export async function getAllVendorApplications() {
  return await getVendors({ per_page: 100, includeRestricted: true });
}

export async function updateCustomer(id, data) {
  try {
    const input = { id: parseInt(id), firstName: data.first_name, lastName: data.last_name };
    const res = await fetchGraphQL(UPDATE_CUSTOMER, { input }, getAuthHeaders());
    return mapUser(res?.updateCustomer?.customer);
  } catch (error) {
    console.error(`Error updating customer ${id}:`, error.message);
    throw error;
  }
}

export async function getCustomersByIds(ids) {
  if (!ids || ids.length === 0) return [];
  try {
    const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;
    const auth = Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`).toString("base64");
    
    const response = await fetch(`${WP_URL}/wp-json/wc/v3/customers?role=all&include=${ids.join(',')}&per_page=100`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    
    if (!response.ok) return [];
    const data = await response.json();
    return data.map(customer => ({
      id: customer.id,
      ID: customer.id,
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      username: customer.username,
      date_created: customer.date_created,
      avatar_url: customer.avatar_url,
      meta_data: customer.meta_data || [],
      roles: [customer.role]
    }));
  } catch (e) {
    return [];
  }
}

export async function getOrders(options = {}) {
  try {
    const data = await fetchGraphQL(GET_ORDERS, { first: options.per_page ? parseInt(options.per_page, 10) : 10 }, getAuthHeaders());
    return (data?.orders?.nodes || []).map(mapOrder);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
}

export async function getOrder(id) {
  try {
    const data = await fetchGraphQL(`query GetOrder($id: ID!) { order(id: $id, idType: DATABASE_ID) { id databaseId status total currency date billing { firstName lastName email phone address1 city country } shipping { firstName lastName address1 city country } lineItems { nodes { product { node { databaseId name } } quantity total } } metaData { key value } customerId } }`, { id: parseInt(id, 10) }, getAuthHeaders());
    return mapOrder(data?.order) || null;
  } catch (error) {
    console.error(`Error fetching order ${id}:`, error);
    return null;
  }
}

export async function getCustomers(options = {}) {
  try {
    const data = await fetchGraphQL(`query GetCustomers($first: Int) { users(first: $first, where: { role: CUSTOMER }) { nodes { databaseId email firstName lastName name avatar { url } roles { nodes { name } } mahallyId mahallyRole mahallyStoreSlug mahallyIsRestricted dokanEnableSelling } } }`, { first: options.per_page ? parseInt(options.per_page, 10) : 20 }, getAuthHeaders());
    return (data?.users?.nodes || []).map(mapUser);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
}

export async function getCustomer(id) {
  try {
    const data = await fetchGraphQL(`query GetCustomer($id: ID!) { user(id: $id, idType: DATABASE_ID) { databaseId email firstName lastName name avatar { url } roles { nodes { name } } mahallyId mahallyRole mahallyStoreSlug mahallyIsRestricted dokanEnableSelling } }`, { id: parseInt(id, 10) }, getAuthHeaders());
    return mapUser(data?.user);
  } catch (error) {
    console.error(`Error fetching customer ${id}:`, error);
    return null;
  }
}

export const wcApi = {
  get: async (endpoint, options = {}) => {
    if (endpoint === 'products') {
      const { data } = await getProducts(options);
      return { data };
    }
    if (endpoint.startsWith('products/')) {
      const id = endpoint.split('/')[1];
      const product = await getProduct(id);
      return { data: product };
    }
    if (endpoint === 'orders') {
      const data = await getOrders(options);
      return { data };
    }
    if (endpoint.startsWith('orders/')) {
      const id = endpoint.split('/')[1];
      const order = await getOrder(id);
      return { data: order };
    }
    if (endpoint === 'customers') {
      const data = await getCustomers(options);
      return { data };
    }
    if (endpoint.startsWith('customers/')) {
      const id = endpoint.split('/')[1];
      const customer = await getCustomer(id);
      return { data: customer };
    }
    return { data: [] };
  },
  post: async (endpoint, data) => {
    console.warn(`Direct wcApi.post('${endpoint}') called. Please refactor to specific GraphQL mutations.`);
    return { data: {} };
  },
  put: async (endpoint, data) => {
    if (endpoint.startsWith('products/')) {
      const id = endpoint.split('/')[1];
      const input = {
        id: parseInt(id, 10),
        ...data,
        regularPrice: data.regularPrice ?? data.regular_price,
        salePrice: data.salePrice ?? data.sale_price,
      };

      const dateOnSaleFrom = data.dateOnSaleFrom ?? data.date_on_sale_from;
      const dateOnSaleTo = data.dateOnSaleTo ?? data.date_on_sale_to;

      if (dateOnSaleFrom !== undefined && dateOnSaleFrom !== null) {
        input.dateOnSaleFrom = dateOnSaleFrom;
      }
      if (dateOnSaleTo !== undefined && dateOnSaleTo !== null) {
        input.dateOnSaleTo = dateOnSaleTo;
      }

      delete input.regular_price;
      delete input.sale_price;
      delete input.date_on_sale_from;
      delete input.date_on_sale_to;
      delete input.brands;
      delete input.product_brand;
      delete input.featured; // Not a valid UpdateProductInput field in WPGraphQL
      const result = await fetchGraphQL(UPDATE_PRODUCT, { input }, getAuthHeaders());
      return { data: result?.updateProduct?.product || null };
    }
    if (endpoint.startsWith('orders/')) {
      const id = endpoint.split('/')[1];
      const input = {
        id,
        status: data.status,
        billing: data.billing,
        shipping: data.shipping,
        metaData: data.meta_data || data.metaData
      };
      const result = await fetchGraphQL(UPDATE_ORDER, { input }, getAuthHeaders());
      return { data: result?.updateOrder?.order || null };
    }
    if (endpoint.startsWith('customers/')) {
      const id = endpoint.split('/')[1];
      const input = {
        id: parseInt(id, 10),
        firstName: data.first_name || data.firstName,
        lastName: data.last_name || data.lastName,
        metaData: data.meta_data || data.metaData,
      };
      const result = await fetchGraphQL(UPDATE_CUSTOMER, { input }, getAuthHeaders());
      return { data: result?.updateCustomer?.customer || null };
    }
    return { data: {} };
  }
};
