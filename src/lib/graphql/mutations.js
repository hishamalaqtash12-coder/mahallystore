export const CREATE_PRODUCT = `
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      product {
        id
        databaseId
        name
        slug
      }
    }
  }
`;

export const UPDATE_PRODUCT = `
  mutation UpdateProduct($input: UpdateProductInput!) {
    updateProduct(input: $input) {
      product {
        id
        databaseId
        name
      }
    }
  }
`;

export const CREATE_ORDER = `
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      order {
        id
        databaseId
        orderKey
        status
      }
    }
  }
`;

export const UPDATE_ORDER = `
  mutation UpdateOrder($input: UpdateOrderInput!) {
    updateOrder(input: $input) {
      order {
        id
        databaseId
        status
        total
        currency
        billing {
          firstName
          lastName
          email
          phone
          address1
          city
          country
        }
        shipping {
          firstName
          lastName
          address1
          city
          country
        }
        lineItems {
          nodes {
            quantity
            total
            product {
              node {
                databaseId
                name
              }
            }
          }
        }
        metaData {
          key
          value
        }
        customerId
      }
    }
  }
`;

export const CREATE_CUSTOMER = `
  mutation CreateCustomer($input: CreateCustomerInput!) {
    createCustomer(input: $input) {
      customer {
        id
        databaseId
        email
        firstName
        lastName
      }
    }
  }
`;

export const UPDATE_CUSTOMER = `
  mutation UpdateCustomer($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      customer {
        id
        databaseId
        email
        firstName
        lastName
      }
    }
  }
`;
