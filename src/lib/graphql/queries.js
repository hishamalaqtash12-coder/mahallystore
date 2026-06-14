// Shared product fields fragment used inside SimpleProduct and VariableProduct
const PRODUCT_FIELDS = `
  databaseId
  name
  slug
  type
  status
  description
  shortDescription
  sku
  link
  featured
  date
  modified
  totalSales
  purchasable
  menuOrder
  productTags {
    nodes {
      databaseId
      name
      slug
    }
  }
  attributes {
    nodes {
      name
      options
    }
  }
  reviewsAllowed
  averageRating
  reviewCount
  image {
    sourceUrl
    altText
  }
  galleryImages {
    nodes {
      sourceUrl
      altText
    }
  }
  productCategories {
    nodes {
      databaseId
      name
      slug
    }
  }
  metaData {
    key
    value
  }
`;

export const GET_PRODUCTS = `
  query GetProducts($first: Int, $after: String, $category: String, $categoryId: Int, $search: String, $featured: Boolean, $status: String) {
    products(
      first: $first
      after: $after
      where: { category: $category, categoryId: $categoryId, search: $search, featured: $featured, status: $status }
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ... on SimpleProduct {
          ${PRODUCT_FIELDS}
          price
          regularPrice
          salePrice
          onSale
          dateOnSaleTo
          dateOnSaleFrom
          stockStatus
          stockQuantity
          manageStock
          weight
          virtual
          downloadable
        }
        ... on VariableProduct {
          ${PRODUCT_FIELDS}
          price
          regularPrice
          salePrice
          onSale
          dateOnSaleTo
          dateOnSaleFrom
          stockStatus
          stockQuantity
          manageStock
          weight
        }
        ... on ExternalProduct {
          ${PRODUCT_FIELDS}
          price
          regularPrice
          salePrice
          onSale
          dateOnSaleTo
          dateOnSaleFrom
        }
        ... on GroupProduct {
          ${PRODUCT_FIELDS}
        }
      }
    }
  }
`;

export const GET_PRODUCT = `
  query GetProduct($id: ID!) {
    product(id: $id, idType: DATABASE_ID) {
      ... on SimpleProduct {
        ${PRODUCT_FIELDS}
        price
        regularPrice
        salePrice
        onSale
        dateOnSaleTo
        dateOnSaleFrom
        stockStatus
        stockQuantity
        manageStock
        weight
        virtual
        downloadable
      }
      ... on VariableProduct {
        ${PRODUCT_FIELDS}
        price
        regularPrice
        salePrice
        onSale
        dateOnSaleTo
        dateOnSaleFrom
        stockStatus
        stockQuantity
        manageStock
        weight
      }
      ... on ExternalProduct {
        ${PRODUCT_FIELDS}
        price
        regularPrice
        salePrice
        onSale
        dateOnSaleTo
        dateOnSaleFrom
      }
      ... on GroupProduct {
        ${PRODUCT_FIELDS}
      }
    }
  }
`;

export const GET_PRODUCT_BY_SLUG = `
  query GetProductBySlug($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      ... on SimpleProduct {
        ${PRODUCT_FIELDS}
        price
        regularPrice
        salePrice
        onSale
        dateOnSaleTo
        dateOnSaleFrom
        stockStatus
        stockQuantity
        manageStock
        weight
        virtual
        downloadable
      }
      ... on VariableProduct {
        ${PRODUCT_FIELDS}
        price
        regularPrice
        salePrice
        onSale
        dateOnSaleTo
        dateOnSaleFrom
        stockStatus
        stockQuantity
        manageStock
        weight
      }
      ... on ExternalProduct {
        ${PRODUCT_FIELDS}
        price
        regularPrice
        salePrice
        onSale
        dateOnSaleTo
        dateOnSaleFrom
      }
      ... on GroupProduct {
        ${PRODUCT_FIELDS}
      }
    }
  }
`;

export const GET_CATEGORIES = `
  query GetCategories($first: Int, $after: String) {
    productCategories(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        databaseId
        name
        slug
        description
        count
        image {
          sourceUrl
          altText
        }
        parent {
          node {
            databaseId
            name
          }
        }
      }
    }
  }
`;

export const GET_VENDORS = `
  query GetVendors($first: Int, $after: String) {
    users(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        databaseId
        name
        firstName
        lastName
        email
        registeredDate
        roles {
          nodes {
            name
          }
        }
        avatar {
          url
        }
        mahallyId
        mahallyRole
        mahallyStoreSlug
        mahallyIsRestricted
        dokanEnableSelling
      }
    }
  }
`;

export const GET_VENDOR = `
  query GetVendor($id: ID!) {
    user(id: $id, idType: DATABASE_ID) {
      databaseId
      name
      firstName
      lastName
      email
      registeredDate
      avatar {
        url
      }
      mahallyId
      mahallyRole
      mahallyStoreSlug
      mahallyIsRestricted
      dokanEnableSelling
    }
  }
`;

export const GET_ORDERS = `
  query GetOrders($first: Int, $after: String) {
    orders(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        databaseId
        status
        total
        date
        billing {
          firstName
          lastName
          email
          phone
          address1
          city
        }
        shipping {
          firstName
          lastName
          address1
          city
        }
        lineItems {
          nodes {
            quantity
            total
          }
        }
      }
    }
  }
`;

export const GET_PRODUCT_REVIEWS = `
  query GetProductReviews($id: ID!) {
    product(id: $id, idType: DATABASE_ID) {
      ... on SimpleProduct {
        reviews {
          nodes {
            content
            author {
              node {
                name
              }
            }
          }
        }
        averageRating
        reviewCount
      }
      ... on VariableProduct {
        reviews {
          nodes {
            content
            author {
              node {
                name
              }
            }
          }
        }
        averageRating
        reviewCount
      }
    }
  }
`;
