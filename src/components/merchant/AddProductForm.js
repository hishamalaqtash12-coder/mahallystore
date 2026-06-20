"use client";

import { useState, useEffect } from "react";
import { logMerchantAction } from "@/lib/merchant-logger";
import { useAuth } from "@/context/AuthContext";

// Utility to decode HTML entities like &amp;
const decodeEntities = (text) => {
  if (!text) return "";
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&rsquo;': "'",
    '&lsquo;': "'",
    '&ndash;': '-',
    '&mdash;': '—'
  };
  return text.replace(/&[a-z0-9#]+;/gi, (match) => entities[match] || match);
};

const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  // Handles '2026-05-15T00:00:00' or similar
  return dateString.split('T')[0];
};

import { 
  X, Upload, Image as ImageIcon, Plus, Trash2, 
  Settings, Database, Tag, Layers, Calendar, Package,
  ChevronRight, AlertCircle, Loader2, Check, HelpCircle, Sparkles
} from "lucide-react";
import Image from "next/image";
import RichTextEditor from "./RichTextEditor";

export default function AddProductForm({ onClose, onProductAdded, user, productToEdit }) {
  const { customerName, wooId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [globalAttributes, setGlobalAttributes] = useState([]);
  const [newCatName, setNewCatName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [newBrandName, setNewBrandName] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [enhancingAi, setEnhancingAi] = useState(false);
  const [enhancingShortAi, setEnhancingShortAi] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "simple",
    virtual: false,
    downloadable: false,
    description: "",
    short_description: "",
    regular_price: "",
    sale_price: "",
    date_on_sale_from: "",
    date_on_sale_to: "",
    sku: "",
    manage_stock: false,
    stock_quantity: 0,
    stock_status: "instock",
    sold_individually: false,
    categories: [],
    tags: [],
    brands: [], // Supporting brands if taxonomy exists
    images: [],
    attributes: [],
    default_attributes: [],
    variations: [],
    weight: "",
    dimensions: {
      length: "",
      width: "",
      height: ""
    },
    shipping_class: "",
    upsell_ids: [],
    cross_sell_ids: [],
    purchase_note: "",
    menu_order: 0,
    reviews_allowed: true,
    return_policy: "global",
    return_period: ""
  });

  useEffect(() => {
    // 1. If editing, populate the form
    if (productToEdit) {
      // First, set with what we have from the list view
      setFormData({
        ...formData,
        ...productToEdit,
        name: productToEdit.name || "",
        description: productToEdit.description || "",
        short_description: productToEdit.short_description || "",
        regular_price: productToEdit.regular_price || productToEdit.price || "",
        sale_price: (productToEdit.sale_price && productToEdit.sale_price !== "0.00" && productToEdit.sale_price !== "0") ? productToEdit.sale_price : "",
        sku: productToEdit.sku || "",
        weight: productToEdit.weight || "",
        dimensions: {
          length: productToEdit.dimensions?.length || "",
          width: productToEdit.dimensions?.width || "",
          height: productToEdit.dimensions?.height || ""
        },
        purchase_note: productToEdit.purchase_note || "",
        menu_order: productToEdit.menu_order || 0,
        date_on_sale_from: formatDateForInput(productToEdit.date_on_sale_from),
        date_on_sale_to: formatDateForInput(productToEdit.date_on_sale_to),
        categories: (productToEdit.categories || []).map(c => ({ id: c.id })),
        brands: (productToEdit.brands || []).map(b => ({ id: b.id })),
        images: (productToEdit.images || []).map(img => ({ id: img.id, src: img.src })),
        attributes: productToEdit.attributes || [],
      });

      // Then, fetch full details from the API to ensure all fields (like regular_price, sale_price) are correct
      // This is crucial because list APIs often return partial data
      fetch(`/api/products/${productToEdit.id}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setFormData(prev => ({
              ...prev,
              ...data,
              regular_price: data.regular_price || data.price || prev.regular_price,
              sale_price: (data.sale_price && data.sale_price !== "0.00" && data.sale_price !== "0") ? data.sale_price : (data.sale_price === "" ? "" : prev.sale_price),
              date_on_sale_from: formatDateForInput(data.date_on_sale_from) || prev.date_on_sale_from,
              date_on_sale_to: formatDateForInput(data.date_on_sale_to) || prev.date_on_sale_to,
              variations: data.variations_data || prev.variations,
              categories: (data.categories || []).map(c => ({ id: c.id })),
              images: (data.images || []).map(img => ({ id: img.id, src: img.src })),
              return_policy: data.meta_data?.find(m => m.key === 'mahally_return_policy')?.value || "global",
              return_period: data.meta_data?.find(m => m.key === 'mahally_return_period')?.value || ""
            }));
          }
        })
        .catch(err => console.error("Error fetching full product details:", err));
    }

    // 2. Fetch global form data (Categories, Tags, Attributes)
    fetch("/api/categories")
      .then(res => res.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching categories:", err));

    fetch("/api/tags")
      .then(res => res.json())
      .then(data => setTags(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching tags:", err));

    fetch("/api/merchant/attributes")
      .then(res => res.json())
      .then(data => setGlobalAttributes(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching attributes:", err));

    fetch("/api/brands")
      .then(res => res.json())
      .then(data => setBrandsList(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching brands:", err));
  }, [productToEdit]);

  const handleCreateCategory = async () => {
    if (!newCatName) return;
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCategories([...categories, data]);
      setNewCatName("");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName) return;
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTags([...tags, data]);
      setNewTagName("");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateBrand = async () => {
    if (!newBrandName) return;
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBrandName })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBrandsList([...brandsList, data]);
      setFormData(prev => ({
        ...prev,
        brands: [...prev.brands, { id: data.id }]
      }));
      setNewBrandName("");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleEnhanceWithAI = async () => {
    if (!formData.name) {
      alert("Please enter a product name first before generating a description.");
      return;
    }
    setEnhancingAi(true);
    
    try {
      const res = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: formData.name,
          description: formData.description 
        })
      });
      const data = await res.json();
      
      if (data.enhanced) {
        setFormData(prev => ({ ...prev, description: data.enhanced }));
      } else {
        throw new Error(data.error || "Failed to enhance description");
      }
    } catch (err) {
      console.error("AI Error:", err);
      alert("AI enhancement failed. Please try again or enter description manually.");
    } finally {
      setEnhancingAi(false);
    }
  };

  const handleEnhanceShortWithAI = async () => {
    if (!formData.name) {
      alert("Please enter a product name first before generating a short description.");
      return;
    }
    setEnhancingShortAi(true);
    
    try {
      const res = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: formData.name,
          description: formData.short_description,
          isShort: true
        })
      });
      const data = await res.json();
      
      if (data.enhanced) {
        setFormData(prev => ({ ...prev, short_description: data.enhanced }));
      } else {
        throw new Error(data.error || "Failed to enhance short description");
      }
    } catch (err) {
      console.error("AI Short Error:", err);
      alert("AI short description enhancement failed. Please try again or enter manually.");
    } finally {
      setEnhancingShortAi(false);
    }
  };

  const handleFileUpload = async (e, type = "main", index = null) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (type === "main") setUploadingMain(true);
    if (type === "gallery") setUploadingGallery(true);

    try {
      const uploadPromises = files.map(async (file) => {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/merchant/media", {
          method: "POST",
          body
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return { id: data.id, src: data.url };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      
      if (type === "main") {
        // Main image only takes the first one if multiple selected
        const first = uploadedFiles[0];
        setFormData(prev => ({ 
          ...prev, 
          images: [{ id: first.id, src: first.src }, ...prev.images.slice(1)] 
        }));
      } else if (type === "gallery") {
        setFormData(prev => ({ 
          ...prev, 
          images: [...prev.images, ...uploadedFiles] 
        }));
      } else if (type === "variation" && index !== null) {
        const first = uploadedFiles[0];
        const newVars = [...formData.variations];
        newVars[index].image = { id: first.id, src: first.src };
        setFormData(prev => ({ ...prev, variations: newVars }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      if (type === "main") setUploadingMain(false);
      if (type === "gallery") setUploadingGallery(false);
    }
  };

  const removeImage = (id) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== id)
    }));
  };

  const handleCategoryToggle = (catId) => {
    setFormData(prev => {
      const exists = prev.categories.find(c => c.id === catId);
      if (exists) {
        return { ...prev, categories: prev.categories.filter(c => c.id !== catId) };
      }
      return { ...prev, categories: [...prev.categories, { id: catId }] };
    });
  };

  const addAttribute = (attrId) => {
    if (attrId === 'custom') {
      setFormData(prev => ({
        ...prev,
        attributes: [
          ...prev.attributes,
          {
            name: "",
            position: prev.attributes.length,
            visible: true,
            variation: false,
            options: [],
            isCustom: true
          }
        ]
      }));
      return;
    }

    const attr = globalAttributes.find(a => a.id === attrId);
    if (!attr) return;

    setFormData(prev => ({
      ...prev,
      attributes: [
        ...prev.attributes,
        {
          id: attr.id,
          name: attr.name,
          position: prev.attributes.length,
          visible: true,
          variation: true,
          options: []
        }
      ]
    }));
  };

  const toggleAttributeOption = (attrId, optionName) => {
    setFormData(prev => {
      const newAttrs = prev.attributes.map(attr => {
        if (attr.id === attrId) {
          const options = attr.options.includes(optionName)
            ? attr.options.filter(o => o !== optionName)
            : [...attr.options, optionName];
          return { ...attr, options };
        }
        return attr;
      });
      return { ...prev, attributes: newAttrs };
    });
  };

    const generateVariations = () => {
      const attrs = formData.attributes.filter(a => a.variation && a.options.length > 0);
      if (attrs.length === 0) {
        alert("No attributes set for variations. Please go to the 'Attributes' tab and ensure you have checked 'Used for variations' for at least one attribute with values.");
        return;
      }

    // Cartesian product of options
    const combine = (list, n = 0) => {
      if (n === list.length - 1) return list[n].options.map(o => [{ id: list[n].id, name: list[n].name, option: o }]);
      const res = [];
      const next = combine(list, n + 1);
      list[n].options.forEach(o => {
        next.forEach(nxt => {
          res.push([{ id: list[n].id, name: list[n].name, option: o }, ...nxt]);
        });
      });
      return res;
    };

    const combinations = combine(attrs);
    
    const newVariations = combinations.map(combo => {
      // Create a key for this combination to find if it already exists
      const comboKey = combo.map(a => a.option).sort().join("-");
      
      const existing = formData.variations.find(v => {
        const vKey = v.attributes.map(a => a.option).sort().join("-");
        return vKey === comboKey;
      });

      if (existing) return existing;

      return {
        regular_price: formData.regular_price?.toString() || "",
        sale_price: "",
        sku: "",
        manage_stock: formData.manage_stock || false,
        stock_quantity: formData.stock_quantity || 0,
        stock_status: "instock",
        weight: "",
        dimensions: { length: "", width: "", height: "" },
        backorders: "no",
        low_stock_amount: "",
        shipping_class: "",
        description: "",
        image: null,
        attributes: combo
      };
    });

    setFormData(prev => ({ ...prev, variations: newVariations }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.sale_price && parseFloat(formData.sale_price) >= parseFloat(formData.regular_price)) {
      setError("Sale price must be strictly lower than the regular price.");
      setLoading(false);
      return;
    }

    // Sanitized product data to ensure only writable fields are sent
    const sanitizedProduct = {
      name: formData.name,
      type: formData.type,
      status: "pending",
      description: formData.description,
      short_description: formData.short_description,
      regular_price: formData.type === "variable" ? "" : (formData.regular_price?.toString() || ""),
      sale_price: formData.type === "variable" ? "" : (formData.sale_price?.toString() || ""),
      date_on_sale_from: formData.date_on_sale_from,
      date_on_sale_to: formData.date_on_sale_to,
      sku: formData.sku,
      manage_stock: formData.manage_stock,
      stock_quantity: Number(formData.stock_quantity) || 0,
      stock_status: formData.stock_status,
      sold_individually: formData.sold_individually,
      virtual: formData.virtual,
      downloadable: formData.downloadable,
      categories: formData.categories.map(c => ({ id: c.id })),
      tags: formData.tags.map(t => ({ id: t.id })),
      brands: (formData.brands || []).map(b => ({ id: b.id })),
      images: formData.images.map(img => ({ id: img.id })),
      attributes: formData.attributes,
      default_attributes: formData.default_attributes,
      weight: formData.weight,
      dimensions: formData.dimensions,
      shipping_class: formData.shipping_class,
      upsell_ids: formData.upsell_ids,
      cross_sell_ids: formData.cross_sell_ids,
      purchase_note: formData.purchase_note,
      menu_order: formData.menu_order,
      reviews_allowed: formData.reviews_allowed,
      external_url: formData.external_url,
      button_text: formData.button_text,
      meta_data: [
        ...(formData.meta_data || []).filter(m => !["merchant_email", "merchant_phone", "merchant_name", "_vendor_id", "mahally_owner_name"].includes(m.key)),
        { key: "merchant_email", value: user.email },
        { key: "merchant_phone", value: user.phoneNumber || "" },
        { key: "merchant_name", value: customerName || "Unknown Merchant" },
        { key: "mahally_owner_name", value: customerName || "Unknown Merchant" },
        { key: "_vendor_id", value: wooId?.toString() || "" },
        { key: "mahally_return_policy", value: formData.return_policy },
        { key: "mahally_return_period", value: formData.return_period }
      ]
    };

    const productPayload = {
      id: productToEdit?.id,
      wooId: wooId,
      product: sanitizedProduct,
      variations: formData.type === "variable" ? formData.variations : []
    };

    try {
      const res = await fetch("/api/merchant/products", {
        method: productToEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productPayload)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      if (onProductAdded) onProductAdded(data);
      if (!productToEdit) onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "inventory", label: "Inventory", icon: Database },
    { id: "pricing", label: "Pricing & Schedule", icon: Calendar, hide: formData.type === "variable" },
    { id: "images", label: "Media & Gallery", icon: ImageIcon },
    { id: "categories", label: "Categories & Tags", icon: Tag },
    { id: "shipping", label: "Shipping", icon: Package },
    { id: "linked", label: "Linked Products", icon: Layers },
    { id: "attributes", label: "Attributes", icon: Layers },
    { id: "variations", label: "Variations", icon: Layers, hide: formData.type === "simple" },
    { id: "advanced", label: "Advanced", icon: Plus },
    { id: "bulk", label: "Bulk Upload", icon: Layers }
  ].filter(t => !t.hide);

  useEffect(() => {
    if (typeof document !== 'undefined' && document.body) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      if (typeof document !== 'undefined' && document.body) {
        document.body.style.overflow = 'unset';
      }
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-full z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div>
            <h2 className="text-[18px] font-bold text-zinc-900">{productToEdit ? "Edit Product" : "Add New Product"}</h2>
            <p className="text-[12px] text-zinc-500 font-medium">Complete all sections to publish your product.</p>
          </div>
          <div className="flex items-center gap-6 mr-12">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                id="virtual"
                name="virtual"
                checked={formData.virtual}
                onChange={handleInputChange}
                className="w-4 h-4 accent-[#be374f]"
              />
              <label htmlFor="virtual" className="text-[13px] font-medium text-zinc-700 cursor-pointer">Virtual</label>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                id="downloadable"
                name="downloadable"
                checked={formData.downloadable}
                onChange={handleInputChange}
                className="w-4 h-4 accent-[#be374f]"
              />
              <label htmlFor="downloadable" className="text-[13px] font-medium text-zinc-700 cursor-pointer">Downloadable</label>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-64 border-r border-zinc-100 bg-zinc-50 p-4 space-y-1 overflow-y-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[13px] font-bold transition-all ${
                  activeTab === tab.id 
                    ? "bg-[#febd69] text-zinc-900 shadow-sm" 
                    : "text-zinc-500 hover:bg-zinc-100"
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
                {activeTab === tab.id && <ChevronRight size={14} className="ml-auto" />}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8 bg-white">
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-lg space-y-2 text-rose-700 text-[13px] font-medium">
                <div className="flex items-center gap-3">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
                {error.includes("not allowed to create posts") && (
                  <p className="ml-7 text-[11px] text-rose-500 font-normal italic">
                    Tip: This usually means you need to add a <strong>WordPress Application Password</strong> to your .env file and restart the server.
                  </p>
                )}
              </div>
            )}

            <form id="product-form" onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
              {activeTab === "general" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-zinc-700">Product Name</label>
                    <input 
                      required
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Premium Leather Wallet"
                      className="w-full h-11 px-4 bg-white border border-zinc-300 rounded-lg text-[14px] outline-none focus:border-[#be374f] focus:ring-1 focus:ring-[#be374f] transition-all shadow-inner"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-zinc-700">Product Type</label>
                    <select 
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full h-11 px-4 bg-white border border-zinc-300 rounded-lg text-[14px] outline-none focus:border-[#be374f] transition-all"
                    >
                      <option value="simple">Simple Product</option>
                      <option value="variable">Variable Product</option>
                      <option value="external">External/Affiliate Product</option>
                    </select>
                  </div>

                  {formData.type === "external" && (
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[13px] font-bold text-zinc-700">Product URL</label>
                        <input 
                          name="external_url"
                          value={formData.external_url}
                          onChange={handleInputChange}
                          placeholder="https://..."
                          className="w-full h-11 px-4 bg-white border border-zinc-300 rounded-lg text-[14px] outline-none focus:border-[#be374f]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[13px] font-bold text-zinc-700">Button Text</label>
                        <input 
                          name="button_text"
                          value={formData.button_text}
                          onChange={handleInputChange}
                          placeholder="Buy product"
                          className="w-full h-11 px-4 bg-white border border-zinc-300 rounded-lg text-[14px] outline-none focus:border-[#be374f]"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <RichTextEditor 
                      value={formData.description}
                      onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                      placeholder="Write a detailed, high-converting product description here..."
                      label="Product Description"
                      onEnhanceAi={handleEnhanceWithAI}
                      enhancingAi={enhancingAi}
                    />
                  </div>

                  <div className="space-y-2">
                    <RichTextEditor 
                      value={formData.short_description}
                      onChange={(val) => setFormData(prev => ({ ...prev, short_description: val }))}
                      placeholder="Write a brief, catchy summary of key highlights..."
                      label="Short Description"
                      onEnhanceAi={handleEnhanceShortWithAI}
                      enhancingAi={enhancingShortAi}
                    />
                  </div>
                </div>
              )}

              {activeTab === "inventory" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-zinc-700">SKU</label>
                    <input 
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      className="w-full h-11 px-4 bg-white border border-zinc-300 rounded-lg text-[14px] outline-none focus:border-[#be374f] transition-all shadow-inner"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
                    <input 
                      type="checkbox"
                      id="manage_stock"
                      name="manage_stock"
                      checked={formData.manage_stock}
                      onChange={handleInputChange}
                      className="w-4 h-4 accent-[#be374f]"
                    />
                    <label htmlFor="manage_stock" className="text-[13px] font-bold text-zinc-700 cursor-pointer select-none">
                      Manage stock level (quantity)
                    </label>
                  </div>

                  {formData.manage_stock && (
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-zinc-700">Stock Quantity</label>
                      <input 
                        type="number"
                        name="stock_quantity"
                        value={formData.stock_quantity}
                        onChange={handleInputChange}
                        className="w-full h-11 px-4 bg-white border border-zinc-300 rounded-lg text-[14px] outline-none focus:border-[#be374f] transition-all shadow-inner"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-zinc-700">Stock Status</label>
                    <div className="flex flex-col gap-2">
                      {[
                        { id: 'instock', label: 'In stock' },
                        { id: 'outofstock', label: 'Out of stock' },
                        { id: 'onbackorder', label: 'On backorder' }
                      ].map((status) => (
                        <div key={status.id} className="flex items-center gap-2">
                          <input 
                            type="radio"
                            id={status.id}
                            name="stock_status"
                            value={status.id}
                            checked={formData.stock_status === status.id}
                            onChange={handleInputChange}
                            className="w-4 h-4 accent-[#be374f]"
                          />
                          <label htmlFor={status.id} className="text-[13px] text-zinc-700 cursor-pointer">{status.label}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
                    <input 
                      type="checkbox"
                      id="sold_individually"
                      name="sold_individually"
                      checked={formData.sold_individually}
                      onChange={handleInputChange}
                      className="w-4 h-4 accent-[#be374f]"
                    />
                    <label htmlFor="sold_individually" className="text-[13px] font-bold text-zinc-700 cursor-pointer select-none">
                      Sold individually (Limit purchases to 1 item per order)
                    </label>
                  </div>
                </div>
              )}

              {activeTab === "pricing" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-zinc-700">
                        {formData.type === "variable" ? "Default Regular Price (for variations)" : "Regular Price (JOD)"}
                      </label>
                      <input 
                        required
                        type="number"
                        step="0.01"
                        name="regular_price"
                        value={formData.regular_price || ""}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className="w-full h-11 px-4 bg-white border border-zinc-300 rounded-lg text-[14px] font-bold outline-none focus:border-[#be374f] transition-all shadow-inner"
                      />
                      {formData.type === "variable" && (
                        <p className="text-[11px] text-zinc-500 italic">This price will be used for any variations you generate below.</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-zinc-700">
                        {formData.type === "variable" ? "Default Sale Price" : "Sale Price (JOD)"}
                      </label>
                      <input 
                        type="number"
                        step="0.01"
                        name="sale_price"
                        value={formData.sale_price || ""}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className={`w-full h-11 px-4 bg-white border rounded-lg text-[14px] font-bold outline-none transition-all shadow-inner ${
                          parseFloat(formData.sale_price) >= parseFloat(formData.regular_price) 
                            ? "border-rose-500 text-rose-600 focus:border-rose-600" 
                            : "border-zinc-300 text-emerald-600 focus:border-emerald-500"
                        }`}
                      />
                      {parseFloat(formData.sale_price) >= parseFloat(formData.regular_price) && (
                        <p className="text-[11px] text-rose-500 font-bold mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                          <AlertCircle size={12} />
                          Sale price must be lower than the regular price.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-xl space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar size={16} className="text-zinc-400" />
                      <h4 className="text-[13px] font-bold text-zinc-700">Sale Schedule (Optional)</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-zinc-500">From Date</label>
                        <input 
                          type="date"
                          name="date_on_sale_from"
                          value={formData.date_on_sale_from || ""}
                          onChange={handleInputChange}
                          className="w-full h-10 px-4 bg-white border border-zinc-300 rounded-lg text-[13px] outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-zinc-500">To Date</label>
                        <input 
                          type="date"
                          name="date_on_sale_to"
                          value={formData.date_on_sale_to || ""}
                          onChange={handleInputChange}
                          className="w-full h-10 px-4 bg-white border border-zinc-300 rounded-lg text-[13px] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "images" && (
                <div className="space-y-10">
                  {/* Featured Image Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[14px] font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                        <ImageIcon size={18} className="text-[#be374f]" />
                        Main Product Image
                      </h3>
                      {formData.images.length > 0 && (
                        <span className="text-[11px] text-zinc-400 font-medium italic">This will be the primary image for search results.</span>
                      )}
                    </div>
                    
                    <div className="flex items-start gap-6">
                      <div className="w-48 h-48 relative rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex items-center justify-center overflow-hidden group">
                        {formData.images?.[0]?.src ? (
                          <>
                            <Image src={formData.images[0].src} alt={formData.name || "Main image"} fill className="object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button 
                                type="button"
                                onClick={() => removeImage(formData.images[0].id)}
                                className="w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 transition-all scale-75 group-hover:scale-100"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <label className="inset-0 absolute cursor-pointer flex flex-col items-center justify-center gap-2 hover:bg-zinc-100 transition-colors">
                            <Upload size={32} className="text-zinc-300" />
                            <span className="text-[12px] font-bold text-zinc-400">Set Main Image</span>
                            <input 
                              type="file" 
                              hidden 
                              accept="image/*" 
                              onChange={(e) => handleFileUpload(e, "main")} 
                            />
                          </label>
                        )}
                        {uploadingMain && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                            <Loader2 size={24} className="text-[#be374f] animate-spin" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-[13px] text-zinc-500 leading-relaxed pt-4">
                        <p className="font-bold text-zinc-700 mb-1">Recommended format:</p>
                        <p>• 800x800px or larger</p>
                        <p>• JPG, PNG or WebP</p>
                        <p>• Max size: 2MB</p>
                      </div>
                    </div>
                  </div>

                  {/* Gallery Section */}
                  <div className="space-y-4 pt-8 border-t border-zinc-100">
                    <h3 className="text-[14px] font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                      <Layers size={18} className="text-zinc-400" />
                      Product Gallery
                    </h3>
                    
                    <div className="grid grid-cols-4 gap-4">
                      {/* Upload Placeholder */}
                      <label className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                        uploadingGallery ? "bg-zinc-50 border-zinc-200 cursor-not-allowed" : "hover:bg-zinc-50 border-zinc-200 hover:border-[#be374f] hover:bg-zinc-50"
                      }`}>
                        {uploadingGallery ? <Loader2 size={24} className="text-zinc-300 animate-spin" /> : <Plus size={24} className="text-zinc-300" />}
                        <span className="text-[11px] font-bold text-zinc-400">{uploadingGallery ? "Uploading..." : "Add Gallery Images"}</span>
                        <input 
                          type="file" 
                          hidden 
                          accept="image/*" 
                          multiple
                          disabled={uploadingGallery}
                          onChange={(e) => handleFileUpload(e, "gallery")} 
                        />
                      </label>

                      {/* Display Gallery Images (Skip index 0 which is main) */}
                      {formData.images.slice(1).filter(img => img.src).map((img) => (
                        <div key={img.id} className="relative aspect-square rounded-xl border border-zinc-200 overflow-hidden group shadow-sm">
                          <Image src={img.src} alt="Gallery image" fill className="object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button 
                              type="button"
                              onClick={() => removeImage(img.id)}
                              className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "categories" && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[14px] font-bold text-zinc-900 uppercase tracking-wider">Product Categories</h3>
                    </div>
                    <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-4">
                      <div className="flex gap-2">
                        <input 
                          placeholder="Add new category..."
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          className="flex-1 h-10 px-3 bg-white border border-zinc-300 rounded-lg text-[13px] outline-none focus:border-[#be374f]"
                        />
                        <button 
                          type="button"
                          onClick={handleCreateCategory}
                          className="h-10 px-4 bg-zinc-900 text-white rounded-lg text-[12px] font-bold hover:bg-zinc-800"
                        >
                          Add
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {categories.map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleCategoryToggle(cat.id)}
                            className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-[12px] font-bold transition-all ${
                              formData.categories.find(c => c.id === cat.id)
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm"
                                : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300"
                            }`}
                          >
                            {decodeEntities(cat.name)}
                            {formData.categories.find(c => c.id === cat.id) && <Check size={14} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[14px] font-bold text-zinc-900 uppercase tracking-wider">Product Tags</h3>
                    <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-4">
                      <div className="flex gap-2">
                        <input 
                          placeholder="Add new tag..."
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          className="flex-1 h-10 px-3 bg-white border border-zinc-300 rounded-lg text-[13px] outline-none focus:border-[#be374f]"
                        />
                        <button 
                          type="button"
                          onClick={handleCreateTag}
                          className="h-10 px-4 bg-zinc-900 text-white rounded-lg text-[12px] font-bold hover:bg-zinc-800"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => {
                              const exists = formData.tags.find(t => t.id === tag.id);
                              setFormData(prev => ({
                                ...prev,
                                tags: exists 
                                  ? prev.tags.filter(t => t.id !== tag.id)
                                  : [...prev.tags, { id: tag.id }]
                              }));
                            }}
                            className={`px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all ${
                              formData.tags.find(t => t.id === tag.id)
                                ? "bg-zinc-900 border-zinc-900 text-white shadow-md"
                                : "bg-white border-zinc-300 text-zinc-500 hover:border-zinc-400"
                            }`}
                          >
                            {decodeEntities(tag.name)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[14px] font-bold text-zinc-900 uppercase tracking-wider">Product Brand</h3>
                    <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-4">
                      <div className="flex gap-2">
                        <input 
                          placeholder="Add new brand (e.g. Zara)..."
                          value={newBrandName}
                          onChange={(e) => setNewBrandName(e.target.value)}
                          className="flex-1 h-10 px-3 bg-white border border-zinc-300 rounded-lg text-[13px] outline-none focus:border-[#be374f]"
                        />
                        <button 
                          type="button"
                          onClick={handleCreateBrand}
                          className="h-10 px-4 bg-zinc-900 text-white rounded-lg text-[12px] font-bold hover:bg-zinc-800"
                        >
                          Add
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-zinc-400 uppercase">Or select:</span>
                        <select 
                          name="brand_select"
                          onChange={(e) => {
                            const brandId = parseInt(e.target.value);
                            if (!brandId) return;
                            const exists = formData.brands.find(b => b.id === brandId);
                            if (!exists) {
                              setFormData(prev => ({
                                ...prev,
                                brands: [...prev.brands, { id: brandId }]
                              }));
                            }
                          }}
                          className="flex-1 h-10 px-3 bg-white border border-zinc-300 rounded-lg text-[13px] outline-none"
                        >
                          <option value="">Choose Existing...</option>
                          {brandsList.map(brand => (
                            <option key={brand.id} value={brand.id}>{decodeEntities(brand.name)}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Active Brand Display */}
                      <div className="flex flex-wrap gap-2">
                         {(formData.brands || []).map(b => {
                           const brandObj = brandsList.find(bl => bl.id === b.id);
                           if (!brandObj) return null;
                           return (
                            <span key={b.id} className="px-3 py-1 bg-[#febd69] text-zinc-900 text-[11px] font-bold rounded-full flex items-center gap-2">
                              {decodeEntities(brandObj.name)}
                              <button 
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    brands: prev.brands.filter(brand => brand.id !== b.id)
                                  }));
                                }} 
                                className="hover:text-rose-600"
                              >
                                <X size={12} />
                              </button>
                            </span>
                           );
                         })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "shipping" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-zinc-700">Weight (kg)</label>
                    <input 
                      type="number"
                      name="weight"
                      value={formData.weight || ""}
                      onChange={handleInputChange}
                      className="w-full h-11 px-4 bg-white border border-zinc-300 rounded-lg text-[14px] outline-none focus:border-[#be374f] transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[13px] font-bold text-zinc-700">Dimensions (cm)</label>
                    <div className="grid grid-cols-3 gap-4">
                       <input 
                         placeholder="Length"
                         name="dimensions.length"
                         value={formData.dimensions.length}
                         onChange={(e) => setFormData(prev => ({ ...prev, dimensions: { ...prev.dimensions, length: e.target.value } }))}
                         className="h-11 px-4 bg-white border border-zinc-300 rounded-lg text-[14px] outline-none focus:border-[#be374f] transition-all shadow-inner"
                       />
                       <input 
                         placeholder="Width"
                         name="dimensions.width"
                         value={formData.dimensions.width}
                         onChange={(e) => setFormData(prev => ({ ...prev, dimensions: { ...prev.dimensions, width: e.target.value } }))}
                         className="h-11 px-4 bg-white border border-zinc-300 rounded-lg text-[14px] outline-none focus:border-[#be374f] transition-all shadow-inner"
                       />
                       <input 
                         placeholder="Height"
                         name="dimensions.height"
                         value={formData.dimensions.height}
                         onChange={(e) => setFormData(prev => ({ ...prev, dimensions: { ...prev.dimensions, height: e.target.value } }))}
                         className="h-11 px-4 bg-white border border-zinc-300 rounded-lg text-[14px] outline-none focus:border-[#be374f] transition-all shadow-inner"
                       />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "linked" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-zinc-700">Upsells</label>
                    <p className="text-[11px] text-zinc-400">Upsells are products which you recommend instead of the currently viewed product, for example, products that are more profitable or better quality or more expensive.</p>
                    <input 
                      disabled
                      placeholder="Search for a product... (Coming soon)"
                      className="w-full h-11 px-4 bg-zinc-50 border border-zinc-300 rounded-lg text-[14px] outline-none cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-zinc-700">Cross-sells</label>
                    <p className="text-[11px] text-zinc-400">Cross-sells are products which you promote in the cart, based on the current product.</p>
                    <input 
                      disabled
                      placeholder="Search for a product... (Coming soon)"
                      className="w-full h-11 px-4 bg-zinc-50 border border-zinc-300 rounded-lg text-[14px] outline-none cursor-not-allowed"
                    />
                  </div>
                </div>
              )}

              {activeTab === "bulk" && (
                <div className="space-y-6">
                  <div className="p-8 border-2 border-dashed border-zinc-200 rounded-2xl bg-zinc-50 text-center space-y-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <Upload className="text-zinc-400" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-zinc-900">Upload Bulk Products</h4>
                      <p className="text-[12px] text-zinc-500 mt-1">Upload a JSON file containing an array of product objects.</p>
                    </div>
                    <label className="inline-block h-10 px-6 bg-zinc-900 text-white rounded-lg text-[13px] font-bold cursor-pointer hover:bg-zinc-800 transition-all">
                      Choose File
                      <input 
                        type="file" 
                        accept=".json" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          try {
                            const text = await file.text();
                            const products = JSON.parse(text);
                            if (!Array.isArray(products)) throw new Error("JSON must be an array of products");
                            
                            setLoading(true);
                            for (const p of products) {
                              await fetch("/api/merchant/products", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ product: { ...p, meta_data: [{ key: "merchant_email", value: user.email }] } })
                              });
                            }
                            setSuccess(true);
                            setTimeout(() => {
                              if (productToEdit) {
                                logMerchantAction(user, "PRODUCT_UPDATE", `Updated product: ${formData.name}`);
                              } else {
                                logMerchantAction(user, "PRODUCT_CREATE", `Created new product: ${formData.name}`);
                              }

                              onProductAdded();
                              onClose();
                            }, 1500);
                          } catch (err) {
                            setError(err.message);
                          } finally {
                            setLoading(false);
                          }
                        }}
                      />
                    </label>
                    <p className="text-[11px] text-zinc-400 font-medium italic">Note: Media files in bulk upload must be public URLs.</p>
                  </div>
                </div>
              )}

              {activeTab === "advanced" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-zinc-700">Purchase Note</label>
                    <textarea 
                      name="purchase_note"
                      value={formData.purchase_note}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full p-4 bg-white border border-zinc-300 rounded-lg text-[14px] outline-none focus:border-[#be374f] transition-all shadow-inner resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-zinc-700">Menu Order</label>
                    <input 
                      type="number"
                      name="menu_order"
                      value={formData.menu_order}
                      onChange={handleInputChange}
                      className="w-full h-11 px-4 bg-white border border-zinc-300 rounded-lg text-[14px] outline-none focus:border-[#be374f] transition-all shadow-inner"
                    />
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
                    <input 
                      type="checkbox"
                      id="reviews_allowed"
                      name="reviews_allowed"
                      checked={formData.reviews_allowed}
                      onChange={handleInputChange}
                      className="w-4 h-4 accent-[#be374f]"
                    />
                    <label htmlFor="reviews_allowed" className="text-[13px] font-bold text-zinc-700 cursor-pointer select-none">
                      Enable reviews
                    </label>
                  </div>
                  
                  <div className="pt-4 border-t border-zinc-200 space-y-4">
                    <h4 className="text-[14px] font-bold text-zinc-900">Returns & Refunds</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[13px] font-bold text-zinc-700">Item Return Policy</label>
                        <select 
                          name="return_policy"
                          value={formData.return_policy}
                          onChange={handleInputChange}
                          className="w-full h-11 px-4 bg-white border border-zinc-300 rounded-lg text-[13px] outline-none focus:border-[#be374f] transition-all cursor-pointer"
                        >
                          <option value="global">Use Global Store Policy</option>
                          <option value="custom">Custom Policy for this Item</option>
                          <option value="no-returns">No Returns Accepted</option>
                        </select>
                      </div>
                      
                      {formData.return_policy === "custom" && (
                        <div className="space-y-2">
                          <label className="text-[13px] font-bold text-zinc-700">Return Period (Days)</label>
                          <input 
                            type="number"
                            min="1"
                            name="return_period"
                            value={formData.return_period}
                            onChange={handleInputChange}
                            placeholder="e.g. 14"
                            className="w-full h-11 px-4 bg-white border border-zinc-300 rounded-lg text-[13px] outline-none focus:border-[#be374f] transition-all"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "attributes" && (
                <div className="space-y-6">
                  <div className="p-6 bg-white border border-zinc-200 rounded-xl space-y-6 shadow-sm">
                    <div className="flex items-center gap-4">
                      <select 
                        id="attr-select"
                        className="h-10 px-4 bg-zinc-50 border border-zinc-300 rounded-lg text-[13px] outline-none flex-1"
                      >
                        <option value="custom">Custom product attribute</option>
                        {globalAttributes?.filter(ga => !formData.attributes?.find(fa => fa.id === ga.id)).map(ga => (
                          <option key={ga.id} value={ga.id}>{ga.name}</option>
                        ))}
                      </select>
                      <button 
                        type="button" 
                        onClick={() => {
                          const val = document.getElementById("attr-select").value;
                          addAttribute(val);
                        }}
                        className="h-10 px-6 bg-white border border-zinc-300 rounded-lg text-[13px] font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
                      >
                        Add
                      </button>
                    </div>

                    <div className="space-y-4">
                      {formData.attributes?.map((attr, idx) => (
                        <div key={idx} className="p-5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-4">
                          <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                            <span className="text-[14px] font-bold text-zinc-900">{attr.name || "New attribute"}</span>
                            <button 
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, attributes: prev.attributes.filter((_, i) => i !== idx) }))}
                              className="text-[12px] font-bold text-rose-600 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-6">
                            <div className="col-span-1 space-y-2">
                              <label className="text-[12px] text-zinc-600">Name:</label>
                              {(attr.isCustom || attr.id === 0) ? (
                                <input 
                                  placeholder="e.g. Color or Size"
                                  value={attr.name}
                                  onChange={(e) => {
                                    const newAttrs = [...formData.attributes];
                                    newAttrs[idx].name = e.target.value;
                                    setFormData(prev => ({ ...prev, attributes: newAttrs }));
                                  }}
                                  className="w-full h-9 px-3 bg-white border border-zinc-300 rounded text-[13px] outline-none focus:border-[#be374f]"
                                />
                              ) : (
                                <div className="h-9 px-3 bg-zinc-100 border border-zinc-200 rounded text-[13px] flex items-center text-zinc-500 font-bold">
                                  {attr.name}
                                </div>
                              )}

                              <div className="pt-4 space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="checkbox"
                                    checked={attr.visible}
                                    onChange={(e) => {
                                      const newAttrs = [...formData.attributes];
                                      newAttrs[idx].visible = e.target.checked;
                                      setFormData(prev => ({ ...prev, attributes: newAttrs }));
                                    }}
                                    className="accent-[#be374f] w-4 h-4"
                                  />
                                  <span className="text-[12px] text-zinc-700">Visible on the product page</span>
                                </label>
                                {formData.type === "variable" && (
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                      type="checkbox"
                                      checked={attr.variation}
                                      onChange={(e) => {
                                        const newAttrs = [...formData.attributes];
                                        newAttrs[idx].variation = e.target.checked;
                                        setFormData(prev => ({ ...prev, attributes: newAttrs }));
                                      }}
                                      className="accent-[#be374f] w-4 h-4"
                                    />
                                    <span className="text-[12px] text-zinc-700">Used for variations</span>
                                  </label>
                                )}
                              </div>
                            </div>

                            <div className="col-span-2 space-y-2">
                              <label className="text-[12px] text-zinc-600">Value(s):</label>
                              {(attr.isCustom || attr.id === 0) ? (
                                <textarea 
                                  placeholder="Enter options for customers to choose from, f.e. 'Blue' or 'Large'. Use '|' to separate different options."
                                  value={attr.rawValue !== undefined ? attr.rawValue : attr.options?.join(" | ") || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const newAttrs = [...formData.attributes];
                                    newAttrs[idx].rawValue = val;
                                    newAttrs[idx].options = val.split("|").map(o => o.trim()).filter(o => o !== "");
                                    setFormData(prev => ({ ...prev, attributes: newAttrs }));
                                  }}
                                  className="w-full p-3 bg-white border border-zinc-300 rounded text-[13px] outline-none focus:border-[#be374f] min-h-[120px] resize-none"
                                />
                              ) : (
                                <div className="p-3 bg-white border border-zinc-300 rounded min-h-[120px]">
                                  <div className="flex flex-wrap gap-2">
                                    {globalAttributes?.find(ga => ga.id === attr.id)?.terms?.map(term => (
                                      <button
                                        key={term.id}
                                        type="button"
                                        onClick={() => toggleAttributeOption(attr.id, term.name)}
                                        className={`px-3 py-1 rounded text-[12px] font-medium transition-all ${
                                          attr.options.includes(term.name)
                                            ? "bg-zinc-800 text-white"
                                            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                                        }`}
                                      >
                                        {term.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-zinc-200">
                      <button 
                        type="button"
                        onClick={() => alert("Attributes saved locally. They will be published when you save the product.")}
                        className="h-9 px-6 bg-[#0073aa] text-white rounded text-[13px] font-medium hover:bg-[#005177] transition-colors"
                      >
                        Save attributes
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "variations" && (
                <div className="space-y-6">
                  <div className="p-6 bg-white border border-zinc-200 rounded-xl space-y-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Do you want to generate all variations? This will create a new variation for each and every possible combination of variation attributes (max 50 per run).")) {
                            generateVariations();
                          }
                        }}
                        className="h-9 px-6 bg-white border border-[#0073aa] text-[#0073aa] rounded text-[13px] font-medium hover:bg-zinc-50 transition-colors"
                      >
                        Generate variations
                      </button>
                      <button
                        type="button"
                        onClick={() => alert("Manual addition coming soon. Use Generate for now.")}
                        className="h-9 px-6 bg-white border border-zinc-300 text-zinc-700 rounded text-[13px] font-medium hover:bg-zinc-50 transition-colors"
                      >
                        Add manually
                      </button>
                    </div>

                    {formData.variations?.length === 0 ? (
                      <div className="py-12 text-center text-zinc-400">
                        <div className="flex justify-center mb-4 opacity-50">
                          <Layers size={48} />
                        </div>
                        <p className="text-[14px]">No variations yet. Generate them from all added attributes or add a new variation manually.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-2 pb-2 border-b border-zinc-200 text-[12px] text-zinc-500 font-medium">
                          <span>{formData.variations?.length || 0} variations</span>
                          <span className="cursor-pointer hover:text-zinc-900">Expand / Close</span>
                        </div>
                        {formData.variations?.map((v, i) => (
                          <div key={i} className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between p-3 bg-zinc-50 border-b border-zinc-200">
                              <div className="flex items-center gap-3">
                                <span className="text-[12px] font-bold text-zinc-400">#{i + 1}</span>
                                <span className="text-[13px] font-bold text-zinc-900">
                                  {v.attributes?.map(a => a.option || a.name).join(" - ") || "Variation Options"}
                                </span>
                              </div>
                              <button 
                                type="button" 
                                onClick={() => {
                                  if(window.confirm("Are you sure you want to remove this variation?")) {
                                    setFormData(prev => ({...prev, variations: prev.variations.filter((_, idx) => idx !== i)}));
                                  }
                                }}
                                className="text-[12px] text-rose-600 hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="p-4 bg-white space-y-6">
                              {/* Row 1: Image, SKU, Enabled, Manage Stock */}
                              <div className="flex items-start gap-6">
                                <div className="space-y-1 text-center">
                                  <label className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider block">Image</label>
                                  <div 
                                    onClick={() => document.getElementById(`var-img-${i}`).click()}
                                    className="w-20 h-20 bg-zinc-50 border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center rounded-lg cursor-pointer hover:border-[#0073aa] hover:bg-[#f0f8ff] transition-all group relative overflow-hidden"
                                  >
                                    {v.image?.src ? (
                                      <Image src={v.image.src} alt={v.sku || "Variation image"} fill className="object-cover" />
                                    ) : (
                                      <>
                                        <ImageIcon size={20} className="text-zinc-300 group-hover:text-[#0073aa]" />
                                        <span className="text-[9px] text-zinc-400 font-bold mt-1 group-hover:text-[#0073aa]">UPLOAD</span>
                                      </>
                                    )}
                                    <input 
                                      id={`var-img-${i}`}
                                      type="file"
                                      className="hidden"
                                      accept="image/*"
                                      onChange={(e) => handleFileUpload(e, "variation", i)}
                                    />
                                  </div>
                                </div>

                                <div className="flex-1 grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-[12px] text-zinc-600 font-bold">SKU</label>
                                    <input 
                                      value={v.sku || ""}
                                      onChange={(e) => {
                                        const newVars = [...formData.variations];
                                        newVars[i].sku = e.target.value;
                                        setFormData(prev => ({ ...prev, variations: newVars }));
                                      }}
                                      className="w-full h-9 px-3 border border-zinc-300 rounded text-[13px] outline-none focus:border-[#0073aa]"
                                    />
                                  </div>
                                  <div className="flex items-center gap-6 pt-7">
                                    <label className="flex items-center gap-2 text-[12px] text-zinc-600 cursor-pointer font-medium">
                                      <input 
                                        type="checkbox" 
                                        className="accent-[#0073aa] w-4 h-4" 
                                        checked={v.status !== 'private'} 
                                        onChange={(e) => {
                                          const newVars = [...formData.variations];
                                          newVars[i].status = e.target.checked ? 'publish' : 'private';
                                          setFormData(prev => ({ ...prev, variations: newVars }));
                                        }}
                                      /> Enabled
                                    </label>
                                    <label className="flex items-center gap-2 text-[12px] text-zinc-600 cursor-pointer font-medium">
                                      <input 
                                        type="checkbox" 
                                        className="accent-[#0073aa] w-4 h-4"
                                        checked={v.manage_stock}
                                        onChange={(e) => {
                                          const newVars = [...formData.variations];
                                          newVars[i].manage_stock = e.target.checked;
                                          setFormData(prev => ({ ...prev, variations: newVars }));
                                        }}
                                      /> Manage stock?
                                    </label>
                                  </div>
                                </div>
                              </div>

                              {/* Row 2: Prices and Stock */}
                              <div className="grid grid-cols-4 gap-4 pb-4 border-b border-zinc-100">
                                <div className="space-y-2">
                                  <label className="text-[12px] text-zinc-600 font-bold">Regular price (JOD) <span className="text-rose-500">*</span></label>
                                  <input 
                                    type="number"
                                    step="0.01"
                                    value={v.regular_price || ""}
                                    onChange={(e) => {
                                      const newVars = [...formData.variations];
                                      newVars[i].regular_price = e.target.value;
                                      setFormData(prev => ({ ...prev, variations: newVars }));
                                    }}
                                    className="w-full h-9 px-3 border border-zinc-300 rounded text-[13px] outline-none focus:border-[#0073aa]"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[12px] text-zinc-600 font-bold">Sale price (JOD)</label>
                                  <input 
                                    type="number"
                                    step="0.01"
                                    value={v.sale_price || ""}
                                    onChange={(e) => {
                                      const newVars = [...formData.variations];
                                      newVars[i].sale_price = e.target.value;
                                      setFormData(prev => ({ ...prev, variations: newVars }));
                                    }}
                                    className="w-full h-9 px-3 border border-zinc-300 rounded text-[13px] outline-none focus:border-[#0073aa]"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[12px] text-zinc-600 font-bold">Stock status</label>
                                  <select 
                                    value={v.stock_status || "instock"}
                                    onChange={(e) => {
                                      const newVars = [...formData.variations];
                                      newVars[i].stock_status = e.target.value;
                                      setFormData(prev => ({ ...prev, variations: newVars }));
                                    }}
                                    className="w-full h-9 px-3 border border-zinc-300 rounded text-[13px] outline-none focus:border-[#0073aa]"
                                  >
                                    <option value="instock">In stock</option>
                                    <option value="outofstock">Out of stock</option>
                                    <option value="onbackorder">On backorder</option>
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[12px] text-zinc-600 font-bold">Stock qty</label>
                                  <input 
                                    type="number"
                                    disabled={!v.manage_stock}
                                    value={v.stock_quantity || 0}
                                    onChange={(e) => {
                                      const newVars = [...formData.variations];
                                      newVars[i].stock_quantity = e.target.value;
                                      setFormData(prev => ({ ...prev, variations: newVars }));
                                    }}
                                    className="w-full h-9 px-3 border border-zinc-300 rounded text-[13px] outline-none focus:border-[#0073aa] disabled:bg-zinc-50 disabled:text-zinc-400"
                                  />
                                </div>
                              </div>

                              {/* Row 3: Backorders, Threshold, Weight, Dimensions */}
                              <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-[12px] text-zinc-600 font-bold flex items-center gap-1">Allow backorders? <HelpCircle size={14} className="text-zinc-300" /></label>
                                      <select 
                                        value={v.backorders || "no"}
                                        onChange={(e) => {
                                          const newVars = [...formData.variations];
                                          newVars[i].backorders = e.target.value;
                                          setFormData(prev => ({ ...prev, variations: newVars }));
                                        }}
                                        className="w-full h-9 px-3 border border-zinc-300 rounded text-[13px] outline-none focus:border-[#0073aa]"
                                      >
                                        <option value="no">Do not allow</option>
                                        <option value="notify">Allow, but notify customer</option>
                                        <option value="yes">Allow</option>
                                      </select>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-[12px] text-zinc-600 font-bold flex items-center gap-1">Low stock threshold <HelpCircle size={14} className="text-zinc-300" /></label>
                                      <input 
                                        type="number"
                                        placeholder="Store-wide threshold (2)"
                                        value={v.low_stock_amount || ""}
                                        onChange={(e) => {
                                          const newVars = [...formData.variations];
                                          newVars[i].low_stock_amount = e.target.value;
                                          setFormData(prev => ({ ...prev, variations: newVars }));
                                        }}
                                        className="w-full h-9 px-3 border border-zinc-300 rounded text-[13px] outline-none focus:border-[#0073aa]"
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-[12px] text-zinc-600 font-bold flex items-center gap-1">Shipping class <HelpCircle size={14} className="text-zinc-300" /></label>
                                    <select 
                                      value={v.shipping_class || ""}
                                      onChange={(e) => {
                                        const newVars = [...formData.variations];
                                        newVars[i].shipping_class = e.target.value;
                                        setFormData(prev => ({ ...prev, variations: newVars }));
                                      }}
                                      className="w-full h-9 px-3 border border-zinc-300 rounded text-[13px] outline-none focus:border-[#0073aa]"
                                    >
                                      <option value="">Same as parent</option>
                                      <option value="standard">Standard Shipping</option>
                                      <option value="heavy">Heavy Items</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div className="grid grid-cols-4 gap-2">
                                    <div className="col-span-1 space-y-2">
                                      <label className="text-[12px] text-zinc-600 font-bold">Weight (kg)</label>
                                      <input 
                                        type="number"
                                        step="0.01"
                                        value={v.weight || ""}
                                        onChange={(e) => {
                                          const newVars = [...formData.variations];
                                          newVars[i].weight = e.target.value;
                                          setFormData(prev => ({ ...prev, variations: newVars }));
                                        }}
                                        className="w-full h-9 px-3 border border-zinc-300 rounded text-[13px] outline-none focus:border-[#0073aa]"
                                      />
                                    </div>
                                    <div className="col-span-3 space-y-2">
                                      <label className="text-[12px] text-zinc-600 font-bold">Dimensions (L×W×H) (cm)</label>
                                      <div className="flex gap-2">
                                        <input 
                                          placeholder="Length"
                                          value={v.dimensions?.length || ""}
                                          onChange={(e) => {
                                            const newVars = [...formData.variations];
                                            newVars[i].dimensions = { ...newVars[i].dimensions, length: e.target.value };
                                            setFormData(prev => ({ ...prev, variations: newVars }));
                                          }}
                                          className="flex-1 h-9 px-3 border border-zinc-300 rounded text-[13px] outline-none focus:border-[#0073aa]"
                                        />
                                        <input 
                                          placeholder="Width"
                                          value={v.dimensions?.width || ""}
                                          onChange={(e) => {
                                            const newVars = [...formData.variations];
                                            newVars[i].dimensions = { ...newVars[i].dimensions, width: e.target.value };
                                            setFormData(prev => ({ ...prev, variations: newVars }));
                                          }}
                                          className="flex-1 h-9 px-3 border border-zinc-300 rounded text-[13px] outline-none focus:border-[#0073aa]"
                                        />
                                        <input 
                                          placeholder="Height"
                                          value={v.dimensions?.height || ""}
                                          onChange={(e) => {
                                            const newVars = [...formData.variations];
                                            newVars[i].dimensions = { ...newVars[i].dimensions, height: e.target.value };
                                            setFormData(prev => ({ ...prev, variations: newVars }));
                                          }}
                                          className="flex-1 h-9 px-3 border border-zinc-300 rounded text-[13px] outline-none focus:border-[#0073aa]"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-[12px] text-zinc-600 font-bold">Description</label>
                                    <textarea 
                                      rows={2}
                                      value={v.description || ""}
                                      onChange={(e) => {
                                        const newVars = [...formData.variations];
                                        newVars[i].description = e.target.value;
                                        setFormData(prev => ({ ...prev, variations: newVars }));
                                      }}
                                      className="w-full p-2 border border-zinc-300 rounded text-[13px] outline-none focus:border-[#0073aa] resize-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-4 border-t border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2 text-zinc-500">
            {loading && <Loader2 size={16} className="animate-spin" />}
            <span className="text-[12px] font-medium">
              {loading ? "Creating product..." : "All changes are saved locally."}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {success && (
              <span className="text-[13px] text-emerald-600 font-medium flex items-center gap-1 animate-in fade-in slide-in-from-right-2">
                <Check size={16} /> Product updated successfully!
              </span>
            )}
            <button 
              onClick={onClose}
              className="h-10 px-6 bg-white border border-zinc-300 rounded-lg text-[13px] font-bold hover:bg-zinc-50 transition-all shadow-sm"
            >
              Cancel
            </button>
            <button 
              form="product-form"
              type="submit"
              disabled={loading || success}
              className={`h-10 px-8 rounded-lg text-[13px] font-bold text-white transition-all shadow-sm flex items-center gap-2 ${
                success ? "bg-emerald-600" : "bg-zinc-900 hover:bg-zinc-800"
              }`}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {success ? (
                <>
                  <Check size={16} /> {productToEdit ? "Updated" : "Published"}
                </>
              ) : (
                productToEdit ? "Update Product" : "Publish Product"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
