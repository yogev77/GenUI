import type { ProductInfo } from "./funnel-claude";

export interface FunnelImage {
  url: string;        // Display URL (Supabase Storage public URL after upload)
  originalUrl: string; // Source URL before upload
  context: string;    // "Product front view", "Size chart", etc.
  isLogo?: boolean;
}

export interface PageSpec {
  name: string;            // "Landing Page", "Quiz Step 1"
  componentSuffix: string; // "Landing", "QuizStep1" (PascalCase)
  description: string;     // Detailed page content description (50-100 words)
  hasCheckout: boolean;    // Whether to inject FakeCheckout
}

export interface FunnelBrief {
  productInfo: ProductInfo;
  pageSpecs: PageSpec[];
  designNotes: string;     // Style/design preferences from chat
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
