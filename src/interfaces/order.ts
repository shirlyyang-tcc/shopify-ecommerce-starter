export interface OrderLineItemVariant {
  title: string;
  image?: { url: string; altText?: string | null } | null;
  priceV2: { amount: number; currencyCode: string };
}

export interface OrderLineItemNode {
  id: string;
  title: string;
  quantity: number;
  variant?: OrderLineItemVariant | null;
}

export interface OrderLineItemEdge {
  node: OrderLineItemNode;
}

export interface Order {
  id: string;
  orderNumber: string;
  name: string; // Shopify's order name, e.g., #1001
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  totalPriceV2: { amount: number; currencyCode: string };
  lineItems: { edges: OrderLineItemEdge[] };
} 