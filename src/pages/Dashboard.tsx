import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { QrCode, LogOut, ShoppingCart, UtensilsCrossed, Plus, Table, Trash2, Download, BarChart3, Palette, Image as ImageIcon, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  table_number: number | null;
  status: string;
  payment_method: string;
  total: number;
  customer_note: string | null;
  created_at: string;
  items?: OrderItem[];
}

interface Category {
  id: string;
  name: string;
  sort_order: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  available: boolean;
}

interface Profile {
  subscription_plan: string;
  menu_theme: string;
  restaurant_name: string;
  restaurant_description: string | null;
  logo_url: string | null;
}

type Tab = "orders" | "menu" | "tables" | "analytics" | "theme";

const MENU_THEMES = [
  { id: "default", name: "Klasični", description: "Čist i minimalan dizajn" },
  { id: "dark", name: "Tamna tema", description: "Elegantan tamni meni" },
  { id: "warm", name: "Topli tonovi", description: "Topli, ugodni tonovi" },
  { id: "ocean", name: "Okean", description: "Plavi i sveži izgled" },
];

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tableCount, setTableCount] = useState(0);
  const [tables, setTables] = useState<{ id: string; table_number: number; qr_code_token: string }[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  // New item form
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newProduct, setNewProduct] = useState({ name: "", description: "", price: "", category_id: "" });
  const [newTableCount, setNewTableCount] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [hideFinished, setHideFinished] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState({ name: "", description: "", price: "", category_id: "", image_url: "" });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [updatingProduct, setUpdatingProduct] = useState(false);

  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ restaurant_name: "", restaurant_description: "", logo_url: "" });

  const isPremium = profile?.subscription_plan === "premium";
  const formatRSD = (value: number) =>
    new Intl.NumberFormat("sr-RS", {
      style: "currency",
      currency: "RSD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  useEffect(() => {
    if (!user) return;
    fetchOrders();
    fetchCategories();
    fetchProducts();
    fetchTables();
    fetchProfile();

    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", filter: `restaurant_user_id=eq.${user.id}` },
        (payload) => {
          setOrders((prev) => [payload.new as Order, ...prev]);
          toast.info("Nova porudžbina!", { description: `Sto ${(payload.new as Order).table_number}` });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase.from("profiles").select("subscription_plan, menu_theme, restaurant_name, restaurant_description, logo_url").eq("user_id", user!.id).single();
    if (data) {
      setProfile(data as Profile);
      setProfileForm({ restaurant_name: data.restaurant_name, restaurant_description: data.restaurant_description || "", logo_url: data.logo_url || "" });
    }
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("*, order_items(id, product_name, quantity, price)").eq("restaurant_user_id", user!.id).order("created_at", { ascending: false }).limit(50);
    if (data) setOrders(data.map((o: any) => ({ ...o, items: o.order_items })));
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").eq("user_id", user!.id).order("sort_order");
    if (data) setCategories(data);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").eq("user_id", user!.id).order("sort_order");
    if (data) setProducts(data);
  };

  const fetchTables = async () => {
    const { data, count } = await supabase.from("restaurant_tables").select("*", { count: "exact" }).eq("user_id", user!.id).order("table_number");
    setTableCount(count ?? 0);
    if (data) setTables(data);
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    const { error } = await supabase.from("categories").insert({ name: newCategoryName, user_id: user!.id, sort_order: categories.length });
    if (error) { toast.error(error.message); return; }
    setNewCategoryName("");
    fetchCategories();
    toast.success("Kategorija dodata!");
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    fetchCategories();
    toast.success("Kategorija obrisana!");
  };

  const uploadProductImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) { toast.error("Greška pri uploadu slike."); return null; }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const addProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.price) return;
    setUploadingImage(true);
    let imageUrl: string | null = null;
    if (imageFile) {
      imageUrl = await uploadProductImage(imageFile);
      if (!imageUrl) { setUploadingImage(false); return; }
    }
    const { error } = await supabase.from("products").insert({
      name: newProduct.name,
      description: newProduct.description,
      price: parseFloat(newProduct.price),
      category_id: newProduct.category_id || null,
      user_id: user!.id,
      sort_order: products.length,
      image_url: imageUrl,
    });
    if (error) { toast.error(error.message); setUploadingImage(false); return; }
    setNewProduct({ name: "", description: "", price: "", category_id: "" });
    setImageFile(null);
    setUploadingImage(false);
    fetchProducts();
    toast.success("Proizvod dodat!");
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    fetchProducts();
    toast.success("Proizvod obrisan!");
  };

  const startEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setEditProduct({
      name: p.name,
      description: p.description || "",
      price: String(p.price),
      category_id: p.category_id || "",
      image_url: (p as any).image_url || "",
    });
    setEditImageFile(null);
  };

  const cancelEditProduct = () => {
    setEditingProductId(null);
    setEditImageFile(null);
  };

  const saveEditProduct = async () => {
    if (!editingProductId || !editProduct.name.trim() || !editProduct.price) return;
    setUpdatingProduct(true);
    let imageUrl = editProduct.image_url;
    if (editImageFile) {
      const url = await uploadProductImage(editImageFile);
      if (!url) { setUpdatingProduct(false); return; }
      imageUrl = url;
    }
    const { error } = await supabase.from("products").update({
      name: editProduct.name,
      description: editProduct.description || null,
      price: parseFloat(editProduct.price),
      category_id: editProduct.category_id || null,
      image_url: imageUrl || null,
    }).eq("id", editingProductId);
    if (error) { toast.error(error.message); setUpdatingProduct(false); return; }
    setEditingProductId(null);
    setEditImageFile(null);
    setUpdatingProduct(false);
    fetchProducts();
    toast.success("Proizvod ažuriran!");
  };

  const generateTables = async () => {
    const count = parseInt(newTableCount);
    if (!count || count < 1) return;
    const newTables = Array.from({ length: count }, (_, i) => ({
      user_id: user!.id,
      table_number: tableCount + i + 1,
    }));
    const { error } = await supabase.from("restaurant_tables").insert(newTables);
    if (error) { toast.error(error.message); return; }
    setNewTableCount("");
    fetchTables();
    toast.success(`${count} stolova generisano!`);
  };

  const deleteTable = async (id: string) => {
    const { error: detachError } = await supabase
      .from("orders")
      .update({ table_id: null })
      .eq("restaurant_user_id", user!.id)
      .eq("table_id", id);

    if (detachError) {
      toast.error(detachError.message);
      return;
    }

    const { error } = await supabase.from("restaurant_tables").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    fetchTables();
    toast.success("Sto obrisan!");
  };

  const downloadQR = (tableNumber: number, token: string) => {
    const canvas = document.getElementById(`qr-${token}`) as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `sto-${tableNumber}-qr.png`;
    a.click();
  };

  const updateTheme = async (theme: string) => {
    const { error } = await supabase.from("profiles").update({ menu_theme: theme }).eq("user_id", user!.id);
    if (error) { toast.error(error.message); return; }
    setProfile((prev) => prev ? { ...prev, menu_theme: theme } : prev);
    toast.success("Tema ažurirana!");
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/logo.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
    if (error) { toast.error("Greška pri uploadu logoa."); return null; }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const updateProfile = async () => {
    setUploadingLogo(true);
    let logoUrl = profileForm.logo_url;
    if (logoFile) {
      const url = await uploadLogo(logoFile);
      if (!url) { setUploadingLogo(false); return; }
      logoUrl = url;
    }
    const { error } = await supabase.from("profiles").update({
      restaurant_name: profileForm.restaurant_name,
      restaurant_description: profileForm.restaurant_description || null,
      logo_url: logoUrl || null,
    }).eq("user_id", user!.id);
    if (error) { toast.error(error.message); setUploadingLogo(false); return; }
    setEditingProfile(false);
    setLogoFile(null);
    setUploadingLogo(false);
    fetchProfile();
    toast.success("Profil ažuriran!");
  };

  type OrderStatus = Database["public"]["Enums"]["order_status"];
  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) { toast.error(error.message); return; }
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    toast.success("Status ažuriran!");
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    preparing: "bg-orange-100 text-orange-800",
    ready: "bg-green-100 text-green-800",
    completed: "bg-muted text-muted-foreground",
    cancelled: "bg-destructive/10 text-destructive",
  };

  const statusLabels: Record<string, string> = {
    pending: "Na čekanju",
    confirmed: "Potvrđena",
    preparing: "Priprema se",
    ready: "Spremna",
    completed: "Završena",
    cancelled: "Otkazana",
  };

  // Analytics — exclude cancelled orders from revenue calculations
  const nonCancelledOrders = orders.filter((o) => o.status !== "cancelled");
  const filteredOrders = hideFinished ? orders.filter((o) => o.status !== "completed" && o.status !== "cancelled") : orders;
  const todayOrders = nonCancelledOrders.filter((o) => new Date(o.created_at).toDateString() === new Date().toDateString());
  const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const completedOrders = nonCancelledOrders.filter((o) => o.status === "completed");
  const avgOrderValue = completedOrders.length > 0 ? completedOrders.reduce((s, o) => s + Number(o.total), 0) / completedOrders.length : 0;

  const allTabs: { key: Tab; icon: any; label: string; premium?: boolean }[] = [
    { key: "orders", icon: ShoppingCart, label: "Porudžbine" },
    { key: "menu", icon: UtensilsCrossed, label: "Meni" },
    { key: "tables", icon: Table, label: "Stolovi" },
    { key: "analytics", icon: BarChart3, label: "Analitika", premium: true },
    { key: "theme", icon: Palette, label: "Tema", premium: true },
  ];

  const visibleTabs = allTabs.filter((t) => !t.premium || isPremium);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero">
              <QrCode className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold text-foreground">Dashboard</span>
            {isPremium && (
              <span className="rounded-full bg-gradient-hero px-2 py-0.5 text-xs font-semibold text-primary-foreground">Premium</span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }}>
            <LogOut className="mr-1 h-4 w-4" /> Odjavi se
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border bg-card overflow-x-auto">
        <div className="mx-auto flex max-w-7xl gap-1 px-4 md:px-8">
          {visibleTabs.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        {activeTab === "orders" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold text-foreground">Porudžbine</h2>
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideFinished}
                  onChange={(e) => setHideFinished(e.target.checked)}
                  className="rounded border-border"
                />
                Sakrij završene/otkazane
              </label>
            </div>
            {filteredOrders.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-12 text-center">
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <p className="mt-4 text-muted-foreground">Još nema porudžbina</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-semibold text-foreground">
                        Sto {order.table_number ?? "?"}
                      </span>
                      <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${statusColors[order.status]}`}>
                        {statusLabels[order.status] ?? order.status}
                      </span>
                    </div>
                    {order.items && order.items.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {order.items.map((item) => (
                          <li key={item.id} className="flex justify-between text-sm text-foreground">
                            <span>{item.quantity}x {item.product_name}</span>
                            <span className="text-muted-foreground">{formatRSD(Number(item.price) * item.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-lg font-bold text-foreground">{formatRSD(Number(order.total))}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.payment_method === "card" ? "Kartica" : "Gotovina"} • {new Date(order.created_at).toLocaleTimeString("sr")}
                      </p>
                    </div>
                    {order.customer_note && (
                      <p className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-sm italic text-muted-foreground">📝 {order.customer_note}</p>
                    )}
                    {order.status === "pending" && (
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="hero" onClick={() => updateOrderStatus(order.id, "confirmed")}>Potvrdi</Button>
                        <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.id, "cancelled")}>Otkaži</Button>
                      </div>
                    )}
                    {order.status === "confirmed" && (
                      <Button size="sm" variant="hero" className="mt-3" onClick={() => updateOrderStatus(order.id, "preparing")}>Priprema se</Button>
                    )}
                    {order.status === "preparing" && (
                      <Button size="sm" variant="hero" className="mt-3" onClick={() => updateOrderStatus(order.id, "ready")}>Spremna</Button>
                    )}
                    {order.status === "ready" && (
                      <Button size="sm" variant="secondary" className="mt-3" onClick={() => updateOrderStatus(order.id, "completed")}>Završi</Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "menu" && (
          <div className="space-y-8">
            {/* Branding (Premium) */}
            {isPremium && (
              <div className="rounded-xl border border-primary/20 bg-accent/30 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-lg font-bold text-foreground">Brending restorana</h3>
                  {!editingProfile ? (
                    <Button size="sm" variant="outline" onClick={() => setEditingProfile(true)}>Uredi</Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" variant="hero" onClick={updateProfile}>Sačuvaj</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingProfile(false)}>Otkaži</Button>
                    </div>
                  )}
                </div>
                {editingProfile ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <input className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none" placeholder="Naziv restorana" value={profileForm.restaurant_name} onChange={(e) => setProfileForm({ ...profileForm, restaurant_name: e.target.value })} />
                    <input className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none" placeholder="Opis restorana" value={profileForm.restaurant_description} onChange={(e) => setProfileForm({ ...profileForm, restaurant_description: e.target.value })} />
                    <label className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm cursor-pointer">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground truncate">{logoFile ? logoFile.name : "Upload logo"}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-3">
                    {profile?.logo_url && <img src={profile.logo_url} alt="Logo" className="h-10 w-10 rounded-lg object-cover" />}
                    <div>
                      <p className="font-semibold text-foreground">{profile?.restaurant_name}</p>
                      <p className="text-xs text-muted-foreground">{profile?.restaurant_description || "Bez opisa"}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Categories */}
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground">Kategorije</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <span key={c.id} className="group flex items-center gap-1 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
                    {c.name}
                    <button onClick={() => deleteCategory(c.id)} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Nova kategorija..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCategory()}
                />
                <Button size="sm" variant="hero" onClick={addCategory}>
                  <Plus className="mr-1 h-4 w-4" /> Dodaj
                </Button>
              </div>
            </div>

            {/* Products */}
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground">Proizvodi</h2>
              {products.length > 0 && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((p) => (
                    <div key={p.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                      {editingProductId === p.id ? (
                        <div className="space-y-2">
                          <input className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none" placeholder="Naziv" value={editProduct.name} onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })} />
                          <input className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none" placeholder="Opis" value={editProduct.description} onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })} />
                          <input className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none" placeholder="Cena (RSD)" type="number" value={editProduct.price} onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })} />
                          <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none" value={editProduct.category_id} onChange={(e) => setEditProduct({ ...editProduct, category_id: e.target.value })}>
                            <option value="">Bez kategorije</option>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                          <label className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm cursor-pointer">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground truncate">{editImageFile ? editImageFile.name : "Promeni sliku"}</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => setEditImageFile(e.target.files?.[0] || null)} />
                          </label>
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" variant="hero" onClick={saveEditProduct} disabled={updatingProduct}>
                              <Check className="mr-1 h-4 w-4" /> Sačuvaj
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEditProduct}>
                              <X className="mr-1 h-4 w-4" /> Otkaži
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          {(p as any).image_url && (
                            <img src={(p as any).image_url} alt={p.name} className="h-14 w-14 rounded-lg object-cover flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">{p.name}</p>
                            {p.description && <p className="text-xs text-muted-foreground truncate">{p.description}</p>}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="font-heading text-lg font-bold text-primary">{formatRSD(Number(p.price))}</span>
                            <button onClick={() => startEditProduct(p)} className="rounded-full p-1 text-muted-foreground hover:text-primary transition-colors">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => deleteProduct(p.id)} className="rounded-full p-1 text-muted-foreground hover:text-destructive transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 grid gap-3 rounded-xl border border-border bg-card p-4 shadow-card sm:grid-cols-2 lg:grid-cols-5">
                <input className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none" placeholder="Naziv proizvoda" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
                <input className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none" placeholder="Opis" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} />
                <input className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none" placeholder="Cena (RSD)" type="number" step="1" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} />
                <label className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm cursor-pointer">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">{imageFile ? imageFile.name : "Slika"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                </label>
                <div className="flex gap-2">
                  <select className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none" value={newProduct.category_id} onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}>
                    <option value="">Kategorija</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <Button size="sm" variant="hero" onClick={addProduct} disabled={uploadingImage}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tables" && (
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-bold text-foreground">Stolovi i QR kodovi</h2>
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <p className="text-foreground">
                Trenutno imate <span className="font-bold text-primary">{tableCount}</span> stolova.
              </p>
              <div className="mt-4 flex gap-2">
                <input
                  className="w-32 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none"
                  type="number"
                  min="1"
                  placeholder="Broj stolova"
                  value={newTableCount}
                  onChange={(e) => setNewTableCount(e.target.value)}
                />
                <Button variant="hero" size="sm" onClick={generateTables}>
                  <Plus className="mr-1 h-4 w-4" /> Generiši stolove
                </Button>
              </div>
            </div>

            {tables.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tables.map((t) => {
                  const menuUrl = `${window.location.origin}/menu/${t.qr_code_token}`;
                  return (
                    <div key={t.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-heading text-lg font-bold text-foreground">Sto {t.table_number}</span>
                        <button onClick={() => deleteTable(t.id)} className="rounded-full p-1 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex justify-center rounded-lg bg-white p-4">
                        <QRCodeCanvas
                          id={`qr-${t.qr_code_token}`}
                          value={menuUrl}
                          size={180}
                          level="H"
                          includeMargin
                          imageSettings={{
                            src: "",
                            height: 0,
                            width: 0,
                            excavate: false,
                          }}
                        />
                      </div>
                      <p className="mt-3 text-center text-xs text-muted-foreground">Sto {t.table_number}</p>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => downloadQR(t.table_number, t.qr_code_token)}
                        >
                          <Download className="mr-1 h-3 w-3" /> Preuzmi
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteTable(t.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "analytics" && isPremium && (
          <div className="space-y-6">
            <h2 className="font-heading text-xl font-bold text-foreground">Analitika porudžbina</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                <p className="text-sm text-muted-foreground">Ukupno porudžbina</p>
                <p className="mt-1 font-heading text-3xl font-bold text-foreground">{nonCancelledOrders.length}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                <p className="text-sm text-muted-foreground">Danas</p>
                <p className="mt-1 font-heading text-3xl font-bold text-foreground">{todayOrders.length}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                <p className="text-sm text-muted-foreground">Prihod danas</p>
                <p className="mt-1 font-heading text-3xl font-bold text-primary">{formatRSD(todayRevenue)}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                <p className="text-sm text-muted-foreground">Prosek porudžbine</p>
                <p className="mt-1 font-heading text-3xl font-bold text-foreground">{formatRSD(avgOrderValue)}</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-heading font-bold text-foreground mb-3">Po statusu</h3>
              <div className="grid gap-2 sm:grid-cols-3">
                {Object.entries(statusLabels).map(([key, label]) => {
                  const count = orders.filter((o) => o.status === key).length;
                  return (
                    <div key={key} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[key]}`}>{label}</span>
                      <span className="font-semibold text-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "theme" && isPremium && (
          <div className="space-y-6">
            <h2 className="font-heading text-xl font-bold text-foreground">Tema menija</h2>
            <p className="text-sm text-muted-foreground">Izaberite kako će vaš digitalni meni izgledati mušterijama.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {MENU_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => updateTheme(theme.id)}
                  className={`rounded-xl border p-5 text-left transition-all ${
                    profile?.menu_theme === theme.id
                      ? "border-primary bg-accent shadow-card-hover"
                      : "border-border bg-card shadow-card hover:shadow-card-hover"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    <span className="font-heading font-bold text-foreground">{theme.name}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{theme.description}</p>
                  {profile?.menu_theme === theme.id && (
                    <span className="mt-2 inline-block rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">Aktivna</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
