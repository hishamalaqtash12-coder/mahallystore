import { Truck, RotateCcw, Megaphone, Users, Cookie, ShieldAlert } from "lucide-react";

export default function GenericContentPage({ params }) {
  // Map slugs to content
  const contentMap = {
    'shipping': {
      title: "Shipping Info",
      icon: Truck,
      desc: "Fast and reliable delivery across Jordan.",
      body: "We offer express shipping to all major cities in Jordan including Amman, Zarqa, and Irbid. Orders over 20 JOD qualify for free delivery. Most orders are processed within 24 hours and delivered within 2-5 business days."
    },
    'returns': {
      title: "Returns & Refund",
      icon: RotateCcw,
      desc: "Worry-free shopping with easy returns.",
      body: "Not happy with your purchase? No problem. We offer a 14-day return policy for most items. Items must be in their original packaging and condition. Once received, refunds are processed within 5-7 business days."
    },
    'ads': {
      title: "Ad Program",
      icon: Megaphone,
      desc: "Boost your visibility on Mahally.",
      body: "Promote your products to millions of shoppers. Our targeted ad platform allows you to reach the right audience at the right time. Increase your sales with featured placements and search result boosts."
    },
    'partners': {
      title: "Partner Program",
      icon: Users,
      desc: "Grow your business with Mahally.",
      body: "Join our ecosystem of partners. From logistics providers to marketing agencies, we're always looking for collaborators to help build the future of Jordan's marketplace. Benefit from shared resources and cross-promotion."
    },
    'cookies': {
      title: "Cookie Policy",
      icon: Cookie,
      desc: "How we use cookies to improve your experience.",
      body: "We use cookies to remember your preferences and improve your browsing experience. Cookies help us understand how people use our site, so we can make it better. You can manage your cookie settings at any time in your browser."
    },
    'security': {
      title: "Security",
      icon: ShieldAlert,
      desc: "State-of-the-art protection for your data.",
      body: "Your security is our top priority. We use industry-standard encryption to protect your personal and payment information. Our security team monitors the platform 24/7 to detect and prevent unauthorized access or fraudulent activity."
    }
  };

  // In a real app, this would be a dynamic route, but for now I'll use separate files 
  // or a wrapper. I'll just create the files manually since Next.js static export requires it.
  return null;
}
